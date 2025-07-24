<template>
  <div class="main-page">

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              우리 대학 학생들만의<br>
              <span class="hero-highlight">안전한 중고거래</span>
            </h1>
            <p class="hero-description">
              같은 캠퍼스 학생들과 믿을 수 있는 거래를 시작하세요.<br>
              학생증 인증으로 더욱 안전하게!
            </p>
            <div class="hero-actions">
              <button class="btn-primary btn-large">
                <Search class="btn-icon" />
                상품 둘러보기
              </button>
              <button class="btn-secondary btn-large">
                <Plus class="btn-icon" />
                상품 등록하기
              </button>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">1,234</span>
                <span class="stat-label">등록된 상품</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">567</span>
                <span class="stat-label">활성 사용자</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">890</span>
                <span class="stat-label">완료된 거래</span>
              </div>
            </div>
          </div>
          <div class="hero-image">
            <div class="hero-card">
              <img src="/placeholder.svg?height=300&width=400" alt="대학생 중고거래" class="hero-img">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="categories-section">
      <div class="section-container">
        <h2 class="section-title">인기 카테고리</h2>
        <div class="categories-grid">
          <div v-for="category in categories" :key="category.id" class="category-card">
            <div class="category-icon">
              <component :is="category.icon" class="icon" />
            </div>
            <h3 class="category-title">{{ category.name }}</h3>
            <p class="category-count">{{ category.count }}개 상품</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Products Section -->
    <section class="products-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">최신 등록 상품</h2>
          <button class="btn-text">전체보기 <ChevronRight class="btn-icon" /></button>
        </div>
        <div class="products-grid">
          <div v-for="product in latestProducts" :key="product.id" class="product-card">
            <div class="product-image-container">
              <img :src="product.image" :alt="product.title" class="product-image">
              <button class="wishlist-btn">
                <Heart class="heart-icon" />
              </button>
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="product-price">{{ product.price.toLocaleString() }}원</p>
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
        <h2 class="section-title">왜 TUNI 인가요?</h2>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.id" class="feature-card">
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
import { reactive } from 'vue'
import '@/assets/styles/pages/Mainpage.css';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  Heart,
  Laptop,
  Book,
  Shirt,
  Gamepad2,
  Coffee,
  Headphones,
  Shield,
  Users,
  Clock,
  CheckCircle
} from 'lucide-vue-next'

const categories = reactive([
  { id: 1, name: '전자기기', icon: Laptop, count: 234 },
  { id: 2, name: '도서/교재', icon: Book, count: 156 },
  { id: 3, name: '의류/잡화', icon: Shirt, count: 189 },
  { id: 4, name: '게임/취미', icon: Gamepad2, count: 98 },
  { id: 5, name: '생활용품', icon: Coffee, count: 145 },
  { id: 6, name: '음향기기', icon: Headphones, count: 67 }
])

const latestProducts = reactive([
  {
    id: 1,
    title: '맥북 프로 13인치 M1',
    price: 1200000,
    image: '/placeholder.svg?height=200&width=200',
    location: '공과대학',
    timeAgo: '2분 전'
  },
  {
    id: 2,
    title: '아이패드 에어 5세대',
    price: 650000,
    image: '/placeholder.svg?height=200&width=200',
    location: '인문대학',
    timeAgo: '15분 전'
  },
  {
    id: 3,
    title: '에어팟 프로 2세대',
    price: 180000,
    image: '/placeholder.svg?height=200&width=200',
    location: '경영대학',
    timeAgo: '1시간 전'
  },
  {
    id: 4,
    title: '갤럭시 탭 S8',
    price: 450000,
    image: '/placeholder.svg?height=200&width=200',
    location: '자연대학',
    timeAgo: '2시간 전'
  }
])

const features = reactive([
  {
    id: 1,
    title: '학생 인증 시스템',
    description: '학생증 인증을 통해 같은 대학 학생들과만 거래할 수 있어 더욱 안전합니다.',
    icon: Shield
  },
  {
    id: 2,
    title: '캠퍼스 내 만남',
    description: '같은 캠퍼스 내에서 직접 만나 거래하므로 사기 위험이 적고 편리합니다.',
    icon: Users
  },
  {
    id: 3,
    title: '빠른 거래',
    description: '가까운 거리의 학생들과 거래하므로 빠르고 효율적인 거래가 가능합니다.',
    icon: Clock
  },
  {
    id: 4,
    title: '신뢰도 시스템',
    description: '거래 후기와 평점 시스템으로 신뢰할 수 있는 거래 파트너를 찾을 수 있습니다.',
    icon: CheckCircle
  }
])
</script>

