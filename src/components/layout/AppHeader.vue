<template>
  <header class="header">
    <div class="header-container">
      <div class="header-content">
        <router-link to="/main" class="logo">
          <img src="../../../public/placeholder.svg" alt="TUNI 아이콘" class="logo-icon w-12 h-12 rounded-full" />
          <span class="logo-text">TUNI</span>
        </router-link>
          <nav class="navbar">
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link active" href="#" @click="goToShop">Shop</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click="goToSell">Sell</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click="goToChat">Chat</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" @click="goToProfile">Profile</a>
              </li>
            </ul>
          </nav>

        <div class="header-actions">
          <button class="icon-button">
            <Bell class="icon" />
          </button>
          <button class="icon-button">
            <Settings class="icon" />
          </button>
        </div>
        <div class="right">
          <template v-if="authStore.isLogin">
            <span class="nickname">{{ authStore.userId }}님</span>
            <button @click="logout">Logout</button>
          </template>
          <template v-else>
            <button @click="goToLogin">Login</button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>


<script setup>

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
  router.push('/login') // 로그아웃 후 로그인 페이지로 이동
}
</script>


