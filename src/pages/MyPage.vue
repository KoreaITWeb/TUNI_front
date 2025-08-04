<template>
  <div class="my-page">
    <div class="main-container">
      <!-- Main Profile Section -->
      <div class="profile-section">
        <div class="profile-content">
          <!-- Profile Info -->
          <div class="profile-info">
            <div class="profile-avatar-container">
              <img 
                :src="user.profileImage" 
                :alt="user.name"
                class="profile-avatar"
              >
              <div class="verification-badge">
                <Check class="verification-icon" />
              </div>
            </div>
            <div class="profile-details">
              <h2 class="profile-name">{{ user.name }}</h2>
              <p class="profile-department">{{ user.schoolname }} </p>
              <div class="profile-rating">
                <div class="rating-stars">
                  <Star class="star-icon" />
                  <span class="rating-score">{{ user.rating }}</span>
                </div>
                <span class="rating-separator">•</span>
                <span class="transaction-count">거래 {{ user.transactionCount }}회</span>
              </div>
            </div>
          </div>

          <!-- Stats Dashboard -->
          <div class="stats-dashboard">
            <div class="stat-card stat-selling">
              <div class="stat-number">{{ stats.selling }}</div>
              <div class="stat-label">판매중</div>
            </div>
            <div class="stat-card stat-sold">
              <div class="stat-number">{{ stats.sold }}</div>
              <div class="stat-label">판매완료</div>
            </div>
            <div class="stat-card stat-purchased">
              <div class="stat-number">{{ stats.purchased }}</div>
              <div class="stat-label">구매완료</div>
            </div>
            <div class="stat-card stat-wishlist">
              <div class="stat-number">{{ stats.wishlist }}</div>
              <div class="stat-label">찜한상품</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="btn-primary">
              <Plus class="btn-icon" />
              상품 등록
            </button>
            <button class="btn-secondary">
              <Edit class="btn-icon" />
              프로필 수정
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <h3 class="section-title">최근 활동</h3>
          <div class="activity-grid">
            <div class="activity-section">
              <h4 class="activity-title">최근 등록한 상품</h4>
              <div class="activity-list">
                <div v-for="item in recentItems" :key="item.id" class="activity-item">
                  <img :src="item.image" :alt="item.title" class="activity-image">
                  <div class="activity-details">
                    <p class="activity-item-title">{{ item.title }}</p>
                    <p class="activity-item-price">{{ item.price.toLocaleString() }}원</p>
                  </div>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </div>
              </div>
            </div>
            <div class="activity-section">
              <h4 class="activity-title">최근 메시지</h4>
              <div class="activity-list">
                <div v-for="message in recentMessages" :key="message.id" class="message-item">
                  <img :src="message.senderImage" :alt="message.sender" class="message-avatar">
                  <div class="message-details">
                    <p class="message-sender">{{ message.sender }}</p>
                    <p class="message-content">{{ message.content }}</p>
                  </div>
                  <span class="message-time">{{ message.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="navigation-menu">
        <button 
          v-for="menu in menuItems" 
          :key="menu.id"
          @click="activeMenu = menu.id"
          class="menu-item"
          :class="{ 'menu-item-active': activeMenu === menu.id }"
        >
          <component :is="menu.icon" class="menu-icon" />
          <div class="menu-title">{{ menu.title }}</div>
          <div class="menu-count">{{ menu.count }}</div>
        </button>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <div v-if="activeMenu === 'wishlist'" class="content-section">
          <h3 class="content-title">찜한 목록</h3>
          <div v-if="wishlistItems.length === 0" class="empty-message">
            찜한 상품이 없습니다.
          </div>
          <div v-else class="wishlist-grid">
            <div v-for="item in wishlistItems" :key="item.id" class="wishlist-item">
              <img :src="item.image" :alt="item.title" class="wishlist-image">
              <h4 class="wishlist-title">{{ item.title }}</h4>
              <p class="wishlist-price">{{ item.price.toLocaleString() }}원</p>
            </div>
          </div>
        </div>

        <div v-else-if="activeMenu === 'myItems'" class="content-section">
          <h3 class="content-title">내가 등록한 상품</h3>
          <div class="product-list">
            <template v-if="myProducts.length === 0">
              <div>등록한 상품이 없습니다.</div>
            </template>
            <template v-else>
              <div
                class="product-card"
                style="width: 12rem; cursor: pointer;"
                v-for="item in myProducts"
                :key="`${item.boardId}-${item.title}`"
                @click="goToDetail(item.boardId)"
              >
                <img
                  :src="item.thumbnailUrl"
                  alt="상품 이미지"
                  style="width: 100%; height: 150px; object-fit: cover;"
                />
                <div class="card-body">
                  <h6 class="card-title">{{ item.title }}</h6>
                  <p class="card-text text-truncate">{{ item.content }}</p>
                  <p class="card-text fw-bold">{{ item.price?.toLocaleString?.() || 0 }}원</p>
                </div>
              </div>
            </template>
          </div>
        </div>


        <div v-else-if="activeMenu === 'reviews'" class="content-section">
          <h3 class="content-title">리뷰</h3>
        </div>

        <div v-else-if="activeMenu === 'cart'" class="content-section">
          <h3 class="content-title">장바구니</h3>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  Check, Star, Plus, Edit, Heart, 
  Package, MessageSquare, ShoppingCart 
} from 'lucide-vue-next'
import '@/assets/styles/pages/Mypage.css'
import api from '@/api';
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const activeMenu = ref('wishlist')
const myProducts = ref([])
const wishlistItems = ref([])
const placeholder = '/placeholder.svg'

const user = reactive({
  name: '',
  department: '',
  grade: '3',
  profileImage: placeholder,
  rating: 4.8,
  transactionCount: 23
})

onMounted(async () => {
  const userId = authStore.userId  // ✅ store에서 가져옴
  const schoolId = authStore.schoolId
  console.log("현재 저장된 userId: ", userId)
  console.log("현재 저장된 schoolId: ", schoolId)
  
  if (!userId || !schoolId) {
    console.error('사용자 ID 또는 학교 ID가 없습니다.')
    return
  }

  try {
    // ② 찜한 게시글 목록 API 호출
    const resLikes = await axios.get(`/api/mypage/${userId}/likes`)
    // API 응답을 wishlistItems에 넣기 (필요에 따라 프로퍼티 맞춤)
    wishlistItems.value = resLikes.data.map(item => ({
      id: item.boardId,
      title: item.title,
      price: item.price,
      image: item.thumbnailUrl || '/placeholder.svg?height=128&width=128'
    }))

    const res = await api.get(`/api/mypage/${userId}`)  // ✅ 백틱 사용
    console.log('API 응답 데이터:', res.data)
    console.log('내 상품 목록:', res.data.productList)
    // Object.assign(user, res.data)
    //user.name = res.data.userId
    //user.schoolname = res.data.schoolId
    myProducts.value = res.data.productList || []
    user.name = res.data.user.userId; // 또는 user.name이 이미 있을 수 있음
    user.schoolname = res.data.university.name;
  
    console.log('업데이트된 user 객체:', user)
    
  } catch (err) {
    console.error('사용자 정보 로딩 실패:', err)
  }
})

const stats = reactive({
  selling: 5,
  sold: 18,
  purchased: 12,
  wishlist: 8
})

const menuItems = [
  { id: 'wishlist', title: '찜한목록', count: '8개', icon: Heart },
  { id: 'myItems', title: '내가 등록한 상품', count: '23개', icon: Package },
  { id: 'reviews', title: '리뷰', count: '15개', icon: MessageSquare },
  { id: 'cart', title: '장바구니', count: '3개', icon: ShoppingCart }
]

const recentItems = [
  {
    id: 1,
    title: '맥북 프로 13인치',
    price: 1200000,
    image: placeholder,
    status: '판매중'
  },
  {
    id: 2,
    title: '아이패드 에어',
    price: 600000,
    image: placeholder,
    status: '예약중'
  }
]

const recentMessages = [
  {
    id: 1,
    sender: '이학생',
    content: '맥북 상태 어떤가요?',
    time: '2분 전',
    senderImage: placeholder
  },
  {
    id: 2,
    sender: '박구매',
    content: '네고 가능한가요?',
    time: '1시간 전',
    senderImage: placeholder
  }
]


const getStatusClass = (status) => {
  switch (status) {
    case '판매중':
      return 'status-selling'
    case '예약중':
      return 'status-reserved'
    case '판매완료':
      return 'status-sold'
    default:
      return 'status-default'
  }
}
</script>

