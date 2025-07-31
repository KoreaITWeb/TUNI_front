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

        <div v-if="isLoading" class="text-center mt-5">
          <p>상품 목록을 불러오는 중...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger mt-5">
          {{ error }}
        </div>

        <div v-else class="product-list">
          <div v-if="products.length === 0" class="text-center mt-5">
            <p>등록된 상품이 없습니다.</p>
          </div>
          <div
            v-else
            class="product-card"
            style="width: 12rem; cursor:pointer;"
            v-for="product in products"
            :key="product.boardId" @click="goToDetail(product.boardId)"
          >
            <img :src="product.thumbnailUrl ? product.thumbnailUrl : '/default-image.png'" alt="상품 이미지" class="product-image"/> 
            <div class="card-body">
              <h6 class="card-title">{{ product.title }}</h6>
              <p class="card-text text-truncate">{{ product.content }}</p> 
              <p class="card-text fw-bold">{{ product.price }}원</p>
            </div>
          </div>
        </div>
        <nav class="mt-4" style="display: flex; justify-content: center;">
          <ul class="pagination">
            <li class="page-item disabled"><a class="page-link">← Previous</a></li>
            <li class="page-item active"><a class="page-link">1</a></li>
            <li class="page-item"><a class="page-link">Next →</a></li>
          </ul>
        </nav>


      </div>
    </div>
  </div>
</template>

<script setup>
import '@/assets/styles/pages/ListPage.css';
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia';

const router = useRouter();

// API 응답 데이터를 저장할 반응형 변수들
const products = ref([]);
const user = ref(null);
const isLoading = ref(true);
const error = ref(null);

// 토큰 관련
const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore);

// 백엔드 API를 호출하여 상품 목록을 가져오는 함수
async function fetchProducts() {
  try {
    const currentIsLogin = isLogin.value;
    const currentUserId = userId.value;
    const currentSchoolId = schoolId.value;
    // console.log(currentUserId);
    // console.log(currentSchoolId);

    if (!currentIsLogin || !currentUserId || !currentSchoolId) {
      error.value = '로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.';
      isLoading.value = false;
      alert('로그인 후 이용가능합니다.');
      router.push('/login');
      return;
    }
    
    // schoolId = parseInt(schoolIdString, 10);

    const formData = new FormData();
    formData.append('userId', currentUserId);
    formData.append('schoolId', currentSchoolId);

    const response = await axios.post('/board/list', formData);
    
    if (response.data.success) {
      products.value = response.data.list;
      user.value = response.data.user;
    } else {
      throw new Error(response.data.message || '데이터 로딩 실패');
    }

  } catch (err) {
    console.error('상품 목록을 불러오는 중 에러 발생:', err);
    error.value = '상품 목록을 불러올 수 없습니다.';
  } finally {
    isLoading.value = false;
  }
}

// 상세 페이지로 이동하는 함수
function goToDetail(boardId) {
  router.push(`/product/${boardId}`);
}

// 컴포넌트가 화면에 마운트될 때 함수를 실행
onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
/* 이미지 크기를 카드에 맞게 조정하는 CSS 추가 */
.product-image {
    width: 100%;
    height: 120px; /* 원하는 높이로 조절 */
    object-fit: cover; /* 이미지가 비율을 유지하며 꽉 차게 */
}
</style>