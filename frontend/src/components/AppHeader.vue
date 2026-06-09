<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Menu as MenuIcon, Search as SearchIcon, UserFilled } from '@element-plus/icons-vue'

import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

const mobileMenuOpen = ref(false)
const keyword = ref('')

watch(
  () => route.query.q,
  (q) => {
    if (typeof q === 'string') keyword.value = q
  },
  { immediate: true },
)

const menus = [
  { id: 'home', to: '/home', label: '首页' },
  { id: 'spots', to: '/spots', label: '景点' },
  { id: 'guides', to: '/guides', label: '游玩攻略' },
  { id: 'stay', to: '/stay', label: '住宿预订' },
  { id: 'tickets', to: '/tickets', label: '票务中心' },
  { id: 'about', to: '/about', label: '关于我们' },
  { id: 'map', to: '/map', label: '景区导览' },
]

const activeMenuId = computed(() => {
  if (route.path.startsWith('/spot/') || route.path === '/spots') return 'spots'
  if (route.path === '/home') return 'home'
  const found = menus.find((m) => m.to === route.path)
  return found?.id ?? 'home'
})

function go(to) {
  mobileMenuOpen.value = false
  router.push(to)
}

function onDrawerSelect(id) {
  const menu = menus.find((m) => m.id === id)
  if (!menu) return
  go(menu.to)
}

function onSearch() {
  const q = keyword.value.trim()
  router.push({ path: '/spots', query: q ? { q } : {} })
}

function logout() {
  auth.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}

function goLogin() {
  mobileMenuOpen.value = false
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}
</script>

<template>
  <header class="app-header">
    <div class="wrap">
      <div class="left">
        <button class="burger" type="button" @click="mobileMenuOpen = true" aria-label="menu">
          <el-icon><MenuIcon /></el-icon>
        </button>

        <div class="brand" @click="go('/home')">
          <div class="logo">悦</div>
          <div class="name">
            <div class="title">悦行山海</div>
            <div class="sub">旅游景区官方网站</div>
          </div>
        </div>

        <nav class="nav">
          <a
            v-for="m in menus"
            :key="m.id"
            class="nav-item"
            :class="{ active: activeMenuId === m.id }"
            @click.prevent="go(m.to)"
            href="#"
          >
            {{ m.label }}
          </a>
        </nav>
      </div>

      <div class="right">
        <el-input
          v-model="keyword"
          class="search"
          placeholder="搜索景点/服务关键词"
          clearable
          @keyup.enter="onSearch"
        >
          <template #prefix>
            <el-icon><SearchIcon /></el-icon>
          </template>
        </el-input>

        <el-dropdown v-if="auth.isLoggedIn" trigger="click">
          <button class="user" type="button">
            <el-icon class="avatar"><UserFilled /></el-icon>
            <span class="username">{{ auth.user?.username }}</span>
            <span class="role">游客</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="go('/me')">用户中心</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <button v-else class="user" type="button" @click="goLogin">
          <el-icon class="avatar"><UserFilled /></el-icon>
          <span class="username">登录/注册</span>
        </button>
      </div>
    </div>

    <el-drawer v-model="mobileMenuOpen" direction="ltr" size="78%" class="mobile-drawer">
      <template #header>
        <div class="drawer-title">导航</div>
      </template>
      <el-menu :default-active="activeMenuId" class="drawer-menu" @select="onDrawerSelect">
        <el-menu-item v-for="m in menus" :key="m.id" :index="m.id">
          {{ m.label }}
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(245, 247, 250, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(74, 144, 226, 0.12);
}

.wrap {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
}

.left {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.burger {
  display: none;
  height: 40px;
  width: 40px;
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.16);
  background: rgba(255, 255, 255, 0.8);
}

.brand {
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.logo {
  height: 40px;
  width: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, var(--brand-primary), #6aa8f0);
  box-shadow: 0 10px 26px rgba(74, 144, 226, 0.25);
}

.name {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--text-strong);
}

.sub {
  font-size: 12px;
  color: var(--text-muted);
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: nowrap;
}

.nav-item {
  padding: 8px 10px;
  border-radius: 12px;
  color: var(--text);
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-item:hover {
  background: rgba(74, 144, 226, 0.1);
  color: var(--brand-primary);
}

.nav-item.active {
  background: rgba(74, 144, 226, 0.14);
  color: var(--brand-primary);
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search {
  width: 260px;
}

.user {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(74, 144, 226, 0.16);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-strong);
  font-weight: 700;
}

.avatar {
  color: var(--brand-primary);
}

.username {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role {
  font-size: 12px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(74, 144, 226, 0.12);
  color: var(--brand-primary);
}

.drawer-title {
  font-weight: 800;
  color: var(--text-strong);
}

@media (max-width: 980px) {
  .nav {
    display: none;
  }
  .burger {
    display: inline-grid;
    place-items: center;
  }
  .search {
    width: 180px;
  }
}

@media (max-width: 520px) {
  .search {
    display: none;
  }
  .sub {
    display: none;
  }
}
</style>
