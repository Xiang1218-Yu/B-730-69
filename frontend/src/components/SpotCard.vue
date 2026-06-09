<script setup>
import { computed } from 'vue'
import { StarFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../store/data'
import { smallCover } from '../utils/media'

const props = defineProps({
  spot: { type: Object, required: true },
})

const router = useRouter()
const data = useDataStore()

const cover = computed(() => smallCover(props.spot.id, props.spot.name))
const isFav = computed(() => data.favoriteSet.has(props.spot.id))

function goDetail() {
  router.push(`/spot/${props.spot.id}`)
}

function toggleFav() {
  data.toggleFavorite(props.spot.id)
}
</script>

<template>
  <div class="spot card">
    <div class="img-wrap" @click="goDetail">
      <img class="img" :src="cover" :alt="spot.name" loading="lazy" />
      <div class="badge">
        <el-icon><StarFilled /></el-icon>
        <span>{{ spot.score.toFixed(1) }}</span>
      </div>
    </div>
    <div class="body">
      <div class="row">
        <div class="name">{{ spot.name }}</div>
        <div class="meta">{{ spot.distanceKm }}km</div>
      </div>
      <div class="tags">
        <el-tag v-for="t in spot.tags" :key="t" size="small" effect="plain" round>{{ t }}</el-tag>
      </div>
      <div class="desc">{{ spot.short }}</div>
      <div class="actions">
        <el-button type="primary" round @click="goDetail">查看详情</el-button>
        <el-button :type="isFav ? 'success' : 'default'" round plain @click="toggleFav">
          {{ isFav ? '已收藏' : '收藏' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spot {
  overflow: hidden;
}

.img-wrap {
  position: relative;
  cursor: pointer;
}

.img {
  display: block;
  width: 100%;
  height: 168px;
  object-fit: cover;
}

.badge {
  position: absolute;
  right: 10px;
  top: 10px;
  height: 30px;
  padding: 0 10px;
  border-radius: 14px;
  background: rgba(12, 35, 64, 0.55);
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.body {
  padding: 12px 12px 14px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.name {
  font-weight: 900;
  color: var(--text-strong);
  font-size: 16px;
}

.meta {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

.tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.desc {
  margin-top: 10px;
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
  min-height: 38px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>

