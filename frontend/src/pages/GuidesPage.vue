<script setup>
import { computed, ref } from 'vue'
import { View, Document } from '@element-plus/icons-vue'

import AppShell from '../components/AppShell.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { smallCover } from '../utils/media'
import { useDataStore } from '../store/data'

const data = useDataStore()

const selected = ref(null)
const open = ref(false)

const guides = computed(() => data.guides)

function cover(g) {
  return smallCover(g.cover ?? g.id, g.title)
}

function openGuide(g) {
  selected.value = g
  open.value = true
}
</script>

<template>
  <AppShell>
    <div class="page-wrap">
      <div class="head card">
        <div class="h1">
          <el-icon><Document /></el-icon>
          游玩攻略
        </div>
        <div class="h2">攻略文章列表（封面图 / 作者 / 阅读量），点击查看详情</div>
      </div>

      <SectionTitle title="攻略推荐" subtitle="行程规划 · 注意事项 · 美食推荐" />

      <div class="grid">
        <div v-for="g in guides" :key="g.id" class="item card" @click="openGuide(g)">
          <img class="img" :src="cover(g)" :alt="g.title" loading="lazy" />
          <div class="body">
            <div class="title">{{ g.title }}</div>
            <div class="meta">
              <span>作者：{{ g.author }}</span>
              <span class="views">
                <el-icon><View /></el-icon>
                {{ g.views.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <el-dialog v-model="open" width="760px" :title="selected?.title ?? '攻略详情'">
        <div v-if="selected" class="detail">
          <img class="cover" :src="cover(selected)" :alt="selected.title" loading="lazy" />
          <div class="info">
            <div class="author">作者：{{ selected.author }} · 阅读 {{ selected.views.toLocaleString() }}</div>
          </div>
          <div class="sec">
            <div class="st">行程规划</div>
            <ol class="list">
              <li v-for="(p, i) in selected.content.plan" :key="i">{{ p }}</li>
            </ol>
          </div>
          <div class="sec">
            <div class="st">注意事项</div>
            <ul class="list">
              <li v-for="(t, i) in selected.content.tips" :key="i">{{ t }}</li>
            </ul>
          </div>
          <div class="sec">
            <div class="st">美食推荐</div>
            <div class="food">
              <el-tag v-for="f in selected.content.food" :key="f" round effect="plain" type="success">{{ f }}</el-tag>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="open = false">关闭</el-button>
          <el-button type="primary" @click="open = false">收藏攻略</el-button>
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

.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, 1fr);
}

.item {
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.2s ease;
}

.item:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 46px rgba(12, 35, 64, 0.12);
}

.img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.body {
  padding: 12px 12px 14px;
}

.title {
  font-weight: 900;
  color: var(--text-strong);
  font-size: 14px;
  line-height: 1.3;
}

.meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 12px;
}

.views {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail {
  display: grid;
  gap: 12px;
}

.cover {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 18px;
  border: 1px solid rgba(74, 144, 226, 0.12);
}

.author {
  color: var(--text-muted);
  font-weight: 700;
}

.sec {
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(74, 144, 226, 0.1);
  background: rgba(245, 247, 250, 0.6);
}

.st {
  font-weight: 900;
  color: var(--text-strong);
  margin-bottom: 10px;
}

.list {
  margin: 0;
  padding-left: 18px;
  color: var(--text);
  font-weight: 600;
  display: grid;
  gap: 6px;
}

.food {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

