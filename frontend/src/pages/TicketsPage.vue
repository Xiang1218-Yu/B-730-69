<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CreditCard, Tickets } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useDataStore } from '../store/data'
import { useAuthStore } from '../store/auth'

const data = useDataStore()
const auth = useAuthStore()
auth.hydrate()

const ticketId = ref(data.tickets[0]?.id ?? '')
const count = ref(1)

const selected = computed(() => data.tickets.find((t) => t.id === ticketId.value))
const total = computed(() => (selected.value ? selected.value.price * count.value : 0))

const dialogOpen = ref(false)
const order = reactive({
  name: '',
  phone: '',
})

function openPay() {
  if (!selected.value) return
  order.name = auth.user?.username ?? ''
  order.phone = ''
  dialogOpen.value = true
}

function submit() {
  if (!selected.value) return
  if (!order.name || !order.phone) {
    ElMessage.warning('请填写姓名与手机号')
    return
  }
  data.submitTicketOrder({
    ticketId: selected.value.id,
    ticketName: selected.value.name,
    count: count.value,
    total: total.value,
    name: order.name,
    phone: order.phone,
  })
  dialogOpen.value = false
  ElMessage.success('订单已提交，进入支付入口（演示）')
}
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="head card">
        <div class="h1">
          <el-icon><Tickets /></el-icon>
          票务中心
        </div>
        <div class="h2">门票类型选择 · 数量选择 · 订单提交与支付入口（演示）</div>
      </div>

      <section class="panel">
        <div class="left card">
          <SectionTitle title="选择门票" subtitle="成人票 / 儿童票 / 套票" />
          <el-radio-group v-model="ticketId" class="radios">
            <el-radio v-for="t in data.tickets" :key="t.id" :value="t.id" class="r">
              <div class="r-name">{{ t.name }}</div>
              <div class="r-price">￥{{ t.price }}</div>
            </el-radio>
          </el-radio-group>

          <SectionTitle title="购票数量" />
          <el-input-number v-model="count" :min="1" :max="10" />
        </div>

        <div class="right card">
          <SectionTitle title="订单信息" subtitle="确认后提交订单" />
          <div class="sum">
            <div class="row">
              <span class="k">门票类型</span>
              <span class="v">{{ selected?.name }}</span>
            </div>
            <div class="row">
              <span class="k">单价</span>
              <span class="v">￥{{ selected?.price }}</span>
            </div>
            <div class="row">
              <span class="k">数量</span>
              <span class="v">{{ count }}</span>
            </div>
            <div class="row total">
              <span class="k">合计</span>
              <span class="v">￥{{ total }}</span>
            </div>
          </div>
          <button class="pay" type="button" @click="openPay">提交订单</button>
          <div class="hint">支付入口：微信 / 支付宝（演示）</div>
        </div>
      </section>

      <el-dialog v-model="dialogOpen" title="确认订单并支付" width="520px" class="pay-dialog">
        <div class="dlg">
          <div class="amount card">
            <div class="a1">应付金额</div>
            <div class="a2">￥{{ total }}</div>
          </div>
          <el-form label-position="top">
            <el-form-item label="购票人">
              <el-input v-model="order.name" placeholder="姓名" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="order.phone" placeholder="手机号" />
            </el-form-item>
          </el-form>
          <div class="payways">
            <div class="pw card">
              <div class="pwt">微信支付</div>
              <div class="pws">扫码跳转支付（演示功能，暂未实现）</div>
            </div>
            <div class="pw card">
              <div class="pwt">支付宝</div>
              <div class="pws">扫码跳转支付（演示功能，暂未实现）</div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="dialogOpen = false">取消</el-button>
          <el-button type="primary" @click="submit">
            <el-icon><CreditCard /></el-icon>
            去支付
          </el-button>
        </template>
      </el-dialog>
    </div>
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

.panel {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
  align-items: stretch;
}

.left,
.right {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.radios {
  display: grid;
  gap: 10px;
  width: 100%;
}

.r {
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: rgba(255, 255, 255, 0.78);
  min-height: 54px;
  display: flex;
  align-items: center;
  width: 100%;
}

.r :deep(.el-radio__label) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0;
  line-height: 1.2;
  width: 100%;
}

.r :deep(.el-radio__input) {
  align-self: center;
  margin-right: 12px;
}

.r-name {
  font-weight: 900;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-price {
  margin-top: 0;
  color: var(--brand-primary);
  font-weight: 900;
  white-space: nowrap;
}

.sum {
  margin-top: 10px;
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(74, 144, 226, 0.06);
  border: 1px solid rgba(74, 144, 226, 0.12);
}

.pay {
  margin-top: auto;
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

.total .v {
  color: var(--brand-primary);
  font-size: 18px;
}

.pay {
  margin-top: 14px;
  width: 100%;
  height: 44px;
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, var(--brand-primary), rgba(125, 209, 129, 0.92));
  box-shadow: 0 16px 34px rgba(74, 144, 226, 0.25);
}

.hint {
  margin-top: 10px;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
  text-align: center;
}

.dlg {
  display: grid;
  gap: 12px;
}

.amount {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.a1 {
  color: var(--text-muted);
  font-weight: 800;
}

.a2 {
  color: var(--brand-primary);
  font-weight: 900;
  font-size: 22px;
}

.payways {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pw {
  padding: 12px;
}

.pwt {
  font-weight: 900;
  color: var(--text-strong);
}

.pws {
  margin-top: 8px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
}

@media (max-width: 980px) {
  .panel {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.pay-dialog .el-dialog__headerbtn {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  font-size: 16px !important;
  top: 18px !important;
  right: 24px !important;
}

.pay-dialog .el-dialog__headerbtn:hover {
  background: rgba(0, 0, 0, 0.05) !important;
  transform: none !important;
}

.pay-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted);
}
</style>
