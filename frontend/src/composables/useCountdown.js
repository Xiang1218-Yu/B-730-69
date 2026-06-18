import { ref, onUnmounted } from 'vue'

/**
 * 验证码倒计时组合式函数
 * @param {number} seconds - 倒计时秒数（默认60秒）
 * @returns {Object}
 */
export function useCountdown(seconds = 60) {
  const countdown = ref(0)
  let timer = null

  /**
   * 开始倒计时
   */
  function start() {
    if (countdown.value > 0) return

    countdown.value = seconds
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  /**
   * 停止倒计时
   */
  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = 0
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    stop()
  })

  return {
    countdown,
    start,
    stop,
    isCounting: () => countdown.value > 0,
  }
}
