<template>
  <div class="main-page">
    <!-- Hero Section -->
    <section class="w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 py-24 sm:py-32">
      <div class="container mx-auto px-6 text-center">
        
        <div class="max-w-3xl mx-auto">
          <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Trade within your
            <span class="text-blue-600">University Campus</span>
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-600">
            Start safe and convenient second-hand trading with authenticated fellow students.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <button class="btn-primary btn-large flex items-center gap-2 bg-blue-600 hover:bg-blue-700" @click="handleGoShop">
              <Search class="btn-icon" />
              <span>Go Shop</span>
            </button>
            <button class="btn-secondary btn-large flex items-center gap-2" @click="handleAddProduct">
              <Plus class="btn-icon" />
              <span>Sell Product</span>
            </button>
          </div>
          
          <div class="mt-16 flex justify-center gap-8 lg:gap-16">
            <div class="flex flex-col items-center">
              <span class="text-3xl font-bold tracking-tight text-gray-900">{{ stats.productCount.toLocaleString() }}</span>
              <span class="mt-1 text-sm font-medium text-gray-500">Listed Items</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-3xl font-bold tracking-tight text-gray-900">{{ stats.userCount.toLocaleString() }}</span>
              <span class="mt-1 text-sm font-medium text-gray-500">Signed-up Students</span>
            </div>
          </div>
        </div>

        </div>
    </section>

    <!-- Latest Products Section -->
    <section class="products-section">
      <div class="section-container">
        <div class="section-header flex items-center">
          <h2 class="section-title">Recently Listed Products</h2>
          <button 
            class="btn-text ml-auto flex items-center gap-1 flex-nowrap" 
            @click="handleViewMore"
          >
            <span>View more</span>
            <ChevronRight class="btn-icon" />
          </button>

        </div>
        <!-- 한 줄에 4개 고정 & 중앙 정렬 -->
<div class="flex justify-center">
  <div class="grid grid-cols-4 gap-4 max-w-[1150px] w-full">
    <div
      v-for="product in latestProducts.slice(0, 4)"
      :key="product.boardId"
      class="product-card cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1"
      @click="goToDetail(product.boardId)"
    >
      <div class="product-image-container">
        <img
          :src="product.thumbnailUrl || '../../placeholder.svg'"
          :alt="product.title"
          class="w-full h-40 object-cover rounded"
        />
      </div>
      <div class="product-info">
        <h3 class="product-title">{{ product.title }}</h3>
        <p class="product-price">
          $ {{ product.price.toLocaleString() }}
        </p>
        <div class="product-meta">
          <span v-if="!isLogin" class="product-location">{{ product.schoolName }}</span>
        </div>
      </div>
    </div>
  </div>
</div>



      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api';
import '@/assets/styles/pages/Mainpage.css'
import { storeToRefs } from 'pinia';

import {
  Search,
  Plus,
  ChevronRight
} from 'lucide-vue-next'

const router = useRouter();
const authStore = useAuthStore();
const { isLogin } = storeToRefs(authStore);

// --- 로그인 확인 및 라우팅 함수 ---
function handleGoShop() {
  if (!isLogin.value) {
    alert('Please log in to continue.');
    router.push('/login');
    return;
  }
  router.push('/shop');
}

function handleAddProduct() {
  if (!isLogin.value) {
    alert('Please log in to continue.');
    router.push('/login');
    return
  }
  router.push('/Sell');
}

function handleViewMore() {
  if (!isLogin.value) {
    alert('Please log in to continue.');
    router.push('/login');
    return
  }
  router.push('/Shop');
}

// ✅ 실시간 등록 상품 수 / 사용자 수
const stats = reactive({
  productCount: 0,
  userCount: 0
})

onMounted(async () => {
  try {
  const res = await api.get('/api/main/counts') // ✅ 백엔드 경로와 맞춰줌
    stats.productCount = res.data.productCount
    stats.userCount = res.data.userCount
  } catch (err) {
    console.error('실시간 통계 불러오기 실패:', err)
  }
})

const latestProducts = ref([]);

async function fetchLatestProducts() {
  try {
    // isLogin 상태에 따라 알아서 올바른 API가 호출됨
    const response = await api.get('/board/latest');
    latestProducts.value = response.data;
    console.log(latestProducts);
  } catch (err) {
    console.error('최신 상품 로딩 실패:', err);
  }
}

// --- 이벤트 핸들러 ---
function goToDetail(productId) {
  if (!isLogin.value) {
    alert('Please log in to continue.');
    return;
  }
  router.push(`/details/${productId}`);
}

onMounted(() => {
  fetchLatestProducts();
});
</script>


