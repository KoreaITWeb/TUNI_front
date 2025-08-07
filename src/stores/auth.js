// src/composables/useAuth.js
// isLogin, userId, schoold가 필요하거나 로그인 상태 관리 해야할때 사용

/* 1. <script setup> 블럭 안에서 사용할때
<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore) // ◀️ 반응형 상태 가져오기

// isLogin 값이 바뀔 때마다 자동으로 계산되는 computed 속성
const welcomeMessage = computed(() => {
  return isLogin.value ? `${userId.value}님 환영합니다.` : '로그인이 필요합니다.'
})
</script>
*/

/* 2. <template> 안에서만 사용할 때
<script setup>
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
// storeToRefs를 사용하지 않음
</script>

<template>
  <div v-if="authStore.isLogin">
    <p>{{ authStore.userId }}</p>
  </div>
</template>
*/

/* 3. action(함수)만 호출할 때
<script setup>
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<template>
  <button @click="authStore.logout()">로그아웃</button>
</template>
*/

import { defineStore } from 'pinia'
import { ref } from 'vue'

function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);

        // userId 필드가 없으면 sub 필드를 userId로 설정
        if (!payload.userId && payload.sub) {
            payload.userId = payload.sub;
        }

        return payload;
    } catch (e) {
        console.error("Invalid token:", e);
        return null;
    }
}


export const useAuthStore = defineStore('auth', () => {
    // 1. 상태 (State)
    const isLogin = ref(false)
    const userId = ref('')
    const schoolId = ref(null)
    const accessToken = ref(localStorage.getItem('accessToken') || '')

    // 2. 액션 (Actions) - 상태를 변경하는 함수들
    function checkLoginStatus() {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const payload = decodeJwt(token);
            if (payload) {
                isLogin.value = true;
                userId.value = payload.userId;
                schoolId.value = payload.schoolId;
                accessToken.value = token;
            }
        }
    }

    // 로그인 시 호출되는 함수
    function login(tokenDto) {
        const payload = decodeJwt(tokenDto.accessToken);
        if (payload) {
            localStorage.setItem('accessToken', tokenDto.accessToken);
            localStorage.setItem('refreshToken', tokenDto.refreshToken);
            localStorage.setItem('userId', payload.userId);
            localStorage.setItem('schoolId', payload.schoolId);

            isLogin.value = true;
            userId.value = payload.userId || payload.sub;
            schoolId.value = payload.schoolId;
            accessToken.value = tokenDto.accessToken;
        }
    }

    // 로그아웃 시 호출되는 함수
    function logout() {
        localStorage.clear();
        isLogin.value = false;
        userId.value = '';
        schoolId.value = null;
        accessToken.value = '';
    }

    // 3. 반환
    return { isLogin, userId, schoolId, accessToken, checkLoginStatus, login, logout }
})