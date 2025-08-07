<template>
  <div class="shop-container">
    <div class="row">
      <div class="col-md-3 border-end" style="margin-top: 5rem;">
        <div class="side-nav-categories">
          <div class="title"><strong>CATEGORY</strong></div>
          <div class="category-content px-3 pb-3">
            <div class="mb-2">
              <span
                v-for="category in selectedCategories"
                :key="category"
                class="badge bg-dark me-1"
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
              <input type="number" class="form-control" placeholder="Min" v-model="minPrice">
              <span>~</span>
              <input type="number" class="form-control" placeholder="Max" v-model="maxPrice">
            </div>
            <h5 class="mt-4">Status</h5>
            <div
              class="form-check"
              v-for="status in allStatus"
              :key="status"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :id="status"
                :value="status"
                :checked="selectedStatuses.includes(status)"
                @change="toggleStatus(status)"
              >
              <label class="form-check-label" :for="status">{{ status }}</label>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-9">
        <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
          <div class="input-group w-50">
            <div class="dropdown me-2">
              <button class="btn btn-primary dropdown-toggle" type="button" id="searchTypeDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                {{ searchTypeLabel }}
              </button>
              <ul class="dropdown-menu" aria-labelledby="searchTypeDropdown">
                <li v-for="(label, key) in searchOptions" :key="key">
                  <a class="dropdown-item" href="#" @click="selectSearchType(key)">{{ label }}</a>
                </li>
              </ul>
            </div>
            <input type="text" class="form-control" placeholder="Search" v-model="tempKeyword" @keyup.enter="onSearch">
            <button class="btn btn-outline-secondary" @click="onSearch"><Search class="w-5 h-5"/></button>
          </div>
          <div class="btn-group">
            <button
              class="btn"
              :class="sortOrder === 'recent' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="sortOrder = 'recent'"
            >
              Recently
            </button>
            <button
              class="btn"
              :class="sortOrder === 'asc' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="sortOrder = 'asc'"
            >
              Price ascending
            </button>
            <button
              class="btn"
              :class="sortOrder === 'desc' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="sortOrder = 'desc'"
            >
              Price descending
            </button>
          </div>
        </div>
        <div v-if="isLoading" class="text-center mt-5">
          <p>Loading Items...</p>
        </div>
        <div v-else-if="error" class="alert alert-danger mt-5">
          {{ error }}
        </div>
        <div v-else class="product-list">
          <div v-if="filteredProducts.length === 0" class="text-center mt-5">
            <p>No items listed yet.</p>
          </div>
          <div
            v-else
            class="product-card"
            style="width: 12rem; cursor:pointer;"
            v-for="product in paginatedProducts"
            :key="product.boardId"
            @click="goToDetail(product.boardId)"
          >
            <div v-if="product.saleStatus === 'SOLD'" class="sold-out-badge">SOLD OUT</div>
            <img :src="product.thumbnailUrl || '../../placeholder.svg'" alt="상품 이미지" class="product-image"/> 
            <div class="card-body">
              <h4 class="card-title">{{ product.title }}</h4>
              <p class="card-text fw-bold">$ {{ product.price }}</p>
              <p class="card-text text-muted" style="font-size: 0.8rem;">{{ timeSince(product.regdate) }}</p>
            </div>
          </div>
        </div>
        <nav aria-label="Page navigation" class="d-flex justify-content-center align-items-center mt-4 gap-3">
          <button
            class="btn btn-outline-primary"
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
          >
            ← Previous
          </button>
          <div class="d-flex align-items-center gap-2">
            <input
              type="number"
              v-model.number="inputPage"
              :min="1"
              :max="totalPages"
              class="form-control"
              style="width: 60px; text-align: center;"
              @keyup.enter="goToInputPage"
            />
            / {{ totalPages }}
          </div>
          <button
            class="btn btn-outline-primary"
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
          >
            Next →
          </button>
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
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Search} from 'lucide-vue-next';

const minPrice = ref('');
const maxPrice = ref('');
const router = useRouter();
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
const sortOrder = ref("recent");
const tempKeyword = ref("");
const searchKeyword = ref("");
const inputPage = ref(1);
const selectedStatuses = ref([]);
const allStatus = ['SALE','SOLD']

const searchType = ref('Title');
const searchOptions = {
  title: 'Title',
  content: 'Content',
  userid: 'Nickname'
};
const searchTypeLabel = computed(() => searchOptions?.[searchType.value] || 'Title');

function selectSearchType(type) {
  searchType.value = type;
}

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  const total = Math.ceil(filteredProducts.value.length / itemsPerPage);
  return total > 0 ? total : 1;
});

const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore);

const sortedProducts = computed(() => {
  const sorted = [...filteredProducts.value];
  if (sortOrder.value === "asc") {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortOrder.value === "desc") {
    sorted.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortOrder.value === "recent") {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted;
});


const filteredProducts = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return products.value.filter(product => {
    const categoryMatch =
      selectedCategories.value.length === 0 ||
      selectedCategories.value.includes(product.category);
    const price = Number(product.price);
    const min = Number(minPrice.value);
    const max = Number(maxPrice.value);
    const minOk = !minPrice.value || price >= min;
    const maxOk = !maxPrice.value || price <= max;
    const statusMatch =
      selectedStatuses.value.length === 0 ||
      (product.saleStatus && selectedStatuses.value.includes(product.saleStatus));

    let keywordMatch = true;
    if (keyword !== "") {
      switch (searchType.value) {
        case 'title':
          keywordMatch = product.title?.toLowerCase().includes(keyword);
          break;
        case 'content':
          keywordMatch = product.content?.toLowerCase().includes(keyword);
          break;
        case 'userid':
          keywordMatch = (product.userId?.toLowerCase() || "").includes(keyword);
          break;
        default:
          keywordMatch = true;
      }
    }

    return categoryMatch && minOk && maxOk && keywordMatch && statusMatch;
  });
});

watch([selectedCategories, minPrice, maxPrice, selectedStatuses, searchType], () => {
  currentPage.value = 1;
});

watch(currentPage, (newPage) => {
  inputPage.value = newPage;
});

async function fetchProducts() {
  try {
    const currentIsLogin = isLogin.value;
    const currentUserId = userId.value;
    const currentSchoolId = schoolId.value;

    if (!currentIsLogin || !currentUserId || !currentSchoolId) {
      error.value = 'Your session has expired. Please log in again.';
      isLoading.value = false;
      alert('Please log in to continue.');
      router.push('/login');
      return;
    }

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
    error.value = 'Could not load product list.';
  } finally {
    isLoading.value = false;
  }
}

function goToDetail(boardId) {
  router.push(`/details/${boardId}`);
};

function onSearch() {
  searchKeyword.value = tempKeyword.value;
  currentPage.value = 1;
}

function goToInputPage() {
  if (inputPage.value >= 1 && inputPage.value <= totalPages.value) {
    currentPage.value = inputPage.value;
  } else {
    alert(`1부터 ${totalPages.value} 사이의 숫자를 입력해주세요.`);
  }
}

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

function toggleStatus(status) {
  if (selectedStatuses.value.includes(status)) {
    selectedStatuses.value = [];
  } else {
    selectedStatuses.value = [status];
  }
}

function timeSince(dateString) {
  const dbDate = new Date(dateString.replace(' ', 'T'));
  const now = new Date();
  const dateOnly = new Date(dbDate.getFullYear(), dbDate.getMonth(), dbDate.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffInDays = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays >= 365) {
    const years = now.getFullYear() - dbDate.getFullYear();
    const yearText = years === 1 ? 'year' : 'years';
    return `${years} ${yearText} ago`;
  }
  if (diffInDays >= 30) {
    let months = (now.getFullYear() - dbDate.getFullYear()) * 12;
    months -= dbDate.getMonth();
    months += now.getMonth();
    const monthText = months === 1 ? 'month' : 'months';
    return `${months} ${monthText} ago`;
  }
  if (diffInDays > 0) {
    const dayText = diffInDays === 1 ? 'day' : 'days';
    return `${diffInDays} ${dayText} ago`;
  }
  const diffInMilliseconds = now.getTime() - dbDate.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours > 0) {
    const hourText = diffInHours === 1 ? 'hour' : 'hours';
    return `${diffInHours} ${hourText} ago`;
  }
  const minutes = diffInMinutes > 0 ? diffInMinutes : 1;
  const minuteText = minutes === 1 ? 'minute' : 'minutes';
  return `${minutes} ${minuteText} ago`;
}

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}
.product-card {
  position: relative;
}
.sold-out-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
}
.custom-margin-top {
  margin-top: 5rem;
}
.badge.bg-dark {
  background-color: #000 !important;
  color: #fff !important;
  font-size: 0.7rem;
  padding: 0.5em 0.75em;
  border-radius: 999px;
}
.btn-primary {
  background-color: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}
.btn-primary:hover {
  background-color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}
.side-nav-categories {
  position: relative;
  background-color: #fff;
  border: 1px solid #eee;
  box-shadow: 0 5px 0 rgba(200, 200, 200, 0.2);
  margin-bottom: 30px;
  width: 100%;
}
.side-nav-categories .title {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 25px 10px 25px;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: #2563eb;
  position: relative;
  display: inline-block;
  margin-left: -10px;
  margin-top: 0;
}
.side-nav-categories .title::before {
  content: '\f0c9';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  margin-right: 10px;
}
.side-nav-categories .title::after {
  content: "";
  height: 1px;
  width: 1px;
  border-style: solid;
  border-width: 5px;
  position: absolute;
  bottom: -10px;
  left: 0;
  border-color: #1d4ed8 #1d4ed8 transparent transparent;
}
</style>