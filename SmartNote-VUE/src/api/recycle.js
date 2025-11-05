import axios from '@/api/axios'

const recycleApi = {
  list: () => axios.get('/recycle'),
  restore: (ids) => axios.post('/recycle/restore', ids),
  remove: (ids) => axios.delete('/recycle/permanent', { data: ids })
}

export default recycleApi
