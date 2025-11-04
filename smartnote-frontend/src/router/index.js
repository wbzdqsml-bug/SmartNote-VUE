import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/userStore'

import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Notes from '../views/Notes.vue'
import NoteDetail from '../views/NoteDetail.vue'
import Recycle from '../views/Recycle.vue'
import Workspaces from '../views/Workspaces.vue'
import Invitations from '../views/Invitations.vue'

const routes = [
  { path: '/', redirect: '/notes' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/notes', component: Notes },
  { path: '/notes/:id', component: NoteDetail },
  { path: '/recycle', component: Recycle },
  { path: '/workspaces', component: Workspaces },
  { path: '/invitations', component: Invitations }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const store = useUserStore()
  if (!store.token && !['/login', '/register'].includes(to.path)) next('/login')
  else next()
})

export default router
