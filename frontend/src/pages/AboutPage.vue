<script setup>
import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { scenicImage } from '../utils/media'

const cover = scenicImage('about', { title: '悦行山海', subtitle: '关于我们' })
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="hero card">
        <img class="img" :src="cover" alt="about" loading="lazy" />
        <div class="mask" />
        <div class="text">
          <div class="t1">关于我们</div>
          <div class="t2">明快清新的自然体验 · 让旅行更简单</div>
        </div>
      </div>

      <div class="grid">
        <div class="block card">
          <SectionTitle title="品牌理念" />
          <div class="p">
            悦行山海致力于打造“看得见风景、用得上服务”的景区体验：景点推荐、路线规划、住宿预订、票务下单与导览服务，一站式
            解决出行需求。
          </div>
        </div>
        <div class="block card">
          <SectionTitle title="服务范围" />
          <div class="p">- 景点介绍与实用信息：开放时间、价格、交通路线</div>
          <div class="p">- 活动资讯与报名入口：枫叶节、星空露营等</div>
          <div class="p">- 住宿预订与订单提交：酒店 / 民宿分类</div>
          <div class="p">- 票务中心与支付入口：多种票型支持</div>
        </div>
        <div class="block card">
          <SectionTitle title="联系我们" />
          <div class="p">客服热线：400-800-1234</div>
          <div class="p">邮箱：service@yuexing-demo.com</div>
          <div class="p">地址：山海省悦行市云岭路 88 号</div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  height: 300px;
  border-radius: 18px;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 35, 64, 0.62), rgba(12, 35, 64, 0.1));
}

.text {
  position: absolute;
  left: 18px;
  bottom: 18px;
  right: 18px;
  color: rgba(255, 255, 255, 0.92);
}

.t1 {
  font-size: 26px;
  font-weight: 900;
}

.t2 {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 600;
}

.grid {
  margin-top: 14px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, 1fr);
}

.block {
  padding: 16px;
}

.p {
  color: var(--text);
  font-weight: 600;
  margin: 10px 0;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

