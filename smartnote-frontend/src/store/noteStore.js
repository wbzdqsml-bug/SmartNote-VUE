import { defineStore } from 'pinia'
import { getNotes, createNote, updateNote, deleteNote } from '../api/note'
import { ElMessage } from 'element-plus'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    loading: false
  }),

  actions: {
    async loadNotes() {
      this.loading = true
      try {
        this.notes = await getNotes()
      } finally {
        this.loading = false
      }
    },

    async addNote(payload) {
      const id = await createNote(payload)
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
