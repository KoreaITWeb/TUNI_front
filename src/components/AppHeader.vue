<template>
  <header class="header">
    <div class="logo">TUNI</div>

    <nav class="nav">
      <button @click="goToShop">Shop</button>
      <button @click="goToSell">Sell</button>
      <button @click="goToChat">Chat</button>
      <button @click="goToProfile">Profile</button>
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
    goToShop() {
      this.$router.push('/Shop')
    },
    goToSell() {
      this.$router.push('/Sell')
    },
    goToChat() {
      this.$router.push('/Chat')
    },
    goToProfile() {
      this.$router.push('/Profile')
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
