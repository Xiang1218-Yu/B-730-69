import { defineStore } from 'pinia'
import { encode, decode } from '../utils/crypto'

// 本地存储键名
const STORAGE_KEY = 'yuexing_auth'
const USERS_KEY = 'yuexing_users'
const SMS_CODES_KEY = 'yuexing_sms_codes'

/**
 * 安全解析 JSON
 * @param {string} value - JSON 字符串
 * @returns {any}
 */
function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * 获取当前 ISO 时间字符串
 * @returns {string}
 */
function nowIso() {
  return new Date().toISOString()
}

/**
 * 生成随机验证码
 * @returns {string}
 */
function generateSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    hydrated: false,
  }),
  getters: {
    /**
     * 是否已登录
     */
    isLoggedIn: (state) => Boolean(state.token && state.user),

    /**
     * 是否已实名认证
     */
    isVerified: (state) => Boolean(state.user?.realName && state.user?.idCard),

    /**
     * 是否已绑定手机号
     */
    hasPhone: (state) => Boolean(state.user?.phone),
  },
  actions: {
    /**
     * 从本地存储恢复登录状态
     */
    hydrate() {
      if (this.hydrated) return
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? safeJsonParse(raw) : null
      if (parsed?.token && parsed?.user) {
        this.user = parsed.user
        this.token = parsed.token
      }
      this.hydrated = true
    },

    /**
     * 保存当前登录状态到本地存储
     */
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
    },

    /**
     * 获取所有注册用户
     * @returns {Object}
     */
    loadUsers() {
      const raw = localStorage.getItem(USERS_KEY)
      if (!raw) return {}
      try {
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        return {}
      }
    },

    /**
     * 保存用户数据
     * @param {Object} users - 用户数据对象
     */
    saveUsers(users) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    },

    /**
     * 用户注册
     * @param {Object} params - 注册参数
     * @param {string} params.username - 用户名/手机号
     * @param {string} params.password - 密码
     * @param {string} [params.phone] - 手机号
     * @returns {{ success: boolean, message: string }}
     */
    register({ username, password, phone }) {
      const users = this.loadUsers()
      const trimmedUsername = String(username).trim()

      if (users[trimmedUsername]) {
        return { success: false, message: '账号已存在，请直接登录' }
      }

      // 创建用户数据
      users[trimmedUsername] = {
        password: encode(password),
        phone: phone || trimmedUsername,
        createdAt: nowIso(),
        realName: null,
        idCard: null,
        verifiedAt: null,
      }

      this.saveUsers(users)
      return { success: true, message: '注册成功' }
    },

    /**
     * 用户登录
     * @param {Object} params - 登录参数
     * @param {string} params.username - 用户名/手机号
     * @param {string} params.password - 密码
     * @returns {{ success: boolean, message: string }}
     */
    login({ username, password }) {
      const users = this.loadUsers()
      const trimmedUsername = String(username).trim()

      const userData = users[trimmedUsername]
      if (!userData) {
        return { success: false, message: '账号不存在，请先注册' }
      }

      if (decode(userData.password) !== password) {
        return { success: false, message: '密码不正确' }
      }

      // 构建登录用户信息
      this.user = {
        username: trimmedUsername,
        phone: userData.phone,
        realName: userData.realName,
        idCard: userData.idCard ? `${userData.idCard.slice(0, 4)}***********${userData.idCard.slice(-4)}` : null,
        verifiedAt: userData.verifiedAt,
        loginAt: nowIso(),
      }
      this.token = `yuexing_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
      this.persist()

      return { success: true, message: '登录成功' }
    },

    /**
     * 退出登录
     */
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem(STORAGE_KEY)
    },

    /**
     * 发送验证码（演示用，实际项目应对接短信服务）
     * @param {string} phone - 手机号
     * @returns {{ success: boolean, message: string, code?: string }}
     */
    sendSmsCode(phone) {
      // 保存验证码（5分钟有效期）
      const codes = safeJsonParse(localStorage.getItem(SMS_CODES_KEY)) || {}
      const code = generateSmsCode()
      codes[phone] = {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
      }
      localStorage.setItem(SMS_CODES_KEY, JSON.stringify(codes))

      // 演示模式下直接返回验证码
      return { success: true, message: `验证码已发送（演示：${code}）`, code }
    },

    /**
     * 验证验证码
     * @param {string} phone - 手机号
     * @param {string} code - 验证码
     * @returns {{ success: boolean, message: string }}
     */
    verifySmsCode(phone, code) {
      const codes = safeJsonParse(localStorage.getItem(SMS_CODES_KEY)) || {}
      const record = codes[phone]

      if (!record) {
        return { success: false, message: '请先获取验证码' }
      }

      if (Date.now() > record.expiresAt) {
        return { success: false, message: '验证码已过期，请重新获取' }
      }

      if (record.code !== String(code)) {
        return { success: false, message: '验证码不正确' }
      }

      // 验证成功后删除验证码
      delete codes[phone]
      localStorage.setItem(SMS_CODES_KEY, JSON.stringify(codes))

      return { success: true, message: '验证成功' }
    },

    /**
     * 检查手机号是否已注册
     * @param {string} phone - 手机号
     * @returns {{ success: boolean, message: string }}
     */
    checkPhoneRegistered(phone) {
      const users = this.loadUsers()
      const trimmedPhone = String(phone).trim()

      // 查找对应该手机号的用户
      for (const [username, data] of Object.entries(users)) {
        if (data.phone === trimmedPhone || username === trimmedPhone) {
          return { success: true, message: '该手机号已注册' }
        }
      }

      return { success: false, message: '该手机号未注册账号' }
    },

    /**
     * 重置密码
     * @param {Object} params - 重置参数
     * @param {string} params.phone - 手机号
     * @param {string} params.newPassword - 新密码
     * @returns {{ success: boolean, message: string }}
     */
    resetPassword({ phone, newPassword }) {
      const users = this.loadUsers()
      const trimmedPhone = String(phone).trim()

      // 查找对应该手机号的用户
      let foundUsername = null
      for (const [username, data] of Object.entries(users)) {
        if (data.phone === trimmedPhone || username === trimmedPhone) {
          foundUsername = username
          break
        }
      }

      if (!foundUsername) {
        return { success: false, message: '该手机号未注册账号' }
      }

      users[foundUsername].password = encode(newPassword)
      this.saveUsers(users)

      return { success: true, message: '密码重置成功' }
    },

    /**
     * 修改手机号
     * @param {Object} params - 参数
     * @param {string} params.newPhone - 新手机号
     * @param {string} params.code - 验证码
     * @returns {{ success: boolean, message: string }}
     */
    changePhone({ newPhone, code }) {
      if (!this.user) {
        return { success: false, message: '请先登录' }
      }

      // 验证新手机号的验证码
      const verifyResult = this.verifySmsCode(newPhone, code)
      if (!verifyResult.success) {
        return verifyResult
      }

      const users = this.loadUsers()
      const username = this.user.username

      // 更新用户数据中的手机号
      if (users[username]) {
        users[username].phone = newPhone
        this.saveUsers(users)
      }

      // 更新当前登录状态
      this.user.phone = newPhone
      this.persist()

      return { success: true, message: '手机号修改成功' }
    },

    /**
     * 实名认证
     * @param {Object} params - 参数
     * @param {string} params.realName - 真实姓名
     * @param {string} params.idCard - 身份证号
     * @returns {{ success: boolean, message: string }}
     */
    verifyIdentity({ realName, idCard }) {
      if (!this.user) {
        return { success: false, message: '请先登录' }
      }

      const users = this.loadUsers()
      const username = this.user.username

      if (!users[username]) {
        return { success: false, message: '用户不存在' }
      }

      // 更新认证信息
      users[username].realName = realName
      users[username].idCard = idCard
      users[username].verifiedAt = nowIso()
      this.saveUsers(users)

      // 更新当前登录状态（脱敏显示）
      this.user.realName = realName
      this.user.idCard = `${idCard.slice(0, 4)}***********${idCard.slice(-4)}`
      this.user.verifiedAt = users[username].verifiedAt
      this.persist()

      return { success: true, message: '实名认证成功' }
    },
  },
})
