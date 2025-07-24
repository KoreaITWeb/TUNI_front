<template>
  <header class="header">
    <div class="header-container">
      <div class="header-content">
        <div class="logo">TUNI</div>
        <nav class="nav">
          <button @click="goToShop">Shop</button>
          <button @click="goToSell">Sell</button>
          <button @click="goToChat">Chat</button>
          <button @click="goToProfile">Profile</button>
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
          <button @click="goToMy"  style="margin-right: 10px;">마이페이지</button>
          <button @click="goToLogin">로그인</button>
        </div>
      </div>
    </div>
  </header>
</template>


<script setup>

import { Bell, Settings } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

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

function goToMy() {
  router.push('/My')
}
</script>


