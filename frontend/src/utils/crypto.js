/**
 * 编解码工具
 * 使用 Base64 进行简单的编码解码（演示用，实际项目请使用更安全的加密方式）
 */

/**
 * 编码字符串
 * @param {string} value - 待编码字符串
 * @returns {string}
 */
export function encode(value) {
  try {
    return btoa(unescape(encodeURIComponent(value)))
  } catch {
    return ''
  }
}

/**
 * 解码字符串
 * @param {string} value - 待解码字符串
 * @returns {string}
 */
export function decode(value) {
  try {
    return decodeURIComponent(escape(atob(value)))
  } catch {
    return ''
  }
}
