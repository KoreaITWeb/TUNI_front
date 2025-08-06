<template>
  <div class="main-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Trade <span class="hero-highlight">University</span>
            </h1>
            <p class="hero-description">
              Start trading with students on the same campus.<br />
            </p>
            <div class="hero-actions">
              <button class="btn-primary btn-large" @click="handleGoShop">
                <Search class="btn-icon" />
                Go Shop
              </button>
              <button class="btn-secondary btn-large" @click="handleAddProduct">
                <Plus class="btn-icon" />
                Add Product
              </button>
            </div>
            <!-- ✅ 실시간 통계 표시 -->
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">{{ stats.productCount }}</span>
                <span class="stat-label">Listed Items</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ stats.userCount }}</span>
                <span class="stat-label">Signed-up Students</span>
              </div>
            </div>
          </div>

          <!-- Hero 이미지 카드 -->
          <div class="mt-10 lg:mt-0">
            <div class="flex items-center justify-center">
              <img
                :src="logoTuni"
                alt="대학생 중고거래 로고"
                class="w-[220px] object-contain"
                />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Products Section -->
    <section class="products-section">
      <div class="section-container">
        <div class="section-header flex items-center">
          <h2 class="section-title">Recent Register Products</h2>
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
      class="product-card cursor-pointer"
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
          {{ product.price.toLocaleString() }}원
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
import logoTuni from '@/assets/logo-tuni.png'
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
    alert('로그인 후 이용 가능합니다.');
    router.push('/login');
    return;
  }
  router.push('/shop');
}

function handleAddProduct() {
  if (!isLogin.value) {
    alert('로그인 후 이용 가능합니다.');
    router.push('/login');
    return
  }
  router.push('/Sell');
}

function handleViewMore() {
  if (!isLogin.value) {
    alert('로그인 후 이용 가능합니다.');
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
    alert('로그인이 필요한 기능입니다.');
    return;
  }
  router.push(`/details/${productId}`);
}

onMounted(() => {
  fetchLatestProducts();
});
</script>


