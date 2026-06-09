import { defineStore } from 'pinia'

// 当前登录态本地存储 key
const STORAGE_KEY = 'yuexing_auth'
// 全部用户信息本地存储 key（演示用，实际应由后端管理）
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

// 简易加密：用于密码本地存储，仅做演示
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

// 加载本地用户表（结构：{ [username]: { password, phone, realName, idCard, verified, ... } }）
function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  const parsed = raw ? safeJsonParse(raw) : null
  return parsed && typeof parsed === 'object' ? parsed : {}
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/**
 * 密码强度校验
 * 规则：长度 >= 8，且必须同时包含大写字母、小写字母、数字和特殊字符
 */
export function validatePasswordStrength(password) {
  const value = String(password ?? '')
  if (value.length < 8) {
    return { ok: false, message: '密码长度至少 8 位' }
  }
  if (!/[A-Z]/.test(value)) {
    return { ok: false, message: '密码必须包含大写字母' }
  }
  if (!/[a-z]/.test(value)) {
    return { ok: false, message: '密码必须包含小写字母' }
  }
  if (!/\d/.test(value)) {
    return { ok: false, message: '密码必须包含数字' }
  }
  if (!/[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/\\|`~]/.test(value)) {
    return { ok: false, message: '密码必须包含特殊字符' }
  }
  return { ok: true, message: '通过' }
}

// 简单手机号校验（中国大陆 11 位）
export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(String(phone ?? ''))
}

// 简单身份证号校验（18 位，最后一位可为 X）
export function validateIdCard(idCard) {
  return /^\d{17}[\dXx]$/.test(String(idCard ?? ''))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    hydrated: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.user),
  },
  actions: {
    // 从 localStorage 恢复登录态
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

    // 同步本地用户表中最新信息到当前登录态
    syncFromUsers() {
      if (!this.user?.username) return
      const users = loadUsers()
      const record = users[this.user.username]
      if (!record) return
      this.user = {
        ...this.user,
        phone: record.phone ?? '',
        realName: record.realName ?? '',
        idCard: record.idCard ?? '',
        verified: Boolean(record.verified),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
    },

    /**
     * 注册
     * @returns { ok: boolean, message: string }
     */
    register({ username, password, phone }) {
      const name = String(username ?? '').trim()
      if (!name) return { ok: false, message: '请输入账号' }
      const strength = validatePasswordStrength(password)
      if (!strength.ok) return strength
      if (phone && !validatePhone(phone)) {
        return { ok: false, message: '手机号格式不正确' }
      }
      const users = loadUsers()
      if (users[name]) return { ok: false, message: '账号已存在，请直接登录' }
      // 同手机号不允许重复注册（仅当传入手机号时校验）
      if (phone) {
        const phoneTaken = Object.values(users).some((u) => u?.phone === phone)
        if (phoneTaken) return { ok: false, message: '该手机号已被注册' }
      }
      users[name] = {
        password: encode(password),
        phone: phone ?? '',
        realName: '',
        idCard: '',
        verified: false,
        createdAt: nowIso(),
      }
      saveUsers(users)
      return { ok: true, message: '注册成功' }
    },

    /**
     * 登录
     */
    login({ username, password }) {
      const name = String(username ?? '').trim()
      const users = loadUsers()
      const record = users[name]
      if (!record) return { ok: false, message: '账号不存在，请先注册' }
      if (decode(record.password) !== String(password ?? '')) {
        return { ok: false, message: '密码不正确' }
      }
      this.user = {
        username: name,
        phone: record.phone ?? '',
        realName: record.realName ?? '',
        idCard: record.idCard ?? '',
        verified: Boolean(record.verified),
        loginAt: nowIso(),
      }
      this.token = `demo_${Math.random().toString(16).slice(2)}`
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
      return { ok: true, message: '登录成功' }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem(STORAGE_KEY)
    },

    /**
     * 重置密码（通过账号 + 手机号校验后设置新密码）
     */
    resetPassword({ username, phone, newPassword }) {
      const name = String(username ?? '').trim()
      const users = loadUsers()
      const record = users[name]
      if (!record) return { ok: false, message: '账号不存在' }
      if (!record.phone || record.phone !== phone) {
        return { ok: false, message: '账号与手机号不匹配' }
      }
      const strength = validatePasswordStrength(newPassword)
      if (!strength.ok) return strength
      record.password = encode(newPassword)
      record.passwordResetAt = nowIso()
      users[name] = record
      saveUsers(users)
      return { ok: true, message: '密码重置成功，请重新登录' }
    },

    /**
     * 修改密码（需提供旧密码）
     */
    changePassword({ oldPassword, newPassword }) {
      if (!this.user?.username) return { ok: false, message: '未登录' }
      const users = loadUsers()
      const record = users[this.user.username]
      if (!record) return { ok: false, message: '账号不存在' }
      if (decode(record.password) !== String(oldPassword ?? '')) {
        return { ok: false, message: '原密码不正确' }
      }
      const strength = validatePasswordStrength(newPassword)
      if (!strength.ok) return strength
      record.password = encode(newPassword)
      record.passwordChangedAt = nowIso()
      users[this.user.username] = record
      saveUsers(users)
      return { ok: true, message: '密码修改成功' }
    },

    /**
     * 修改手机号（需输入当前密码做二次确认）
     */
    changePhone({ password, newPhone }) {
      if (!this.user?.username) return { ok: false, message: '未登录' }
      if (!validatePhone(newPhone)) return { ok: false, message: '手机号格式不正确' }
      const users = loadUsers()
      const record = users[this.user.username]
      if (!record) return { ok: false, message: '账号不存在' }
      if (decode(record.password) !== String(password ?? '')) {
        return { ok: false, message: '密码不正确，无法修改手机号' }
      }
      // 校验新手机号未被其他账号占用
      const taken = Object.entries(users).some(
        ([name, u]) => name !== this.user.username && u?.phone === newPhone,
      )
      if (taken) return { ok: false, message: '该手机号已被其他账号使用' }
      record.phone = newPhone
      record.phoneUpdatedAt = nowIso()
      users[this.user.username] = record
      saveUsers(users)
      this.syncFromUsers()
      return { ok: true, message: '手机号修改成功' }
    },

    /**
     * 实名认证
     */
    verifyRealName({ realName, idCard }) {
      if (!this.user?.username) return { ok: false, message: '未登录' }
      const name = String(realName ?? '').trim()
      if (name.length < 2) return { ok: false, message: '请输入真实姓名' }
      if (!validateIdCard(idCard)) return { ok: false, message: '身份证号格式不正确' }
      const users = loadUsers()
      const record = users[this.user.username]
      if (!record) return { ok: false, message: '账号不存在' }
      record.realName = name
      record.idCard = String(idCard).toUpperCase()
      record.verified = true
      record.verifiedAt = nowIso()
      users[this.user.username] = record
      saveUsers(users)
      this.syncFromUsers()
      return { ok: true, message: '实名认证成功' }
    },
  },
})
