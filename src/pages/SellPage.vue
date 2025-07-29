<template>
  <div class="sell-page-container">
    <form class="upload-form">
      <h3>Upload Item</h3>

      <label>Item Name</label>
      <input v-model="item.title" placeholder="상품명" class="form-control" />

      <label>Price</label>
      <input v-model="item.price" placeholder="가격" type="number" class="form-control" />

      <label>Description</label>
      <textarea v-model="item.description" placeholder="설명" class="form-control"></textarea>

      <label>Photo</label>
      <input type="file" @change="handleFileUpload" />

      <button type="button" @click="submitItem">Upload Item</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useProductStore } from '@/store/productStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const productStore = useProductStore()

const item = ref({
  title: '',
  price: '',
  description: '',
  imageUrl: ''
})

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    item.value.imageUrl = URL.createObjectURL(file) // 임시 이미지 URL
  }
}


function submitItem() {
  if (!item.value.title.trim() || !item.value.price) {
    alert('이름과 가격을 입력하세요')
    return
  }

  productStore.addProduct({ ...item.value })
  router.push('/shop')
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
