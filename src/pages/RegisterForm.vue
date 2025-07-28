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
import { isLogin, userNickname } from '@/composables/useAuth'

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

    // 닉네임 직접 저장 (서버가 따로 주지 않으므로)
    userNickname.value = nickname.value.trim()
    isLogin.value = true

    // 로컬스토리지 저장
    localStorage.setItem('nickname', userNickname.value)
    // 토큰은 로그인 완료 시 받은 걸 사용하세요.
    // localStorage.setItem('token', '받은 토큰')

    alert('닉네임 설정이 완료되었습니다!')
    const response2 = await axios.post('/api/auth/register', {
        email: email,
        code: code,
        userId: nickname.value.trim(),
    })
    if (response2.data){
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
