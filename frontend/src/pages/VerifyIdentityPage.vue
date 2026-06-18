<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, UserFilled, CircleCheckFilled } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useAuthStore } from '../store/auth'
import { validateIdCard } from '../utils/validators'

const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

const formRef = ref(null)
const loading = ref(false)

// 是否已认证
const isVerified = computed(() => auth.isVerified)

// 认证时间格式化
const verifiedTimeDisplay = computed(() => {
  if (!auth.user?.verifiedAt) return ''
  return auth.user.verifiedAt.slice(0, 19).replace('T', ' ')
})

// 表单数据
const form = reactive({
  realName: '',
  idCard: '',
  agree: false,
})

// 表单验证规则
const rules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2-20个字符之间', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5·]+$/,
      message: '请输入正确的中文姓名',
      trigger: 'blur',
    },
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const result = validateIdCard(value)
        if (!result.valid) {
          return callback(new Error(result.message))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  agree: [
    {
      validator: (rule, value, callback) => {
        if (!value) return callback(new Error('请先阅读并同意认证协议'))
        callback()
      },
      trigger: 'change',
    },
  ],
}

/**
 * 提交认证
 */
async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = auth.verifyIdentity({
      realName: form.realName,
      idCard: form.idCard,
    })

    if (result.success) {
      ElMessage.success(result.message)
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
          <el-icon><UserFilled /></el-icon>
          实名认证
        </div>
      </div>

      <!-- 已认证状态 -->
      <div v-if="isVerified" class="content card verified">
        <div class="verified-icon">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <div class="verified-title">已完成实名认证</div>
        <div class="verified-info">
          <div class="info-row">
            <span class="k">真实姓名</span>
            <span class="v">{{ auth.user?.realName }}</span>
          </div>
          <div class="info-row">
            <span class="k">身份证号</span>
            <span class="v">{{ auth.user?.idCard }}</span>
          </div>
          <div class="info-row">
            <span class="k">认证时间</span>
            <span class="v">{{ verifiedTimeDisplay }}</span>
          </div>
        </div>
        <div class="verified-tip">
          您的身份信息已通过验证，可享受平台全部服务。
        </div>
        <button class="back-btn-large" @click="goBack">返回用户中心</button>
      </div>

      <!-- 未认证状态 -->
      <div v-else class="content card">
        <SectionTitle title="实名认证" subtitle="完成实名认证后可享受更多服务" />

        <div class="notice">
          <div class="notice-title">为什么要实名认证？</div>
          <ul>
            <li>预订住宿、购买门票需完成实名认证</li>
            <li>保障您的账号安全，防止身份被盗用</li>
            <li>符合国家相关法律法规要求</li>
          </ul>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="form">
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入身份证上的真实姓名" clearable />
          </el-form-item>

          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="form.idCard" placeholder="请输入18位身份证号码" clearable maxlength="18" />
          </el-form-item>

          <el-form-item prop="agree">
            <el-checkbox v-model="form.agree">
              我已阅读并同意
              <a href="#" class="link" @click.prevent>《实名认证服务协议》</a>
              和
              <a href="#" class="link" @click.prevent>《隐私政策》</a>
            </el-checkbox>
          </el-form-item>

          <div class="security-tip">
            <p>🔒 信息安全保障：</p>
            <ul>
              <li>您的身份信息将被加密存储，仅用于身份验证</li>
              <li>我们不会向第三方泄露您的个人敏感信息</li>
              <li>信息传输采用SSL加密技术，确保数据安全</li>
            </ul>
          </div>

          <div class="actions">
            <button class="submit-btn" type="button" :disabled="loading" @click="submit">
              {{ loading ? '提交中...' : '提交认证' }}
            </button>
            <button class="cancel-btn" type="button" @click="goBack">稍后认证</button>
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
  padding: 24px;
  max-width: 520px;
}

/* 已认证状态样式 */
.content.verified {
  text-align: center;
}

.verified-icon {
  font-size: 72px;
  color: #67c23a;
  margin-bottom: 16px;
}

.verified-title {
  font-size: 22px;
  font-weight: 900;
  color: var(--text-strong);
  margin-bottom: 24px;
}

.verified-info {
  text-align: left;
  padding: 18px;
  border-radius: 14px;
  background: rgba(103, 194, 58, 0.06);
  border: 1px solid rgba(103, 194, 58, 0.15);
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(12, 35, 64, 0.06);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .k {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 14px;
}

.info-row .v {
  font-weight: 900;
  color: var(--text-strong);
  font-size: 15px;
  letter-spacing: 0.5px;
}

.verified-tip {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.6;
}

.back-btn-large {
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

.back-btn-large:hover {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.92), rgba(125, 209, 129, 0.98));
  transform: translateY(-1px);
}

/* 未认证状态样式 */
.notice {
  margin: 16px 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(74, 144, 226, 0.06);
  border: 1px solid rgba(74, 144, 226, 0.12);
  font-size: 13px;
  color: var(--text);
  line-height: 1.7;
}

.notice-title {
  font-weight: 800;
  color: var(--brand-primary);
  margin-bottom: 6px;
}

.notice ul {
  margin: 0;
  padding-left: 18px;
}

.link {
  color: var(--brand-primary);
  font-weight: 700;
}

.security-tip {
  margin-top: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(103, 194, 58, 0.06);
  border: 1px solid rgba(103, 194, 58, 0.12);
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.7;
}

.security-tip p {
  margin: 0 0 6px;
  font-weight: 700;
  color: #67c23a;
}

.security-tip ul {
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
