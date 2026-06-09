<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Location, Aim } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { useDataStore } from '../store/data'

const data = useDataStore()
const router = useRouter()

const layer = ref('景点')
const layers = ['景点', '服务设施']

const facilities = [
  { id: 'wc', name: '卫生间', x: 58, y: 82 },
  { id: 'parking', name: '停车场', x: 18, y: 74 },
  { id: 'food', name: '餐厅', x: 72, y: 22 },
  { id: 'help', name: '游客中心', x: 44, y: 48 },
]

const items = computed(() => {
  if (layer.value === '景点') {
    return data.spots.map((s) => ({ id: s.id, name: s.name, x: s.location?.x ?? 50, y: s.location?.y ?? 50 }))
  }
  return facilities
})

function openSpot(id) {
  router.push(`/spot/${id}`)
}
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="head card">
        <div class="h1">
          <el-icon><Aim /></el-icon>
          景区导览
        </div>
        <div class="h2">交互式景区地图：景点定位、路线导航、服务设施标注（演示）</div>
        <div class="tools">
          <el-segmented v-model="layer" :options="layers" />
        </div>
      </div>

      <section class="content">
        <div class="map card">
          <div class="map-inner">
            <div class="path a" />
            <div class="path b" />
            <div
              v-for="m in items"
              :key="m.id"
              class="marker"
              :class="{ clickable: layer === '景点' }"
              :style="{ left: `${m.x}%`, top: `${m.y}%` }"
              @click="layer === '景点' && openSpot(m.id)"
            >
              <span class="dot" />
              <span class="label">
                <el-icon><Location /></el-icon>
                {{ m.name }}
              </span>
            </div>
          </div>
          <div class="hint">提示：切换图层查看景点或服务设施；点击景点进入详情页</div>
        </div>

        <aside class="side card">
          <SectionTitle :title="layer === '景点' ? '景点列表' : '服务设施'" subtitle="点击景点可查看详情" />
          <div class="list">
            <div
              v-for="m in items"
              :key="m.id"
              class="li"
              :class="{ clickable: layer === '景点' }"
              @click="layer === '景点' && openSpot(m.id)"
            >
              <div class="n">{{ m.name }}</div>
              <div class="xy">{{ m.x }},{{ m.y }}</div>
            </div>
          </div>
        </aside>
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

.tools {
  margin-top: 14px;
}

.content {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 14px;
  align-items: start;
}

.map {
  padding: 16px;
}

.map-inner {
  height: 520px;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: radial-gradient(240px 200px at 16% 18%, rgba(74, 144, 226, 0.16), transparent 62%),
    radial-gradient(280px 240px at 82% 70%, rgba(125, 209, 129, 0.18), transparent 68%),
    linear-gradient(135deg, rgba(245, 247, 250, 0.85), rgba(255, 255, 255, 0.82));
}

.path {
  position: absolute;
  border-radius: 999px;
  background: rgba(12, 35, 64, 0.08);
}

.path.a {
  width: 78%;
  height: 12px;
  left: 10%;
  top: 46%;
  transform: rotate(-9deg);
}

.path.b {
  width: 60%;
  height: 10px;
  left: 18%;
  top: 68%;
  transform: rotate(14deg);
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.marker.clickable {
  cursor: pointer;
}

.dot {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: var(--brand-primary);
  box-shadow: 0 0 0 8px rgba(74, 144, 226, 0.18);
}

.label {
  padding: 6px 10px;
  border-radius: 14px;
  background: rgba(12, 35, 64, 0.55);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
}

.hint {
  margin-top: 10px;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
  text-align: center;
}

.side {
  padding: 16px;
}

.list {
  display: grid;
  gap: 10px;
}

.li {
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: rgba(255, 255, 255, 0.78);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.li.clickable {
  cursor: pointer;
  transition: transform 0.12s ease;
}

.li.clickable:hover {
  transform: translateY(-1px);
}

.n {
  font-weight: 900;
  color: var(--text-strong);
}

.xy {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }
  .map-inner {
    height: 420px;
  }
}
</style>

