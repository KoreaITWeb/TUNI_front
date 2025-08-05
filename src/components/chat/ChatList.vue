<template>
  <div>
    <h5 class="p-3">💬 채팅 목록</h5>
    
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
            {{ props.isConnected ? '실시간 연결됨' : '연결 중...' }}
          </small>
        </div>
        <small class="text-muted">{{ props.currentUserId }}</small>
      </div>
    </div>

    <!-- 채팅방 목록 -->
    <ul class="list-group list-group-flush">
      <li v-if="props.chatRooms.length === 0 && props.currentUserId" class="text-center text-muted p-4">
        참여 중인 채팅방이 없습니다.
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
          class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
          style="width: 45px; height: 45px; font-size: 18px;"
        >
          {{ getOtherUserInitial(room) }}
        </div>

        <!-- 이름 + 메시지 -->
        <div class="flex-grow-1">
          <div class="fw-bold">
            {{ getOtherUserName(room) }}
            <span v-if="room.isNew" class="badge bg-primary ms-2">NEW</span>
            <span v-if="room.isOtherUserLeft" class="badge bg-secondary ms-2">나감</span>
          </div>
          <div v-if="room.lastMessage" class="text-muted small text-truncate">
            {{ room.lastMessage }}
          </div>
          <div v-else class="text-muted small text-truncate">
            대화를 시작해보세요
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
import { ref, computed, watch, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import ko from 'date-fns/locale/ko'

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
    // console.log(`🔍 Room ${room.chatId}: unreadCount = ${room.unreadCount}`)
  })
}, { deep: true })

const getOtherUserName = (room) => {
  return room.buyerId === props.currentUserId ? room.sellerId : room.buyerId
}

const getOtherUserInitial = (room) => {
  const otherUser = getOtherUserName(room)
  return otherUser ? otherUser.charAt(0).toUpperCase() : '?'
}

function formatTimeAgo(timeString) {
  if (!timeString) return ''
  
  try {
    return formatDistanceToNow(new Date(timeString), {
      addSuffix: true,
      locale: ko,
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
</style>