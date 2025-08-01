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
          <div v-if="seller" class="mb-4">
            <p class="font-bold text-gray-800">{{ seller.userId }}</p>
          </div>
          <hr class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ product.title }}</h1>
          <p class="text-2xl font-semibold text-gray-800 mb-4">$ {{ product.price }}</p>

          <div class="mb-6">
            <div v-if="isOwner">
              <select 
                v-model="product.saleStatus" 
                @change="updateStatus"
                class="inline-block rounded-full px-3 py-1 text-sm font-semibold cursor-pointer"
                :class="{ 
                  'bg-green-200 text-green-800': product.saleStatus === 'SALE', 
                  'bg-gray-300 text-gray-800': product.saleStatus === 'SOLD' 
                }"
              >
                <option class="bg-white text-black" value="SALE">판매중</option>
                <option class="bg-white text-black" value="SOLD">판매완료</option>
              </select>
            </div>

            <div v-else>
              <span
                class="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                :class="{ 
                  'bg-green-200 text-green-800': product.saleStatus === 'SALE', 
                  'bg-gray-300 text-gray-800': product.saleStatus === 'SOLD' 
                }"
              >
                {{ product.saleStatus === 'SALE' ? '판매중' : '판매완료' }}
              </span>
            </div>
          </div>

          <div class="description flex-grow mb-6">
            <h5 class="font-bold text-lg mb-2">상품 설명</h5>
            <p class="text-gray-600 leading-relaxed whitespace-pre-wrap">{{ product.content }}</p>
          </div>
          <div class="flex justify-end items-center gap-2 mb-2 text-xs text-gray-500">
            <p>좋아요 {{ likeCount }}</p>
            <span class="text-gray-400">&middot;</span>
            <p>조회수 {{ product.views }}</p>
          </div>
          <hr>
          <div class="action-buttons flex gap-4 mt-auto pt-6">
            <template v-if="isOwner">
                <button @click="editProduct" class="flex-1 btn btn-secondary">
                    수정하기
                </button>
                <button @click="deleteProduct" class="flex-1 btn btn-danger">
                    삭제하기
                </button>
            </template>
            
            <template v-else>
                <button
                  @click="toggleLike"
                  class="flex-1 btn flex items-center justify-center gap-2 whitespace-nowrap py-2 px-4"
                  :class="isLikedByUser ? 'btn-danger' : 'btn-outline-danger'"
                >
                  <span>❤️</span>
                  <span class="font-semibold">좋아요</span>
                </button>
                <button class="flex-1 btn btn-dark py-2 px-4">
                  채팅하기
                </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter()
const productId = ref(null);

// API로부터 받아온 데이터를 저장할 상태 변수
const product = ref(null);
const seller = ref(null);
const images = ref([]);
const mainImage = ref(''); // 큰 대표 이미지 URL
const isLoading = ref(true);
const error = ref(null);
const likeCount = ref(0);
const isLikedByUser = ref(false); // 현재 사용자가 이 글에 좋아요를 눌렀는지 여부

// --- Pinia 스토어에서 로그인 정보 가져오기 ---
const authStore = useAuthStore();
const { userId: loggedInUserId } = storeToRefs(authStore);

// 현재 사용자가 판매자인지 확인하는 computed 속성
const isOwner = computed(() => {
  // seller 정보와 로그인한 사용자 ID가 모두 존재하고, 두 ID가 일치하는지 확인
  console.log(seller.value);
  console.log(loggedInUserId.value);
  console.log('판매자 ID 타입:', typeof seller.value);       // "number"
  console.log('로그인 ID 타입:', typeof loggedInUserId.value);
  console.log(String(seller.value) == String(loggedInUserId.value));
  return seller.value && loggedInUserId.value && String(seller.value) === String(loggedInUserId.value);
});

// 수정 페이지로 이동하는 함수
function editProduct() {
  router.push(`/product/edit/${productId.value}`);
}

// 상품을 삭제하는 함수
async function deleteProduct() {
  if (!isOwner.value) return; // 주인이 아니면 실행 방지

  if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
    try {
      // 백엔드에 DELETE 요청 보내기 (API 경로는 예시입니다)
      await axios.delete(`/board/${productId.value}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      alert('상품이 삭제되었습니다.');
      router.push('/shop'); // 삭제 후 목록 페이지로 이동
    } catch (err) {
      console.error('상품 삭제 실패:', err);
      alert('상품 삭제에 실패했습니다.');
    }
  }
}

// 썸네일을 클릭했을 때 메인 이미지를 변경하는 함수
function changeMainImage(imageUrl) {
  mainImage.value = imageUrl;
}

// 백엔드 API를 호출하는 함수
async function fetchProductDetails(id) {
  try {
    const response = await axios.get(`/board/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    const data = response.data;
    
    product.value = data.board;
    seller.value = data.board.userId;
    images.value = data.images;
    likeCount.value = response.data.board.likes;
    isLikedByUser.value = response.data.isLikedByUser;

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

// Sale 상태 변경 함수
async function updateStatus() {
  if (!isOwner.value) return; // 주인이 아니면 실행 방지

  try {
    const newStatus = product.value.saleStatus;
    // JWT 토큰을 헤더에 담아 PATCH 요청 전송
    await axios.patch(`/board/${productId.value}/status`, 
      { saleStatus: newStatus },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    alert('판매 상태가 변경되었습니다.');
  } catch (err) {
    console.error('상태 변경 실패:', err);
    alert(err.response?.data?.message || '상태 변경에 실패했습니다.');
    // 실패 시, 화면의 상태를 원래대로 되돌리기 위해 페이지를 새로고침
    location.reload();
  }
}

// 좋아요 버튼 클릭 시 실행될 함수
async function toggleLike() {
  // (Optimistic Update) 서버 응답을 기다리지 않고 UI를 즉시 변경
  isLikedByUser.value = !isLikedByUser.value;
  likeCount.value += isLikedByUser.value ? 1 : -1;

  try {
    // 백엔드에 좋아요/취소 요청
    await axios.post(`/board/${productId.value}/like`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
  } catch (err) {
    console.error('좋아요 처리 실패:', err);
    // 실패 시 UI를 원래 상태로 되돌림
    alert('요청에 실패했습니다.');
    isLikedByUser.value = !isLikedByUser.value;
    likeCount.value += isLikedByUser.value ? 1 : -1;
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