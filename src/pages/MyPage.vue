<template>
  <div class="bg-slate-50 min-h-screen">
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
      
      <div class="profile-card bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div class="relative">
          <img 
            :src="user.profileImage" 
            :alt="user.name"
            class="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md"
          >
        </div>
        <div class="flex-grow text-center sm:text-left">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-800">{{ user.name }}</h2>
          <p class="text-md text-gray-500 mt-1">{{ user.schoolname }}</p>
        </div>
        <div class="quick-actions">
          <button class="btn-primary" @click="goToSellpage">
            <Plus class="btn-icon" />
            Sell
          </button>
          <button class="btn-secondary" @click="goToProfileUpdate">
            <Edit class="btn-icon" />
            Edit Profile
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="stat-card bg-white p-5 rounded-xl shadow-sm text-center">
          <div class="text-3xl font-bold text-sky-600">{{ stats.selling }}</div>
          <div class="text-sm font-medium text-gray-500 mt-1">For Sale</div>
        </div>
        <div class="stat-card bg-white p-5 rounded-xl shadow-sm text-center">
          <div class="text-3xl font-bold text-gray-700">{{ stats.sold }}</div>
          <div class="text-sm font-medium text-gray-500 mt-1">Sold</div>
        </div>
        <div class="stat-card bg-white p-5 rounded-xl shadow-sm text-center">
          <div class="text-3xl font-bold text-rose-500">{{ stats.wishlist }}</div>
          <div class="text-sm font-medium text-gray-500 mt-1">Liked</div>
        </div>
      </div>

      <div class="border-b border-gray-200 mb-6">
        <nav class="flex -mb-px space-x-6">
          <button 
            v-for="menu in menuItems" 
            :key="menu.id"
            @click="activeMenu = menu.id"
            class="py-3 px-1 font-medium text-md transition-colors duration-200"
            :class="activeMenu === menu.id 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            {{ menu.title }}
            <span class="ml-2 bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {{ menu.count }}
            </span>
          </button>
        </nav>
      </div>

      <div class="content-area bg-white p-6 rounded-2xl shadow-sm min-h-[300px]">
        <div v-if="activeMenu === 'wishlist'">
          <div v-if="wishlistItems.length === 0" class="empty-message">
            You haven't liked any items yet.
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="item in wishlistItems" :key="item.id" class="product-card-small" @click="goToDetail(item.id)">
              <img :src="item.image" :alt="item.title" class="product-image">
              <div class="p-2">
                <h4 class="product-title-small">{{ item.title }}</h4>
                <p class="product-price-small">$ {{ item.price.toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeMenu === 'myItems'">
          <div v-if="myProducts.length === 0" class="empty-message">
            You haven't listed any items for sale.
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div
              v-for="item in myProducts"
              :key="item.boardId"
              class="product-card-small cursor-pointer"
              @click="goToDetail(item.boardId)"
            >
              <img :src="item.thumbnailUrl || placeholder" alt="상품 이미지" class="product-image"/>
              <div class="p-2">
                <h4 class="product-title-small">{{ item.title }}</h4>
                <p class="product-price-small">$ {{ item.price?.toLocaleString?.() || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { Plus, Edit, Heart, Package} from 'lucide-vue-next'
import '@/assets/styles/pages/Mypage.css'
import api from '@/api'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const activeMenu = ref('myItems')
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
    // console.log('loadMyPageData 호출 - userId:', userId)
    // console.log("프론트에서 서버에 요청 보내는 userId:", userId);

    const res = await api.get(`/api/mypage/${userId}`)
    // console.log("프론트에서 서버에 요청 보내는 userId:", userId);

    // console.log(res.data.saleCount);  // 판매중
    // console.log(res.data.soldCount)
    // console.log('API 응답 데이터:', res.data)
    // console.log('내 상품 목록:', res.data.productList)
    myProducts.value = res.data.productList || []
    // 상태별 카운트 업데이트
    updateSaleStatusStats();
    // console.log('상품 리스트 길이:', (res.data.productList || []).length)
    // console.log("상품 saleStatus 상태 확인:");
    user.name = res.data.user.userId
    user.schoolname = res.data.university.name
    
    // console.log('첫 번째 상품 상세:', res.data.productList[0])
    //stats.selling = myProducts.value.length
    

    // console.log('판매중 상품 개수:', stats.selling)
    // console.log('상품 목록:', myProducts.value)
    // console.log('업데이트된 user 객체:', user)
    // ✅ 프로필 이미지도 같이 불러오기
    await fetchProfileImage(userId)
  } catch (err) {
    console.error('내가 등록한 상품 데이터 로딩 실패:', err)
  }
}

// 컴포넌트 마운트 시 찜한 상품과 내가 등록한 상품 모두 불러오기
onMounted(async () => {
  if (!isLogin.value) {
    alert('Please log in to continue.');
    router.push('/login');
  }
  const userId = authStore.userId
  const schoolId = authStore.schoolId
  // console.log("현재 저장된 userId: ", userId)
  // console.log("현재 저장된 schoolId: ", schoolId)
  
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
      // console.log('✅ userId 변경 감지:', oldUserId, '→', newUserId)
      await loadWishlist(newUserId)
      await loadMyPageData(newUserId)
    }
  }
)
const menuItems = computed(() => [
  { id: 'myItems', title: 'My Items', count: `${myProducts.value.length}`, icon: Package },
  { id: 'wishlist', title: 'Liked Items', count: `${wishlistItems.value.length}`, icon: Heart },
  //{ id: 'reviews', title: '리뷰', count: '15개', icon: MessageSquare },
  //{ id: 'cart', title: '장바구니', count: '3개', icon: ShoppingCart }
])

function goToDetail(boardId) {
  router.push(`/details/${boardId}`);
};
</script>

<style scoped>
/* Tailwind CSS로 대부분의 스타일을 처리하므로, 복잡한 CSS는 필요 없습니다. */
.empty-message {
  @apply text-center text-gray-500 py-16;
}
.product-card-small {
  @apply bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-lg;
}
.product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}
.product-title-small {
  @apply font-semibold text-sm text-gray-800 truncate;
}
.product-price-small {
  @apply text-sm text-gray-600 mt-1;
}
</style>
