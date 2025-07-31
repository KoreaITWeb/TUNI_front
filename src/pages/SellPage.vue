<template>
  <div class="container max-w-2xl mx-auto my-16 p-8 border rounded-lg bg-white shadow-md">
    <form @submit.prevent="submitItem">
      <h3 class="text-2xl font-bold mb-6">Upload Item</h3>

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
        
        <div>
          <label for="photo" class="form-label font-semibold">Photo</label>
          <input type="file" @change="handleFileUpload" multiple accept="image/*" class="form-control"/>
        </div>

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

      <button type="submit" class="btn btn-dark w-full mt-6 py-2.5">Upload Item</button>
    </form>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore)
const router = useRouter()

const title = ref('')
const price = ref('')
const content = ref('')
const selectedFiles = ref([])
const previewImages = ref([])
const representativeIndex = ref(0); // 대표 사진 저장할 변수

const categories = ref([
  'Electronics', 'Books', 'Clothings', 'Home & kitchen', 
  'shoes', 'Beauty', 'Hobby'
]);
const category = ref(''); // 선택된 카테고리를 저장할 변수

onMounted(() => {
  if (!isLogin.value) {
    alert('로그인 후 이용가능합니다.');
    router.push('/login');
  }
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
</script>