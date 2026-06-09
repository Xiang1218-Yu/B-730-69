import { createRouter, createWebHistory } from 'vue-router'

import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/HomePage.vue'
import SpotsPage from '../pages/SpotsPage.vue'
import SpotDetailPage from '../pages/SpotDetailPage.vue'
import UserCenterPage from '../pages/UserCenterPage.vue'
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
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    { path: '/home', name: 'home', component: HomePage },
    { path: '/spots', name: 'spots', component: SpotsPage },
    { path: '/spot/:id', name: 'spot-detail', component: SpotDetailPage, props: true },
    { path: '/me', name: 'me', component: UserCenterPage },
    { path: '/stay', name: 'stay', component: StayBookingPage },
    { path: '/guides', name: 'guides', component: GuidesPage },
    { path: '/tickets', name: 'tickets', component: TicketsPage },
    { path: '/map', name: 'map', component: MapGuidePage },
    { path: '/about', name: 'about', component: AboutPage, meta: { public: true } },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

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
