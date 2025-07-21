<template>
  <header class="header">
    <div class="logo">TUNI</div>

    <nav class="nav">
      <router-link to="/">Home</router-link>
      |
      <router-link to="/about">About</router-link>
    </nav>

    <div class="right">
      <button @click="goToLogin">로그인</button>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  methods: {
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
}

.logo {
  font-size: 24px;
  font-weight: bold;
}

.right button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
