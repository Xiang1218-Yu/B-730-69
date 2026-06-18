<script setup>
import { onMounted, ref } from 'vue'

const emit = defineEmits(['change'])

const canvasRef = ref(null)
const code = ref('')

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomCode(len = 4) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[rand(0, chars.length - 1)]
  return out
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  
  // 清除画布，防止重绘时文字重叠
  ctx.clearRect(0, 0, w, h)
  
  const bg1 = `rgba(74, 144, 226, ${Math.random() * 0.12 + 0.18})`
  const bg2 = `rgba(125, 209, 129, ${Math.random() * 0.12 + 0.16})`
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, bg1)
  g.addColorStop(1, bg2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(12, 35, 64, ${Math.random() * 0.18 + 0.08})`
    ctx.beginPath()
    ctx.moveTo(rand(0, w), rand(0, h))
    ctx.lineTo(rand(0, w), rand(0, h))
    ctx.stroke()
  }

  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.55 + 0.15})`
    ctx.beginPath()
    ctx.arc(rand(0, w), rand(0, h), rand(1, 2), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.font = '700 18px system-ui, -apple-system, Segoe UI, sans-serif'

  const value = randomCode(4)
  code.value = value

  const spacing = w / (value.length + 1)
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    const x = spacing * (i + 1)
    const y = h / 2 + rand(-3, 3)
    const angle = (rand(-18, 18) * Math.PI) / 180
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillStyle = `rgba(12, 35, 64, ${Math.random() * 0.25 + 0.65})`
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  }

  emit('change', value)
}

function refresh() {
  draw()
}

defineExpose({ refresh })

onMounted(() => {
  draw()
})
</script>

<template>
  <canvas ref="canvasRef" class="captcha" width="110" height="40" @click="refresh" />
</template>

<style scoped>
.captcha {
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.16);
  cursor: pointer;
}
</style>

