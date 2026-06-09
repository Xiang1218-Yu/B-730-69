<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import CaptchaCanvas from '../components/CaptchaCanvas.vue'
import { scenicImage } from '../utils/media'
import {
  useAuthStore,
  validatePasswordStrength,
  validatePhone,
} from '../store/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
auth.hydrate()

const bg = scenicImage('login-bg', { title: '悦行山海', subtitle: '登录' })

// 验证码相关
const captchaExpected = ref('')
const captchaRef = ref(null)
const formRef = ref(null)
const loading = ref(false)

// 切换登录 / 注册
const mode = ref('login')
const modeOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
]

// 找回密码（重置密码）弹窗
const forgotOpen = ref(false)
const forgotForm = reactive({
  username: '',
  phone: '',
  newPassword: '',
  confirmPassword: '',
})
const forgotLoading = ref(false)

const rememberKey = 'yuexing_login_remember'

// 表单数据
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  captcha: '',
  remember: true,
})

/**
 * Element Plus 校验器：密码强度
 * 注册时需满足强度规则，登录时仅校验非空
 */
function passwordValidator(rule, value, callback) {
  if (!value) return callback(new Error('请输入密码'))
  if (mode.value !== 'register') return callback()
  const result = validatePasswordStrength(value)
  if (!result.ok) return callback(new Error(result.message))
  callback()
}

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, validator: passwordValidator, trigger: 'blur' }],
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
  phone: [
    {
      validator: (rule, value, callback) => {
        // 注册时手机号必填且格式正确
        if (mode.value !== 'register') return callback()
        if (!value) return callback(new Error('请输入手机号'))
        if (!validatePhone(value)) return callback(new Error('手机号格式不正确'))
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

// 密码强度提示（仅注册模式实时反馈）
const passwordStrength = computed(() => {
  if (!form.password) return { level: 0, text: '', tip: '至少 8 位，含大小写字母、数字与特殊字符' }
  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    digit: /\d/.test(form.password),
    special: /[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/\\|`~]/.test(form.password),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const text = passed >= 5 ? '强' : passed >= 3 ? '中' : '弱'
  return { level: passed, text, checks, tip: '至少 8 位，含大小写字母、数字与特殊字符' }
})

// base64 编解码用于"记住密码"的本地存储
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

// 提交登录或注册
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
        // 调用 store 完成注册
        const result = auth.register({ username, password, phone: form.phone })
        if (!result.ok) {
          ElMessage.warning(result.message)
          return
        }
        ElMessage.success('注册成功，请登录')
        mode.value = 'login'
        form.confirmPassword = ''
        form.phone = ''
        return
      }

      // 登录
      const result = auth.login({ username, password })
      if (!result.ok) {
        ElMessage.error(result.message)
        return
      }
      saveRemembered()
      ElMessage.success('登录成功')
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
      router.replace(redirect)
    } finally {
      loading.value = false
    }
  })
}

// 打开重置密码弹窗
function openForgot() {
  forgotForm.username = form.username
  forgotForm.phone = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
  forgotOpen.value = true
}

// 提交重置密码
function submitForgot() {
  if (!forgotForm.username || !forgotForm.phone) {
    ElMessage.warning('请填写账号与手机号')
    return
  }
  if (!validatePhone(forgotForm.phone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }
  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  forgotLoading.value = true
  try {
    const result = auth.resetPassword({
      username: forgotForm.username,
      phone: forgotForm.phone,
      newPassword: forgotForm.newPassword,
    })
    if (!result.ok) {
      ElMessage.error(result.message)
      return
    }
    ElMessage.success(result.message)
    forgotOpen.value = false
  } finally {
    forgotLoading.value = false
  }
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
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入密码" show-password clearable />
          </el-form-item>
          <!-- 注册模式：密码强度提示 -->
          <div v-if="mode === 'register'" class="strength">
            <div class="bar">
              <span :class="['seg', passwordStrength.level >= 1 ? 'active' : '']" />
              <span :class="['seg', passwordStrength.level >= 3 ? 'active' : '']" />
              <span :class="['seg', passwordStrength.level >= 5 ? 'active' : '']" />
            </div>
            <div class="tip">
              <span v-if="passwordStrength.text">强度：{{ passwordStrength.text }} · </span>
              <span>{{ passwordStrength.tip }}</span>
            </div>
          </div>
          <el-form-item v-if="mode === 'register'" label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" placeholder="请再次输入密码" show-password clearable />
          </el-form-item>
          <el-form-item v-if="mode === 'register'" label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="用于找回密码与实名认证" maxlength="11" clearable />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="不区分大小写" clearable />
              <CaptchaCanvas ref="captchaRef" @change="onCaptchaChange" />
            </div>
          </el-form-item>

          <div class="extra">
            <el-checkbox v-model="form.remember">记住密码</el-checkbox>
            <a class="forgot" href="#" @click.prevent="openForgot">忘记密码？</a>
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

    <!-- 找回 / 重置密码弹窗 -->
    <el-dialog v-model="forgotOpen" title="重置密码" width="440px">
      <el-form label-position="top">
        <el-form-item label="账号">
          <el-input v-model="forgotForm.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="注册手机号">
          <el-input v-model="forgotForm.phone" placeholder="用于校验身份" maxlength="11" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="forgotForm.newPassword"
            placeholder="至少 8 位，含大小写字母、数字与特殊字符"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="forgotForm.confirmPassword" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotOpen = false">取消</el-button>
        <el-button type="primary" :loading="forgotLoading" @click="submitForgot">提交</el-button>
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

/* 密码强度条 */
.strength {
  margin: -8px 0 8px;
}

.strength .bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.strength .seg {
  height: 6px;
  border-radius: 4px;
  background: rgba(12, 35, 64, 0.1);
}

.strength .seg.active:nth-child(1) {
  background: #f56c6c;
}

.strength .seg.active:nth-child(2) {
  background: #e6a23c;
}

.strength .seg.active:nth-child(3) {
  background: #67c23a;
}

.strength .tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
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

@media (max-width: 920px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
