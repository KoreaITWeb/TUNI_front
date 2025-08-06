<template>
  <div class="login-page">
    <main class="login-main">
      <form class="login-form" @submit.prevent="onButtonClick" novalidate>

        <!-- ✅ 1. 대학교 선택 -->
        <label for="university">University</label>
        <select id="university" v-model="universityId" :disabled="showCodeInput" required>
          <option value="">-- Select University --</option>
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
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
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
    alert('Failed to load university list.')
  }
})

async function onButtonClick() {
  if (!universityId.value) {
    alert('Please select your university.')
    return
  }
  if (!email.value) {
    alert('Please enter your email.')
    return
  }

  if (!showCodeInput.value) {
    // 코드 전송
    try {
      // console.log(universityId.value);
      const response = await axios.post('/api/auth/code/send', {
        email: email.value,
        universityId: universityId.value,
      })

      if (response.status === 200) {
        alert(`A verification code has been sent to ${email.value}.`)
        showCodeInput.value = true
      }
    } catch (err) {
      console.error('코드 전송 실패:', err)
      alert('Could not send verification code.')
    }
  } else {
    // 코드 인증
    if (!code.value) {
      alert('Please enter verification code.')
      return
    }
    try {
      const response = await axios.post('/api/auth/code/verify', {
        email: email.value,
        code: code.value,
        universityId: universityId.value,
      })

      const result = response.data

      if (result.isNewUser) {
        alert('Welcome! Redirecting to nickname setup.')
        router.push(`/register-form?email=${email.value}&code=${code.value}`)
      } else {
        // login 함수 호출하여 상태 업데이트 및 localStorage 저장
        authStore.login(result.token); 
        alert('Login successful!');
        router.push('/main');
      }
    } catch (err) {
      console.error('코드 인증 실패:', err)
      alert('Invalid code. Please check and try again. ')
    }
  }
}

</script>




