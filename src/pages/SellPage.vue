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
      <input type="file" />

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

onMounted(() => {
  if (!isLogin) {
    alert('로그인 후 이용가능합니다.');
    router.push('/login');
  }
});

// function handleFileUpload(event) {
//   const file = event.target.files[0]
//   if (file) {
//     let imageUrl = URL.createObjectURL(file) // 임시 이미지 URL
//   }
// }


async function submitItem() {
  try {
    const response = await axios.post('/board/register', {
          title: title.value,
          price: price.value,
          content: content.value,
          userId: userId.value,
          schoolId: schoolId.value,
    });
    if (response.status === 200){
      alert('상품 등록을 완료하였습니다.');
      router.push('/shop');
    }
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

</style>
