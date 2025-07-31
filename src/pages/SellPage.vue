<template>
  <div class="sell-page-container">
    <form class="upload-form">
      <h3>Upload Item</h3>

      <label>Item Name</label>
      <input v-model="title" placeholder="제목" class="form-control" required/>

      <label>Price</label>
      <input v-model="price" placeholder="가격" type="number" class="form-control" required/>

      <label>Description</label>
      <textarea v-model="content" placeholder="설명" class="form-control" required></textarea>

      <label>Photo</label>
      <input type="file" @change="handleFileUpload" multiple accept="image/*" class="form-control"/>

      <div v-if="previewImages.length > 0" class="image-preview">
        <div v-for="(image, index) in previewImages" :key="index" class="preview-item">
          <img :src="image" alt="미리보기 이미지"/>
        </div>
      </div>

      <button type="button" @click="submitItem">Upload Item</button>
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

onMounted(() => {
  if (!isLogin) {
    alert('로그인 후 이용가능합니다.');
    router.push('/login');
  }
});

// 파일이 선택되었을 때 실행되는 함수
function handleFileUpload(event) {
  const files = event.target.files;
  if (!files) return;

  selectedFiles.value = Array.from(files);
  
  // 기존 미리보기 이미지 초기화
  previewImages.value = [];
  
  // 선택된 각 파일에 대해 미리보기 URL 생성
  for (const file of selectedFiles.value) {
    previewImages.value.push(URL.createObjectURL(file));
  }
}

async function submitItem() {
  if (!title.value || !price.value || !content.value) {
    alert('모든 필드를 입력해주세요.');
    return;
  }

  try {
    // --- 텍스트 정보 등록하여 상품 등록 및 boardId 받아오기 ---
    const response = await axios.post('/board/register', {
          title: title.value,
          price: price.value,
          content: content.value,
          userId: userId.value,
          schoolId: schoolId.value,
    });

    const newBoardId = response.data.boardId;

    if (!newBoardId) {
      throw new Error('게시물 ID를 받아오지 못했습니다.');
    }

    // --- 받아온 boardId와 함께 이미지 파일 업로드 ---
    if (selectedFiles.value.length > 0) {
      const imageFormData = new FormData();
      imageFormData.append('boardId', newBoardId);
      
      selectedFiles.value.forEach(file => {
        imageFormData.append('uploadFile', file);
      });
      
      // 이미지 업로드 API 호출
      await axios.post('/images/upload', imageFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    alert('상품 등록을 완료하였습니다.');
    router.push('/shop');

  } catch (err) {
    console.log('상품등록 실패:', err);
    alert('상품 등록 실패하였습니다.');
    router.push('/sell');
  }
}
</script>

<style scoped>
.sell-page-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-form h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.upload-form input,
.upload-form textarea {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.upload-form button {
  background-color: black;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.image-preview {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
}
.preview-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
