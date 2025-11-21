import { createRouter, createWebHistory } from 'vue-router'
import LoginRegister from '@/pages/LoginRegister.vue'
import Home from '@/views/Home.vue'
import Profile from '@/views/Profile.vue'
import TagManager from '@/views/TagManager.vue'

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
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagManager,
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
