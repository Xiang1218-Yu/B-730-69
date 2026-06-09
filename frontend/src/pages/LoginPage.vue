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

// 背景图
const bg = scenicImage('login-bg', { title: '悦行山海', subtitle: '登录' })

// 验证码相关
const captchaExpected = ref('')
const captchaRef = ref(null)

// 表单引用
const formRef = ref(null)
const loading = ref(false)

// 登录/注册模式切换
const mode = ref('login')
const modeOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
]

// 忘记密码弹窗状态
const forgotOpen = ref(false)
const forgotStep = ref(1) // 1: 输入账号手机号, 2: 设置新密码
const forgotForm = reactive({
  username: '',
  phone: '',
  captcha: '',
  newPassword: '',
  confirmPassword: '',
})
const forgotCaptchaExpected = ref('')
const forgotCaptchaRef = ref(null)

// 记住密码相关key
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
 * 密码强度校验
 * 要求：至少8位，包含大写字母、小写字母、特殊字符
 * @param {string} password - 密码
 * @returns {object} 校验结果 { valid, level, message }
 */
function checkPasswordStrength(password) {
  if (!password) {
    return { valid: false, level: 0, message: '请输入密码' }
  }
  
  // 长度检查
  if (password.length < 8) {
    return { valid: false, level: 1, message: '密码长度至少8位' }
  }
  
  // 包含小写字母
  const hasLower = /[a-z]/.test(password)
  // 包含大写字母
  const hasUpper = /[A-Z]/.test(password)
  // 包含数字
  const hasNumber = /[0-9]/.test(password)
  // 包含特殊字符
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\[\]\\/~`]/.test(password)
  
  // 必须包含大小写字母和特殊字符
  if (!hasLower || !hasUpper || !hasSpecial) {
    return {
      valid: false,
      level: 2,
      message: '密码必须包含大写字母、小写字母和特殊字符',
    }
  }
  
  // 计算强度等级
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
const passwordStrength = computed(() => checkPasswordStrength(form.password))
const forgotPasswordStrength = computed(() => checkPasswordStrength(forgotForm.newPassword))

// 密码强度等级文字
const strengthLabels = ['', '弱', '一般', '良好', '强']
// 密码强度等级颜色
const strengthColors = ['', '#f56c6c', '#e6a23c', '#409eff', '#67c23a']

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号长度至少3位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
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
    {
      validator: (rule, value, callback) => {
        if (mode.value !== 'register') return callback()
        if (!value) return callback(new Error('请再次输入密码'))
        if (String(value) !== String(form.password)) {
          return callback(new Error('两次密码不一致'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  phone: [
    {
      validator: (rule, value, callback) => {
        if (mode.value !== 'register') return callback()
        if (!value) return callback() // 手机号可选
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(value)) {
          return callback(new Error('手机号格式不正确'))
        }
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

// 忘记密码表单验证规则
const forgotRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        if (String(value).trim().toUpperCase() !== String(forgotCaptchaExpected.value).toUpperCase()) {
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
        if (String(value) !== String(forgotForm.newPassword)) {
          return callback(new Error('两次密码不一致'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

/**
 * Base64编码
 * @param {string} value - 要编码的字符串
 * @returns {string} 编码后的字符串
 */
function encode(value) {
  try {
    return btoa(unescape(encodeURIComponent(value)))
  } catch {
    return ''
  }
}

/**
 * Base64解码
 * @param {string} value - 要解码的字符串
 * @returns {string} 解码后的字符串
 */
function decode(value) {
  try {
    return decodeURIComponent(escape(atob(value)))
  } catch {
    return ''
  }
}

/**
 * 加载记住的账号密码
 */
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

/**
 * 保存记住的账号密码
 */
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

/**
 * 验证码变化回调
 * @param {string} value - 新验证码
 */
function onCaptchaChange(value) {
  captchaExpected.value = value
}

/**
 * 忘记密码弹窗验证码变化回调
 * @param {string} value - 新验证码
 */
function onForgotCaptchaChange(value) {
  forgotCaptchaExpected.value = value
}

/**
 * 提交登录/注册表单
 * @param {object} formEl - 表单元素
 */
async function submit(formEl) {
  const el = formEl?.value ?? formEl
  if (!el) return
  
  await el.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    
    try {
      const username = String(form.username).trim()
      const password = String(form.password)
      const phone = String(form.phone).trim()

      if (mode.value === 'register') {
        // 注册模式
        const success = auth.register({ username, password, phone })
        if (!success) {
          ElMessage.warning('账号已存在，请直接登录')
          mode.value = 'login'
          form.confirmPassword = ''
          return
        }
        ElMessage.success('注册成功，请登录')
        mode.value = 'login'
        form.confirmPassword = ''
        form.phone = ''
        // 清空验证码
        captchaRef.value?.refresh?.()
        return
      }

      // 登录模式
      const validCred = auth.validateCredentials({ username, password })
      if (!validCred) {
        ElMessage.error('账号或密码不正确')
        // 刷新验证码
        captchaRef.value?.refresh?.()
        form.captcha = ''
        return
      }

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

/**
 * 打开忘记密码弹窗
 */
function openForgot() {
  forgotForm.username = form.username
  forgotForm.phone = ''
  forgotForm.captcha = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
  forgotStep.value = 1
  forgotOpen.value = true
}

/**
 * 提交忘记密码第一步（验证账号和手机号）
 */
function submitForgotStep1() {
  if (!forgotForm.username || !forgotForm.phone) {
    ElMessage.warning('请填写账号和手机号')
    return
  }
  if (!forgotForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (
    String(forgotForm.captcha).trim().toUpperCase() !==
    String(forgotCaptchaExpected.value).toUpperCase()
  ) {
    ElMessage.error('验证码不正确')
    return
  }
  
  // 验证账号和手机号是否匹配
  const users = loadUsers()
  const user = users[forgotForm.username]
  if (!user) {
    ElMessage.error('账号不存在')
    return
  }
  if (user.phone && user.phone !== forgotForm.phone) {
    ElMessage.error('手机号与账号不匹配')
    return
  }
  
  forgotStep.value = 2
}

/**
 * 提交忘记密码第二步（设置新密码）
 */
function submitForgotStep2() {
  if (!forgotForm.newPassword || !forgotForm.confirmPassword) {
    ElMessage.warning('请填写新密码')
    return
  }
  
  const result = checkPasswordStrength(forgotForm.newPassword)
  if (!result.valid) {
    ElMessage.error(result.message)
    return
  }
  
  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    ElMessage.error('两次密码不一致')
    return
  }
  
  // 重置密码
  const resetResult = auth.resetPassword({
    username: forgotForm.username,
    phone: forgotForm.phone,
    newPassword: forgotForm.newPassword,
  })
  
  if (resetResult.success) {
    ElMessage.success(resetResult.message)
    forgotOpen.value = false
    mode.value = 'login'
    form.username = forgotForm.username
    form.password = ''
  } else {
    ElMessage.error(resetResult.message)
  }
}

/**
 * 加载用户数据（用于验证）
 * @returns {object} 用户数据
 */
function loadUsers() {
  const raw = localStorage.getItem('yuexing_users')
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * 第三方登录
 * @param {string} provider - 第三方提供商
 */
function openThirdLogin(provider) {
  const label = provider === 'wechat' ? '微信' : provider === 'alipay' ? '支付宝' : '第三方'
  ElMessage.info(`${label}快捷登录入口（演示）`)
}

// 页面挂载时
onMounted(() => {
  // 如果已登录，跳转首页
  if (auth.isLoggedIn) router.replace('/home')
  // 加载记住的密码
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
            <el-input v-model="form.username" placeholder="用户名 / 手机号 / 邮箱" clearable />
          </el-form-item>
          
          <el-form-item v-if="mode === 'register'" label="手机号（选填）" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" clearable />
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
            />
            <!-- 密码强度提示（注册时显示） -->
            <div v-if="mode === 'register' && form.password" class="password-strength">
              <div class="strength-bar">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="strength-item"
                  :class="{ active: i <= passwordStrength.level }"
                  :style="{ backgroundColor: i <= passwordStrength.level ? strengthColors[passwordStrength.level] : '' }"
                ></div>
              </div>
              <span class="strength-text" :style="{ color: strengthColors[passwordStrength.level] }">
                {{ strengthLabels[passwordStrength.level] }}
              </span>
            </div>
            <div v-if="mode === 'register'" class="password-tip">
              密码需包含大写字母、小写字母和特殊字符，长度至少8位
            </div>
          </el-form-item>
          
          <el-form-item v-if="mode === 'register'" label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              clearable
            />
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

    <!-- 忘记密码弹窗 -->
    <el-dialog v-model="forgotOpen" title="找回密码" width="420px" :close-on-click-modal="false">
      <!-- 第一步：验证身份 -->
      <div v-if="forgotStep === 1">
        <el-form :model="forgotForm" :rules="forgotRules" label-position="top">
          <el-form-item label="账号" prop="username">
            <el-input v-model="forgotForm.username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="forgotForm.phone" placeholder="请输入注册时的手机号" />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="forgotForm.captcha" placeholder="不区分大小写" clearable />
              <CaptchaCanvas ref="forgotCaptchaRef" @change="onForgotCaptchaChange" />
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 第二步：设置新密码 -->
      <div v-else>
        <el-form :model="forgotForm" :rules="forgotRules" label-position="top">
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="forgotForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
              clearable
            />
            <!-- 密码强度提示 -->
            <div v-if="forgotForm.newPassword" class="password-strength">
              <div class="strength-bar">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="strength-item"
                  :class="{ active: i <= forgotPasswordStrength.level }"
                  :style="{ backgroundColor: i <= forgotPasswordStrength.level ? strengthColors[forgotPasswordStrength.level] : '' }"
                ></div>
              </div>
              <span class="strength-text" :style="{ color: strengthColors[forgotPasswordStrength.level] }">
                {{ strengthLabels[forgotPasswordStrength.level] }}
              </span>
            </div>
            <div class="password-tip">
              密码需包含大写字母、小写字母和特殊字符，长度至少8位
            </div>
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="forgotForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              clearable
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="forgotOpen = false">取消</el-button>
        <el-button v-if="forgotStep === 2" @click="forgotStep = 1">上一步</el-button>
        <el-button type="primary" @click="forgotStep === 1 ? submitForgotStep1() : submitForgotStep2()">
          {{ forgotStep === 1 ? '下一步' : '确认重置' }}
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
