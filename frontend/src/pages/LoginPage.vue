<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import CaptchaCanvas from '../components/CaptchaCanvas.vue'
import { scenicImage } from '../utils/media'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
auth.hydrate()

const bg = scenicImage('login-bg', { title: '悦行山海', subtitle: '登录' })

const captchaExpected = ref('')
const captchaRef = ref(null)
const formRef = ref(null)
const loading = ref(false)

// 当前模式：登录 / 注册
const mode = ref('login')
const modeOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
]

// 密码重置对话框
const resetOpen = ref(false)
const resetStep = ref(1)
const resetFormRef = ref(null)
const resetForm = reactive({
  username: '',
  phone: '',
  newPassword: '',
  confirmPassword: '',
  captcha: '',
})
const resetCaptchaExpected = ref('')
const resetCaptchaRef = ref(null)

// 记住密码相关
const rememberKey = 'yuexing_login_remember'
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  captcha: '',
  remember: true,
})

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

// 计算密码强度等级（用于可视化展示）
const passwordStrength = computed(() => {
  const pwd = form.password
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)) score++
  if (pwd.length >= 12) score++
  return score
})

const passwordStrengthLabel = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return '弱'
  if (s <= 3) return '中'
  return '强'
})

const passwordStrengthColor = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return '#f56c6c'
  if (s <= 3) return '#e6a23c'
  return '#67c23a'
})

// 重置密码的强度校验
const resetPasswordStrength = computed(() => {
  const pwd = resetForm.newPassword
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)) score++
  if (pwd.length >= 12) score++
  return score
})

// 手机号校验
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 密码规则辅助函数（避免在模板中直接使用含特殊字符的正则表达式）
const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/
function hasUpper(pwd) { return /[A-Z]/.test(pwd) }
function hasLower(pwd) { return /[a-z]/.test(pwd) }
function hasSpecial(pwd) { return SPECIAL_CHAR_RE.test(pwd) }
function hasMinLen(pwd, len) { return pwd && pwd.length >= len }

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (mode.value !== 'register') return callback()
        if (!validatePhone(value)) return callback(new Error('请输入正确的11位手机号'))
        callback()
      },
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (mode.value !== 'register') return callback()
        const result = validatePasswordStrength(value)
        if (!result.valid) return callback(new Error(result.msg))
        callback()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (mode.value !== 'register') return callback()
        if (!value) return callback(new Error('请再次输入密码'))
        if (String(value) !== String(form.password)) return callback(new Error('两次密码不一致'))
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
        if (String(value).trim().toUpperCase() !== String(captchaExpected.value).toUpperCase()) {
          return callback(new Error('验证码不正确'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

// 重置密码表单校验规则
const resetRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!validatePhone(value)) return callback(new Error('请输入正确的11位手机号'))
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
        if (String(value).trim().toUpperCase() !== String(resetCaptchaExpected.value).toUpperCase()) {
          return callback(new Error('验证码不正确'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const result = validatePasswordStrength(value)
        if (!result.valid) return callback(new Error(result.msg))
        callback()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (String(value) !== String(resetForm.newPassword)) return callback(new Error('两次密码不一致'))
        callback()
      },
      trigger: 'blur',
    },
  ],
}

function encode(value) {
  try {
    return btoa(unescape(encodeURIComponent(value)))
  } catch {
    return ''
  }
}

function decode(value) {
  try {
    return decodeURIComponent(escape(atob(value)))
  } catch {
    return ''
  }
}

function loadRemembered() {
  const raw = localStorage.getItem(rememberKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    form.username = parsed.username ?? ''
    form.password = parsed.password ? decode(parsed.password) : ''
    form.remember = Boolean(parsed.remember)
  } catch {}
}

function saveRemembered() {
  if (!form.remember) {
    localStorage.removeItem(rememberKey)
    return
  }
  localStorage.setItem(
    rememberKey,
    JSON.stringify({
      username: form.username,
      password: encode(form.password),
      remember: true,
      savedAt: new Date().toISOString(),
    }),
  )
}

function onCaptchaChange(value) {
  captchaExpected.value = value
}

function onResetCaptchaChange(value) {
  resetCaptchaExpected.value = value
}

async function submit(formEl) {
  const el = formEl?.value ?? formEl
  if (!el) return
  await el.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const username = String(form.username).trim()
      const password = String(form.password)

      if (mode.value === 'register') {
        // 注册：检查用户名是否已存在
        if (auth.userExists(username)) {
          ElMessage.warning('账号已存在，请直接登录')
          mode.value = 'login'
          return
        }
        // 注册：保存新用户
        auth.register({ username, password, phone: form.phone })
        ElMessage.success('注册成功，请登录')
        mode.value = 'login'
        form.confirmPassword = ''
        form.captcha = ''
        captchaRef.value?.refresh()
        return
      }

      // 登录：验证密码
      if (!auth.verifyPassword(username, password)) {
        const exists = auth.userExists(username)
        if (!exists) {
          ElMessage.warning('账号不存在，请先注册')
          mode.value = 'register'
        } else {
          ElMessage.error('密码不正确')
        }
        return
      }

      // 登录成功
      saveRemembered()
      auth.login({ username })
      ElMessage.success('登录成功')
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
      router.replace(redirect)
    } finally {
      loading.value = false
    }
  })
}

// 打开密码重置对话框
function openReset() {
  resetForm.username = form.username
  resetForm.phone = ''
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''
  resetForm.captcha = ''
  resetStep.value = 1
  resetOpen.value = true
}

// 密码重置第一步：验证账号和手机号
async function submitResetStep1(formEl) {
  const el = formEl?.value ?? formEl
  if (!el) return
  await el.validateField(['username', 'phone', 'captcha'], (valid) => {
    if (!valid) return
    // 验证账号和手机号是否匹配
    const result = auth.resetPassword(resetForm.username, resetForm.phone, '')
    if (result.msg === '账号不存在') {
      ElMessage.error('账号不存在')
      return
    }
    if (result.msg === '手机号不匹配') {
      ElMessage.error('手机号与注册时不匹配')
      return
    }
    // 验证通过，进入第二步
    resetStep.value = 2
  })
}

// 密码重置第二步：设置新密码
async function submitResetStep2(formEl) {
  const el = formEl?.value ?? formEl
  if (!el) return
  await el.validateField(['newPassword', 'confirmPassword'], (valid) => {
    if (!valid) return
    const result = auth.resetPassword(resetForm.username, resetForm.phone, resetForm.newPassword)
    if (result.ok) {
      ElMessage.success('密码重置成功，请使用新密码登录')
      resetOpen.value = false
      form.username = resetForm.username
      form.password = ''
    } else {
      ElMessage.error(result.msg)
    }
  })
}

function openThirdLogin(provider) {
  const label = provider === 'wechat' ? '微信' : provider === 'alipay' ? '支付宝' : '第三方'
  ElMessage.info(`${label}快捷登录入口（演示）`)
}

onMounted(() => {
  if (auth.isLoggedIn) router.replace('/home')
  loadRemembered()
})
</script>

<template>
  <div class="login" :style="{ '--bg': `url(${bg})` }">
    <div class="overlay" />
    <div class="content">
      <div class="brand">
        <div class="logo">悦</div>
        <div class="text">
          <div class="title">悦行山海</div>
          <div class="sub">与自然同行，向山海出发</div>
        </div>
      </div>

      <div class="panel card">
        <div class="panel-title">游客{{ mode === 'login' ? '登录' : '注册' }}</div>
        <div class="mode">
          <el-segmented v-model="mode" :options="modeOptions" />
        </div>
        <el-form :model="form" :rules="rules" label-position="top" class="form" ref="formRef">
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="手机号 / 邮箱 / 用户名" clearable />
          </el-form-item>

          <!-- 注册时显示手机号输入 -->
          <el-form-item v-if="mode === 'register'" label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入11位手机号" clearable maxlength="11" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入密码" show-password clearable />
          </el-form-item>

          <!-- 注册时显示密码强度指示器 -->
          <div v-if="mode === 'register' && form.password" class="strength-bar">
            <div class="strength-track">
              <div
                class="strength-fill"
                :style="{ width: `${passwordStrength * 20}%`, background: passwordStrengthColor }"
              />
            </div>
            <span class="strength-label" :style="{ color: passwordStrengthColor }">
              密码强度：{{ passwordStrengthLabel }}
            </span>
          </div>

          <!-- 注册时显示密码要求提示 -->
          <div v-if="mode === 'register'" class="password-tips">
            <div :class="['tip', { met: form.password && hasUpper(form.password) }]">
              包含大写字母
            </div>
            <div :class="['tip', { met: form.password && hasLower(form.password) }]">
              包含小写字母
            </div>
            <div :class="['tip', { met: form.password && hasSpecial(form.password) }]">
              包含特殊字符
            </div>
            <div :class="['tip', { met: hasMinLen(form.password, 8) }]">
              至少8位
            </div>
          </div>

          <el-form-item v-if="mode === 'register'" label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" placeholder="请再次输入密码" show-password clearable />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="不区分大小写" clearable />
              <CaptchaCanvas ref="captchaRef" @change="onCaptchaChange" />
            </div>
          </el-form-item>

          <div class="extra">
            <el-checkbox v-model="form.remember">记住密码</el-checkbox>
            <a class="forgot" href="#" @click.prevent="openReset">忘记密码？</a>
          </div>

          <button class="submit" type="button" :disabled="loading" @click="submit(formRef)">
            {{ loading ? (mode === 'login' ? '登录中...' : '注册中...') : mode === 'login' ? '登录' : '注册' }}
          </button>

          <div v-if="mode === 'login'" class="third">
            <div class="third-divider"><span>第三方快捷登录</span></div>
            <div class="third-links">
              <a class="third-link" href="#" @click.prevent="openThirdLogin('wechat')">
                <img class="third-icon" src="/images/icons/wechat.svg" alt="微信" />
                <span>微信</span>
              </a>
              <a class="third-link" href="#" @click.prevent="openThirdLogin('alipay')">
                <img class="third-icon" src="/images/icons/alipay.svg" alt="支付宝" />
                <span>支付宝</span>
              </a>
            </div>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 密码重置对话框 -->
    <el-dialog v-model="resetOpen" title="重置密码" width="440px" :close-on-click-modal="false">
      <!-- 第一步：验证身份 -->
      <el-form
        v-if="resetStep === 1"
        :model="resetForm"
        :rules="resetRules"
        label-position="top"
        ref="resetFormRef"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="resetForm.username" placeholder="请输入注册时的账号" clearable />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="resetForm.phone" placeholder="请输入注册时的手机号" clearable maxlength="11" />
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-row">
            <el-input v-model="resetForm.captcha" placeholder="不区分大小写" clearable />
            <CaptchaCanvas ref="resetCaptchaRef" @change="onResetCaptchaChange" />
          </div>
        </el-form-item>
      </el-form>

      <!-- 第二步：设置新密码 -->
      <el-form v-else :model="resetForm" :rules="resetRules" label-position="top" ref="resetFormRef">
        <div class="reset-step-hint">身份验证通过，请设置新密码</div>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" placeholder="请输入新密码" show-password clearable />
        </el-form-item>
        <!-- 新密码强度指示器 -->
        <div v-if="resetForm.newPassword" class="strength-bar">
          <div class="strength-track">
            <div
              class="strength-fill"
              :style="{
                width: `${resetPasswordStrength * 20}%`,
                background: resetPasswordStrength <= 1 ? '#f56c6c' : resetPasswordStrength <= 3 ? '#e6a23c' : '#67c23a',
              }"
            />
          </div>
          <span
            class="strength-label"
            :style="{
              color: resetPasswordStrength <= 1 ? '#f56c6c' : resetPasswordStrength <= 3 ? '#e6a23c' : '#67c23a',
            }"
          >
            密码强度：{{ resetPasswordStrength <= 1 ? '弱' : resetPasswordStrength <= 3 ? '中' : '强' }}
          </span>
        </div>
        <div class="password-tips">
          <div :class="['tip', { met: resetForm.newPassword && hasUpper(resetForm.newPassword) }]">
            包含大写字母
          </div>
          <div :class="['tip', { met: resetForm.newPassword && hasLower(resetForm.newPassword) }]">
            包含小写字母
          </div>
          <div :class="['tip', { met: resetForm.newPassword && hasSpecial(resetForm.newPassword) }]">
            包含特殊字符
          </div>
          <div :class="['tip', { met: hasMinLen(resetForm.newPassword, 8) }]">
            至少8位
          </div>
        </div>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" placeholder="请再次输入新密码" show-password clearable />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetOpen = false">取消</el-button>
        <el-button v-if="resetStep === 1" type="primary" @click="submitResetStep1(resetFormRef)">
          验证身份
        </el-button>
        <el-button v-else type="primary" @click="submitResetStep2(resetFormRef)">
          重置密码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  padding: 28px 18px;
  background-image: var(--bg);
  background-size: cover;
  background-position: center;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 35, 64, 0.55), rgba(12, 35, 64, 0.18));
  backdrop-filter: blur(14px);
}

.content {
  position: relative;
  z-index: 2;
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 28px;
  align-items: center;
}

.brand {
  color: rgba(255, 255, 255, 0.92);
  display: flex;
  gap: 14px;
  align-items: center;
}

.logo {
  height: 56px;
  width: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.95), rgba(125, 209, 129, 0.92));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
}

.text .title {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 1px;
}

.text .sub {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 600;
}

.panel {
  padding: 18px 18px 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
}

.panel-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-strong);
  margin-bottom: 10px;
}

.mode {
  margin-bottom: 12px;
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.extra {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.forgot {
  font-weight: 700;
  color: var(--brand-primary);
}

.submit {
  margin-top: 12px;
  width: 100%;
  height: 44px;
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, var(--brand-primary), rgba(125, 209, 129, 0.92));
  box-shadow: 0 16px 34px rgba(74, 144, 226, 0.25);
}

.submit:hover {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.92), rgba(125, 209, 129, 0.98));
}

.submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.third {
  margin-top: 14px;
}

.third-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(12, 35, 64, 0.62);
  font-weight: 700;
  font-size: 12px;
}

.third-divider::before,
.third-divider::after {
  content: '';
  height: 1px;
  background: rgba(12, 35, 64, 0.12);
  flex: 1;
}

.third-links {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.third-link {
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(12, 35, 64, 0.12);
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  color: rgba(12, 35, 64, 0.86);
}

.third-link:hover {
  border-color: rgba(74, 144, 226, 0.35);
  background: rgba(74, 144, 226, 0.06);
}

.third-icon {
  height: 22px;
  width: 22px;
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

/* 重置密码步骤提示 */
.reset-step-hint {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(103, 194, 58, 0.08);
  color: #67c23a;
  font-weight: 700;
  font-size: 14px;
}

@media (max-width: 920px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
