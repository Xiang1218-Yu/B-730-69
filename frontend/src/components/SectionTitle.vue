<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="section-title">
    <div class="left">
      <div class="title">{{ title }}</div>
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    </div>
    <div class="right">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  margin: 22px 0 12px;
}

.title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-strong);
}

.subtitle {
  margin-top: 6px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
}
</style>

