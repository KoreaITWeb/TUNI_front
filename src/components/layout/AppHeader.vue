<template>
  <header class="header">
    <div class="header-container">
      <div class="header-content">
        <router-link to="/main" class="logo">
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
            <li class="nav-item chat-nav-item">
              <a class="nav-link" href="#" @click="goToChat">
                Chat
                <!-- ✅ 안읽은 메시지 뱃지 -->
                <span v-if="unreadCount > 0" class="unread-badge">
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              </a>
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
import { useChatStore } from '@/stores/chat'
import { computed, onMounted, watch } from 'vue'

const authStore = useAuthStore()
const chatStore = useChatStore()
const router = useRouter()

// ✅ 안읽은 메시지 총 개수
const unreadCount = computed(() => chatStore.unreadMessagesCount)

// ✅ 로그인 시 전역 WebSocket 연결
watch(
  () => authStore.userId,
  async (newUserId) => {
    if (newUserId && !chatStore.isConnected) {
      console.log('🔍 Header - 사용자 로그인, WebSocket 연결 시작')
      chatStore.connectGlobalWebSocket(newUserId)
    } else if (!newUserId && chatStore.isConnected) {
      console.log('🔍 Header - 사용자 로그아웃, WebSocket 연결 해제')
      chatStore.disconnectGlobalWebSocket()
    }
  },
  { immediate: true }
)

// ✅ 컴포넌트 마운트 시 WebSocket 연결 확인
onMounted(() => {
  if (authStore.userId && !chatStore.isConnected) {
    chatStore.connectGlobalWebSocket(authStore.userId)
  }
})

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
  // WebSocket 연결 해제
  chatStore.disconnectGlobalWebSocket()
  
  authStore.logout()
  alert('로그아웃되었습니다.')
  router.push('/login')
}
</script>

<style scoped>
/* 기존 스타일 유지 */

/* ✅ 채팅 네비게이션 아이템 스타일 추가 */
.chat-nav-item {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -15px;
  background-color: #ff4444;
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  /* 애니메이션 효과 */
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* nav-link와 badge가 함께 잘 보이도록 조정 */
.chat-nav-item .nav-link {
  position: relative;
  padding-right: 20px;
}
</style>