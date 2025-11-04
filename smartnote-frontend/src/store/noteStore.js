import { defineStore } from 'pinia'
import { getNotes, createNote, updateNote, deleteNote } from '../api/note'
import { ElMessage } from 'element-plus'
import { ensureArray, extractId } from '../utils/response'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    loading: false
  }),

  actions: {
    async loadNotes() {
      this.loading = true
      try {
        this.notes = ensureArray(await getNotes())
      } finally {
        this.loading = false
      }
    },

    async addNote(payload) {
      const response = await createNote(payload)
      const id = extractId(response)
      await this.loadNotes()
      ElMessage.success('笔记已创建')
      return id
    },

    async saveNote(id, data) {
      await updateNote(id, data)
      ElMessage.success('笔记已保存')
      await this.loadNotes()
    },

    async removeNote(id) {
      await deleteNote(id)
      ElMessage.success('笔记已删除')
      this.notes = this.notes.filter(n => n.id !== id)
    }
  }
})
