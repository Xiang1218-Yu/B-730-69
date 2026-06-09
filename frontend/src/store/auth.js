import { defineStore } from 'pinia'

const STORAGE_KEY = 'yuexing_auth'
const USERS_KEY = 'yuexing_users'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function nowIso() {
  return new Date().toISOString()
}

// 简单的编码/解码函数，用于本地演示（非安全加密）
function encode(value) {
  try {
    return btoa(unescape(encodeURIComponent(value)))
  } catch {
    return ''
  }
}

function decode(value) {
  try {
    return decodeURIComponent(escape(atob(value)))
  } catch {
    return ''
  }
}

// 从 localStorage 加载所有用户数据
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

// 保存所有用户数据到 localStorage
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
    isLoggedIn: (state) => Boolean(state.token && state.user),
    // 是否已实名认证
    isVerified: (state) => Boolean(state.user?.realName && state.user?.idNumber),
  },
  actions: {
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
    // 登录：验证账号密码，写入 auth 状态
    login({ username }) {
      const users = loadUsers()
      const userData = users[username] || {}
      this.user = {
        username,
        phone: userData.phone || '',
        realName: userData.realName || '',
        idNumber: userData.idNumber || '',
        loginAt: nowIso(),
      }
      this.token = `demo_${Math.random().toString(16).slice(2)}`
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
    },
    // 注册：创建新用户并保存
    register({ username, password, phone }) {
      const users = loadUsers()
      users[username] = {
        password: encode(password),
        phone: phone || '',
        realName: '',
        idNumber: '',
        createdAt: nowIso(),
      }
      saveUsers(users)
    },
    // 验证登录密码是否正确
    verifyPassword(username, password) {
      const users = loadUsers()
      const userData = users[username]
      if (!userData) return false
      return decode(userData.password) === password
    },
    // 检查用户名是否已存在
    userExists(username) {
      const users = loadUsers()
      return Boolean(users[username])
    },
    // 重置密码：通过用户名和手机号验证后重置
    resetPassword(username, phone, newPassword) {
      const users = loadUsers()
      const userData = users[username]
      if (!userData) return { ok: false, msg: '账号不存在' }
      if (userData.phone !== phone) return { ok: false, msg: '手机号不匹配' }
      users[username].password = encode(newPassword)
      saveUsers(users)
      return { ok: true, msg: '密码重置成功' }
    },
    // 修改密码
    changePassword(username, oldPassword, newPassword) {
      const users = loadUsers()
      const userData = users[username]
      if (!userData) return { ok: false, msg: '账号不存在' }
      if (decode(userData.password) !== oldPassword) return { ok: false, msg: '原密码不正确' }
      users[username].password = encode(newPassword)
      saveUsers(users)
      return { ok: true, msg: '密码修改成功' }
    },
    // 修改手机号
    changePhone(username, newPhone) {
      const users = loadUsers()
      const userData = users[username]
      if (!userData) return { ok: false, msg: '账号不存在' }
      users[username].phone = newPhone
      saveUsers(users)
      // 同步更新当前登录用户信息
      if (this.user && this.user.username === username) {
        this.user.phone = newPhone
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
      }
      return { ok: true, msg: '手机号修改成功' }
    },
    // 实名认证
    verifyRealName(username, realName, idNumber) {
      const users = loadUsers()
      const userData = users[username]
      if (!userData) return { ok: false, msg: '账号不存在' }
      users[username].realName = realName
      users[username].idNumber = idNumber
      saveUsers(users)
      // 同步更新当前登录用户信息
      if (this.user && this.user.username === username) {
        this.user.realName = realName
        this.user.idNumber = idNumber
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
      }
      return { ok: true, msg: '实名认证成功' }
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
