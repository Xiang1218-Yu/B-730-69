<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Share, StarFilled, ChatDotRound, Plus } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import SpotCard from '../components/SpotCard.vue'
import { scenicImage, smallCover } from '../utils/media'
import { useAuthStore } from '../store/auth'
import { useDataStore } from '../store/data'

const route = useRoute()
const auth = useAuthStore()
const data = useDataStore()
auth.hydrate()

const spotId = computed(() => String(route.params.id || ''))
const spot = computed(() => data.spots.find((s) => s.id === spotId.value))
const isFav = computed(() => data.favoriteSet.has(spotId.value))

const previewList = computed(() => {
  if (!spot.value) return []
  return (spot.value.gallery ?? []).map((k) => scenicImage(k, { title: spot.value.name, subtitle: '景点图册' }))
})

const consultOpen = ref(false)

function toggleFav() {
  data.toggleFavorite(spotId.value)
  ElMessage.success(isFav.value ? '已取消收藏' : '已加入收藏')
}

async function share() {
  const url = window.location.href
  const title = spot.value?.name ?? '悦行山海'
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.info('复制失败，请手动复制地址栏链接')
  }
}

const reviewForm = reactive({
  rating: 5,
  content: '',
  files: [],
})

const uploadFiles = ref([])
const reviewSubmitting = ref(false)

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function submitReview() {
  if (!spot.value) return
  const content = reviewForm.content.trim()
  if (!content) {
    ElMessage.warning('请输入评价内容')
    return
  }
  reviewSubmitting.value = true
  try {
    const images = []
    for (const item of uploadFiles.value) {
      const raw = item.raw
      if (!raw) continue
      images.push(await fileToDataUrl(raw))
    }
    data.submitReview({
      spotId: spot.value.id,
      username: auth.user?.username ?? '游客',
      rating: reviewForm.rating,
      content,
      images,
    })
    reviewForm.content = ''
    uploadFiles.value = []
    ElMessage.success('评价已提交')
  } finally {
    reviewSubmitting.value = false
  }
}

const reviews = computed(() => data.reviewsBySpot.get(spotId.value) ?? [])

const related = computed(() => data.spots.filter((s) => s.id !== spotId.value).slice(0, 3))

const cover = computed(() => (spot.value ? smallCover(spot.value.id, spot.value.name) : scenicImage('empty')))
</script>

<template>
  <AppShell>
    <div v-if="!spot" class="page-wrap">
      <div class="empty card">
        <div class="t">未找到该景点</div>
        <el-button type="primary" round @click="$router.push('/home')">返回首页</el-button>
      </div>
    </div>

    <div v-else class="page-wrap">
      <section class="top card">
        <div class="hero">
          <img class="hero-img" :src="cover" :alt="spot.name" loading="lazy" />
          <div class="hero-mask" />
          <div class="hero-info">
            <div class="name">{{ spot.name }}</div>
            <div class="meta">
              <span class="score">
                <el-icon><StarFilled /></el-icon>
                {{ spot.score.toFixed(1) }}
              </span>
              <span>距离 {{ spot.distanceKm }}km</span>
              <span>开放时间 {{ spot.openTime }}</span>
            </div>
            <div class="actions">
              <el-button :type="isFav ? 'success' : 'default'" round @click="toggleFav">
                {{ isFav ? '已收藏' : '收藏' }}
              </el-button>
              <el-button type="primary" round @click="share">
                <el-icon><Share /></el-icon>
                分享
              </el-button>
              <el-button round plain @click="consultOpen = true">
                <el-icon><ChatDotRound /></el-icon>
                在线咨询
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <section class="content">
        <div class="left">
          <div class="block card">
            <SectionTitle title="景点详情图册" subtitle="支持点击放大预览" />
            <div class="gallery">
              <el-image
                v-for="(src, idx) in previewList"
                :key="idx"
                class="g"
                :src="src"
                :preview-src-list="previewList"
                :initial-index="idx"
                fit="cover"
                lazy
              />
            </div>
          </div>

          <div class="block card">
            <SectionTitle title="详细介绍" />
            <div class="p">{{ spot.history }}</div>
            <div class="p">
              <span class="k">游玩亮点：</span>
              <el-tag v-for="h in spot.highlights" :key="h" size="small" round effect="plain" class="tag">{{
                h
              }}</el-tag>
            </div>
            <div class="kv">
              <div class="kv-item">
                <div class="kv-k">开放时间</div>
                <div class="kv-v">{{ spot.openTime }}</div>
              </div>
              <div class="kv-item">
                <div class="kv-k">门票价格</div>
                <div class="kv-v">￥{{ spot.price }}</div>
              </div>
              <div class="kv-item">
                <div class="kv-k">交通路线</div>
                <div class="kv-v">{{ spot.traffic }}</div>
              </div>
            </div>
          </div>

          <div class="block card">
            <SectionTitle title="游客评价" subtitle="提交后实时刷新" />
            <div class="review-form">
              <div class="row">
                <div class="who">评价人：{{ auth.user?.username ?? '游客' }}</div>
                <el-rate v-model="reviewForm.rating" allow-half />
              </div>
              <el-input
                v-model="reviewForm.content"
                type="textarea"
                :rows="3"
                placeholder="说说你的游玩体验吧~"
                maxlength="200"
                show-word-limit
              />
              <div class="row2">
                <el-upload
                  v-model:file-list="uploadFiles"
                  list-type="picture-card"
                  :auto-upload="false"
                  :limit="3"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
                <el-button type="primary" round :loading="reviewSubmitting" @click="submitReview">提交评价</el-button>
              </div>
            </div>

            <div class="reviews">
              <div v-if="reviews.length === 0" class="empty2">暂无评价，快来成为第一个吧</div>
              <div v-for="r in reviews" :key="r.id" class="review">
                <div class="head">
                  <div class="u">{{ r.username }}</div>
                  <el-rate :model-value="r.rating" disabled allow-half />
                  <div class="time">{{ new Date(r.createdAt).toLocaleString() }}</div>
                </div>
                <div class="text">{{ r.content }}</div>
                <div v-if="r.images?.length" class="pics">
                  <el-image
                    v-for="(img, i) in r.images"
                    :key="i"
                    class="pic"
                    :src="img"
                    :preview-src-list="r.images"
                    :initial-index="i"
                    fit="cover"
                    lazy
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="right">
          <div class="block card">
            <SectionTitle title="简易地图示意" subtitle="景点定位与设施标注（演示）" />
            <div class="map">
              <div class="map-bg" />
              <div class="marker" :style="{ left: `${spot.location?.x ?? 50}%`, top: `${spot.location?.y ?? 50}%` }">
                <span class="dot" />
                <span class="label">{{ spot.name }}</span>
              </div>
              <div class="poi" style="left: 18%; top: 74%">P 停车场</div>
              <div class="poi" style="left: 72%; top: 22%">餐厅</div>
              <div class="poi" style="left: 58%; top: 82%">卫生间</div>
            </div>
          </div>

          <div class="block card">
            <SectionTitle title="相关景点推荐" />
            <div class="related">
              <SpotCard v-for="s in related" :key="s.id" :spot="s" />
            </div>
          </div>
        </aside>
      </section>

      <el-dialog v-model="consultOpen" title="在线咨询" width="420px">
        <div class="consult">
          <div class="c1">欢迎咨询，客服将为你提供行程与票务建议（演示）。</div>
          <div class="c2">客服电话：400-800-1234</div>
          <div class="c2">微信：YueXingService</div>
        </div>
        <template #footer>
          <el-button @click="consultOpen = false">关闭</el-button>
          <el-button type="primary" @click="consultOpen = false">我知道了</el-button>
        </template>
      </el-dialog>
    </div>
  </AppShell>
</template>

<style scoped>
.empty {
  padding: 24px;
  display: grid;
  gap: 12px;
  justify-items: start;
}

.t {
  font-weight: 900;
  color: var(--text-strong);
  font-size: 16px;
}

.top {
  overflow: hidden;
}

.hero {
  height: 280px;
  position: relative;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 35, 64, 0.62), rgba(12, 35, 64, 0.12));
}

.hero-info {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  color: rgba(255, 255, 255, 0.92);
}

.name {
  font-size: 26px;
  font-weight: 900;
}

.meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.78);
}

.score {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.content {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.45fr 0.85fr;
  gap: 14px;
  align-items: start;
}

.block {
  padding: 16px;
  margin-bottom: 14px;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.g {
  border-radius: 14px;
  overflow: hidden;
  height: 110px;
}

.p {
  color: var(--text);
  font-weight: 600;
  margin: 10px 0;
}

.k {
  font-weight: 900;
  color: var(--text-strong);
}

.tag {
  margin-left: 8px;
  margin-top: 6px;
}

.kv {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.kv-item {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(74, 144, 226, 0.06);
  border: 1px solid rgba(74, 144, 226, 0.12);
}

.kv-k {
  font-weight: 900;
  color: var(--text-strong);
}

.kv-v {
  color: var(--text);
  font-weight: 600;
}

.review-form {
  display: grid;
  gap: 10px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.who {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

.row2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reviews {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.empty2 {
  color: var(--text-muted);
  font-weight: 700;
  padding: 12px 0 6px;
}

.review {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: rgba(255, 255, 255, 0.8);
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.u {
  font-weight: 900;
  color: var(--text-strong);
}

.time {
  margin-left: auto;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
}

.text {
  margin-top: 8px;
  color: var(--text);
  font-weight: 600;
}

.pics {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pic {
  width: 88px;
  height: 66px;
  border-radius: 14px;
  overflow: hidden;
}

.map {
  height: 260px;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(74, 144, 226, 0.12);
  background: radial-gradient(220px 180px at 20% 25%, rgba(74, 144, 226, 0.14), transparent 60%),
    radial-gradient(240px 200px at 80% 70%, rgba(125, 209, 129, 0.18), transparent 65%),
    linear-gradient(135deg, rgba(245, 247, 250, 0.85), rgba(255, 255, 255, 0.82));
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
}

.poi {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 6px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(74, 144, 226, 0.14);
  color: var(--text-strong);
  font-weight: 800;
  font-size: 12px;
}

.related {
  display: grid;
  gap: 12px;
}

.consult {
  display: grid;
  gap: 10px;
}

.c1 {
  font-weight: 700;
  color: var(--text);
}

.c2 {
  font-weight: 800;
  color: var(--text-strong);
}

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }
  .gallery {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
