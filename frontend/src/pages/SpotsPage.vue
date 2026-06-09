<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Compass } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import SpotCard from '../components/SpotCard.vue'
import { useDataStore } from '../store/data'

const route = useRoute()
const data = useDataStore()

const page = ref(1)
const pageSize = 9
const q = ref('')

watch(
  () => route.query.q,
  (v) => {
    q.value = typeof v === 'string' ? v : ''
    page.value = 1
  },
  { immediate: true },
)

const filteredSpots = computed(() => {
  const keyword = q.value.trim()
  if (!keyword) return data.spots
  const lower = keyword.toLowerCase()
  return data.spots.filter((s) => {
    const inName = s.name.toLowerCase().includes(lower)
    const inShort = s.short.toLowerCase().includes(lower)
    const inTags = (s.tags ?? []).some((t) => String(t).toLowerCase().includes(lower))
    return inName || inShort || inTags
  })
})

const pagedSpots = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredSpots.value.slice(start, start + pageSize)
})
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="head card">
        <div class="h1">
          <el-icon><Compass /></el-icon>
          景点
        </div>
        <div class="h2">热门景点推荐 · 支持搜索与分页</div>
      </div>

      <section class="content">
        <SectionTitle title="热门景点推荐" subtitle="精选人气景点，轻松规划行程">
          <div v-if="q" class="filter">关键词：{{ q }}</div>
          <div v-else class="filter">共 {{ filteredSpots.length }} 个景点</div>
        </SectionTitle>

        <div class="spots">
          <SpotCard v-for="s in pagedSpots" :key="s.id" :spot="s" />
        </div>

        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            layout="prev, pager, next"
            :total="filteredSpots.length"
            hide-on-single-page
          />
        </div>
      </section>
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

.filter {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

.spots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.pager {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

@media (max-width: 980px) {
  .spots {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .spots {
    grid-template-columns: 1fr;
  }
}
</style>

