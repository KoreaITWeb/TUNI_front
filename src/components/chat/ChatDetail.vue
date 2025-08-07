<template>
  <div class="col-md-2"></div>
  <div v-if="props.room" class="flex-grow-1 d-flex flex-column  ">
    <!-- 채팅 헤더 -->
    <div class="p-3 border-bottom">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 class="mb-0">{{ getOtherUserName() }}</h6>
        </div>
        <button 
          class="btn btn-outline-danger btn-sm" 
          type="button"
          @click="handleQuitRoom"
          title="Quit Chat"
        >
          <i class="bi bi-box-arrow-left me-2"></i>Quit Chat
        </button>
      </div>
      
      <!-- 게시글 정보 표시 -->
      <div v-if="productInfo.title" class="product-info-box mt-2">
        <div class="d-flex align-items-center">
          <img 
            v-if="productInfo.mainImage" 
            :src="productInfo.mainImage" 
            alt="product img"
            class="product-thumbnail me-3"
            @error="handleImageError"
          >
          <div class="product-placeholder me-3" v-else>
            <i class="bi bi-image"></i>
          </div>
          <div>
            <h6 class="mb-1 text-truncate" style="max-width: 300px;">{{ productInfo.title }}</h6>
            <small class="text-muted">$ {{ productInfo.price }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 채팅 내용 (스크롤 영역) -->
    <div 
      ref="chatArea" 
      class="flex-grow-1 overflow-auto p-3 bg-light chat-scroll-area" 
      style="display: flex; flex-direction: column; min-height: 400px; max-height: 500px;"
    >
      <div v-if="props.messages.length === 0" class="text-center text-muted mt-5">
        No Messages.
      </div>
      
      <div
        v-for="(msg, index) in props.messages" 
        :key="`${msg.chatId}-${msg.regdate}-${index}`"
        class="mb-2"
        :class="getMessageClass(msg)"
      >
        <!-- 시스템 메시지 -->
        <div v-if="msg.userId === 'system'" class="system-message">
          {{ msg.content }}
        </div>
        
        <!-- 다른 사용자 메시지 -->
        <div v-else-if="msg.userId !== props.currentUserId" class="d-flex">
          <div 
            class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" 
            style="width: 32px; height: 32px; font-size: 12px; flex-shrink: 0;"
          >
            <img 
                  :src="profileId" 
                  class="w-8 h-8 rounded-full object-cover"
                >
            <!-- {{ msg.userId ? msg.userId.charAt(0).toUpperCase() : '?' }} -->
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
    <div v-if="props.room.isOtherUserLeft" class="chat-disabled-notice">
      Chat Over
    </div>
    <div v-else class="p-3 border-top d-flex">
      <input 
        type="text" 
        class="form-control me-2" 
        v-model="message" 
        @keyup.enter="sendMessage" 
        @click="handleInputClick"
        placeholder="Send Your Message..."
        :disabled="!props.isConnected"
      />
      <button 
        class="btn btn-primary" 
        @click="sendMessage"
        :disabled="!props.isConnected || !message.trim()"
      >
        send
      </button>
    </div>
  </div>

  <!-- 채팅방 선택 안 한 상태 -->
  <div v-else class="d-flex align-items-center justify-content-center flex-grow-1">
    <div class="text-center text-muted">
      <div style="font-size: 48px;">💬</div>
      <h5 class="mt-3">Welcome!</h5>
      <p>Click Your ChatRoom. You can Start the Chat</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import api from '@/api'
import axios from 'axios'

const chatStore = useChatStore()

const props = defineProps(['room', 'messages', 'currentUserId', 'isConnected', 'boardNumber','profileImgUrl'])
const emit = defineEmits(['sendMessage', 'quitRoom', 'lastMessageUpdate'])

const message = ref('')
const chatArea = ref(null)
const productInfo = ref({
  title: '',
  mainImage: '',
  images: [],
  price: ''
})
const profileId = ref('')


const getProfileImg =  async (profileImg) => {
  
  const profileGet = profileImg
  console.log(profileGet)
  
  try{
            const res = await axios.get(`/api/mypage/${profileGet}/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            },
            responseType: 'blob'
          })
          console.log(res.data)
          if (res.data) {
            profileId.value = URL.createObjectURL(res.data);
          } else {
            profileId.value = '';
          }

          }catch(err){
            profileId.value = '';
          }
          console.log(profileId.value)
        
}

// 게시글 정보 가져오기
const getBoardProduct = async (boardId) => {
  if (!boardId) return
  
  try {
    // console.log('🔍 게시글 정보 로드 중, boardId:', boardId)
    
    const response = await api.get(`/board/${boardId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    
    const data = response.data
    productInfo.value.title = data.board.title
    productInfo.value.images = data.images || []
    productInfo.value.price = data.board.price
    
    // 대표 이미지 찾기
    const representativeImage = productInfo.value.images.find(img => img.representative)
    if (representativeImage) {
      productInfo.value.mainImage = `/images/display?fileName=${representativeImage.uploadPath}/${representativeImage.uuid}_${representativeImage.fileName}`
    } else if (productInfo.value.images.length > 0) {
      // 대표 이미지가 없으면 첫 번째 이미지 사용
      const firstImage = productInfo.value.images[0]
      productInfo.value.mainImage = `/images/display?fileName=${firstImage.uploadPath}/${firstImage.uuid}_${firstImage.fileName}`
    }
    
    // console.log('🔍 게시글 정보 로드 완료:', productInfo.value)
    
  } catch (err) {
    // console.error('게시글 정보 로드 실패:', err)
    productInfo.value.title = "Can't read product"
  }
}

// 이미지 로드 실패 처리
const handleImageError = (event) => {
  // console.error('이미지 로드 실패')
  event.target.style.display = 'none'
}

// 채팅방 변경 감지
watch(() => props.room, (newRoom) => {
  if (newRoom && newRoom.boardId) {
    // 게시글 정보 초기화
    productInfo.value = {
      title: '',
      mainImage: '',
      images: []
    }

    profileId.value = ''
    // console.log(newRoom.sellerId)
    getProfileImg(newRoom.sellerId)
    // 새 게시글 정보 로드
    getBoardProduct(newRoom.boardId)
    // 
    // getProfileImg()
    
    try{
    // 마지막 메시지 업데이트
    if (lastMessage.value) {
      emit('lastMessageUpdate', {
        chatId: newRoom.chatId,
        lastMessage: lastMessage.value.content,
        lastMessageTime: lastMessage.value.regdate,
        lastMessageUserId: lastMessage.value.userId
      })
    }
  }catch(err){}
  }
}, { immediate: true })

// 마지막 메시지 추출
const lastMessage = computed(() => {
  if (!props.messages || props.messages.length === 0) return null
  return props.messages[props.messages.length - 1]
})

// 마지막 메시지 변경 시 부모에게 전달
watch(lastMessage, (newLastMessage) => {
  if (newLastMessage && props.room) {
    emit('lastMessageUpdate', {
      chatId: props.room.chatId,
      lastMessage: newLastMessage.content,
      lastMessageTime: newLastMessage.regdate,
      lastMessageUserId: newLastMessage.userId
    })
  }
}, { deep: true })

// 메시지 변경 감지하여 스크롤
watch(() => props.messages, () => {
  scrollChatToBottom()
}, { deep: true })

const handleQuitRoom = () => {
  if (confirm(`Do You want to quit chatroom with "${getOtherUserName()}"?\n\nYou can't see your messages NEVER.`)) {
    emit('quitRoom')
  }
}

const handleInputClick = () => {
  chatStore.markRoomAsRead(props.room.chatId)
}

const sendMessage = () => {
  chatStore.markRoomAsRead(props.room.chatId)
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
  const tempName = props.room.buyerId === props.currentUserId ? props.room.sellerId : props.room.buyerId
  if (tempName == null) {
    return "(Unknown)"
  }
  return tempName
}

const formatDate = (isoStr) => {
  if (!isoStr) return ""
  const date = new Date(isoStr)
  return date.toLocaleString('en-US')
}

const scrollChatToBottom = () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight
    }
  })
}

const getMessageClass = (msg) => {
  if (msg.userId === 'system') return 'text-center'
  return msg.userId === props.currentUserId ? 'text-end' : 'text-start'
}

// 컴포넌트 마운트 시
onMounted(() => {
  if (props.room && props.room.boardId) {
    getBoardProduct(props.room.boardId)
  }
})
</script>

<style scoped>
.bg-light {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
}

/* 게시글 정보 박스 */
.product-info-box {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #e9ecef;
}

.product-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.product-placeholder {
  width: 50px;
  height: 50px;
  background-color: #e9ecef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 20px;
}

/* 채팅 스크롤 영역 개선 */
.chat-scroll-area {
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

.system-message {
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
  margin: 20px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 20px;
}

.chat-disabled-notice {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  color: #6c757d;
  border-top: 1px solid #dee2e6;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>