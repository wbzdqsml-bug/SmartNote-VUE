import { defineStore } from 'pinia'
import { getWorkspaces, createWorkspace, deleteWorkspace } from '../api/workspace'
import { ElMessage } from 'element-plus'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    workspaces: [],
    loading: false
  }),

  actions: {
    async loadWorkspaces() {
      this.loading = true
      try {
        this.workspaces = await getWorkspaces()
      } finally {
        this.loading = false
      }
    },

    async addWorkspace(data) {
      await createWorkspace(data)
      ElMessage.success('工作区已创建')
      await this.loadWorkspaces()
    },

    async removeWorkspace(id) {
      await deleteWorkspace(id)
      ElMessage.success('工作区已删除')
      await this.loadWorkspaces()
    }
  }
})
