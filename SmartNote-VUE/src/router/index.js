import { createRouter, createWebHistory } from 'vue-router'
import LoginRegister from '@/pages/LoginRegister.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import Overview from '@/views/Overview.vue'
import NotesWorkspace from '@/views/NotesWorkspace.vue'
import AiAssistant from '@/views/AiAssistant.vue'
import KnowledgeGraphPage from '@/views/KnowledgeGraphPage.vue'
import WorkspacePage from '@/views/WorkspacePage.vue'
import RecyclePage from '@/views/RecyclePage.vue'
import TagManager from '@/views/TagManager.vue'
import Profile from '@/views/Profile.vue'

const routes = [
  // 部分浏览器插件会往 history 注入 `/hybridaction/...` 之类的路径，导致路由无匹配并出现空白页/告警。
  // 这里直接拦截并取消这类导航，避免影响正常页面。
  {
    path: '/hybridaction/:pathMatch(.*)*',
    name: 'hybridaction-ignore',
    beforeEnter: () => false
  },
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
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: 'home',
        component: Overview,
        meta: {
          requiresAuth: true,
          sidebarKey: 'home',
          title: '首页概览',
          subtitle: '笔记总览与最近动态'
        }
      },
      {
        path: 'notes',
        name: 'notes',
        component: NotesWorkspace,
        meta: {
          requiresAuth: true,
          sidebarKey: 'notes',
          title: '笔记编辑',
          subtitle: '管理与编辑笔记'
        }
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('@/views/AnalysisView.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'analysis',
          title: '学习统计',
          subtitle: '学习趋势与数据洞察'
        }
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/views/ChatLayout.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'chat',
          title: '消息中心',
          subtitle: '好友与工作区聊天'
        }
      },
      {
        path: 'ai',
        name: 'ai',
        component: AiAssistant,
        meta: {
          requiresAuth: true,
          sidebarKey: 'ai',
          title: 'AI 助手',
          subtitle: '智能创作与分析'
        }
      },
      {
        path: 'graph',
        name: 'graph',
        component: KnowledgeGraphPage,
        meta: {
          requiresAuth: true,
          sidebarKey: 'graph',
          title: '知识图谱',
          subtitle: '可视化知识关联'
        }
      },
      {
        path: 'workspace',
        name: 'workspace',
        component: WorkspacePage,
        meta: {
          requiresAuth: true,
          sidebarKey: 'workspace',
          title: '协作空间',
          subtitle: '工作区与成员管理'
        }
      },
      {
        path: 'recycle',
        name: 'recycle',
        component: RecyclePage,
        meta: {
          requiresAuth: true,
          sidebarKey: 'recycle',
          title: '回收站',
          subtitle: '管理已删除的笔记'
        }
      },
      {
        path: 'recycle/:noteId',
        name: 'deleted-note',
        component: () => import('@/views/DeletedNotePage.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'recycle',
          title: '查看已删除的笔记',
          subtitle: '查看已删除笔记的详细内容'
        }
      },
      {
        path: 'tags',
        name: 'tags',
        component: TagManager,
        meta: {
          requiresAuth: true,
          sidebarKey: 'tags',
          title: '标签管理',
          subtitle: '分类与标签维护'
        }
      },
      {
        path: 'profile',
        name: 'profile',
        component: Profile,
        meta: {
          requiresAuth: true,
          sidebarKey: 'profile',
          title: '个人资料',
          subtitle: '查看并更新账号信息'
        }
      },
      {
        path: 'community',
        name: 'community',
        component: () => import('@/views/community/CommunityListPage.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'community',
          title: '知识社区',
          subtitle: '分享与发现创作灵感'
        }
      },
      {
        path: 'community/mine',
        name: 'community-mine',
        component: () => import('@/views/community/MyPublishedListPage.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'community',
          title: '我的发布',
          subtitle: '管理个人社区内容'
        }
      },
      {
        path: 'community/:id',
        name: 'community-detail',
        component: () => import('@/views/community/CommunityDetailPage.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'community',
          title: '社区详情',
          subtitle: '浏览内容详情与评论'
        }
      },
      {
        path: 'tasks/board',
        name: 'tasks-board',
        component: () => import('@/views/tasks/TaskBoardPage.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'tasks-board',
          title: '任务看板',
          subtitle: '拖拽管理任务进度'
        }
      },
      {
        path: 'tasks/calendar',
        name: 'tasks-calendar',
        component: () => import('@/views/tasks/TaskCalendarPage.vue'),
        meta: {
          requiresAuth: true,
          sidebarKey: 'tasks-calendar',
          title: '日程管理',
          subtitle: '按时间范围查看任务'
        }
      }
    ]
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
