<template>
  <div class="login-page">
    <main class="login-main">
      <form class="login-form" @submit.prevent="onButtonClick">
        <label for="email">E-mail</label>
        <input
        type="email"
        id="email"
        v-model="email"
        placeholder="Enter your email"
        required
        :disabled="showCodeInput"
        />
        <!-- 코드 입력 후 이메일 수정 막기 -->

        <!-- 코드 입력창은 Send Code 누른 후에만 보임 -->
        <input
          v-if="showCodeInput"
          type="text"
          id="code"
          v-model="code"
          placeholder="Enter the code"
          required
          style="margin-top: 1rem;"
        />

        <!-- 버튼 하나, 텍스트는 상태에 따라 변경 -->
        <button type="submit" style="margin-top: 1rem;">
          {{ showCodeInput ? 'Verify Code' : 'Send Code' }}
        </button>
      </form>
    </main>
  </div>
</template>


<script setup>
import { ref } from 'vue'

const email = ref('')
const code = ref('')
const showCodeInput = ref(false)  // 코드 입력란 보임 여부

function onButtonClick() {
  if (!showCodeInput.value) {
    // Send Code 단계
    alert(`Send code to ${email.value}`)
    showCodeInput.value = true
  } else {
    // Verify Code 단계
    alert(`Verify code: ${code.value}`)
  }
}
</script>

<style scoped>
.login-main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 320px;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: white;
}

.login-form label {
  font-weight: 600;
}

.login-form input {
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.login-form button {
  padding: 0.75rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.login-form button:hover {
  background-color: #1d4ed8;
}
</style>
