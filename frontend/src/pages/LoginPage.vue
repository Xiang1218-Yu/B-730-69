<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import CaptchaCanvas from '../components/CaptchaCanvas.vue'
import { scenicImage } from '../utils/media'
import { useAuthStore } from '../store/auth'
import { validatePassword, validatePhone, getStrengthInfo } from '../utils/validators'
import { encode, decode } from '../utils/crypto'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
auth.hydrate()

// 背景图
const bg = scenicImage('login-bg', { title: '悦行山海', subtitle: '登录' })

// 表单引用和状态
const captchaExpected = ref('')
const captchaRef = ref(null)
const formRef = ref(null)
const loading = ref(false)

// 模式切换：login / register
const mode = ref('login')
const modeOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
]

// 密码强度状态
const passwordStrength = ref(0)

// 记住密码相关
const rememberKey = 'yuexing_login_remember'

// 表单数据
const form = reactive({
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  remember: true,
})

// 监听密码输入，实时计算强度
watch(() => form.password, (val) => {
  const result = validatePassword(val)
  passwordStrength.value = result.strength
})

// 计算密码强度显示信息
const strengthInfo = computed(() => getStrengthInfo(passwordStrength.value))

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
  ],
  phone: [
    {
      validator: (rule, value, callback) => {
        if (mode.value !== 'register') return callback()
        if (!value) return callback(new Error('请输入手机号'))
        if (!validatePhone(value)) return callback(new Error('请输入正确的手机号格式'))
        callback()
      },
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        // 登录时不强制密码强度（兼容旧账号），注册时强制
        if (mode.value === 'register') {
          const result = validatePassword(value)
          if (!result.valid) {
            return callback(new Error(result.message))
          }
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
 */
function onCaptchaChange(value) {
  captchaExpected.value = value
}

/**
 * 提交表单（登录/注册）
 */
async function submit(formEl) {
  const el = formEl?.value ?? formEl
  if (!el) return

  await el.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      let result

      if (mode.value === 'register') {
        // 注册流程
        result = auth.register({
          username: form.username,
          password: form.password,
          phone: form.phone,
        })

        if (result.success) {
          ElMessage.success('注册成功，请登录')
          mode.value = 'login'
          form.confirmPassword = ''
          form.password = ''
          form.phone = ''
          if (captchaRef.value) {
            captchaRef.value.refresh()
          }
        } else {
          ElMessage.warning(result.message)
        }
      } else {
        // 登录流程
        result = auth.login({
          username: form.username,
          password: form.password,
        })

        if (result.success) {
          saveRemembered()
          ElMessage.success(result.message)
          const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
          router.replace(redirect)
        } else {
          ElMessage.error(result.message)
          if (captchaRef.value) {
            captchaRef.value.refresh()
          }
        }
      }
    } finally {
      loading.value = false
    }
  })
}

/**
 * 跳转到密码重置页
 */
function goToReset() {
  router.push('/reset-password')
}

/**
 * 第三方登录入口（演示）
 */
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
            <el-input v-model="form.username" placeholder="用户名 / 手机号" clearable />
          </el-form-item>

          <!-- 注册时显示手机号输入 -->
          <el-form-item v-if="mode === 'register'" label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" clearable maxlength="11" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入密码" show-password clearable />
            <!-- 密码强度提示 -->
            <div v-if="mode === 'register' && form.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :style="{ width: strengthInfo.width, background: strengthInfo.color }"
                />
              </div>
              <span class="strength-text" :style="{ color: strengthInfo.color }">
                密码强度：{{ strengthInfo.label }}
              </span>
              <div class="strength-tips">
                需包含：大小写字母、数字、特殊字符（!@#$%^&*等），长度8-20位
              </div>
            </div>
          </el-form-item>

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
            <a class="forgot" href="#" @click.prevent="goToReset">忘记密码？</a>
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
  border-radius: 14px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit:hover {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.92), rgba(125, 209, 129, 0.98));
  transform: translateY(-1px);
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

/* 密码强度样式 */
.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 6px;
  background: rgba(12, 35, 64, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.strength-text {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
}

.strength-tips {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

@media (max-width: 920px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
