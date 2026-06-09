<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Phone, Key, CircleCheck, Edit } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useAuthStore } from '../store/auth'
import { useDataStore } from '../store/data'

const auth = useAuthStore()
auth.hydrate()
const data = useDataStore()

/**
 * 从本地存储加载数组数据
 * @param {string} key - 存储key
 * @returns {Array} 数组数据
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

// 数据统计
const summary = computed(() => [
  { label: '收藏景点', value: data.favorites.length },
  { label: '发表评价', value: data.reviews.length },
  { label: '住宿预订', value: bookings.value.length },
  { label: '票务订单', value: ticketOrders.value.length },
])

// 退出登录
function logout() {
  auth.logout()
  ElMessage.success('已退出登录')
  location.href = '/login'
}

// ========== 修改手机号相关 ==========
const phoneDialogVisible = ref(false)
const phoneForm = reactive({
  newPhone: '',
  code: '',
})
const phoneFormRef = ref(null)
const phoneLoading = ref(false)
const phoneCountdown = ref(0)

// 手机号验证规则
const phoneRules = {
  newPhone: [
    { required: true, message: '请输入新手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
  ],
}

/**
 * 打开修改手机号弹窗
 */
function openPhoneDialog() {
  phoneForm.newPhone = auth.user?.phone || ''
  phoneForm.code = ''
  phoneDialogVisible.value = true
}

/**
 * 发送验证码（演示）
 */
function sendPhoneCode() {
  if (!phoneForm.newPhone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phoneForm.newPhone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }
  if (phoneCountdown.value > 0) return
  
  // 演示：生成6位验证码
  const code = Math.random().toString().slice(2, 8)
  ElMessage.info(`演示验证码：${code}`)
  
  // 倒计时
  phoneCountdown.value = 60
  const timer = setInterval(() => {
    phoneCountdown.value--
    if (phoneCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

/**
 * 提交修改手机号
 */
async function submitPhoneChange() {
  if (!phoneFormRef.value) return
  
  await phoneFormRef.value.validate(async (valid) => {
    if (!valid) return
    phoneLoading.value = true
    
    try {
      const result = auth.changePhone({
        newPhone: phoneForm.newPhone,
        code: phoneForm.code,
      })
      
      if (result.success) {
        ElMessage.success(result.message)
        phoneDialogVisible.value = false
      } else {
        ElMessage.error(result.message)
      }
    } finally {
      phoneLoading.value = false
    }
  })
}

// ========== 修改密码相关 ==========
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordFormRef = ref(null)
const passwordLoading = ref(false)

/**
 * 密码强度校验
 * @param {string} password - 密码
 * @returns {object} 校验结果
 */
function checkPasswordStrength(password) {
  if (!password) {
    return { valid: false, level: 0, message: '请输入密码' }
  }
  
  if (password.length < 8) {
    return { valid: false, level: 1, message: '密码长度至少8位' }
  }
  
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\[\]\\/~`]/.test(password)
  
  if (!hasLower || !hasUpper || !hasSpecial) {
    return {
      valid: false,
      level: 2,
      message: '密码必须包含大写字母、小写字母和特殊字符',
    }
  }
  
  let level = 2
  if (hasNumber) level++
  if (password.length >= 12) level++
  
  return {
    valid: true,
    level: Math.min(level, 4),
    message: '密码强度符合要求',
  }
}

// 密码强度计算属性
const newPasswordStrength = computed(() => checkPasswordStrength(passwordForm.newPassword))
const strengthLabels = ['', '弱', '一般', '良好', '强']
const strengthColors = ['', '#f56c6c', '#e6a23c', '#409eff', '#67c23a']

// 密码验证规则
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const result = checkPasswordStrength(value)
        if (!result.valid) {
          return callback(new Error(result.message))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        if (String(value) !== String(passwordForm.newPassword)) {
          return callback(new Error('两次密码不一致'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

/**
 * 打开修改密码弹窗
 */
function openPasswordDialog() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

/**
 * 提交修改密码
 */
async function submitPasswordChange() {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    passwordLoading.value = true
    
    try {
      const result = auth.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      
      if (result.success) {
        ElMessage.success(result.message)
        passwordDialogVisible.value = false
      } else {
        ElMessage.error(result.message)
      }
    } finally {
      passwordLoading.value = false
    }
  })
}

// ========== 实名认证相关 ==========
const verifyDialogVisible = ref(false)
const verifyForm = reactive({
  realName: '',
  idCard: '',
})
const verifyFormRef = ref(null)
const verifyLoading = ref(false)

// 实名认证验证规则
const verifyRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度至少2位', trigger: 'blur' },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const idCardRegex = /^\d{17}[\dXx]$/
        if (!idCardRegex.test(value)) {
          return callback(new Error('身份证号格式不正确'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

/**
 * 身份证号脱敏显示
 * @param {string} idCard - 身份证号
 * @returns {string} 脱敏后的身份证号
 */
function maskIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4)
}

/**
 * 打开实名认证弹窗
 */
function openVerifyDialog() {
  if (auth.isVerified) {
    ElMessage.info('您已完成实名认证')
    return
  }
  verifyForm.realName = ''
  verifyForm.idCard = ''
  verifyDialogVisible.value = true
}

/**
 * 提交实名认证
 */
async function submitVerify() {
  if (!verifyFormRef.value) return
  
  await verifyFormRef.value.validate(async (valid) => {
    if (!valid) return
    verifyLoading.value = true
    
    try {
      const result = auth.verifyIdentity({
        realName: verifyForm.realName,
        idCard: verifyForm.idCard,
      })
      
      if (result.success) {
        ElMessage.success(result.message)
        verifyDialogVisible.value = false
      } else {
        ElMessage.error(result.message)
      }
    } finally {
      verifyLoading.value = false
    }
  })
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
              <span class="k">手机号</span>
              <span class="v">
                {{ auth.user?.phone || '未绑定' }}
                <el-icon class="edit-icon" @click="openPhoneDialog"><Edit /></el-icon>
              </span>
            </div>
            <div class="row">
              <span class="k">实名认证</span>
              <span class="v">
                <span v-if="auth.isVerified" class="verified">
                  <el-icon><CircleCheck /></el-icon>
                  已认证
                </span>
                <span v-else class="unverified">
                  未认证
                  <el-button type="primary" link size="small" @click="openVerifyDialog">
                    去认证
                  </el-button>
                </span>
              </span>
            </div>
            <div v-if="auth.isVerified" class="row">
              <span class="k">真实姓名</span>
              <span class="v">{{ auth.user?.realName }}</span>
            </div>
            <div v-if="auth.isVerified" class="row">
              <span class="k">身份证号</span>
              <span class="v">{{ maskIdCard(auth.user?.idCard) }}</span>
            </div>
            <div class="row">
              <span class="k">登录时间</span>
              <span class="v">{{ auth.user?.loginAt?.slice(0, 19)?.replace('T', ' ') }}</span>
            </div>
          </div>
          
          <!-- 账号操作按钮 -->
          <div class="account-actions">
            <el-button type="primary" round icon="Phone" @click="openPhoneDialog">
              修改手机号
            </el-button>
            <el-button type="warning" round icon="Key" @click="openPasswordDialog">
              修改密码
            </el-button>
            <el-button
              v-if="!auth.isVerified"
              type="success"
              round
              icon="CircleCheck"
              @click="openVerifyDialog"
            >
              实名认证
            </el-button>
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

    <!-- 修改手机号弹窗 -->
    <el-dialog
      v-model="phoneDialogVisible"
      title="修改手机号"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="phoneForm"
        :rules="phoneRules"
        label-position="top"
        ref="phoneFormRef"
      >
        <el-form-item label="当前手机号">
          <el-input :value="auth.user?.phone || '未绑定'" disabled />
        </el-form-item>
        <el-form-item label="新手机号" prop="newPhone">
          <el-input v-model="phoneForm.newPhone" placeholder="请输入新手机号" clearable />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-row">
            <el-input v-model="phoneForm.code" placeholder="请输入6位验证码" clearable />
            <el-button
              type="primary"
              :disabled="phoneCountdown > 0 || !phoneForm.newPhone"
              @click="sendPhoneCode"
            >
              {{ phoneCountdown > 0 ? `${phoneCountdown}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="phoneLoading" @click="submitPhoneChange">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
        ref="passwordFormRef"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          />
          <!-- 密码强度提示 -->
          <div v-if="passwordForm.newPassword" class="password-strength">
            <div class="strength-bar">
              <div
                v-for="i in 4"
                :key="i"
                class="strength-item"
                :class="{ active: i <= newPasswordStrength.level }"
                :style="{ backgroundColor: i <= newPasswordStrength.level ? strengthColors[newPasswordStrength.level] : '' }"
              ></div>
            </div>
            <span class="strength-text" :style="{ color: strengthColors[newPasswordStrength.level] }">
              {{ strengthLabels[newPasswordStrength.level] }}
            </span>
          </div>
          <div class="password-tip">
            密码需包含大写字母、小写字母和特殊字符，长度至少8位
          </div>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="submitPasswordChange">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 实名认证弹窗 -->
    <el-dialog
      v-model="verifyDialogVisible"
      title="实名认证"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="verify-tip">
        <el-icon><CircleCheck /></el-icon>
        实名认证后可享受更多服务，信息将严格保密
      </div>
      <el-form
        :model="verifyForm"
        :rules="verifyRules"
        label-position="top"
        ref="verifyFormRef"
      >
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="verifyForm.realName" placeholder="请输入真实姓名" clearable />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="verifyForm.idCard" placeholder="请输入18位身份证号" clearable />
        </el-form-item>
      </el-form>
      <div class="verify-note">
        * 本项目为演示项目，仅做格式校验，不会真实提交身份信息
      </div>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifyLoading" @click="submitVerify">
          提交认证
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
  align-items: center;
}

.k {
  color: var(--text-muted);
}

.v {
  color: var(--text-strong);
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-icon {
  cursor: pointer;
  font-size: 14px;
  color: var(--brand-primary);
  opacity: 0.7;
}

.edit-icon:hover {
  opacity: 1;
}

.verified {
  color: var(--el-color-success) !important;
  display: flex;
  align-items: center;
  gap: 4px;
}

.unverified {
  color: var(--text-muted);
  font-weight: 600;
}

/* 账号操作按钮 */
.account-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

/* 验证码行样式 */
.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  width: 100%;
  align-items: center;
}

/* 密码强度样式 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.strength-bar {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-item {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: rgba(12, 35, 64, 0.1);
  transition: all 0.3s;
}

.strength-item.active {
  opacity: 1;
}

.strength-text {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.password-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 实名认证提示 */
.verify-tip {
  padding: 12px;
  border-radius: 12px;
  background: rgba(103, 194, 58, 0.1);
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
}

.verify-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
