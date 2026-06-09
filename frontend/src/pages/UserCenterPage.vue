<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import {
  useAuthStore,
  validatePasswordStrength,
  validatePhone,
  validateIdCard,
} from '../store/auth'
import { useDataStore } from '../store/data'

const auth = useAuthStore()
auth.hydrate()
// 进入页面时同步一次最新的用户信息（手机号、实名状态等）
auth.syncFromUsers()
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

// 实名认证状态展示
const verifiedText = computed(() => (auth.user?.verified ? '已认证' : '未认证'))
// 手机号脱敏展示
const phoneText = computed(() => {
  const phone = auth.user?.phone
  if (!phone) return '未绑定'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})
// 身份证号脱敏展示
const idCardText = computed(() => {
  const id = auth.user?.idCard
  if (!id) return '—'
  return id.replace(/^(.{4}).*(.{4})$/, '$1**********$2')
})

// 修改密码弹窗
const passwordOpen = ref(false)
const passwordLoading = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 修改手机号弹窗
const phoneOpen = ref(false)
const phoneLoading = ref(false)
const phoneForm = reactive({
  password: '',
  newPhone: '',
})

// 实名认证弹窗
const verifyOpen = ref(false)
const verifyLoading = ref(false)
const verifyForm = reactive({
  realName: '',
  idCard: '',
})

// 打开修改密码弹窗
function openChangePassword() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordOpen.value = true
}

// 提交修改密码
function submitChangePassword() {
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  // 前端先做强度校验
  const strength = validatePasswordStrength(passwordForm.newPassword)
  if (!strength.ok) {
    ElMessage.warning(strength.message)
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  passwordLoading.value = true
  try {
    const result = auth.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    if (!result.ok) {
      ElMessage.error(result.message)
      return
    }
    ElMessage.success(result.message)
    passwordOpen.value = false
  } finally {
    passwordLoading.value = false
  }
}

// 打开修改手机号弹窗
function openChangePhone() {
  phoneForm.password = ''
  phoneForm.newPhone = ''
  phoneOpen.value = true
}

// 提交修改手机号
function submitChangePhone() {
  if (!phoneForm.password) {
    ElMessage.warning('请输入当前密码以验证身份')
    return
  }
  if (!validatePhone(phoneForm.newPhone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }
  phoneLoading.value = true
  try {
    const result = auth.changePhone({
      password: phoneForm.password,
      newPhone: phoneForm.newPhone,
    })
    if (!result.ok) {
      ElMessage.error(result.message)
      return
    }
    ElMessage.success(result.message)
    phoneOpen.value = false
  } finally {
    phoneLoading.value = false
  }
}

// 打开实名认证弹窗
function openVerify() {
  // 已认证则填入只读信息（再次提交会覆盖更新）
  verifyForm.realName = auth.user?.realName ?? ''
  verifyForm.idCard = auth.user?.idCard ?? ''
  verifyOpen.value = true
}

// 提交实名认证
function submitVerify() {
  if (!verifyForm.realName || verifyForm.realName.trim().length < 2) {
    ElMessage.warning('请输入真实姓名')
    return
  }
  if (!validateIdCard(verifyForm.idCard)) {
    ElMessage.warning('身份证号格式不正确')
    return
  }
  verifyLoading.value = true
  try {
    const result = auth.verifyRealName({
      realName: verifyForm.realName,
      idCard: verifyForm.idCard,
    })
    if (!result.ok) {
      ElMessage.error(result.message)
      return
    }
    ElMessage.success(result.message)
    verifyOpen.value = false
  } finally {
    verifyLoading.value = false
  }
}

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
            <!-- 手机号信息 + 修改入口 -->
            <div class="row">
              <span class="k">手机号</span>
              <span class="v">{{ phoneText }}</span>
            </div>
            <!-- 实名认证状态 -->
            <div class="row">
              <span class="k">实名认证</span>
              <span class="v">
                <el-tag :type="auth.user?.verified ? 'success' : 'info'" size="small">
                  {{ verifiedText }}
                </el-tag>
              </span>
            </div>
            <div v-if="auth.user?.verified" class="row">
              <span class="k">真实姓名</span>
              <span class="v">{{ auth.user?.realName }}</span>
            </div>
            <div v-if="auth.user?.verified" class="row">
              <span class="k">身份证号</span>
              <span class="v">{{ idCardText }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button type="primary" round @click="$router.push('/spots')">去逛景点</el-button>
            <el-button round @click="openChangePassword">修改密码</el-button>
            <el-button round @click="openChangePhone">修改手机号</el-button>
            <el-button round :type="auth.user?.verified ? 'success' : 'warning'" @click="openVerify">
              {{ auth.user?.verified ? '查看实名信息' : '立即实名认证' }}
            </el-button>
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

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordOpen" title="修改密码" width="440px">
      <el-form label-position="top">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            placeholder="至少 8 位，含大小写字母、数字与特殊字符"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordOpen = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="submitChangePassword">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改手机号弹窗 -->
    <el-dialog v-model="phoneOpen" title="修改手机号" width="440px">
      <el-form label-position="top">
        <el-form-item label="当前密码">
          <el-input v-model="phoneForm.password" placeholder="用于身份验证" show-password />
        </el-form-item>
        <el-form-item label="新手机号">
          <el-input
            v-model="phoneForm.newPhone"
            placeholder="请输入 11 位手机号"
            maxlength="11"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneOpen = false">取消</el-button>
        <el-button type="primary" :loading="phoneLoading" @click="submitChangePhone">提交</el-button>
      </template>
    </el-dialog>

    <!-- 实名认证弹窗 -->
    <el-dialog v-model="verifyOpen" title="实名认证" width="440px">
      <el-form label-position="top">
        <el-form-item label="真实姓名">
          <el-input v-model="verifyForm.realName" placeholder="与身份证一致" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="verifyForm.idCard"
            placeholder="18 位身份证号"
            maxlength="18"
            clearable
          />
        </el-form-item>
        <div class="verify-tip">
          实名信息仅在本地保存用于演示，不会上传到任何服务器。
        </div>
      </el-form>
      <template #footer>
        <el-button @click="verifyOpen = false">取消</el-button>
        <el-button type="primary" :loading="verifyLoading" @click="submitVerify">
          {{ auth.user?.verified ? '更新认证' : '提交认证' }}
        </el-button>
      </template>
    </el-dialog>
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

.verify-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
