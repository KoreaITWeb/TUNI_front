<template>
  <div v-if="props.room" class="flex-grow-1 d-flex flex-column">
    <!-- 채팅 헤더 -->
    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
      <div>
        <h6 class="mb-0">{{ getOtherUserName() }}</h6>
        <small class="text-muted">게시글 #{{ props.room.boardId }}</small>
      </div>
      <button 
        class="btn btn-outline-danger btn-sm" 
        type="button"
        @click="handleQuitRoom"
        title="채팅방 나가기"
      >
        <i class="bi bi-box-arrow-left me-2"></i>채팅방 나가기
      </button>
    </div>

    <!-- 채팅 내용 (스크롤 영역) -->
    <div 
      ref="chatArea" 
      class="flex-grow-1 overflow-auto p-3 bg-light chat-scroll-area" 
      style="display: flex; flex-direction: column; min-height: 400px; max-height: 500px;"
    >
      <div v-if="props.messages.length === 0" class="text-center text-muted mt-5">
        아직 메시지가 없습니다. 첫 메시지를 보내보세요!
      </div>
      
      <div
        v-for="(msg, index) in props.messages" 
        :key="index"
        class="mb-2"
        :class="msg.userId === props.currentUserId ? 'text-end' : 'text-start'"
      >
        <!-- 다른 사용자 메시지 -->
        <div v-if="msg.userId !== props.currentUserId" class="d-flex">
          <div 
            class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" 
            style="width: 32px; height: 32px; font-size: 12px;"
          >
            {{ msg.userId.charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="bg-white border rounded p-2 shadow-sm" style="max-width: 300px;">
              {{ msg.content }}
            </div>
            <small class="text-muted">{{ formatDate(msg.regdate) }}</small>
          </div>
        </div>
        
        <!-- 내 메시지 -->
        <div v-else class="d-flex justify-content-end">
          <div>
            <div class="bg-primary text-white rounded p-2 shadow-sm" style="max-width: 300px;">
              {{ msg.content }}
            </div>
            <small class="text-muted">{{ formatDate(msg.regdate) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 입력창 -->
    <div class="p-3 border-top d-flex">
      <input 
        type="text" 
        class="form-control me-2" 
        v-model="message" 
        @keyup.enter="sendMessage" 
        placeholder="메시지를 입력하세요..."
        :disabled="!props.isConnected"
      />
      <button 
        class="btn btn-primary" 
        @click="sendMessage"
        :disabled="!props.isConnected || !message.trim()"
      >
        전송
      </button>
    </div>
  </div>

  <!-- 채팅방 선택 안 한 상태 -->
  <div v-else class="d-flex align-items-center justify-content-center flex-grow-1">
    <div class="text-center text-muted">
      <div style="font-size: 48px;">💬</div>
      <h5 class="mt-3">채팅방을 선택해주세요</h5>
      <p>왼쪽에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed ,watch, nextTick } from 'vue'

const props = defineProps(['room', 'messages', 'currentUserId', 'isConnected'])

const message = ref('')
const chatArea = ref(null)



const emit = defineEmits(['sendMessage', 'quitRoom','lastMessageUpdate'])

// ✅ 새로 추가: 마지막 메시지 추출
const lastMessage = computed(() => {
  if (!props.messages || props.messages.length === 0) return null
  return props.messages[props.messages.length - 1]
})

// ✅ 새로 추가: 마지막 메시지 변경 시 부모에게 전달
watch(lastMessage, (newLastMessage) => {
  if (newLastMessage && props.room) {
    emit('lastMessageUpdate', {
      chatId: props.room.chatId,
      lastMessage: newLastMessage.content,
      lastMessageTime: newLastMessage.regdate,
      lastMessageUserId: newLastMessage.userId
    })
  }
}, { immediate: true, deep: true })

// ✅ 새로 추가: 채팅방 변경 시에도 마지막 메시지 전달
watch(() => props.room, (newRoom) => {
  if (newRoom && lastMessage.value) {
    emit('lastMessageUpdate', {
      chatId: newRoom.chatId,
      lastMessage: lastMessage.value.content,
      lastMessageTime: lastMessage.value.regdate,
      lastMessageUserId: lastMessage.value.userId
    })
  }
}, { immediate: true })

const handleQuitRoom = () => {
  if (confirm(`정말로 "${getOtherUserName()}"님과의 채팅방을 나가시겠습니까?\n\n나간 후에는 대화 내역을 볼 수 없습니다.`)) {
    emit('quitRoom')
  }
}

const sendMessage = () => {
  if (!message.value.trim()) return
  
  const messageData = {
    chatId: props.room.chatId,
    boardId: props.room.boardId,
    content: message.value.trim()
  }
  
  emit('sendMessage', messageData)
  message.value = ''
}

const getOtherUserName = () => {
  if (!props.room) return ''
  return props.room.buyerId === props.currentUserId ? props.room.sellerId : props.room.buyerId
}

const formatDate = (isoStr) => {
  if (!isoStr) return ""
  const date = new Date(isoStr)
  return date.toLocaleString('ko-KR')
}

const scrollChatToBottom = () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight
    }
  })
}

// 메시지 변경 감지하여 스크롤
watch(() => props.messages, () => {
  scrollChatToBottom()
}, { deep: true })

// 채팅방 변경 시 스크롤
watch(() => props.room, () => {
  scrollChatToBottom()
})
</script>

<style scoped>
.bg-light {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
}

/* 채팅 스크롤 영역 개선 */
.chat-scroll-area {
  /* 스크롤바 스타일링 */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.chat-scroll-area::-webkit-scrollbar {
  width: 8px;
}

.chat-scroll-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-scroll-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.chat-scroll-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 부드러운 스크롤 */
.chat-scroll-area {
  scroll-behavior: auto;
}

.dropdown-menu {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: white;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: none;
  min-width: 10rem;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  list-style: none;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.375rem 1rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
}

.dropdown-item:hover,
.dropdown-item:focus {
  color: #1e2125;
  background-color: #e9ecef;
}

.dropdown-item.text-danger {
  color: #dc3545 !important;
}

.dropdown-item.text-danger:hover {
  color: #fff !important;
  background-color: #dc3545 !important;
}

.dropdown {
  position: relative;
}

.dropdown-toggle::after {
  display: inline-block;
  margin-left: 0.255em;
  vertical-align: 0.255em;
  content: "";
  border-top: 0.3em solid;
  border-right: 0.3em solid transparent;
  border-bottom: 0;
  border-left: 0.3em solid transparent;
}
</style>