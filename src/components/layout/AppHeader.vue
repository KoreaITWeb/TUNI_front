<template>
  <header class="header">
    <div class="header-container">
      <div class="header-content">
        <router-link to="/" class="logo">
          <img src="/logo-icon.svg" alt="TUNI 아이콘" class="logo-icon" />
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

function goToLogin() {
  router.push('/Login')
}

</script>


