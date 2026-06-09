<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useAuthStore } from '../store/auth'
import { useDataStore } from '../store/data'

const auth = useAuthStore()
auth.hydrate()
const data = useDataStore()

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const bookings = computed(() => loadArray('yuexing_bookings'))
const ticketOrders = computed(() => loadArray('yuexing_ticket_orders'))

const summary = computed(() => [
  { label: '收藏景点', value: data.favorites.length },
  { label: '发表评价', value: data.reviews.length },
  { label: '住宿预订', value: bookings.value.length },
  { label: '票务订单', value: ticketOrders.value.length },
])

function logout() {
  auth.logout()
  ElMessage.success('已退出登录')
  location.href = '/login'
}
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="head card">
        <div class="h1">
          <el-icon><UserFilled /></el-icon>
          用户中心
        </div>
        <div class="h2">登录角色：游客</div>
      </div>

      <section class="grid">
        <div class="card profile">
          <SectionTitle title="账号信息" subtitle="本项目为纯前端演示，数据保存在本地" />
          <div class="info">
            <div class="row">
              <span class="k">用户名</span>
              <span class="v">{{ auth.user?.username }}</span>
            </div>
            <div class="row">
              <span class="k">登录时间</span>
              <span class="v">{{ auth.user?.loginAt?.slice(0, 19)?.replace('T', ' ') }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button type="primary" round @click="$router.push('/spots')">去逛景点</el-button>
            <el-button round plain @click="logout">退出登录</el-button>
          </div>
        </div>

        <div class="card stats">
          <SectionTitle title="数据概览" subtitle="收藏 / 评价 / 预订 / 订单" />
          <div class="stats-grid">
            <div v-for="s in summary" :key="s.label" class="stat">
              <div class="n">{{ s.value }}</div>
              <div class="t">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.head {
  padding: 16px;
}

.h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 900;
  color: var(--text-strong);
}

.h2 {
  margin-top: 8px;
  color: var(--text-muted);
  font-weight: 600;
}

.grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: stretch;
}

.profile,
.stats {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info {
  margin-top: 10px;
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(74, 144, 226, 0.06);
  border: 1px solid rgba(74, 144, 226, 0.12);
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
}

.k {
  color: var(--text-muted);
}

.v {
  color: var(--text-strong);
  font-weight: 900;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stats-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat {
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: rgba(255, 255, 255, 0.78);
}

.n {
  font-size: 22px;
  font-weight: 900;
  color: var(--brand-primary);
}

.t {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
