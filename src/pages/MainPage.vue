<template>
<<<<<<< HEAD
  <div class="page-container">
    <!-- 왼쪽 사이드바 공간 확보 -->
    <aside class="sidebar">
      <!-- 사이드바 내용 예시 -->
      <p>카테고리</p>
    </aside>

    <!-- 카드 영역 -->
    <div class="card-container">
      <div class="card" v-for="i in 6" :key="i">
        <img src="#" class="card-img-top" alt="#">
        <div class="card-body">
          <h5 class="card-title">Card title</h5>
          <p class="card-text">Some quick example text...</p>
          <a href="#" class="btn btn-primary">Go somewhere</a>
        </div>
=======
  <div class="container-fluid">
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
        <div class="d-flex flex-wrap gap-3">
          <div
            class="card"
            style="width: 12rem; cursor:pointer;"
            v-for="product in products"
            :key="product.id"
            @click="goToDetail(product.id)"
          >
            <img :src="product.imageUrl" class="card-img-top" alt="상품 이미지" />
            <div class="card-body">
              <h6 class="card-title">{{ product.title }}</h6>
              <p class="card-text text-truncate">{{ product.description }}</p>
              <p class="card-text fw-bold">{{ product.price }}원</p>
            </div>
          </div>
        </div>
        <!-- 에러 해결 -->
        <!-- 페이지네이션 -->
        <nav class="mt-4">
          <ul class="pagination justify-content-center">
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
>>>>>>> d635fa86cf9c4fbe9313d74e7e94d784fe61b242
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  padding: 20px;
}

/* 사이드바 */
.sidebar {
  width: 200px;
  margin-right: 20px;
}

/* 카드 영역 */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
  gap: 16px;
  flex: 1;
}

/* 카드 */
.card {
  width: 100%;
  box-sizing: border-box;
}
</style>

<script>
//import { fetchProducts } from '@/api/product'; 

export default {
  name: 'MainPage',
  data() {
    return {
      products: []
    }
  },
  /*
  mounted() {
    fetchProducts()
      .then(data => {
        this.products = data;
      });
  },
  */
  methods: {
    goToDetail(productId) {
      this.$router.push({ name: 'ProductDetail', params: { id: productId } });
    }
  }
}
</script>

<style scoped>
.card img {
  height: 150px;
  object-fit: cover;
}
.card {
  transition: box-shadow 0.2s;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.16);
}
</style>
