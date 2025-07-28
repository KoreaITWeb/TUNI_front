<template>
  <div class="shop-container">
    <div class="row">
      <!-- 왼쪽 필터 영역 -->
      <div class="col-md-3 border-end">
        <h5>Category</h5>
        <div>
          <span class="badge bg-secondary me-1">Electronics ✕</span>
          <span class="badge bg-secondary me-1">Books ✕</span>
          <span class="badge bg-secondary me-1">Clothings ✕</span>
        </div>

        <div class="form-check mt-3" v-for="n in 3" :key="n">
          <input class="form-check-input" type="checkbox" :id="'label' + n" checked>
          <label class="form-check-label" :for="'label' + n">Label</label>
        </div>

        <label class="form-label mt-3">Price</label>
        <input type="range" class="form-range" min="0" max="100">
      </div>

      <!-- 오른쪽 콘텐츠 영역 -->
      <div class="col-md-9">
        <!-- 검색 & 정렬 -->
        <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
          <div class="input-group w-50">
            <input type="text" class="form-control" placeholder="Search">
            <button class="btn btn-outline-secondary" type="button">🔍</button>
          </div>
          <div class="btn-group">
            <button class="btn btn-dark">New</button>
            <button class="btn btn-outline-secondary">Price ascending</button>
            <button class="btn btn-outline-secondary">Price descending</button>
          </div>
        </div>

        <!-- 카드 영역 -->
        <div class="product-list d-flex flex-wrap gap-3">
          <div
            class="product-card"
            style="width: 12rem; cursor:pointer;"
            v-for="product in products"
            :key="product.id"
            @click="goToDetail(product.id)"
          >
            <img :src="product.imageUrl" alt="상품 이미지" />
            <div class="card-body">
              <h6 class="card-title">{{ product.title }}</h6>
              <p class="card-text text-truncate">{{ product.description }}</p>
              <p class="card-text fw-bold">{{ product.price }}$</p>
            </div>
          </div>
        </div>
      </div> <!-- col-md-9 끝 -->
    </div> <!-- row 끝 -->

    <!-- ✅ 페이지네이션: 전체 가운데 정렬 -->
    <nav class="mt-4" style="display: flex; justify-content: center;">
      <ul class="pagination">
        <li class="page-item disabled"><a class="page-link">← Previous</a></li>
        <li class="page-item active"><a class="page-link">1</a></li>
        <li class="page-item"><a class="page-link">2</a></li>
        <li class="page-item"><a class="page-link">3</a></li>
        <li class="page-item"><a class="page-link">…</a></li>
        <li class="page-item"><a class="page-link">99</a></li>
        <li class="page-item"><a class="page-link">100</a></li>
        <li class="page-item"><a class="page-link">Next →</a></li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import '@/assets/styles/pages/ListPage.css';
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const products = ref([
  {
    id: 1,
    title: 'Smartphone',
    description: 'Latest Android smartphone.',
    price: 799,
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: 2,
    title: 'Earbuds',
    description: 'Noise cancelling wireless earbuds.',
    price: 149,
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: 3,
    title: 'Laptop',
    description: 'Powerful laptop for work and play.',
    price: 1299,
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: 4,
    title: 'Smartwatch',
    description: 'Track your health and notifications.',
    price: 199,
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: 5,
    title: 'E-book Reader',
    description: 'Read books on the go.',
    price: 99,
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: 6,
    title: 'Bluetooth Speaker',
    description: 'High quality sound anywhere.',
    price: 89,
    imageUrl: 'https://via.placeholder.com/150'
  }
])

const router = useRouter()

function goToDetail(productId) {
  router.push({ name: 'ProductDetail', params: { id: productId } })
}
</script>
