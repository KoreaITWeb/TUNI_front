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
        <label for="profileImg">Profile Image</label>
        <input
          id="profileImg"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />
        <!-- 이미지 미리보기 -->
        <div v-if="previewImg">
          <img :src="previewImg" alt="Preview" style="max-width: 150px; margin-top: 10px;" />
        </div>
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
import api from '@/api';
import { useAuthStore } from '@/stores/auth'

// 토큰 관련
const authStore = useAuthStore()

const route = useRoute()
const router = useRouter()
const nickname = ref('')
const profileImg = ref(null)
const previewImg = ref(null)
const isLoading = ref(false)

const email = route.query.email
const code = route.query.code

// 파일 선택 시 호출
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.')
    return
  }

  profileImg.value = file
  previewImg.value = URL.createObjectURL(file)
}

const submitNickname = async () => {
  if (!nickname.value.trim()) {
    alert('닉네임을 입력해주세요.')
    return
  }

  try {
    isLoading.value = true

    const response = await api.get('/api/auth/check-nickname', {
      params: {
        nickname: nickname.value.trim(),
      },
    })

    console.log('중복 체크 결과:', response.data)

    if (!response.data.available) {
      alert('이미 사용 중인 닉네임입니다.')
      return
    }

    // FormData 생성 (multipart/form-data)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('code', code)
    formData.append('userId', nickname.value.trim())
    if (profileImg.value) {
      formData.append('profileImg', profileImg.value)
    }

    // 회원가입 API 호출
    const response2 = await api.post('/api/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
