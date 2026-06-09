import { defineStore } from 'pinia'

// 本地存储key
const STORAGE_KEY = 'yuexing_auth'
const USERS_KEY = 'yuexing_users'

/**
 * 安全解析JSON
 * @param {string} value - 要解析的字符串
 * @returns {object|null} 解析结果或null
 */
function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * 获取当前ISO时间字符串
 * @returns {string} ISO格式时间
 */
function nowIso() {
  return new Date().toISOString()
}

/**
 * Base64编码
 * @param {string} value - 要编码的字符串
 * @returns {string} 编码后的字符串
 */
function encode(value) {
  try {
    return btoa(unescape(encodeURIComponent(value)))
  } catch {
    return ''
  }
}

/**
 * Base64解码
 * @param {string} value - 要解码的字符串
 * @returns {string} 解码后的字符串
 */
function decode(value) {
  try {
    return decodeURIComponent(escape(atob(value)))
  } catch {
    return ''
  }
}

/**
 * 加载所有用户数据
 * @returns {object} 用户数据对象
 */
function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * 保存所有用户数据
 * @param {object} users - 用户数据对象
 */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    hydrated: false,
  }),
  getters: {
    // 是否已登录
    isLoggedIn: (state) => Boolean(state.token && state.user),
    // 是否已实名认证
    isVerified: (state) => Boolean(state.user?.isVerified),
    // 用户手机号
    userPhone: (state) => state.user?.phone || '',
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
     * 保存登录状态到本地存储
     */
    persist() {
      if (this.token && this.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
      }
    },

    /**
     * 用户登录
     * @param {object} param0 - 登录参数
     * @param {string} param0.username - 用户名
     */
    login({ username }) {
      // 从用户列表获取完整用户信息
      const users = loadUsers()
      const userData = users[username] || {}
      
      this.user = {
        username,
        loginAt: nowIso(),
        phone: userData.phone || '',
        isVerified: userData.isVerified || false,
        realName: userData.realName || '',
        idCard: userData.idCard || '',
      }
      this.token = `demo_${Math.random().toString(16).slice(2)}`
      this.persist()
    },

    /**
     * 用户注册
     * @param {object} param0 - 注册参数
     * @param {string} param0.username - 用户名
     * @param {string} param0.password - 密码
     * @param {string} param0.phone - 手机号（可选）
     * @returns {boolean} 是否注册成功
     */
    register({ username, password, phone = '' }) {
      const users = loadUsers()
      if (users[username]) {
        return false // 用户名已存在
      }
      
      users[username] = {
        password: encode(password),
        phone,
        isVerified: false,
        realName: '',
        idCard: '',
        createdAt: nowIso(),
      }
      saveUsers(users)
      return true
    },

    /**
     * 验证用户名密码
     * @param {object} param0 - 验证参数
     * @param {string} param0.username - 用户名
     * @param {string} param0.password - 密码
     * @returns {boolean} 是否验证通过
     */
    validateCredentials({ username, password }) {
      const users = loadUsers()
      const user = users[username]
      if (!user) return false
      return decode(user.password) === password
    },

    /**
     * 重置密码
     * @param {object} param0 - 参数
     * @param {string} param0.username - 用户名
     * @param {string} param0.phone - 手机号
     * @param {string} param0.newPassword - 新密码
     * @returns {boolean} 是否重置成功
     */
    resetPassword({ username, phone, newPassword }) {
      const users = loadUsers()
      const user = users[username]
      
      if (!user) {
        return { success: false, message: '账号不存在' }
      }
      
      // 验证手机号是否匹配（演示用，实际需发送验证码）
      if (phone && user.phone && user.phone !== phone) {
        return { success: false, message: '手机号与账号不匹配' }
      }
      
      user.password = encode(newPassword)
      saveUsers(users)
      return { success: true, message: '密码重置成功' }
    },

    /**
     * 修改密码
     * @param {object} param0 - 参数
     * @param {string} param0.oldPassword - 旧密码
     * @param {string} param0.newPassword - 新密码
     * @returns {object} 结果
     */
    changePassword({ oldPassword, newPassword }) {
      if (!this.user?.username) {
        return { success: false, message: '请先登录' }
      }
      
      const users = loadUsers()
      const user = users[this.user.username]
      
      if (!user) {
        return { success: false, message: '用户不存在' }
      }
      
      if (decode(user.password) !== oldPassword) {
        return { success: false, message: '原密码不正确' }
      }
      
      user.password = encode(newPassword)
      saveUsers(users)
      return { success: true, message: '密码修改成功' }
    },

    /**
     * 修改手机号
     * @param {object} param0 - 参数
     * @param {string} param0.newPhone - 新手机号
     * @param {string} param0.code - 验证码（演示用，实际需验证）
     * @returns {object} 结果
     */
    changePhone({ newPhone, code }) {
      if (!this.user?.username) {
        return { success: false, message: '请先登录' }
      }
      
      const users = loadUsers()
      const user = users[this.user.username]
      
      if (!user) {
        return { success: false, message: '用户不存在' }
      }
      
      // 更新手机号
      user.phone = newPhone
      saveUsers(users)
      
      // 更新当前用户状态
      this.user.phone = newPhone
      this.persist()
      
      return { success: true, message: '手机号修改成功' }
    },

    /**
     * 实名认证
     * @param {object} param0 - 参数
     * @param {string} param0.realName - 真实姓名
     * @param {string} param0.idCard - 身份证号
     * @returns {object} 结果
     */
    verifyIdentity({ realName, idCard }) {
      if (!this.user?.username) {
        return { success: false, message: '请先登录' }
      }
      
      const users = loadUsers()
      const user = users[this.user.username]
      
      if (!user) {
        return { success: false, message: '用户不存在' }
      }
      
      if (user.isVerified) {
        return { success: false, message: '已完成实名认证，无需重复认证' }
      }
      
      // 演示用，实际需对接实名验证API
      if (!realName || !idCard) {
        return { success: false, message: '请填写完整信息' }
      }
      
      // 简单身份证格式校验（18位）
      const idCardRegex = /^\d{17}[\dXx]$/
      if (!idCardRegex.test(idCard)) {
        return { success: false, message: '身份证号格式不正确' }
      }
      
      user.isVerified = true
      user.realName = realName
      user.idCard = idCard
      user.verifiedAt = nowIso()
      saveUsers(users)
      
      // 更新当前用户状态
      this.user.isVerified = true
      this.user.realName = realName
      this.user.idCard = idCard
      this.persist()
      
      return { success: true, message: '实名认证成功' }
    },

    /**
     * 更新用户资料
     * @param {object} data - 要更新的用户数据
     */
    updateUser(data) {
      if (!this.user) return
      this.user = { ...this.user, ...data }
      this.persist()
    },

    /**
     * 退出登录
     */
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})

