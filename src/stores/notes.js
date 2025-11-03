import { defineStore } from 'pinia';
import {
  fetchNotes,
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
  fetchTags
} from '../api/notes';

const normalizeTags = (tags = []) =>
  tags
    .map((tag) => (typeof tag === 'string' ? tag : tag?.name ?? tag?.label ?? ''))
    .filter((tag) => !!tag);

const toTagObjects = (tags = []) =>
  tags
    .map((tag) =>
      typeof tag === 'string'
        ? { name: tag, count: 0 }
        : { name: tag?.name ?? tag?.label ?? '', count: tag?.count ?? 0 }
    )
    .filter((tag) => !!tag.name);

const aggregateTags = (items = []) => {
  const map = new Map();
  items.forEach((note) => {
    (note.tags || []).forEach((tag) => {
      map.set(tag, (map.get(tag) || 0) + 1);
    });
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
};

export const useNotesStore = defineStore('notes', {
  state: () => ({
    items: [],
    tags: [],
    activeNote: null,
    loading: false,
    filter: '',
    error: null,
    isEditing: false
  }),
  getters: {
    filteredNotes(state) {
      if (!state.filter) return state.items;
      const query = state.filter.toLowerCase();
      return state.items.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          (note.content && note.content.toLowerCase().includes(query))
      );
    },
    tagNames(state) {
      return state.tags.map((tag) => tag.name);
    }
  },
  actions: {
    async fetchNotes() {
      this.loading = true;
      this.error = null;
      try {
        const [notes, tags] = await Promise.all([fetchNotes(), fetchTags()]);
        this.items = (notes || []).map((note) => ({
          ...note,
          tags: normalizeTags(note.tags)
        }));
        const receivedTags = toTagObjects(tags);
        this.tags = receivedTags.length ? receivedTags : aggregateTags(this.items);
      } catch (error) {
        this.error = error.message || '无法加载数据';
      } finally {
        this.loading = false;
      }
    },
    async openNote(id) {
      this.loading = true;
      try {
        const note = await fetchNoteById(id);
        this.activeNote = {
          ...note,
          tags: normalizeTags(note.tags)
        };
        this.isEditing = false;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    startCreate() {
      this.activeNote = {
        id: null,
        title: '',
        content: '',
        tags: []
      };
      this.isEditing = true;
    },
    startEdit(note) {
      this.activeNote = { ...note, tags: [...normalizeTags(note.tags)] };
      this.isEditing = true;
    },
    setFilter(value) {
      this.filter = value || '';
    },
    setActiveTags(tags) {
      if (this.activeNote) {
        this.activeNote.tags = tags;
      }
    },
    async save(note) {
      this.loading = true;
      try {
        const payload = {
          title: note.title,
          content: note.content,
          tags: normalizeTags(note.tags)
        };
        if (note.id) {
          const updated = await updateNote(note.id, payload);
          const normalized = { ...updated, tags: normalizeTags(updated.tags) };
          this.items = this.items.map((item) => (item.id === normalized.id ? normalized : item));
          this.activeNote = normalized;
        } else {
          const created = await createNote(payload);
          const normalized = { ...created, tags: normalizeTags(created.tags) };
          this.items = [normalized, ...this.items];
          this.activeNote = normalized;
        }
        this.tags = aggregateTags(this.items);
        this.isEditing = false;
      } catch (error) {
        this.error = error.message || '保存失败';
      } finally {
        this.loading = false;
      }
    },
    async remove(id) {
      this.loading = true;
      try {
        await deleteNote(id);
        this.items = this.items.filter((note) => note.id !== id);
        this.tags = aggregateTags(this.items);
        if (this.activeNote?.id === id) {
          this.activeNote = null;
        }
      } catch (error) {
        this.error = error.message || '删除失败';
      } finally {
        this.loading = false;
      }
    }
  }
});
