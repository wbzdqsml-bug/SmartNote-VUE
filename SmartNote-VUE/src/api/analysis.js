import axios from '@/api/axios'

const analysisApi = {
  getHeatmap() {
    return axios.get('/analysis/heatmap')
  },
  getCategoryStats() {
    return axios.get('/analysis/categories')
  },
  getTagStats() {
    return axios.get('/analysis/tags')
  },
  getTrend() {
    return axios.get('/analysis/trend')
  },
  getWorkspaceStats() {
    return axios.get('/analysis/workspaces')
  }
}

export default analysisApi
