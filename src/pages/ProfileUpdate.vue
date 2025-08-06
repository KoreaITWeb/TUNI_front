<template>
    <div class="register-main">
      <div class="register-form">
        <h2>Edit Profile</h2>
        <form @submit.prevent="submitProfileUpdate">
          <label for="nickname">Nickname</label>
          <input
            id="nickname"
            v-model="nickname"
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
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import '@/assets/styles/pages/RegisterForm.css'
  import { useRouter } from 'vue-router'
  import api from '@/api'
  import { useAuthStore } from '@/stores/auth'
  import axios from 'axios'

  const authStore = useAuthStore()
  const router = useRouter()
  
  const nickname = ref('')
  const profileImg = ref(null)
  const previewImg = ref('')
  const isLoading = ref(false)
  const fetchProfileImage = async (userId) => {
    try {
        const token = authStore.accessToken
        const res = await axios.get(`/api/mypage/${userId}/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
        })
        if (res.data) {
        previewImg.value = URL.createObjectURL(res.data)
        } else {
        previewImg.value = ''  // 기본 이미지 경로 넣어도 됨
        }
    } catch (err) {
        console.error('프로필 이미지 불러오기 실패:', err)
        previewImg.value = ''  // 기본 이미지 경로 넣어도 됨
    }
  }
  onMounted(() => {
    nickname.value = authStore.userId || ''
    if (authStore.userId) {
        fetchProfileImage(authStore.userId)
    }
  })

  // 이미지 파일 선택 시 처리
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
  
  // 프로필 수정 제출
  const submitProfileUpdate = async () => {
    if (!nickname.value.trim()) {
        alert('닉네임을 입력해주세요.')
        return
    }

    try {
        isLoading.value = true

        console.log('✅ 입력한 닉네임:', nickname.value)
        console.log('✅ 기존 유저 ID:', authStore.userId)

        // 닉네임 중복 체크
        if (nickname.value.trim() !== authStore.userId) {
        const checkRes = await api.get('/api/auth/check-nickname', {
            params: { nickname: nickname.value.trim() }
        })

        console.log('✅ 닉네임 중복 체크 결과:', checkRes.data)

        if (!checkRes.data.available) {
            alert('이미 사용 중인 닉네임입니다.')
            return
        }
    }

    const formData = new FormData()
    
    formData.append('userId', nickname.value.trim())
    if (profileImg.value) {
      formData.append('profileImg', profileImg.value)
      console.log('✅ 업로드할 이미지 파일:', profileImg.value)
    }

    console.log('✅ 최종 formData:', formData)

    // 실제 요청
    const updateRes = await api.put(`/api/mypage/${authStore.userId}/update`, formData)

    console.log('✅ 응답 결과:', updateRes.data)

    if (updateRes.data) {
      alert('프로필이 수정되었습니다!')
      router.push('/main')
    } else {
      alert('프로필 수정 중 오류가 발생했습니다.')
    }
  } catch (err) {
    console.error('❌ 프로필 수정 실패:', err)
    alert(err.response?.data?.message || '프로필 수정 중 문제가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}

  </script>
  