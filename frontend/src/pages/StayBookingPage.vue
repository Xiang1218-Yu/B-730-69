<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, House } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { smallCover } from '../utils/media'
import { useDataStore } from '../store/data'
import { useAuthStore } from '../store/auth'

const data = useDataStore()
const auth = useAuthStore()
auth.hydrate()

const type = ref('全部')
const dateRange = ref([])

const types = ['全部', '酒店', '民宿']

const filtered = computed(() => {
  const list = data.stays
  return list.filter((s) => (type.value === '全部' ? true : s.type === type.value))
})

const bookingOpen = ref(false)
const selected = ref(null)
const booking = reactive({
  name: '',
  phone: '',
  dates: [],
  count: 1,
})

function openBooking(item) {
  selected.value = item
  booking.name = auth.user?.username ?? ''
  booking.phone = ''
  booking.dates = dateRange.value?.length ? [...dateRange.value] : []
  booking.count = 1
  bookingOpen.value = true
}

function submit() {
  if (!selected.value) return
  if (!booking.name || !booking.phone || !booking.dates?.length) {
    ElMessage.warning('请填写姓名、电话与入住日期')
    return
  }
  data.submitBooking({
    stayId: selected.value.id,
    stayName: selected.value.name,
    name: booking.name,
    phone: booking.phone,
    dates: booking.dates,
    count: booking.count,
    price: selected.value.price,
  })
  bookingOpen.value = false
  ElMessage.success('预订已提交（演示）')
}

function cover(item) {
  return smallCover(item.cover ?? item.id, item.name)
}
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="head card">
        <div class="h1">
          <el-icon><House /></el-icon>
          住宿预订
        </div>
        <div class="h2">按酒店 / 民宿分类，支持日期筛选与预订提交</div>
        <div class="filters">
          <el-segmented v-model="type" :options="types" />
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="入住日期"
            end-placeholder="离店日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </div>
      </div>

      <SectionTitle title="精选房源" subtitle="价格与余量为演示数据" />

      <div class="grid">
        <div v-for="s in filtered" :key="s.id" class="stay card">
          <img class="img" :src="cover(s)" :alt="s.name" loading="lazy" />
          <div class="body">
            <div class="row">
              <div class="name">{{ s.name }}</div>
              <el-tag size="small" round effect="plain">{{ s.type }}</el-tag>
            </div>
            <div class="price">
              ￥{{ s.price }}
              <span class="unit">/晚</span>
            </div>
            <div class="fac">
              <el-tag v-for="f in s.facilities" :key="f" size="small" round effect="plain" type="success">{{
                f
              }}</el-tag>
            </div>
            <div class="left">剩余房间：{{ s.left }}</div>
            <div class="actions">
              <el-button type="primary" round @click="openBooking(s)">预订</el-button>
              <el-button round plain @click="ElMessage.info('客服咨询：400-800-1234（演示）')">咨询</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-dialog v-model="bookingOpen" title="提交预订" width="520px">
        <div v-if="selected" class="dialog">
          <div class="summary card">
            <img class="sum-img" :src="cover(selected)" :alt="selected.name" loading="lazy" />
            <div class="sum-text">
              <div class="sum-name">{{ selected.name }}</div>
              <div class="sum-sub">￥{{ selected.price }}/晚 · 余量 {{ selected.left }}</div>
            </div>
          </div>
          <el-form label-position="top">
            <el-form-item label="入住人">
              <el-input v-model="booking.name" placeholder="姓名" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="booking.phone" placeholder="手机号" />
            </el-form-item>
            <el-form-item label="入住日期">
              <el-date-picker
                v-model="booking.dates"
                type="daterange"
                range-separator="至"
                start-placeholder="入住"
                end-placeholder="离店"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="预订间数">
              <el-input-number v-model="booking.count" :min="1" :max="Math.max(1, selected.left)" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <el-button @click="bookingOpen = false">取消</el-button>
          <el-button type="primary" @click="submit">
            <el-icon><Calendar /></el-icon>
            提交预订
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

.filters {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filters :deep(.el-date-editor) {
  width: 260px;
  max-width: 100%;
}

.filters :deep(.el-date-editor.el-input__wrapper),
.filters :deep(.el-date-editor.el-range-editor) {
  width: 260px !important;
}

.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, 1fr);
}

.stay {
  overflow: hidden;
}

.img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.body {
  padding: 12px 12px 14px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.name {
  font-weight: 900;
  color: var(--text-strong);
}

.price {
  margin-top: 8px;
  font-weight: 900;
  color: var(--brand-primary);
  font-size: 18px;
}

.unit {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

.fac {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.left {
  margin-top: 10px;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dialog {
  display: grid;
  gap: 12px;
}

.summary {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
}

.sum-img {
  width: 96px;
  height: 72px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid rgba(74, 144, 226, 0.12);
}

.sum-name {
  font-weight: 900;
  color: var(--text-strong);
}

.sum-sub {
  margin-top: 6px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
