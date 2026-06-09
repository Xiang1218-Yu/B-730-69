/**
 * 密码强度验证工具
 * 要求：包含大小写字母、数字、特殊字符
 */

// 密码强度正则：至少包含一个大写字母、一个小写字母、一个数字、一个特殊字符，长度8-20位
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,20}$/

// 手机号正则（中国大陆）
const PHONE_PATTERN = /^1[3-9]\d{9}$/

// 身份证号正则（18位）
const ID_CARD_PATTERN = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

// 邮箱正则
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 验证码正则（6位数字）
const SMS_CODE_PATTERN = /^\d{6}$/

/**
 * 验证密码强度
 * @param {string} password - 待验证密码
 * @returns {{ valid: boolean, message: string, strength: number }}
 * strength: 0-弱, 1-中, 2-强, 3-很强
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, message: '请输入密码', strength: 0 }
  }

  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位', strength: 0 }
  }

  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位', strength: 0 }
  }

  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)

  let strength = 0
  if (hasLower) strength++
  if (hasUpper) strength++
  if (hasNumber) strength++
  if (hasSpecial) strength++

  if (!hasLower) {
    return { valid: false, message: '密码必须包含小写字母', strength }
  }
  if (!hasUpper) {
    return { valid: false, message: '密码必须包含大写字母', strength }
  }
  if (!hasNumber) {
    return { valid: false, message: '密码必须包含数字', strength }
  }
  if (!hasSpecial) {
    return { valid: false, message: '密码必须包含特殊字符（如!@#$%^&*等）', strength }
  }

  return { valid: true, message: '密码强度符合要求', strength: 4 }
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
export function validatePhone(phone) {
  return PHONE_PATTERN.test(String(phone))
}

/**
 * 验证身份证号格式
 * @param {string} idCard - 身份证号
 * @returns {{ valid: boolean, message: string }}
 */
export function validateIdCard(idCard) {
  if (!idCard) {
    return { valid: false, message: '请输入身份证号' }
  }

  if (!ID_CARD_PATTERN.test(idCard)) {
    return { valid: false, message: '身份证号格式不正确' }
  }

  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0

  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i]
  }

  const checkCode = checkCodes[sum % 11]
  if (idCard[17].toUpperCase() !== checkCode) {
    return { valid: false, message: '身份证号校验失败' }
  }

  return { valid: true, message: '身份证号格式正确' }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱
 * @returns {boolean}
 */
export function validateEmail(email) {
  return EMAIL_PATTERN.test(String(email))
}

/**
 * 验证短信验证码格式
 * @param {string} code - 验证码
 * @returns {boolean}
 */
export function validateSmsCode(code) {
  return SMS_CODE_PATTERN.test(String(code))
}

/**
 * 获取密码强度描述
 * @param {number} strength - 强度值
 * @returns {{ label: string, color: string, width: string }}
 */
export function getStrengthInfo(strength) {
  if (strength <= 1) {
    return { label: '弱', color: '#f56c6c', width: '25%' }
  }
  if (strength === 2) {
    return { label: '中', color: '#e6a23c', width: '50%' }
  }
  if (strength === 3) {
    return { label: '强', color: '#409eff', width: '75%' }
  }
  return { label: '很强', color: '#67c23a', width: '100%' }
}
