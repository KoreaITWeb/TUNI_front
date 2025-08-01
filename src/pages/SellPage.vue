<template>
  <div class="container max-w-2xl mx-auto my-16 p-8 border rounded-lg bg-white shadow-md">
    <form @submit.prevent="submitItem">
      <h3 class="text-2xl font-bold mb-6">{{ isEditMode ? 'Update Item' : 'Upload Item' }}</h3>

      <div class="space-y-4">
        <div>
          <label for="title" class="form-label font-semibold">Item Name</label>
          <input v-model="title" id="title" placeholder="제목" class="form-control" required/>
        </div>

        <div>
          <label for="category" class="form-label font-semibold">Category</label>
          <select v-model="category" id="category" class="form-select" required>
            <option value="" disabled>-- 카테고리를 선택하세요 --</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <div>
          <label for="price" class="form-label font-semibold">Price</label>
          <input v-model="price" id="price" placeholder="가격" type="number" class="form-control" required/>
        </div>
        
        <div>
          <label for="content" class="form-label font-semibold">Description</label>
          <textarea v-model="content" id="content" placeholder="설명" class="form-control" rows="4" required></textarea>
        </div>
        
        <div v-if="!isEditMode">
          <label for="photo" class="form-label font-semibold">Photo</label>
          <input type="file" @change="handleFileUpload" multiple accept="image/*" class="form-control"/>
        

          <p v-if="previewImages.length > 0" class="text-sm text-gray-500">
            대표 이미지로 사용할 사진을 클릭하세요.
          </p>

          <div v-if="previewImages.length > 0" class="flex flex-wrap gap-4 mt-2">
            <div
              v-for="(image, index) in previewImages"
              :key="index"
              class="relative cursor-pointer border-3 rounded-lg overflow-hidden transition-all"
              :class="index === representativeIndex ? 'border-blue-500' : 'border-transparent'"
              @click="setRepresentative(index)"
            >
              <img :src="image.url" class="w-24 h-24 object-cover block" alt="미리보기 이미지"/>
              <div 
                v-if="index === representativeIndex"
                class="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                ✓
              </div>
            </div>
          </div>  
        </div>
        <div v-else class="p-4 bg-gray-100 rounded-md text-sm text-gray-600">
          이미지 수정 기능은 현재 지원되지 않습니다.
        </div>
      </div>

      <button type="submit" class="btn btn-dark w-full mt-6 py-2.5">Upload Item</button>
    </form>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore)
const router = useRouter()
const route = useRoute()

// 수정 모드인지 판별하는 computed 속성
const productId = ref(route.params.id || null)
const isEditMode = computed(() => !!productId.value)

// --- 폼 데이터 상태 ---
const title = ref('')
const price = ref('')
const content = ref('')
const category = ref(''); // 선택된 카테고리를 저장할 변수
const categories = ref([
  'Electronics', 'Books', 'Clothings', 'Home & kitchen', 
  'shoes', 'Beauty', 'Hobby'
]);
const selectedFiles = ref([])
const previewImages = ref([])
const representativeIndex = ref(0); // 대표 사진 저장할 변수

// 수정 모드일 때 기존 데이터를 불러오는 함수
async function fetchProductForEdit() {
  if (!isEditMode.value) return;
  try {
    const response = await axios.get(`/board/${productId.value}`);
    const product = response.data.board;
    
    // 폼 상태를 불러온 데이터로 채움
    title.value = product.title;
    price.value = product.price;
    content.value = product.content;
    category.value = product.category;

  } catch (err) {
    console.error('상품 정보 로딩 실패:', err);
    alert('기존 상품 정보를 불러오는 데 실패했습니다.');
    router.push('/shop');
  }
}

onMounted(() => {
  if (!isLogin.value) {
    alert('로그인 후 이용가능합니다.');
    router.push('/login');
  }
  fetchProductForEdit();
});

function setRepresentative(index) {
  representativeIndex.value = index;
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (!files) return;

  selectedFiles.value = Array.from(files);
  previewImages.value = [];
  
  for (const file of selectedFiles.value) {
    previewImages.value.push({
      url: URL.createObjectURL(file),
      file: file
    });
  }
  representativeIndex.value = 0;
}

async function submitItem() {
  if (isEditMode.value) {
    // --- 수정 로직 ---
    try {
      await axios.post('/board/update', {
        boardId: productId.value,
        title: title.value,
        price: price.value,
        content: content.value,
        category: category.value,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      alert('상품 수정을 완료하였습니다.');
      router.push(`/details/${productId.value}`); // 수정 후 상세 페이지로 이동
    } catch (err) {
      console.error('상품 수정 실패:', err);
      alert('상품 수정에 실패하였습니다.');
    }
  }
  else{
    if (!title.value || !category.value || !price.value || !content.value) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const boardResponse = await axios.post('/board/register', {
        title: title.value,
        category: category.value,
        price: price.value,
        content: content.value,
        userId: userId.value,
        schoolId: schoolId.value,
      });

      const newBoardId = boardResponse.data.boardId;

      if (!newBoardId) {
        throw new Error('게시물 ID를 받아오지 못했습니다.');
      }

      if (selectedFiles.value.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append('boardId', newBoardId);
        const representativeFileName = selectedFiles.value[representativeIndex.value].name;
        imageFormData.append('representativeFileName', representativeFileName);
        
        selectedFiles.value.forEach(file => {
          imageFormData.append('uploadFile', file);
        });
        
        await axios.post('/images/upload', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert('상품 등록을 완료하였습니다.');
      router.push('/shop');

    } catch (err) {
      console.log('상품등록 실패:', err);
      alert('상품 등록 실패하였습니다.');
    }
  }
}
</script>