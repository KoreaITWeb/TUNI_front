<template>
  <div class="main-page">

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Saheroe transactions<br>
              <span class="hero-highlight">on University</span>
            </h1>
            <p class="hero-description">
              Start trading with students on the same campus.<br>
            </p>
            <div class="hero-actions">
              <button class="btn-primary btn-large">
                <Search class="btn-icon" />
                Go Shop
              </button>
              <button class="btn-secondary btn-large">
                <Plus class="btn-icon" />
                Add Product
              </button>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">1,234</span>
                <span class="stat-label">Register Product</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">567</span>
                <span class="stat-label">Number of Students</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">890</span>
                <span class="stat-label">Completed transactions</span>
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

    <!-- Latest Products Section -->
    <section class="products-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Recent Register Products</h2>
          <button class="btn-text">View more <ChevronRight class="btn-icon" /></button>
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
        <h2 class="section-title">Why TUNI use?</h2>
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
  Shield,
  Users,
  Clock,
  CheckCircle
} from 'lucide-vue-next'

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
    description: 'You can also make friends within your school through meetings within your university.',
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
    description: 'Find a trustworthy trading partner with our trading reviews and rating system.',
    icon: CheckCircle
  }
])
</script>

