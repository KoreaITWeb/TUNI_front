<template>
  <div class="register-main">
    <div class="register-form">
      <h2>Setting Nickname</h2>
      <form @submit.prevent="submitNickname">
        <label for="nickname">Nickname</label>
        <input
          id="nickname"
          v-model="nickname"
          placeholder="Enter your nickname"
          required
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Setting up...' : 'Complete' }}
        </button>
      </form>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import '@/assets/styles/pages/RegisterForm.css';
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const nickname = ref('')
const isLoading = ref(false)

const email = route.query.email
const code = route.query.code

const submitNickname = async () => {
  if (!nickname.value.trim()) {
    alert('닉네임을 입력해주세요.')
    return
  }

  try {
    isLoading.value = true
    const response = await axios.post('/api/auth/check-nickname', {
      email,
      code,
      nickname: nickname.value.trim(),
    })
    console.log(response.data)
    alert('닉네임 설정이 완료되었습니다!')
    router.push('/main')
  } catch (err) {
    console.error('닉네임 설정 실패:', err)
    alert(err.response?.data?.message || '닉네임 설정 중 문제가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!email || !code) {
    alert('잘못된 접근입니다.')
    router.push('/')
  }
})
</script>
