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
            <!--
            <div class="stat-card stat-purchased">
              <div class="stat-number">{{ stats.purchased }}</div>
              <div class="stat-label">구매완료</div>
            </div>
            -->
            <div class="stat-card stat-wishlist">
              <div class="stat-number">{{ stats.wishlist }}</div>
              <div class="stat-label">찜한상품</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="btn-primary" @click="goToSellpage">
              <Plus class="btn-icon" />
              상품 등록
            </button>
            <button class="btn-secondary" @click="goToProfileUpdate">
              <Edit class="btn-icon" />
              프로필 수정
            </button>
          </div>
        </div>
       
        <!-- Recent Activity 
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
         -->
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { 
  Star, Plus, Edit, Heart, 
  Package, MessageSquare, ShoppingCart 
} from 'lucide-vue-next'
import '@/assets/styles/pages/Mypage.css'
import api from '@/api'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const activeMenu = ref('wishlist')
const myProducts = ref([])
const wishlistItems = ref([])
const placeholder = '/placeholder.svg'
const { isLogin } = storeToRefs(authStore)




const goToSellpage = () => {
  router.push('/Sell')
}

const goToProfileUpdate = () => {
  router.push('/ProfileUpdate')
}

const user = reactive({
  name: '',
  department: '',
  grade: '3',
  profileImage: placeholder,
  rating: 4.8,
  transactionCount: 23,
  schoolname: ''
})

const stats = reactive({
  selling: 0,
  sold: 18,
  purchased: 12,
  wishlist: 0
})

// 찜한 상품 목록과 stats.wishlist 업데이트 함수
async function loadWishlist(userId) {
  try {
    const resLikes = await axios.get(`/api/mypage/${userId}/likes`)
    wishlistItems.value = resLikes.data.map(item => ({
      id: item.boardId,
      title: item.title,
      price: item.price,
      image: item.thumbnailUrl || '/placeholder.svg?height=128&width=128'
    }))
    stats.wishlist = wishlistItems.value.length
  } catch (err) {
    console.error('찜한 게시글 목록 로딩 실패:', err)
  }
}

async function fetchProfileImage(userId) {
  try {
    const token = authStore.accessToken
    const res = await axios.get(`/api/mypage/${userId}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob'
    })

    if (res.data) {
      user.profileImage = URL.createObjectURL(res.data)
    } else {
      user.profileImage = placeholder
    }
  } catch (err) {
    console.error('프로필 이미지 불러오기 실패:', err)
    user.profileImage = placeholder
  }
}

// 예: 판매중, 판매완료 상태별 카운트 업데이트 함수
function updateSaleStatusStats() {
  stats.selling = myProducts.value.filter(p => p.saleStatus === 'SALE').length;
  stats.sold = myProducts.value.filter(p => p.saleStatus === 'SOLD').length;
}

// 내가 등록한 상품 및 user 정보, stats.selling 업데이트 함수
async function loadMyPageData(userId) {
  try {
    console.log('loadMyPageData 호출 - userId:', userId)
    console.log("프론트에서 서버에 요청 보내는 userId:", userId);

    const res = await api.get(`/api/mypage/${userId}`)
    console.log("프론트에서 서버에 요청 보내는 userId:", userId);

    console.log(res.data.saleCount);  // 판매중
    console.log(res.data.soldCount)
    console.log('API 응답 데이터:', res.data)
    console.log('내 상품 목록:', res.data.productList)
    myProducts.value = res.data.productList || []
    // 상태별 카운트 업데이트
    updateSaleStatusStats();
    console.log('상품 리스트 길이:', (res.data.productList || []).length)
    console.log("상품 saleStatus 상태 확인:");
    myProducts.value.forEach((p, i) => {
      console.log(`상품[${i}] saleStatus:`, p.saleStatus);
      console.log(`상품[${i}] 전체:`, JSON.parse(JSON.stringify(p)));
    });
    user.name = res.data.user.userId
    user.schoolname = res.data.university.name
    
    console.log('첫 번째 상품 상세:', res.data.productList[0])
    //stats.selling = myProducts.value.length
    

    console.log('판매중 상품 개수:', stats.selling)
    console.log('상품 목록:', myProducts.value)
    console.log('업데이트된 user 객체:', user)
    // ✅ 프로필 이미지도 같이 불러오기
    await fetchProfileImage(userId)
  } catch (err) {
    console.error('내가 등록한 상품 데이터 로딩 실패:', err)
  }
}

// 컴포넌트 마운트 시 찜한 상품과 내가 등록한 상품 모두 불러오기
onMounted(async () => {
  if (!isLogin.value) {
    alert('로그인 후 이용가능합니다.');
    router.push('/login');
  }
  const userId = authStore.userId
  const schoolId = authStore.schoolId
  console.log("현재 저장된 userId: ", userId)
  console.log("현재 저장된 schoolId: ", schoolId)
  
  if (!userId || !schoolId) {
    console.error('사용자 ID 또는 학교 ID가 없습니다.')
    return
  }
  
  await loadWishlist(userId)
  await loadMyPageData(userId)
})

// activeMenu가 'myItems'로 변경될 때마다 내가 등록한 상품 목록 새로 불러오기
watch(activeMenu, async (newVal) => {
  if (newVal === 'myItems') {
    const userId = authStore.userId
    if (!userId) {
      console.error('userId가 없습니다.')
      return
    }
    await loadMyPageData(userId)
  }
})
watch(
  () => authStore.userId,
  async (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
      console.log('✅ userId 변경 감지:', oldUserId, '→', newUserId)
      await loadWishlist(newUserId)
      await loadMyPageData(newUserId)
    }
  }
)
const menuItems = computed(() => [
  { id: 'wishlist', title: '찜한목록', count: `${wishlistItems.value.length}개`, icon: Heart },
  { id: 'myItems', title: '내가 등록한 상품', count: `${myProducts.value.length}개`, icon: Package },
  //{ id: 'reviews', title: '리뷰', count: '15개', icon: MessageSquare },
  //{ id: 'cart', title: '장바구니', count: '3개', icon: ShoppingCart }
])

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


