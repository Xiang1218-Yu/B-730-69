<script setup>
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Calendar, Compass, Tickets, House } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import SpotCard from '../components/SpotCard.vue'
import { scenicImage } from '../utils/media'
import { useDataStore } from '../store/data'

const data = useDataStore()
const featuredSpots = computed(() => data.spots.slice(0, 6))

const banners = [
  {
    img: scenicImage('banner-1', { title: '天境湖', subtitle: '如镜湖面，蓝天倒影' }),
    title: '一眼入画 · 天境湖',
    sub: '清新自然的湖岸栈道，适合拍照与亲子漫步',
  },
  {
    img: scenicImage('banner-2', { title: '翠谷秘境', subtitle: '林荫溪谷，清凉避暑' }),
    title: '穿行翠谷 · 探索野趣',
    sub: '溪谷步道与瀑布观景点，徒步党必去',
  },
  {
    img: scenicImage('banner-3', { title: '日落观景岭', subtitle: '云霞染山，浪漫黄昏' }),
    title: '追逐日落 · 观景岭',
    sub: '索道直达，黄金时刻拍出大片',
  },
]

const quick = [
  { icon: Compass, title: '景区导览', desc: '地图定位与路线导航', path: '/map' },
  { icon: Tickets, title: '票务中心', desc: '选票下单与支付入口', path: '/tickets' },
  { icon: House, title: '住宿预订', desc: '酒店/民宿与日期筛选', path: '/stay' },
  { icon: Calendar, title: '精选活动', desc: '枫叶节/星空露营等', path: '/home#activities' },
]

function applyActivity() {
  ElMessageBox.alert('该报名还未开始', '提示', { confirmButtonText: '我知道了' })
}
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <section class="hero card">
        <el-carousel height="360px" trigger="click" indicator-position="outside">
          <el-carousel-item v-for="b in banners" :key="b.title">
            <div class="banner">
              <img class="banner-img" :src="b.img" :alt="b.title" loading="lazy" />
              <div class="banner-mask" />
              <div class="banner-text">
                <div class="banner-title">{{ b.title }}</div>
                <div class="banner-sub">{{ b.sub }}</div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </section>

      <section class="quick">
        <div v-for="qk in quick" :key="qk.title" class="q card" @click="$router.push(qk.path)">
          <div class="q-icon">
            <el-icon><component :is="qk.icon" /></el-icon>
          </div>
          <div class="q-text">
            <div class="q-title">{{ qk.title }}</div>
            <div class="q-desc">{{ qk.desc }}</div>
          </div>
        </div>
      </section>

      <section id="spots">
        <SectionTitle title="热门景点推荐" subtitle="卡片式推荐，支持搜索与详情查看">
          <el-button round @click="$router.push('/spots')">查看更多</el-button>
        </SectionTitle>
        <div class="spots">
          <SpotCard v-for="s in featuredSpots" :key="s.id" :spot="s" />
        </div>
      </section>

      <section id="routes">
        <SectionTitle title="主题游玩路线" subtitle="按人群与偏好快速选择">
          <el-tag round effect="plain">亲子游</el-tag>
          <el-tag round effect="plain" type="success">徒步线</el-tag>
          <el-tag round effect="plain" type="warning">日落观光线</el-tag>
        </SectionTitle>

        <div class="routes">
          <div v-for="r in data.routes" :key="r.id" class="route card">
            <div class="route-top">
              <div class="route-title">{{ r.title }}</div>
              <el-tag size="small" round effect="dark" type="success">{{ r.difficulty }}</el-tag>
            </div>
            <div class="route-desc">{{ r.desc }}</div>
            <div class="route-meta">
              <span>时长：{{ r.duration }}</span>
              <span>推荐：{{ r.id === 'hike' ? '徒步鞋' : '轻装' }}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="activities">
        <SectionTitle title="精选活动面板" subtitle="近期景区活动与报名入口" />
        <div class="acts">
          <div v-for="a in data.activities" :key="a.id" class="act card">
            <div class="act-title">{{ a.title }}</div>
            <div class="act-date">{{ a.dateRange }}</div>
            <div class="act-desc">{{ a.desc }}</div>
            <el-button type="primary" round @click="applyActivity">报名入口</el-button>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.hero {
  overflow: hidden;
}

.banner {
  position: relative;
  height: 360px;
  border-radius: 18px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.02);
}

.banner-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 35, 64, 0.55), rgba(12, 35, 64, 0.08));
}

.banner-text {
  position: absolute;
  left: 18px;
  bottom: 18px;
  right: 18px;
  color: rgba(255, 255, 255, 0.92);
}

.banner-title {
  font-size: 24px;
  font-weight: 900;
}

.banner-sub {
  margin-top: 8px;
  max-width: 640px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 600;
}

.quick {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.q {
  padding: 14px 14px 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.2s ease;
}

.q:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 46px rgba(12, 35, 64, 0.12);
}

.q-icon {
  height: 42px;
  width: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.18), rgba(125, 209, 129, 0.22));
  color: var(--brand-primary);
  font-size: 18px;
}

.q-title {
  font-weight: 900;
  color: var(--text-strong);
}

.q-desc {
  margin-top: 4px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
}

.spots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.routes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.route {
  padding: 16px;
}

.route-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.route-title {
  font-weight: 900;
  color: var(--text-strong);
}

.route-desc {
  margin-top: 10px;
  color: var(--text);
  font-weight: 600;
}

.route-meta {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.acts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.act {
  padding: 16px;
}

.act-title {
  font-weight: 900;
  color: var(--text-strong);
  font-size: 16px;
}

.act-date {
  margin-top: 8px;
  color: var(--brand-primary);
  font-weight: 800;
}

.act-desc {
  margin-top: 10px;
  color: var(--text);
  font-weight: 600;
  margin-bottom: 12px;
}

@media (max-width: 980px) {
  .quick {
    grid-template-columns: repeat(2, 1fr);
  }
  .spots {
    grid-template-columns: repeat(2, 1fr);
  }
  .routes {
    grid-template-columns: 1fr;
  }
  .acts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .spots {
    grid-template-columns: 1fr;
  }
  .banner-title {
    font-size: 20px;
  }
  .banner-sub {
    font-size: 13px;
  }
}
</style>
