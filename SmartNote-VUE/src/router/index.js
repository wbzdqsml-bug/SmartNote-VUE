import { createRouter, createWebHistory } from 'vue-router'
import LoginRegister from '@/pages/LoginRegister.vue'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginRegister,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: LoginRegister,
    meta: { guestOnly: true }
  },
  {
    path: '/home',
    name: 'home',
    component: Home,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' })
    return
  }
  if (to.meta.guestOnly && token) {
    next({ name: 'home' })
    return
  }
  next()
})

export default router
