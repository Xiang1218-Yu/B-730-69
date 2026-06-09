<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

import { useAuthStore } from '../store/auth'
import { validatePassword, validatePhone, getStrengthInfo } from '../utils/validators'
import { useCountdown } from '../composables/useCountdown'
import { scenicImage } from '../utils/media'

const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

// 背景图
const bg = scenicImage('login-bg', { title: '悦行山海', subtitle: '重置密码' })

// 倒计时
const { countdown, start: startCountdown, isCounting } = useCountdown(60)

// 步骤：1-输入手机号获取验证码，2-设置新密码
const step = ref(1)
const formRef = ref(null)
const loading = ref(false)

// 密码强度
const passwordStrength = ref(0)

// 表单数据
const form = reactive({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

// 监听密码输入
watch(() => form.newPassword, (val) => {
  const result = validatePassword(val)
  passwordStrength.value = result.strength
})

// 密码强度信息
const strengthInfo = computed(() => getStrengthInfo(passwordStrength.value))

// 发送按钮文字
const smsBtnText = computed(() => {
  if (isCounting()) return `${countdown.value}s后重发`
  return '获取验证码'
})

// 表单验证规则
const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        if (!validatePhone(value)) return callback(new Error('请输入正确的手机号格式'))
        callback()
      },
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const result = validatePassword(value)
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
        if (String(value) !== String(form.newPassword)) {
          return callback(new Error('两次密码不一致'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

// 请求锁，防止重复点击
const smsSending = ref(false)

/**
 * 发送验证码
 */
function sendCode() {
  // 逻辑层守卫：倒计时中或正在发送时直接返回（兜底防重）
  if (isCounting() || smsSending.value) {
    return
  }

  if (!form.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (!validatePhone(form.phone)) {
    ElMessage.warning('请输入正确的手机号格式')
    return
  }

  // 校验手机号是否已注册
  const checkResult = auth.checkPhoneRegistered(form.phone)
  if (!checkResult.success) {
    ElMessage.error(checkResult.message)
    return
  }

  smsSending.value = true
  try {
    const result = auth.sendSmsCode(form.phone)
    if (result.success) {
      ElMessage.success(result.message)
      startCountdown()
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    smsSending.value = false
  }
}

/**
 * 验证验证码，进入下一步
 */
async function verifyCode() {
  const valid = await formRef.value?.validateField(['phone', 'code'])
  if (!valid) return

  loading.value = true
  try {
    const result = auth.verifySmsCode(form.phone, form.code)
    if (result.success) {
      step.value = 2
      ElMessage.success('验证成功，请设置新密码')
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 提交新密码
 */
async function submitNewPassword() {
  const valid = await formRef.value?.validateField(['newPassword', 'confirmPassword'])
  if (!valid) return

  loading.value = true
  try {
    const result = auth.resetPassword({
      phone: form.phone,
      newPassword: form.newPassword,
    })

    if (result.success) {
      ElMessage.success(result.message + '，即将跳转到登录页')
      setTimeout(() => {
        router.replace('/login')
      }, 1500)
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 返回上一步
 */
function goBack() {
  if (step.value === 2) {
    step.value = 1
  } else {
    router.back()
  }
}

/**
 * 返回登录页
 */
function goToLogin() {
  router.replace('/login')
}

onMounted(() => {
  if (auth.isLoggedIn) {
    router.replace('/home')
  }
})
</script>

<template>
  <div class="reset-page" :style="{ '--bg': `url(${bg})` }">
    <div class="overlay" />
    <div class="content">
      <div class="brand">
        <div class="logo">悦</div>
        <div class="text">
          <div class="title">悦行山海</div>
          <div class="sub">重置密码</div>
        </div>
      </div>

      <div class="panel card">
        <div class="panel-header">
          <button class="back-btn" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <div class="panel-title">重置密码</div>
          <div class="step-indicator">
            <span :class="{ active: step >= 1 }">1</span>
            <span class="line" :class="{ active: step >= 2 }" />
            <span :class="{ active: step >= 2 }">2</span>
          </div>
        </div>

        <el-form :model="form" :rules="rules" label-position="top" class="form" ref="formRef">
          <!-- 第一步：手机号验证 -->
          <template v-if="step === 1">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入注册手机号" clearable maxlength="11" />
            </el-form-item>

            <el-form-item label="验证码" prop="code">
              <div class="code-row">
                <el-input v-model="form.code" placeholder="请输入6位验证码" clearable maxlength="6" />
                <button
                  class="code-btn"
                  type="button"
                  :class="{ disabled: isCounting() || smsSending }"
                  :disabled="isCounting() || smsSending"
                  @click="sendCode"
                >
                  {{ smsSending ? '发送中...' : smsBtnText }}
                </button>
              </div>
            </el-form-item>

            <button class="submit" type="button" :disabled="loading" @click="verifyCode">
              {{ loading ? '验证中...' : '下一步' }}
            </button>
          </template>

          <!-- 第二步：设置新密码 -->
          <template v-if="step === 2">
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="form.newPassword" placeholder="请输入新密码" show-password clearable />
              <div v-if="form.newPassword" class="password-strength">
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

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" placeholder="请再次输入新密码" show-password clearable />
            </el-form-item>

            <button class="submit" type="button" :disabled="loading" @click="submitNewPassword">
              {{ loading ? '提交中...' : '确认重置' }}
            </button>
          </template>

          <div class="bottom-link">
            <a href="#" @click.prevent="goToLogin">返回登录</a>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
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
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
}

.back-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: rgba(74, 144, 226, 0.4);
  background: rgba(74, 144, 226, 0.06);
}

.panel-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-strong);
  flex: 1;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-indicator span {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  background: rgba(12, 35, 64, 0.1);
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.step-indicator span.active {
  background: var(--brand-primary);
  color: #fff;
}

.step-indicator .line {
  width: 24px;
  height: 2px;
  background: rgba(12, 35, 64, 0.1);
  border-radius: 1px;
}

.step-indicator .line.active {
  background: var(--brand-primary);
}

.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.code-btn {
  height: 36px;
  padding: 0 16px;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  background: rgba(74, 144, 226, 0.08);
  color: var(--brand-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-btn:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.15);
}

.code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit {
  margin-top: 8px;
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

.bottom-link {
  margin-top: 14px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
}

.bottom-link a {
  color: var(--brand-primary);
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
