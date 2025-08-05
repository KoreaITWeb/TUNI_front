<template>
  <header class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- 로고 -->
        <router-link to="/main" class="flex items-center space-x-2">
          <img :src="logoTuni" alt="TUNI 아이콘" class="h-8 w-8" />
          <span class="text-xl font-bold text-gray-800">TUNI</span>
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
      // console.log('🔍 Header - 사용자 로그인, WebSocket 연결 시작')
      chatStore.connectGlobalWebSocket(newUserId)
    } else if (!newUserId && chatStore.isConnected) {
      // console.log('🔍 Header - 사용자 로그아웃, WebSocket 연결 해제')
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