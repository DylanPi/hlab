// ===== router — hash-history route table for the SPA =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// createWebHashHistory keeps deep links working on static hosting (no server rewrites
// needed). 9 public routes with lazy-loaded views + hidden /lab ink-framework demo
// (excluded from NavBar, direct #/lab link only) + catch-all redirect to /.
// scrollBehavior resets scroll to the top on every navigation.
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
  { path: '/research', name: 'research', component: () => import('../views/ResearchView.vue') },
  { path: '/publications', name: 'publications', component: () => import('../views/PublicationsView.vue') },
  { path: '/news', name: 'news', component: () => import('../views/NewsView.vue') },
  { path: '/people', name: 'people', component: () => import('../views/PeopleView.vue') },
  { path: '/gallery', name: 'gallery', component: () => import('../views/GalleryView.vue') },
  { path: '/join', name: 'join', component: () => import('../views/JoinView.vue') },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
  // 意笔框架隐藏演示路由(UI-FRAMEWORK §10.2):不进 NavBar,直链 #/lab
  { path: '/lab', name: 'lab', component: () => import('../views/LabView.vue') },
  // Catch-all: unknown hash routes previously rendered a bare shell (NavBar +
  // footer, no content) — redirect them home instead. H-line review fix.
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
