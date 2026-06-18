<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Phone,
  Lock,
  CircleCheckFilled,
  ArrowRight,
} from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useAuthStore } from '../store/auth'
import { useDataStore } from '../store/data'

const router = useRouter()
const auth = useAuthStore()
auth.hydrate()
const data = useDataStore()

/**
 * 加载本地数组数据
 */
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

// 手机号脱敏显示
const phoneDisplay = computed(() => {
  const phone = auth.user?.phone
  if (!phone) return '未绑定'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
})

// 实名认证状态
const verifiedStatus = computed(() => {
  if (auth.isVerified) {
    return { text: '已认证', type: 'success' }
  }
  return { text: '未认证', type: 'warning' }
})

/**
 * 退出登录
 */
function logout() {
  auth.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}

/**
 * 跳转到修改手机号
 */
function goChangePhone() {
  router.push('/me/change-phone')
}

/**
 * 跳转到实名认证
 */
function goVerifyIdentity() {
  router.push('/me/verify-identity')
}

/**
 * 跳转到重置密码（需要重新登录）
 */
function goResetPassword() {
  ElMessage.info('请先退出登录，再通过登录页的"忘记密码"功能重置密码')
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
        <!-- 账号信息卡片 -->
        <div class="card profile">
          <SectionTitle title="账号信息" subtitle="管理您的账号安全设置" />
          <div class="info">
            <div class="row">
              <span class="k">用户名</span>
              <span class="v">{{ auth.user?.username }}</span>
            </div>
            <div class="row">
              <span class="k">手机号</span>
              <span class="v">{{ phoneDisplay }}</span>
            </div>
            <div class="row">
              <span class="k">实名认证</span>
              <span class="v" :class="['verify-tag', verifiedStatus.type]">
                <el-icon v-if="auth.isVerified"><CircleCheckFilled /></el-icon>
                {{ verifiedStatus.text }}
              </span>
            </div>
            <div class="row">
              <span class="k">登录时间</span>
              <span class="v">{{ auth.user?.loginAt?.slice(0, 19)?.replace('T', ' ') }}</span>
            </div>
          </div>

          <!-- 账号设置菜单 -->
          <div class="settings-menu">
            <div class="menu-item" @click="goChangePhone">
              <div class="menu-left">
                <div class="menu-icon phone">
                  <el-icon><Phone /></el-icon>
                </div>
                <div class="menu-text">
                  <div class="menu-title">修改手机号</div>
                  <div class="menu-desc">更换绑定的手机号码</div>
                </div>
              </div>
              <el-icon class="menu-arrow"><ArrowRight /></el-icon>
            </div>

            <div class="menu-item" @click="goVerifyIdentity">
              <div class="menu-left">
                <div class="menu-icon verify">
                  <el-icon><CircleCheckFilled /></el-icon>
                </div>
                <div class="menu-text">
                  <div class="menu-title">{{ auth.isVerified ? '查看认证信息' : '实名认证' }}</div>
                  <div class="menu-desc">{{ auth.isVerified ? '您已完成实名认证' : '完成身份认证享更多服务' }}</div>
                </div>
              </div>
              <el-icon class="menu-arrow"><ArrowRight /></el-icon>
            </div>

            <div class="menu-item" @click="goResetPassword">
              <div class="menu-left">
                <div class="menu-icon password">
                  <el-icon><Lock /></el-icon>
                </div>
                <div class="menu-text">
                  <div class="menu-title">重置密码</div>
                  <div class="menu-desc">通过手机号验证重置密码</div>
                </div>
              </div>
              <el-icon class="menu-arrow"><ArrowRight /></el-icon>
            </div>
          </div>

          <div class="actions">
            <el-button type="primary" round @click="$router.push('/spots')">去逛景点</el-button>
            <el-button round plain @click="logout">退出登录</el-button>
          </div>
        </div>

        <!-- 数据概览卡片 -->
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
  align-items: center;
}

.k {
  color: var(--text-muted);
}

.v {
  color: var(--text-strong);
  font-weight: 900;
}

.verify-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
}

.verify-tag.success {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.verify-tag.warning {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

/* 设置菜单样式 */
.settings-menu {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(12, 35, 64, 0.08);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  border-color: rgba(74, 144, 226, 0.3);
  background: rgba(74, 144, 226, 0.04);
  transform: translateX(2px);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 18px;
  color: #fff;
}

.menu-icon.phone {
  background: linear-gradient(135deg, #4a90e2, #357abd);
}

.menu-icon.verify {
  background: linear-gradient(135deg, #67c23a, #52a026);
}

.menu-icon.password {
  background: linear-gradient(135deg, #e6a23c, #c48426);
}

.menu-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-title {
  font-weight: 800;
  color: var(--text-strong);
  font-size: 14px;
}

.menu-desc {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.menu-arrow {
  color: var(--text-muted);
  font-size: 16px;
  transition: transform 0.2s ease;
}

.menu-item:hover .menu-arrow {
  transform: translateX(2px);
  color: var(--brand-primary);
}

.actions {
  margin-top: 16px;
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
