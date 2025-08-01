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

      <!-- 새 채팅방 생성 (개발용) -->
      <div v-if="showCreateForm" class="mt-3 p-2 bg-light rounded">
        <h6 class="mb-2">새 채팅방 생성</h6>
        <input 
          v-model="newRoom.buyerId" 
          class="form-control form-control-sm mb-1" 
          placeholder="구매자 ID"
        />
        <input 
          v-model="newRoom.sellerId" 
          class="form-control form-control-sm mb-1" 
          placeholder="판매자 ID"
        />
        <input 
          v-model.number="newRoom.boardId" 
          type="number" 
          class="form-control form-control-sm mb-2" 
          placeholder="게시글 ID"
        />
        <button 
          @click="handleCreateRoom" 
          class="btn btn-success btn-sm w-100"
          :disabled="!props.isConnected || !isCreateFormValid"
        >
          채팅방 생성
        </button>
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
          <div class="fw-bold">{{ getOtherUserName(room) }}</div>
          <small class="text-muted">게시글 #{{ room.boardId }}</small>
          <div v-if="room.lastMessage" class="text-muted small text-truncate">
            {{ room.lastMessage }}
          </div>
        </div>

        <!-- 시간 및 미읽음 알림 -->
        <div class="text-end">
          <div class="text-muted small">
            {{ formatTimeAgo(room.updatedAt || room.lastMessageTime) }}
          </div>
          <div v-if="room.unreadCount > 0" class="badge bg-danger rounded-pill">
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

const showCreateForm = ref(false)

const newRoom = ref({
  buyerId: '',
  sellerId: '',
  boardId: null
})

const isCreateFormValid = computed(() => {
  return newRoom.value.buyerId && newRoom.value.sellerId && newRoom.value.boardId
})

// 이벤트 정의
const emit = defineEmits(['selectRoom', 'loadRooms', 'createRoom'])

// currentUserId가 변경되면 자동으로 채팅방 목록 로드
watch(() => props.currentUserId, (newUserId) => {
  if (newUserId) {
    emit('loadRooms', newUserId)
  }
}, { immediate: true })

const handleCreateRoom = () => {
  if (isCreateFormValid.value) {
    // 채팅방 생성 데이터 구조 확인
    const roomData = {
      buyerId: newRoom.value.buyerId,
      sellerId: newRoom.value.sellerId,
      boardId: parseInt(newRoom.value.boardId)  // 숫자로 변환
    };
    
    console.log('ChatList에서 생성할 채팅방 데이터:', roomData);
    emit('createRoom', roomData);
    
    // 폼 초기화
    newRoom.value = {
      buyerId: '',
      sellerId: '',
      boardId: null
    };
    
    alert('채팅방 생성 요청을 보냈습니다.');
  }
}

const getOtherUserName = (room) => {
  return room.buyerId === props.currentUserId ? room.sellerId : room.buyerId
}

const getOtherUserInitial = (room) => {
  const otherUser = getOtherUserName(room)
  return otherUser ? otherUser.charAt(0).toUpperCase() : '?'
}

function formatTimeAgo(timeString) {
  if (!timeString) return ''
  
  return formatDistanceToNow(new Date(timeString), {
    addSuffix: true,
    locale: ko,
  })
}
</script>