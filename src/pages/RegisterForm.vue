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
import { useAuthStore } from '@/stores/auth'

// 토큰 관련
const authStore = useAuthStore()

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

    const response = await axios.get('/api/auth/check-nickname', {
      params: {
        nickname: nickname.value.trim(),
      },
    })

    console.log('중복 체크 결과:', response.data)

    if (!response.data.available) {
      alert('이미 사용 중인 닉네임입니다.')
      return
    }

    const response2 = await axios.post('/api/auth/register', {
        email: email,
        code: code,
        userId: nickname.value.trim(),
    })
    if (response2.data){
      alert('닉네임 설정이 완료되었습니다!')
      const result = response2.data
      authStore.login(result.token) 
      router.push('/main')
    } else {
      alert('계정 생성 도중 오류가 발생하였습니다')
    }

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
