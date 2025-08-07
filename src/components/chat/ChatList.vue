<template>
  <div>
    <h5 class="p-3">💬 Chat List</h5>
    
    <!-- 연결 상태 표시 -->
    <div class="p-3 border-bottom">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center">
          <div 
            class="rounded-circle me-2" 
            :class="props.isConnected ? 'bg-success' : 'bg-danger'"
            style="width: 8px; height: 8px;"
          ></div>
          <small class="text-muted">
            {{ props.isConnected ? 'Connected' : 'Waiting...' }}
          </small>
        </div>
        <small class="text-muted">{{ props.currentUserId }}</small>
      </div>
    </div>

    <!-- 채팅방 목록 -->
    <ul class="list-group list-group-flush chat-scroll-area">
      <li v-if="props.chatRooms.length === 0 && props.currentUserId" class="text-center text-muted p-4">
        Make your ChatRooms!
      </li>
      
      <li
        v-for="room in props.chatRooms"
        :key="room.chatId"
        class="list-group-item list-group-item-action d-flex align-items-center"
        @click="$emit('selectRoom', room)"
        style="cursor: pointer;"
      >
        <!-- 프로필 이미지 -->
        <div 
          class="rounded-circle  text-black d-flex align-items-center justify-content-center me-3"
          style="width: 45px; height: 45px; font-size: 18px; color: gray"
        >
        <img :src="profileImgUrl"
        class="rounded-circle object-cover">
          <!-- <div style="display: none;">{{ getOtherUserInitial(room) }}</div> -->
        </div>

        <!-- 이름 + 메시지 -->
        <div class="flex-grow-1">
          <div class="fw-bold">
            {{ getOtherUserName(room) }}
            <span v-if="room.isNew" class="badge bg-primary ms-2">NEW</span>
            <span v-if="room.isOtherUserLeft" class="badge bg-secondary ms-2">Quit</span>
          </div>
          <div v-if="room.lastMessage" class="text-muted small text-truncate">
            {{ room.lastMessage }}
          </div>
          <div v-else class="text-muted small text-truncate">
            Start Your Chat!!
          </div>
        </div>

        <!-- 시간 및 미읽음 알림 -->
        <div class="text-end">
          <div class="text-muted small">
            {{ formatTimeAgo(room.lastMessageTime || room.updatedAt) }}
          </div>
          <!-- ✅ 안읽은 메시지 수 표시 디버깅 -->
          <div v-if="room.unreadCount && room.unreadCount > 0" class="badge bg-danger rounded-pill mt-1">
            {{ room.unreadCount }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import axios from 'axios'


const props = defineProps(['chatRooms', 'currentUserId', 'isConnected'])

// 이벤트 정의
const emit = defineEmits(['selectRoom', 'loadRooms', 'createRoom'])

// currentUserId가 변경되면 자동으로 채팅방 목록 로드
watch(() => props.currentUserId, (newUserId) => {
  if (newUserId) {
    emit('loadRooms', newUserId)
  }
}, { immediate: true })

// 디버깅용 - props 변화 감지
watch(() => props.chatRooms, (newRooms) => {
  // console.log('🔍 ChatList - 채팅방 목록 업데이트:', newRooms)
  newRooms.forEach(room => {
    getOtherUserInitial(room)
    // console.log(`🔍 Room ${room.chatId}: unreadCount = ${room.unreadCount}`)
  })
}, { deep: true })

const getOtherUserName = (room) => {
  return room.buyerId === props.currentUserId ? room.sellerId : room.buyerId
}
const profileImgUrl = ref('')
const getOtherUserInitial = async (room) => {
  const otherUser = getOtherUserName(room)
  
    if(otherUser !== null){
      try{
            const res = await axios.get(`/api/mypage/${otherUser}/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            },
            responseType: 'blob'
          })
          if (res.data) {
            profileImgUrl.value = URL.createObjectURL(res.data);
          } else {
            profileImgUrl.value = '';
          }

          }catch(err){
            profileImgUrl.value = '';
          }
          // console.log(profileImgUrl)
    }
  
  return otherUser ? false : '?'
}

function formatTimeAgo(timeString) {
  if (!timeString) return ''
  
  try {
    return formatDistanceToNow(new Date(timeString), {
      addSuffix: true,
      locale: enUS,
    })
  } catch (error) {
    // console.error('시간 포맷팅 오류:', error)
    return ''
  }
}

// 컴포넌트 마운트 시 디버깅
onMounted(() => {
  // console.log('🔍 ChatList 마운트됨')
  // console.log('🔍 현재 chatRooms:', props.chatRooms)
})
</script>

<style scoped>
/* 기존 스타일 유지 */

/* ✅ 채팅방 상태별 스타일 */
.room-left {
  opacity: 0.7;
  background-color: #f8f9fa;
}

.room-left:hover {
  background-color: #e9ecef;
}

.badge {
  min-width: 20px;
  padding: 4px 8px;
  font-size: 11px;
}

.badge.bg-primary {
  animation: newBadgePulse 2s ease-in-out infinite;
}

@keyframes newBadgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.text-truncate {
  max-width: 200px;
}


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
  scroll-behavior: smooth;
}

</style>