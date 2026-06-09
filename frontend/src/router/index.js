import { createRouter, createWebHistory } from 'vue-router'

import LoginPage from '../pages/LoginPage.vue'
import ResetPasswordPage from '../pages/ResetPasswordPage.vue'
import HomePage from '../pages/HomePage.vue'
import SpotsPage from '../pages/SpotsPage.vue'
import SpotDetailPage from '../pages/SpotDetailPage.vue'
import UserCenterPage from '../pages/UserCenterPage.vue'
import ChangePhonePage from '../pages/ChangePhonePage.vue'
import VerifyIdentityPage from '../pages/VerifyIdentityPage.vue'
import StayBookingPage from '../pages/StayBookingPage.vue'
import GuidesPage from '../pages/GuidesPage.vue'
import TicketsPage from '../pages/TicketsPage.vue'
import MapGuidePage from '../pages/MapGuidePage.vue'
import AboutPage from '../pages/AboutPage.vue'

import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/login' },
    // 公开页面（无需登录）
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordPage, meta: { public: true } },
    { path: '/about', name: 'about', component: AboutPage, meta: { public: true } },
    // 需要登录的页面
    { path: '/home', name: 'home', component: HomePage },
    { path: '/spots', name: 'spots', component: SpotsPage },
    { path: '/spot/:id', name: 'spot-detail', component: SpotDetailPage, props: true },
    { path: '/me', name: 'me', component: UserCenterPage },
    { path: '/me/change-phone', name: 'change-phone', component: ChangePhonePage },
    { path: '/me/verify-identity', name: 'verify-identity', component: VerifyIdentityPage },
    { path: '/stay', name: 'stay', component: StayBookingPage },
    { path: '/guides', name: 'guides', component: GuidesPage },
    { path: '/tickets', name: 'tickets', component: TicketsPage },
    { path: '/map', name: 'map', component: MapGuidePage },
    // 404 重定向
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

// 路由守卫：检查登录状态
router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.hydrate()
  if (to.meta?.public) return true
  if (to.name === 'login') return true
  if (!auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
