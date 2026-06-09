import { defineStore } from 'pinia'

const FAVORITES_KEY = 'yuexing_favorites'
const REVIEWS_KEY = 'yuexing_reviews'
const BOOKINGS_KEY = 'yuexing_bookings'
const TICKET_ORDERS_KEY = 'yuexing_ticket_orders'

function safeJsonParse(value, fallback) {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function loadArray(key) {
  return safeJsonParse(localStorage.getItem(key), [])
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`
}

const spotSeed = [
  {
    id: 'sky-lake',
    name: '天境湖',
    score: 4.8,
    distanceKm: 2.6,
    tags: ['亲子', '轻松', '拍照'],
    short: '湖面如镜，蓝天倒影与木栈道相映成趣。',
    openTime: '08:00-18:00',
    price: 60,
    traffic: '游客中心乘坐观光车15分钟，或沿湖徒步约40分钟。',
    history:
      '相传古时行旅在此歇脚，见湖面映天如镜，故名“天境”。现为景区核心观景点之一。',
    highlights: ['环湖木栈道', '观景平台', '水上皮划艇体验（季节性）'],
    gallery: ['spot-1', 'spot-2', 'spot-3'],
    location: { x: 62, y: 34 },
  },
  {
    id: 'green-valley',
    name: '翠谷秘境',
    score: 4.6,
    distanceKm: 5.1,
    tags: ['徒步', '清凉', '野趣'],
    short: '林荫峡谷与溪流相伴，夏日避暑首选。',
    openTime: '07:30-17:30',
    price: 80,
    traffic: '自驾至2号停车场后步行20分钟进入谷口。',
    history: '谷地植被丰茂，因常年云雾缭绕、溪水清澈，得名“翠谷”。',
    highlights: ['溪谷步道', '瀑布观景点', '林间栈道'],
    gallery: ['spot-4', 'spot-5', 'spot-6'],
    location: { x: 38, y: 58 },
  },
  {
    id: 'sunset-ridge',
    name: '日落观景岭',
    score: 4.9,
    distanceKm: 8.3,
    tags: ['日落', '观景', '轻徒步'],
    short: '黄昏云霞染山，最佳日落拍摄点。',
    openTime: '09:00-19:00',
    price: 50,
    traffic: '乘坐索道8分钟至上站，步行10分钟抵达观景台。',
    history: '山脊开阔，昔日为巡山瞭望点，如今成为游客观日落的热门地标。',
    highlights: ['山脊观景台', '云海观景', '夜间星空（晴天）'],
    gallery: ['spot-7', 'spot-8', 'spot-9'],
    location: { x: 74, y: 72 },
  },
  {
    id: 'ancient-path',
    name: '古道云栈',
    score: 4.5,
    distanceKm: 6.7,
    tags: ['历史', '徒步', '打卡'],
    short: '石阶古道穿林而上，沿途遗迹与观景点丰富。',
    openTime: '08:00-17:00',
    price: 40,
    traffic: '从东门入园步行5分钟到古道起点。',
    history: '古道为商旅通行要道，今保留部分石阶与驿站遗址。',
    highlights: ['驿站遗址', '石阶古道', '山顶观景亭'],
    gallery: ['spot-10', 'spot-11', 'spot-12'],
    location: { x: 18, y: 40 },
  },
]

const routeSeed = [
  {
    id: 'family',
    title: '亲子游',
    duration: '3-4小时',
    difficulty: '轻松',
    desc: '天境湖环湖 + 森林小火车 + 亲子乐园',
  },
  {
    id: 'hike',
    title: '徒步线',
    duration: '5-6小时',
    difficulty: '中等',
    desc: '翠谷秘境穿越 + 瀑布观景 + 林间栈道',
  },
  {
    id: 'sunset',
    title: '日落观光线',
    duration: '2-3小时',
    difficulty: '轻松',
    desc: '索道上山 + 日落观景岭 + 星空步道（可选）',
  },
]

const activitySeed = [
  {
    id: 'maple',
    title: '枫叶节',
    dateRange: '10/15 - 11/20',
    desc: '秋日限定红叶大道打卡 + 摄影比赛',
  },
  {
    id: 'camping',
    title: '星空露营',
    dateRange: '周末限定',
    desc: '露营地预约 + 星空讲解 + 篝火音乐',
  },
]

const staySeed = [
  {
    id: 'hotel-1',
    type: '酒店',
    name: '悦行云端酒店',
    price: 599,
    left: 12,
    facilities: ['早餐', '停车场', '健身房', '观景露台'],
    cover: 'stay-1',
  },
  {
    id: 'bnb-1',
    type: '民宿',
    name: '山海小筑',
    price: 399,
    left: 6,
    facilities: ['厨房', '露台', '投影', '宠物友好'],
    cover: 'stay-2',
  },
  {
    id: 'bnb-2',
    type: '民宿',
    name: '林间木屋',
    price: 459,
    left: 4,
    facilities: ['壁炉', '茶室', '亲子房', '露营区'],
    cover: 'stay-3',
  },
]

const guideSeed = [
  {
    id: 'guide-1',
    title: '一日轻松打卡路线：拍照+美食不走回头路',
    author: '悦行攻略组',
    views: 23840,
    cover: 'guide-1',
    content: {
      plan: ['08:30 入园-游客中心', '09:00 天境湖环湖', '12:00 山海集市午餐', '15:30 日落观景岭'],
      tips: ['建议穿防滑鞋', '晴天记得防晒', '索道旺季提前预约'],
      food: ['山海米线', '林间烤鸡', '青柠气泡水'],
    },
  },
  {
    id: 'guide-2',
    title: '亲子游玩必看：3小时玩遍核心景点',
    author: '小鹿妈妈',
    views: 16502,
    cover: 'guide-2',
    content: {
      plan: ['10:00 入园', '10:20 天境湖栈道', '11:30 亲子乐园', '12:30 轻食补给'],
      tips: ['带上驱蚊液', '儿童推车可走木栈道', '午间注意补水'],
      food: ['奶香玉米', '山野酸奶', '儿童套餐'],
    },
  },
]

const ticketSeed = [
  { id: 'adult', name: '成人票', price: 120 },
  { id: 'child', name: '儿童票', price: 60 },
  { id: 'combo', name: '套票（门票+索道）', price: 168 },
]

export const useDataStore = defineStore('data', {
  state: () => ({
    spots: spotSeed,
    routes: routeSeed,
    activities: activitySeed,
    stays: staySeed,
    guides: guideSeed,
    tickets: ticketSeed,
    favorites: loadArray(FAVORITES_KEY),
    reviews: loadArray(REVIEWS_KEY),
  }),
  getters: {
    favoriteSet: (state) => new Set(state.favorites),
    reviewsBySpot: (state) => {
      const map = new Map()
      for (const r of state.reviews) {
        const list = map.get(r.spotId) ?? []
        list.push(r)
        map.set(r.spotId, list)
      }
      for (const list of map.values()) {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      return map
    },
  },
  actions: {
    toggleFavorite(spotId) {
      const exists = this.favorites.includes(spotId)
      this.favorites = exists ? this.favorites.filter((id) => id !== spotId) : [...this.favorites, spotId]
      saveArray(FAVORITES_KEY, this.favorites)
    },
    submitReview({ spotId, username, rating, content, images }) {
      const review = {
        id: uid('review'),
        spotId,
        username,
        rating,
        content,
        images: images ?? [],
        createdAt: new Date().toISOString(),
      }
      this.reviews = [review, ...this.reviews]
      saveArray(REVIEWS_KEY, this.reviews)
      return review
    },
    submitBooking(payload) {
      const orders = loadArray(BOOKINGS_KEY)
      const order = { id: uid('booking'), createdAt: new Date().toISOString(), ...payload }
      saveArray(BOOKINGS_KEY, [order, ...orders])
      return order
    },
    submitTicketOrder(payload) {
      const orders = loadArray(TICKET_ORDERS_KEY)
      const order = { id: uid('ticket'), createdAt: new Date().toISOString(), ...payload }
      saveArray(TICKET_ORDERS_KEY, [order, ...orders])
      return order
    },
  },
})

