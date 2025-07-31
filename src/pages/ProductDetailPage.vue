<template>
  <div class="bg-gray-50 min-h-screen py-12">
    <div class="container max-w-5xl mx-auto px-4">
      
      <div v-if="isLoading">불러오는 중...</div>
      <div v-else-if="error">{{ error }}</div>
      
      <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        <div class="image-gallery">
          <div class="main-image-wrapper mb-4 rounded-lg overflow-hidden shadow-lg">
            <img :src="mainImage" :alt="product.title" class="w-full h-full object-cover">
          </div>
          <div class="thumbnail-list grid grid-cols-5 gap-3">
            <div
              v-for="image in images"
              :key="image.uuid"
              class="thumbnail-wrapper rounded cursor-pointer overflow-hidden border-2"
              :class="mainImage.includes(image.uuid) ? 'border-blue-500' : 'border-transparent'"
              @click="changeMainImage(`/images/display?fileName=${image.uploadPath}/${image.uuid}_${image.fileName}`)"
            >
              <img :src="`/images/display?fileName=${image.uploadPath}/s_${image.uuid}_${image.fileName}`" :alt="image.fileName" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

        <div class="product-details flex flex-col">
          <div v-if="seller" class="seller-info flex items-center mb-4">
            <img src="https://via.placeholder.com/40" alt="판매자 프로필" class="w-10 h-10 rounded-full mr-3">
            <div>
              <p class="font-bold text-gray-800">{{ seller.nickname }}</p>
              <p class="text-sm text-gray-500">{{ seller.universityName }}</p> </div>
          </div>
          <hr class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ product.title }}</h1>
          <p class="text-2xl font-semibold text-gray-800 mb-4">{{ product.price }}원</p>
          <div class="mb-6">
            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">판매중</span>
          </div>
          <div class="description flex-grow mb-6">
            <h5 class="font-bold text-lg mb-2">상품 설명</h5>
            <p class="text-gray-600 leading-relaxed whitespace-pre-wrap">{{ product.content }}</p>
          </div>
          <div class="action-buttons flex gap-4">
            <button class="flex-1 btn btn-outline-danger">❤️ 찜하기</button>
            <button class="flex-1 btn btn-dark">채팅하기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const productId = ref(null);

// API로부터 받아온 데이터를 저장할 상태 변수
const product = ref(null);
const seller = ref(null);
const images = ref([]);
const mainImage = ref(''); // 큰 대표 이미지 URL
const isLoading = ref(true);
const error = ref(null);

// 썸네일을 클릭했을 때 메인 이미지를 변경하는 함수
function changeMainImage(imageUrl) {
  mainImage.value = imageUrl;
}

// 백엔드 API를 호출하는 함수
async function fetchProductDetails(id) {
  try {
    const response = await axios.get(`/board/${id}`);
    const data = response.data;
    
    product.value = data.board;
    seller.value = data.user;
    images.value = data.images;

    // 첫 번째 이미지를 메인 이미지로 설정
    if (images.value && images.value.length > 0) {
      // 대표 이미지(isRepresentative)가 있다면 그것을, 없다면 첫 번째 이미지를 메인으로
      const representativeImage = images.value.find(img => img.representative) || images.value[0];
      mainImage.value = `/images/display?fileName=${representativeImage.uploadPath}/${representativeImage.uuid}_${representativeImage.fileName}`;
    }

  } catch (err) {
    console.error('상품 상세 정보 로딩 실패:', err);
    error.value = err.response?.data?.message || '상품 정보를 불러올 수 없습니다.';
  } finally {
    isLoading.value = false;
  }
}

// 컴포넌트가 마운트될 때 URL의 ID로 데이터를 가져옵니다.
onMounted(() => {
  productId.value = route.params.id;
  fetchProductDetails(productId.value);
});
</script>

<style scoped>
.main-image-wrapper {
  height: 400px; /* 메인 이미지 높이 고정 */
}
.thumbnail-wrapper {
  height: 80px; /* 썸네일 이미지 높이 고정 */
}
</style>