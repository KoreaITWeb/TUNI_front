<template>
  <div class="login-page">
    <main class="login-main">
      <form class="login-form" @submit.prevent="onButtonClick">

        <!-- ✅ 1. 대학교 선택 -->
        <label for="university">대학교 선택</label>
        <select id="university" v-model="universityId" required :disabled="showCodeInput">
          <option value="">-- 대학교를 선택하세요 --</option>
          <option
            v-for="uni in universities"
            :key="uni.schoolId"
            :value="uni.schoolId"
          >
            {{ uni.name }}
          </option>
        </select>

        <!-- ✅ 2. 이메일 입력 -->
        <label for="email">E-mail</label>
        <input
        type="email"
        id="email"
        v-model="email"
        placeholder="Enter your email"
        required
        :disabled="showCodeInput"
        />
        <!-- 코드 입력 후 이메일 수정 막기 -->

        <!-- 코드 입력창은 Send Code 누른 후에만 보임 -->
        <input
          v-if="showCodeInput"
          type="text"
          id="code"
          v-model="code"
          placeholder="Enter the code"
          required
          style="margin-top: 1rem;"
        />

        <!-- 버튼 하나, 텍스트는 상태에 따라 변경 -->
        <button type="submit" style="margin-top: 1rem;">
          {{ showCodeInput ? 'Verify Code' : 'Send Code' }}
        </button>
      </form>
    </main>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import '@/assets/styles/pages/LoginPage.css';
import axios from 'axios'
import { useRouter } from 'vue-router'
import { isLogin, userNickname } from '@/composables/useAuth'

const router = useRouter()

const email = ref('')
const code = ref('')
const showCodeInput = ref(false)
const universityId = ref('')           // 대학 선택
const universities = ref([])           // 대학 리스트

// 페이지 진입 시 학교 리스트 불러오기
onMounted(async () => {
  try {
    const response = await axios.get('/api/auth/universities') // 백엔드에서 학교 리스트 받기
    universities.value = response.data
  } catch (err) {
    console.error('학교 목록 불러오기 실패:', err)
    alert('학교 목록을 불러오는 데 실패했습니다.')
  }
})

async function onButtonClick() {
  if (!universityId.value) {
    alert('대학교를 선택해주세요.')
    return
  }

  if (!showCodeInput.value) {
    // 코드 전송
    try {
      const response = await axios.post('/api/auth/code/send', {
        email: email.value,
        universityId: universityId.value,
      })

      if (response.status === 200) {
        alert(`인증 코드가 ${email.value}로 전송되었습니다.`)
        showCodeInput.value = true
      }
    } catch (err) {
      console.error('코드 전송 실패:', err)
      alert(err.response?.data?.message || '코드 전송에 실패했습니다.')
    }
  } else {
    // 코드 인증
    try {
      const response = await axios.post('/api/auth/code/verify', {
        email: email.value,
        code: code.value,
        universityId: universityId.value,
      })

      const result = response.data

      if (result.isNewUser) {
        alert('신규 회원입니다. 닉네임 설정 페이지로 이동합니다.')
        router.push(`/register-form?email=${email.value}&code=${code.value}`)
      } else {
        alert('로그인 성공!')
        localStorage.setItem('accessToken', result.token.accessToken)
        localStorage.setItem('refreshToken', result.token.refreshToken)

        isLogin.value = true
        userNickname.value = result.nickname 
        router.push('/main')
      }
    } catch (err) {
      console.error('코드 인증 실패:', err)
      alert(err.response?.data?.message || '코드 인증에 실패했습니다.')
    }
  }
}
</script>




