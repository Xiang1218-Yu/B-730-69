<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Phone } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useAuthStore } from '../store/auth'
import { validatePhone } from '../utils/validators'
import { useCountdown } from '../composables/useCountdown'

const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

// 倒计时
const { countdown, start: startCountdown, isCounting } = useCountdown(60)

const formRef = ref(null)
const loading = ref(false)

// 当前手机号（脱敏显示）
const currentPhoneDisplay = computed(() => {
  const phone = auth.user?.phone
  if (!phone) return '未绑定'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
})

// 表单数据
const form = reactive({
  newPhone: '',
  code: '',
})

// 发送按钮文字
const smsBtnText = computed(() => {
  if (isCounting()) return `${countdown.value}s后重发`
  return '获取验证码'
})

// 表单验证规则
const rules = {
  newPhone: [
    { required: true, message: '请输入新手机号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        if (!validatePhone(value)) return callback(new Error('请输入正确的手机号格式'))
        if (value === auth.user?.phone) {
          return callback(new Error('新手机号不能与原手机号相同'))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' },
  ],
}

/**
 * 发送验证码到新手机号
 */
function sendCode() {
  if (!form.newPhone) {
    ElMessage.warning('请先输入新手机号')
    return
  }
  if (!validatePhone(form.newPhone)) {
    ElMessage.warning('请输入正确的手机号格式')
    return
  }
  if (form.newPhone === auth.user?.phone) {
    ElMessage.warning('新手机号不能与原手机号相同')
    return
  }

  const result = auth.sendSmsCode(form.newPhone)
  if (result.success) {
    ElMessage.success(result.message)
    startCountdown()
  } else {
    ElMessage.error(result.message)
  }
}

/**
 * 提交修改
 */
async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = auth.changePhone({
      newPhone: form.newPhone,
      code: form.code,
    })

    if (result.success) {
      ElMessage.success(result.message)
      setTimeout(() => {
        router.push('/me')
      }, 1000)
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 返回用户中心
 */
function goBack() {
  router.back()
}

onMounted(() => {
  if (!auth.isLoggedIn) {
    router.replace('/login')
  }
})
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="page-header card">
        <button class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <div class="header-title">
          <el-icon><Phone /></el-icon>
          修改手机号
        </div>
      </div>

      <div class="content card">
        <SectionTitle title="修改手机号" subtitle="绑定新手机号后，可使用新手机号登录" />

        <!-- 当前手机号显示 -->
        <div class="current-info">
          <div class="info-label">当前手机号</div>
          <div class="info-value">{{ currentPhoneDisplay }}</div>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="form">
          <el-form-item label="新手机号" prop="newPhone">
            <el-input v-model="form.newPhone" placeholder="请输入新手机号" clearable maxlength="11" />
          </el-form-item>

          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="请输入6位验证码" clearable maxlength="6" />
              <button
                class="code-btn"
                type="button"
                :disabled="isCounting()"
                @click="sendCode"
              >
                {{ smsBtnText }}
              </button>
            </div>
          </el-form-item>

          <div class="tips">
            <p>温馨提示：</p>
            <ul>
              <li>验证码将发送到您的新手机号</li>
              <li>修改成功后，下次登录请使用新手机号</li>
              <li>如遇问题，请联系客服处理</li>
            </ul>
          </div>

          <div class="actions">
            <button class="submit-btn" type="button" :disabled="loading" @click="submit">
              {{ loading ? '提交中...' : '确认修改' }}
            </button>
            <button class="cancel-btn" type="button" @click="goBack">取消</button>
          </div>
        </el-form>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
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

.header-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-strong);
  display: flex;
  align-items: center;
  gap: 10px;
}

.content {
  margin-top: 14px;
  padding: 20px;
  max-width: 520px;
}

.current-info {
  margin: 16px 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(74, 144, 226, 0.06);
  border: 1px solid rgba(74, 144, 226, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 14px;
}

.info-value {
  font-weight: 900;
  color: var(--text-strong);
  font-size: 16px;
  letter-spacing: 1px;
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

.tips {
  margin-top: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(12, 35, 64, 0.04);
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.7;
}

.tips p {
  margin: 0 0 6px;
  font-weight: 700;
  color: var(--text);
}

.tips ul {
  margin: 0;
  padding-left: 18px;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.submit-btn {
  flex: 1;
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

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.92), rgba(125, 209, 129, 0.98));
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 14px;
  border: 1px solid rgba(12, 35, 64, 0.15);
  background: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  border-color: rgba(12, 35, 64, 0.25);
  background: rgba(12, 35, 64, 0.04);
}
</style>
