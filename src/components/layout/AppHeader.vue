<template>
  <header class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- 로고 -->
        <router-link to="/main" class="flex items-center space-x-2">
          <img :src="logoTuni" alt="TUNI 아이콘" class="h-8 w-8" />
          <span class="text-xl font-bold text-gray-800">TUNI</span>
        </router-link>

        <!-- 네비게이션 -->
        <nav class="hidden md:flex space-x-6 text-gray-600 font-medium">
          <button @click="goToShop" class="hover:text-blue-500">Shop</button>
          <button @click="goToSell" class="hover:text-blue-500">Sell</button>
          <button @click="goToChat" class="hover:text-blue-500">Chat</button>
          <button @click="goToProfile" class="hover:text-blue-500">Profile</button>
        </nav>

        <!-- 우측 아이콘 + 로그인 -->
        <div class="flex items-center space-x-4">
          <button class="p-2 hover:bg-gray-100 rounded-full">
            <Bell class="w-5 h-5 text-gray-700" />
          </button>
          <button class="p-2 hover:bg-gray-100 rounded-full">
            <Settings class="w-5 h-5 text-gray-700" />
          </button>

          <div>
            <template v-if="authStore.isLogin">
              <span class="text-sm font-medium text-gray-800 mr-2">{{ authStore.userId }}님</span>
              <button @click="logout" class="text-sm text-red-500 hover:underline">Logout</button>
            </template>
            <template v-else>
              <button @click="goToLogin" class="text-sm text-blue-600 hover:underline">Login</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import logoTuni from '@/assets/logo-tuni.png'
import { Bell, Settings } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

function goToShop() {
  router.push('/Shop')
}
function goToSell() {
  router.push('/Sell')
}
function goToChat() {
  router.push('/Chat')
}
function goToProfile() {
  router.push('/Profile')
}
function goToLogin() {
  router.push('/Login')
}
function logout() {
  authStore.logout()
  alert('로그아웃되었습니다.')
  router.push('/login')
}
</script>


