<script setup>
import { scenicImage } from '../utils/media'

const qr = scenicImage('qr', { width: 220, height: 220, title: '公众号', subtitle: '扫码关注' })
</script>

<template>
  <footer class="footer">
    <div class="footer-top">
      <div class="wrap">
        <div class="grid">
          <div class="block">
            <div class="title">联系方式</div>
            <div class="item">客服热线：400-800-1234</div>
            <div class="item">服务时间：09:00 - 18:00</div>
            <div class="item">邮箱：service@yuexing-demo.com</div>
          </div>
          <div class="block">
            <div class="title">地址导航</div>
            <div class="item">地址：山海省悦行市云岭路 88 号</div>
            <div class="item">交通：地铁 2 号线至游客中心站（示意）</div>
            <div class="grow" />
            <a class="link" href="https://map.baidu.com" target="_blank" rel="noreferrer">打开地图</a>
          </div>
          <div class="block qr">
            <div class="title">官方公众号</div>
            <div class="grow" />
            <img class="qr-img" :src="qr" alt="qr" loading="lazy" />
            <div class="hint">获取活动资讯与优惠</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div class="wrap bar-wrap">
        <div>© {{ new Date().getFullYear() }} 悦行山海 · 旅游景区官方网站</div>
        <div class="small">已适配移动端与桌面端（Chrome / Safari / 微信浏览器）</div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 44px;
}

.footer-top {
  padding: 34px 0;
  background: linear-gradient(180deg, rgba(245, 247, 250, 0.9), rgba(245, 247, 250, 1));
  border-top: 1px solid rgba(74, 144, 226, 0.12);
}

.wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 18px;
}

.grid {
  display: grid;
  gap: 18px;
  grid-template-columns: 1.3fr 1.4fr 1fr;
  align-items: stretch;
}

.block {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(74, 144, 226, 0.12);
  border-radius: 18px;
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  min-height: 170px;
}

.title {
  font-weight: 900;
  color: var(--text-strong);
  margin-bottom: 10px;
}

.item {
  color: var(--text);
  margin: 6px 0;
}

.link {
  display: inline-flex;
  margin-top: 10px;
  font-weight: 700;
  color: var(--brand-primary);
}

.qr {
  align-items: center;
}

.qr-img {
  width: 128px;
  height: 128px;
  border-radius: 16px;
  border: 1px solid rgba(74, 144, 226, 0.12);
}

.grow {
  flex: 1;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
}

.footer-bar {
  background: rgba(12, 35, 64, 0.92);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.bar-wrap {
  height: 52px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 700;
}

.small {
  font-size: 12px;
}

@media (max-width: 920px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .qr {
    align-items: flex-start;
  }
  .qr-img {
    width: 120px;
  }
}
</style>
