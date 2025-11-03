<template>
  <div class="notes-view">
    <NoteList
      :notes="notes"
      :loading="loading"
      :active-note-id="activeNote?.id"
      @select="handleSelect"
    />
    <div class="notes-view__content">
      <el-skeleton v-if="loading && !notes.length" :rows="8" animated />
      <template v-else>
        <NoteEditor
          v-if="isEditing && activeNote"
          :note="activeNote"
          :available-tags="tagNames"
          :loading="loading"
          @save="handleSave"
          @delete="handleDelete"
          @cancel="cancelEdit"
          @update:tags="handleTagsUpdate"
        />
        <NotePreview
          v-else
          :note="activeNote"
          @edit="startEdit"
          @delete="handleDelete"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '../stores/notes';
import NoteList from '../components/NoteList.vue';
import NoteEditor from '../components/NoteEditor.vue';
import NotePreview from '../components/NotePreview.vue';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();

const notes = computed(() => notesStore.filteredNotes);
const tagNames = computed(() => notesStore.tagNames);
const activeNote = computed(() => notesStore.activeNote);
const loading = computed(() => notesStore.loading);
const isEditing = computed(() => notesStore.isEditing);

onMounted(async () => {
  await notesStore.fetchNotes();
  const noteId = Number(route.params.id);
  if (noteId) {
    await notesStore.openNote(noteId);
  } else if (notesStore.items.length) {
    notesStore.$patch({ activeNote: notesStore.items[0], isEditing: false });
  }
});

watch(
  () => route.params.id,
  async (id) => {
    if (id) {
      await notesStore.openNote(Number(id));
    } else if (notesStore.items.length) {
      notesStore.$patch({ activeNote: notesStore.items[0], isEditing: false });
    } else {
      notesStore.$patch({ activeNote: null, isEditing: false });
    }
  }
);

const handleSelect = async (id) => {
  await router.push({ name: 'NoteDetails', params: { id } });
};

const startEdit = (note) => {
  notesStore.startEdit(note);
};

const cancelEdit = () => {
  if (activeNote.value?.id) {
    notesStore.openNote(activeNote.value.id);
  } else if (notesStore.items.length) {
    notesStore.$patch({ activeNote: notesStore.items[0], isEditing: false });
  } else {
    notesStore.$patch({ activeNote: null, isEditing: false });
  }
};

const handleSave = async (note) => {
  await notesStore.save(note);
  if (notesStore.activeNote?.id) {
    router.push({ name: 'NoteDetails', params: { id: notesStore.activeNote.id } });
  } else {
    router.push({ name: 'Notes' });
  }
};

const handleDelete = async (id) => {
  await notesStore.remove(id);
  if (notesStore.items.length) {
    router.push({ name: 'NoteDetails', params: { id: notesStore.items[0].id } });
  } else {
    router.push({ name: 'Notes' });
  }
};

const handleTagsUpdate = (tags) => {
  notesStore.setActiveTags(tags);
};
</script>

<style scoped lang="scss">
.notes-view {
  display: flex;
  height: calc(100vh - 80px);
  background-color: var(--el-bg-color);

  &__content {
    flex: 1;
    min-width: 0;
    background-color: var(--el-bg-color);
  }
}
</style>
