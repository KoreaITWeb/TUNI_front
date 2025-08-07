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
    const profileImg = ref('')
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
        previewImg.value = ''
        }
    } catch (err) {
        console.error('❌ 프로필 이미지 불러오기 실패:', err)
        previewImg.value = ''
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
        alert('Only image files can be uploaded.')
        return
    }

    profileImg.value = file
    previewImg.value = URL.createObjectURL(file)
    }

    const submitProfileUpdate = async () => {
    if (!nickname.value.trim()) {
      alert('Please enter a nickname.');
      return;
    }

    try {
      isLoading.value = true;

      // 1) 닉네임, 프로필 이미지 파일 FormData에 담기
      const formData = new FormData();
      formData.append('userId', nickname.value.trim());

      if (profileImg.value) {
        // 이미지 파일이 있으면 'profileImgFile' 키로 첨부
        formData.append('profileImgFile', profileImg.value);
      }

      // 2) 프로필 수정 API에 multipart/form-data 요청 보내기
      const updateRes = await api.put(
        `/api/mypage/${authStore.userId}/update`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      console.log('프로필 수정 API 응답:', updateRes.data);

      if (updateRes.data) {
        alert('Profile updated successfully!');
        authStore.login(updateRes.data);
        console.log('authStore.profileImg:', authStore.profileImg)
        router.push('/profile');
      } else {
        alert('An error occurred while updating your profile.');
      }

    } catch (err) {
      console.error('❌ 프로필 수정 실패:', err);
      alert('An error occurred while updating your profile.');
    } finally {
      isLoading.value = false;
    }
  };

</script>

  