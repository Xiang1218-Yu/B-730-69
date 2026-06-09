<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Edit, Lock, Phone, Postcard } from '@element-plus/icons-vue'

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

// 密码强度校验：必须包含大写字母、小写字母和特殊字符
function validatePasswordStrength(password) {
  if (!password) return { valid: false, msg: '请输入密码' }
  if (password.length < 8) return { valid: false, msg: '密码长度不能少于8位' }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)
  if (!hasUpper) return { valid: false, msg: '密码必须包含大写字母' }
  if (!hasLower) return { valid: false, msg: '密码必须包含小写字母' }
  if (!hasSpecial) return { valid: false, msg: '密码必须包含特殊字符（如 !@#$% 等）' }
  return { valid: true, msg: '' }
}

// 手机号校验
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 身份证号校验（简单格式校验）
function validateIdNumber(id) {
  return /^\d{17}[\dXx]$/.test(id)
}

// ===== 修改密码 =====
const pwdOpen = ref(false)
const pwdFormRef = ref(null)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const result = validatePasswordStrength(value)
        if (!result.valid) return callback(new Error(result.msg))
        if (value === pwdForm.oldPassword) return callback(new Error('新密码不能与原密码相同'))
        callback()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (String(value) !== String(pwdForm.newPassword)) return callback(new Error('两次密码不一致'))
        callback()
      },
      trigger: 'blur',
    },
  ],
}

// 新密码强度计算
const newPasswordStrength = computed(() => {
  const pwd = pwdForm.newPassword
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)) score++
  if (pwd.length >= 12) score++
  return score
})

function openPwdDialog() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdOpen.value = true
}

async function submitPwd() {
  const el = pwdFormRef.value
  if (!el) return
  await el.validate((valid) => {
    if (!valid) return
    const result = auth.changePassword(auth.user.username, pwdForm.oldPassword, pwdForm.newPassword)
    if (result.ok) {
      ElMessage.success(result.msg)
      pwdOpen.value = false
    } else {
      ElMessage.error(result.msg)
    }
  })
}

// ===== 修改手机号 =====
const phoneOpen = ref(false)
const phoneFormRef = ref(null)
const phoneForm = reactive({
  newPhone: '',
  captcha: '',
})
const phoneCaptchaExpected = ref('')
const phoneCaptchaRef = ref(null)
const phoneRules = {
  newPhone: [
    { required: true, message: '请输入新手机号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validatePhone(value)) return callback(new Error('请输入正确的11位手机号'))
        if (value === auth.user?.phone) return callback(new Error('新手机号不能与当前手机号相同'))
        callback()
      },
      trigger: 'blur',
    },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        if (String(value).trim().toUpperCase() !== String(phoneCaptchaExpected.value).toUpperCase()) {
          return callback(new Error('验证码不正确'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

function onPhoneCaptchaChange(value) {
  phoneCaptchaExpected.value = value
}

function openPhoneDialog() {
  phoneForm.newPhone = ''
  phoneForm.captcha = ''
  phoneOpen.value = true
}

async function submitPhone() {
  const el = phoneFormRef.value
  if (!el) return
  await el.validate((valid) => {
    if (!valid) return
    const result = auth.changePhone(auth.user.username, phoneForm.newPhone)
    if (result.ok) {
      ElMessage.success(result.msg)
      phoneOpen.value = false
    } else {
      ElMessage.error(result.msg)
    }
  })
}

// ===== 实名认证 =====
const verifyOpen = ref(false)
const verifyFormRef = ref(null)
const verifyForm = reactive({
  realName: '',
  idNumber: '',
})
const verifyRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度为2-20个字符', trigger: 'blur' },
  ],
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validateIdNumber(value)) return callback(new Error('请输入正确的18位身份证号'))
        callback()
      },
      trigger: 'blur',
    },
  ],
}

function openVerifyDialog() {
  verifyForm.realName = auth.user?.realName || ''
  verifyForm.idNumber = auth.user?.idNumber || ''
  verifyOpen.value = true
}

async function submitVerify() {
  const el = verifyFormRef.value
  if (!el) return
  await el.validate((valid) => {
    if (!valid) return
    const result = auth.verifyRealName(auth.user.username, verifyForm.realName, verifyForm.idNumber)
    if (result.ok) {
      ElMessage.success(result.msg)
      verifyOpen.value = false
    } else {
      ElMessage.error(result.msg)
    }
  })
}

// 隐藏身份证号中间部分
function maskIdNumber(id) {
  if (!id || id.length < 10) return id || '未认证'
  return id.slice(0, 4) + '**********' + id.slice(-4)
}

// 隐藏手机号中间部分
function maskPhone(phone) {
  if (!phone) return '未绑定'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
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
        <!-- 账号信息 -->
        <div class="card profile">
          <SectionTitle title="账号信息" subtitle="本项目为纯前端演示，数据保存在本地" />
          <div class="info">
            <div class="row">
              <span class="k">用户名</span>
              <span class="v">{{ auth.user?.username }}</span>
            </div>
            <div class="row">
              <span class="k">手机号</span>
              <span class="v">{{ maskPhone(auth.user?.phone) }}</span>
              <el-button size="small" type="primary" text @click="openPhoneDialog">
                <el-icon><Phone /></el-icon>
                修改
              </el-button>
            </div>
            <div class="row">
              <span class="k">实名认证</span>
              <span class="v">
                <el-tag v-if="auth.isVerified" type="success" size="small">已认证</el-tag>
                <el-tag v-else type="warning" size="small">未认证</el-tag>
              </span>
              <el-button size="small" type="primary" text @click="openVerifyDialog">
                <el-icon><Postcard /></el-icon>
                {{ auth.isVerified ? '查看/修改' : '去认证' }}
              </el-button>
            </div>
            <div class="row">
              <span class="k">登录时间</span>
              <span class="v">{{ auth.user?.loginAt?.slice(0, 19)?.replace('T', ' ') }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button type="primary" round @click="$router.push('/spots')">去逛景点</el-button>
            <el-button round plain @click="openPwdDialog">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-button>
            <el-button round plain @click="logout">退出登录</el-button>
          </div>
        </div>

        <!-- 数据概览 -->
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

      <!-- 安全设置 -->
      <section class="card security">
        <SectionTitle title="安全设置" subtitle="管理您的账号安全选项" />
        <div class="security-list">
          <div class="security-item" @click="openPwdDialog">
            <div class="security-left">
              <el-icon class="security-icon"><Lock /></el-icon>
              <div>
                <div class="security-title">修改密码</div>
                <div class="security-desc">定期修改密码有助于保护账号安全</div>
              </div>
            </div>
            <el-icon class="security-arrow"><Edit /></el-icon>
          </div>
          <div class="security-item" @click="openPhoneDialog">
            <div class="security-left">
              <el-icon class="security-icon"><Phone /></el-icon>
              <div>
                <div class="security-title">修改手机号</div>
                <div class="security-desc">当前手机号：{{ maskPhone(auth.user?.phone) }}</div>
              </div>
            </div>
            <el-icon class="security-arrow"><Edit /></el-icon>
          </div>
          <div class="security-item" @click="openVerifyDialog">
            <div class="security-left">
              <el-icon class="security-icon"><Postcard /></el-icon>
              <div>
                <div class="security-title">实名认证</div>
                <div class="security-desc">
                  {{ auth.isVerified ? `已认证：${auth.user?.realName}（${maskIdNumber(auth.user?.idNumber)}）` : '完成实名认证后可享受更多服务' }}
                </div>
              </div>
            </div>
            <el-icon class="security-arrow"><Edit /></el-icon>
          </div>
        </div>
      </section>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="pwdOpen" title="修改密码" width="440px" :close-on-click-modal="false">
      <el-form :model="pwdForm" :rules="pwdRules" label-position="top" ref="pwdFormRef">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" placeholder="请输入原密码" show-password clearable />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" placeholder="请输入新密码" show-password clearable />
        </el-form-item>
        <!-- 新密码强度指示器 -->
        <div v-if="pwdForm.newPassword" class="strength-bar">
          <div class="strength-track">
            <div
              class="strength-fill"
              :style="{
                width: `${newPasswordStrength * 20}%`,
                background: newPasswordStrength <= 1 ? '#f56c6c' : newPasswordStrength <= 3 ? '#e6a23c' : '#67c23a',
              }"
            />
          </div>
          <span
            class="strength-label"
            :style="{
              color: newPasswordStrength <= 1 ? '#f56c6c' : newPasswordStrength <= 3 ? '#e6a23c' : '#67c23a',
            }"
          >
            密码强度：{{ newPasswordStrength <= 1 ? '弱' : newPasswordStrength <= 3 ? '中' : '强' }}
          </span>
        </div>
        <div class="password-tips">
          <div :class="['tip', { met: pwdForm.newPassword && /[A-Z]/.test(pwdForm.newPassword) }]">
            包含大写字母
          </div>
          <div :class="['tip', { met: pwdForm.newPassword && /[a-z]/.test(pwdForm.newPassword) }]">
            包含小写字母
          </div>
          <div :class="['tip', { met: pwdForm.newPassword && /[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]/.test(pwdForm.newPassword) }]">
            包含特殊字符
          </div>
          <div :class="['tip', { met: pwdForm.newPassword && pwdForm.newPassword.length >= 8 }]">
            至少8位
          </div>
        </div>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" show-password clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdOpen = false">取消</el-button>
        <el-button type="primary" @click="submitPwd">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 修改手机号对话框 -->
    <el-dialog v-model="phoneOpen" title="修改手机号" width="440px" :close-on-click-modal="false">
      <div class="current-info">
        当前手机号：<strong>{{ maskPhone(auth.user?.phone) || '未绑定' }}</strong>
      </div>
      <el-form :model="phoneForm" :rules="phoneRules" label-position="top" ref="phoneFormRef">
        <el-form-item label="新手机号" prop="newPhone">
          <el-input v-model="phoneForm.newPhone" placeholder="请输入新的11位手机号" clearable maxlength="11" />
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-row">
            <el-input v-model="phoneForm.captcha" placeholder="不区分大小写" clearable />
            <CaptchaCanvas ref="phoneCaptchaRef" @change="onPhoneCaptchaChange" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneOpen = false">取消</el-button>
        <el-button type="primary" @click="submitPhone">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 实名认证对话框 -->
    <el-dialog v-model="verifyOpen" title="实名认证" width="440px" :close-on-click-modal="false">
      <div v-if="auth.isVerified" class="verified-hint">
        您已完成实名认证，修改后将覆盖原有认证信息
      </div>
      <el-form :model="verifyForm" :rules="verifyRules" label-position="top" ref="verifyFormRef">
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="verifyForm.realName" placeholder="请输入身份证上的姓名" clearable />
        </el-form-item>
        <el-form-item label="身份证号" prop="idNumber">
          <el-input v-model="verifyForm.idNumber" placeholder="请输入18位身份证号" clearable maxlength="18" />
        </el-form-item>
      </el-form>
      <div class="verify-notice">
        <el-icon><Postcard /></el-icon>
        实名信息仅用于身份验证，不会泄露给第三方
      </div>
      <template #footer>
        <el-button @click="verifyOpen = false">取消</el-button>
        <el-button type="primary" @click="submitVerify">
          {{ auth.isVerified ? '更新认证' : '提交认证' }}
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
  align-items: center;
  gap: 12px;
  font-weight: 700;
}

.k {
  color: var(--text-muted);
  white-space: nowrap;
}

.v {
  color: var(--text-strong);
  font-weight: 900;
  flex: 1;
  text-align: right;
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

/* 安全设置区域 */
.security {
  margin-top: 14px;
  padding: 16px;
}

.security-list {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.security-item:hover {
  border-color: rgba(74, 144, 226, 0.35);
  background: rgba(74, 144, 226, 0.04);
}

.security-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.security-icon {
  font-size: 22px;
  color: var(--brand-primary);
}

.security-title {
  font-weight: 800;
  color: var(--text-strong);
  font-size: 14px;
}

.security-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.security-arrow {
  color: var(--text-muted);
  font-size: 16px;
}

/* 密码强度条 */
.strength-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -4px 0 8px;
}

.strength-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(12, 35, 64, 0.08);
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background 0.3s ease;
}

.strength-label {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* 密码要求提示 */
.password-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: -2px 0 8px;
}

.tip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(12, 35, 64, 0.06);
  color: var(--text-muted);
  transition: background 0.2s, color 0.2s;
}

.tip.met {
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
}

/* 验证码行 */
.captcha-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  width: 100%;
  align-items: center;
}

/* 当前手机号提示 */
.current-info {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(74, 144, 226, 0.06);
  color: var(--text);
  font-weight: 600;
  font-size: 14px;
}

.current-info strong {
  color: var(--brand-primary);
}

/* 已认证提示 */
.verified-hint {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(230, 162, 60, 0.08);
  color: #e6a23c;
  font-weight: 700;
  font-size: 14px;
}

/* 实名认证隐私提示 */
.verify-notice {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
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
