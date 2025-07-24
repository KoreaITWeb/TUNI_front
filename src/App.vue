<template>
  <div id="app">
    <Header />
    <main class="content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from '@/components/layout/AppHeader.vue'
import Footer from '@/components/layout/AppFooter.vue'
</script>

<style>
/* 전체 높이 설정 */
html, body, #app {
  height: 100%;
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

/* Flexbox 레이아웃 적용 */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 본문 영역은 확장되도록 설정 */
.content {
  flex: 1;
}
</style>
