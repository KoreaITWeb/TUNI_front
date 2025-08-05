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
        <div class="section-header">
          <h2 class="section-title">Recent Register Products</h2>
          <button class="btn-text" @click="handleViewMore">
            View more <ChevronRight class="btn-icon" />
          </button>
        </div>
        <div class="products-grid">
          <div
            v-for="product in latestProducts"
            :key="product.id"
            class="product-card"
          >
            <div class="product-image-container">
              <img
                :src="product.image"
                :alt="product.title"
                class="product-image"
              />
              <button class="wishlist-btn">
                <Heart class="heart-icon" />
              </button>
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="product-price">
                {{ product.price.toLocaleString() }}$
              </p>
              <div class="product-meta">
                <span class="product-location">{{ product.location }}</span>
                <span class="product-time">{{ product.timeAgo }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="section-container">
        <h2 class="section-title">Why TUNI use?</h2>
        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.id"
            class="feature-card"
          >
            <div class="feature-icon">
              <component :is="feature.icon" class="icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

import '@/assets/styles/pages/Mainpage.css'
import logoTuni from '@/assets/logo-tuni.png'

import {
  Search,
  Plus,
  ChevronRight,
  Heart,
  Shield,
  Users,
  Clock,
  CheckCircle
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

function handleGoShop() {
  if (!authStore.isLogin) {
    alert('로그인 후 이용 가능합니다.')
    return
  }
  router.push('/Shop')
}

function handleAddProduct() {
  if (!authStore.isLogin) {
    alert('로그인 후 이용 가능합니다.')
    return
  }
  router.push('/Sell')
}

function handleViewMore() {
  if (!authStore.isLogin) {
    alert('로그인 후 이용 가능합니다.')
    return
  }
  router.push('/Shop')
}

// ✅ 실시간 등록 상품 수 / 사용자 수
const stats = reactive({
  productCount: 0,
  userCount: 0
})

onMounted(async () => {
  try {
  const res = await axios.get('/api/main/counts') // ✅ 백엔드 경로와 맞춰줌
    stats.productCount = res.data.productCount
    stats.userCount = res.data.userCount
  } catch (err) {
    console.error('실시간 통계 불러오기 실패:', err)
  }
})

const latestProducts = reactive([
  {
    id: 1,
    title: 'MacBook Pro 13 M1',
    price: 1200000,
    image: '/placeholder.svg?height=200&width=200',
    location: 'Haverd.Univ',
    timeAgo: '2min ago'
  },
  {
    id: 2,
    title: 'I-Pad Air 5th',
    price: 650000,
    image: '/placeholder.svg?height=200&width=200',
    location: '...Univ',
    timeAgo: '15min ago'
  },
  {
    id: 3,
    title: 'AirPot Pro 2th',
    price: 180000,
    image: '/placeholder.svg?height=200&width=200',
    location: '...Univ',
    timeAgo: '1H ago'
  },
  {
    id: 4,
    title: 'IPhone 13 Pro',
    price: 1500000,
    image: '/placeholder.svg?height=200&width=200',
    location: '...Univ',
    timeAgo: '2H ago'
  }
])

const features = reactive([
  {
    id: 1,
    title: 'Student Authentication System',
    description: 'Student ID authentication enables safer transactions',
    icon: Shield
  },
  {
    id: 2,
    title: 'Meeting at University',
    description:
      'You can also make friends within your school through meetings within your university.',
    icon: Users
  },
  {
    id: 3,
    title: 'Quick Transactions',
    description: 'Fast and efficient trading possible.',
    icon: Clock
  },
  {
    id: 4,
    title: 'Reliability System',
    description:
      'Find a trustworthy trading partner with our trading reviews and rating system.',
    icon: CheckCircle
  }
])
</script>
