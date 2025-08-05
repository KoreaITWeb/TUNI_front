<template>
  <div class="shop-container">
    <div class="row">
      <!-- 왼쪽 필터 영역 -->
      <div class="col-md-3 border-end">
        <h5>Category</h5>
        <div class="mb-2">
          <span
            v-for="category in selectedCategories"
            :key="category"
            class="badge bg-secondary me-1"
            style="cursor: pointer"
            @click="removeCategory(category)"
          >
            {{ category }} ✕
          </span>
        </div>

        <div
          class="form-check"
          v-for="category in allCategories"
          :key="category"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :id="category"
            :value="category"
            :checked="selectedCategories.includes(category)"
            @change="toggleCategory(category)"
          >
          <label class="form-check-label" :for="category">{{ category }}</label>
        </div>

  <label class="form-label mt-3">Price</label>

  <div class="d-flex gap-2">
  <input
    type="number"
    class="form-control"
    placeholder="Min"
    v-model="minPrice"
  >
  <span>~</span>
  <input
    type="number"
    class="form-control"
    placeholder="Max"
    v-model="maxPrice"
  >
</div>
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
          <div v-if="filteredProducts.length === 0" class="text-center mt-5">
            <p>등록된 상품이 없습니다.</p>
          </div>
          <div
             v-else
             class="product-card"
             style="width: 12rem; cursor:pointer;"
             v-for="product in paginatedProducts"
             :key="product.boardId"
             @click="goToDetail(product.boardId)"
          >
            <img :src="product.thumbnailUrl || '../../placeholder.svg'" alt="상품 이미지" class="product-image"/> 
            <div class="card-body">
              <h6 class="card-title">{{ product.title }}</h6>
              <p class="card-text text-truncate">{{ product.content }}</p> 
              <p class="card-text fw-bold">$ {{ product.price }}</p>
            </div>
          </div>
        </div>
        <nav class="mt-4" style="display: flex; justify-content: center;">
          <ul class="pagination">
            <li
              class="page-item"
              :class="{ disabled: currentPage === 1 }"
              @click="goToPage(currentPage - 1)"
            >
              <a class="page-link" style="cursor:pointer;">← Previous</a>
            </li>

            <li
              class="page-item"
              v-for="page in totalPages"
              :key="page"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              <a class="page-link" style="cursor:pointer;">{{ page }}</a>
            </li>

            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages }"
              @click="goToPage(currentPage + 1)"
            >
              <a class="page-link" style="cursor:pointer;">Next →</a>
            </li>
          </ul>
        </nav>


      </div>
    </div>
  </div>
</template>

<script setup>
import '@/assets/styles/pages/ListPage.css';
import api from '@/api';
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia';

const minPrice = ref('');
const maxPrice = ref('');
const router = useRouter();
// API 응답 데이터를 저장할 반응형 변수들
const products = ref([]);
const user = ref(null);
const isLoading = ref(true);
const error = ref(null);
const allCategories = [
  'Electronics', 'Books', 'Clothings', 'Home & kitchen', 'Shoes', 'Beauty', 'Hobby'
];
const selectedCategories = ref([]);
const currentPage = ref(1);
const itemsPerPage = 12;

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage);
});

// 토큰 관련
const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore);

const filteredProducts = computed(() => {
  return products.value.filter(product => {
    console.log(`--- Checking Product ID: ${product.boardId} ---`);
    console.log(`DB Category: "${product.category}" vs Selected:`, selectedCategories.value);
    console.log(`DB Price: "${product.price}" vs Filter Range: ${minPrice.value}-${maxPrice.value}`);
    
    // 카테고리 조건
    const categoryMatch =
      selectedCategories.value.length === 0 ||
      selectedCategories.value.includes(product.category);

    // 가격 조건
    const price = Number(product.price);
    const min = Number(minPrice.value);
    const max = Number(maxPrice.value);
    const minOk = !minPrice.value || price >= min;
    const maxOk = !maxPrice.value || price <= max;

    return categoryMatch && minOk && maxOk;
  });
});

// 필터 조건이 변경될 때마다 현재 페이지를 1로 리셋합니다.
watch([selectedCategories, minPrice, maxPrice], () => {
  currentPage.value = 1;
});

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

    const requestData = {
      userId: currentUserId,
      schoolId: currentSchoolId
    };

    const response = await api.post('/board/list', requestData);
    
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
  router.push(`/details/${boardId}`);
};

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

function toggleCategory(category) {
  const index = selectedCategories.value.indexOf(category);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(category);
  }
};

function removeCategory(category) {
  selectedCategories.value = selectedCategories.value.filter(c => c !== category);
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