// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
// 1. 导入 Pinia user store (用于路由守卫)
import { useUserStore } from '@/stores/user'

// 2. 导入主布局组件
import MainLayout from '../layout/MainLayout.vue'
// 导入所有视图组件，这里使用懒加载
// import LoginView from '../views/LoginView.vue' // 不推荐直接导入，使用懒加载

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue') // 登录页，懒加载
    },
    {
      // 主布局下的子路由，需要认证
      path: '/',
      name: 'layout',
      component: MainLayout,
      redirect: '/notes', // 访问 / 自动跳转到 /notes
      meta: { requiresAuth: true }, // (关键) 标记这个路由及其所有子路由都需要登录
      children: [
        {
          path: '/notes',
          name: 'notes',
          component: () => import('../views/NotesView.vue')
        },
        {
          path: '/graph',
          name: 'graph',
          component: () => import('../views/GraphView.vue')
        },
        {
          path: '/stats',
          name: 'stats',
          component: () => import('../views/StatsView.vue')
        }
        // (未来还可以添加 /settings 等)
      ]
    },
    {
      // 404 页面处理 (匹配所有未匹配的路由)
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// 3. (关键) 全局前置路由守卫 (Navigation Guard)
router.beforeEach((to, from, next) => {
  // !!! 注意：useUserStore() 必须在函数内部调用 !!!
  // 这是 Pinia 的设计，确保 store 在 Vue 应用上下文中被正确初始化
  const userStore = useUserStore()

  // 检查目标路由是否需要认证
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !userStore.isAuthenticated) {
    // 情况 1: 目标路由需要认证，但用户未登录 -> 重定向到登录页
    // next({ name: 'login' }) 可以，但是如果登录页本身有子路由可能会有问题
    // next({ path: '/login' }) 更直接和安全
    next({ path: '/login' })
  } else if (to.path === '/login' && userStore.isAuthenticated) {
    // 情况 2: 用户已登录，但试图访问登录页 -> 重定向到首页
    next({ path: '/' })
  } else {
    // 情况 3: 其他情况 (无需认证的路由，或者已登录用户访问需要认证的路由) -> 正常放行
    next()
  }
})

export default router
