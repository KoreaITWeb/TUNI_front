<template>
  <div class="container-fluid">
    <div class="row" style="height: 90vh;">
      <!-- 왼쪽: 채팅 목록 -->
      <div class="col-md-4 border-end overflow-auto">
        <ChatList 
          :chatRooms="enhancedChatRooms" 
          :currentUserId="currentUserId"
          :isConnected="isConnected"
          @selectRoom="selectRoom" 
          @loadRooms="loadChatRoomsByUser"
          @createRoom="createChatRoom"
        />
      </div>

      <!-- 오른쪽: 채팅 내용 -->
      <div class="col-md-8 d-flex flex-column">
        <ChatDetail 
          :room="selectedRoom" 
          :messages="messages"
          :currentUserId="currentUserId"
          :isConnected="isConnected"
          @sendMessage="sendMessage"
          @quitRoom="quitChatRoom"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ChatList from '@/components/chat/ChatList.vue'
import ChatDetail from '@/components/chat/ChatDetail.vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import api from '@/api'

const API_BASE = "http://localhost:8443/api/chat"
const route = useRoute()

// Store 사용
const chatStore = useChatStore()
const authStore = useAuthStore()
const { userId: loggedInUserId } = storeToRefs(authStore)

// 로컬 상태 (ChatPages 전용)
const selectedRoom = ref(null)
const messages = ref([])
let currentChatSubscription = null

// // Store의 chatRooms 변경 감지하여 강제 업데이트
watch(
  () => chatStore.chatRooms,
  (newRooms) => {
    console.log('🔍 ChatPages - Store chatRooms 변경 감지')
    // 강제로 컴포넌트 업데이트
    forceUpdate()
  },
  { deep: true }
)

// Vue 3의 forceUpdate
import { getCurrentInstance } from 'vue'
const instance = getCurrentInstance()
const forceUpdate = () => instance?.proxy?.$forceUpdate()

// 전역 Store에서 상태 가져오기
const currentUserId = computed(() => chatStore.currentUserId || authStore.userId)
const isConnected = computed(() => chatStore.isConnected)
const chatRooms = computed(() => chatStore.chatRooms)
const lastMessages = computed(() => chatStore.lastMessages)
chatStore.chatRooms.forEach(room => {
  console.log(`Room ${room.chatId}: unreadCount = ${room.unreadCount}`)
})
// lastMessage 정보가 포함된 채팅방 목록 계산
const enhancedChatRooms = computed(() => {
  return chatRooms.value.map(room => {
    const lastMsg = lastMessages.value.get(room.chatId)
    return {
      ...room,
      lastMessage: lastMsg?.content || null,
      lastMessageTime: lastMsg?.regdate || room.updatedAt,
      lastMessageUserId: lastMsg?.userId || null,
      unreadCount: room.unreadCount || 0
    }

  }).sort((a, b) => {
    // 최신 메시지 시간 순으로 정렬
    const timeA = new Date(a.lastMessageTime || 0)
    const timeB = new Date(b.lastMessageTime || 0)
    return timeB - timeA
  })
})

// 개별 채팅방 구독
const subscribeToChatRoom = (chatId) => {
  console.log('🔍 ChatPages - 개별 채팅방 구독:', chatId)
  
  if (!chatStore.isConnected) {
    console.error("🔍 전역 WebSocket이 연결되어 있지 않습니다")
    return
  }

  // 이전 구독 해제
  if (currentChatSubscription) {
    console.log('🔍 이전 채팅방 구독 해제')
    currentChatSubscription.unsubscribe()
    currentChatSubscription = null
  }

  // 전역 Store의 subscribeToChatRoom 사용
  currentChatSubscription = chatStore.subscribeToChatRoom(chatId, (message) => {
    console.log('🔍 ChatPages - 개별 채팅방 메시지 수신:', message)
    
    // 현재 선택된 채팅방의 메시지만 messages 배열에 추가
    if (selectedRoom.value && message.chatId === selectedRoom.value.chatId) {
      console.log('🔍 현재 채팅방 메시지 - messages 배열에 추가')
      
      // 중복 체크
      const exists = messages.value.some(msg => 
        msg.regdate === message.regdate && 
        msg.content === message.content &&
        msg.userId === message.userId
      )
      
      if (!exists) {
        messages.value.push(message)
        messages.value = [...messages.value]
        console.log('🔍 현재 메시지 목록 길이:', messages.value.length)
      }
    }
  })
  
  if (currentChatSubscription) {
    console.log('🔍 개별 채팅방 구독 성공')
  } else {
    console.error('🔍 개별 채팅방 구독 실패')
  }
}

// 채팅방 목록 불러오기
const loadChatRoomsByUser = async (userId) => {
  if (!userId) {
    alert("사용자 ID를 입력하세요.")
    return
  }

  console.log('🔍 ChatPages - 채팅방 목록 로드 요청')
  
  // 전역 Store에서 로드
  await chatStore.loadChatRooms(userId)
  
  // URL 쿼리에 따른 자동 선택 실행
  await handleAutoSelectRoom()
}

// URL 쿼리에 따른 자동 채팅방 선택
const handleAutoSelectRoom = async () => {
  const { roomId, boardId, newBoardId } = route.query
  
  console.log('자동 채팅방 선택 시작, 쿼리:', { roomId, boardId, newBoardId })
  console.log('WebSocket 연결 상태:', isConnected.value)
  
  // WebSocket 연결이 안 되어 있으면 잠시 대기
  if (!isConnected.value) {
    console.log('WebSocket 연결 대기 중...')
    setTimeout(handleAutoSelectRoom, 500)
    return
  }
  
  if (roomId) {
    const targetRoom = chatRooms.value.find(room => room.chatId === parseInt(roomId))
    if (targetRoom) {
      console.log('URL roomId로 채팅방 자동 선택:', targetRoom)
      await selectRoom(targetRoom)
      return
    }
  }
  
  if (newBoardId) {
    const targetRoom = chatRooms.value.find(room => 
      parseInt(room.boardId) === parseInt(newBoardId)
    )
    if (targetRoom) {
      console.log('URL newBoardId로 채팅방 자동 선택:', targetRoom)
      await selectRoom(targetRoom)
      return
    }
  }
  
  if (boardId) {
    const targetRoom = chatRooms.value.find(room => 
      parseInt(room.boardId) === parseInt(boardId)
    )
    if (targetRoom) {
      console.log('URL boardId로 채팅방 자동 선택:', targetRoom)
      await selectRoom(targetRoom)
      return
    } else {
      console.log('boardId에 해당하는 채팅방을 찾을 수 없음. 채팅방 생성 대기 중...')
    }
  }
}

// 채팅방 생성
const createChatRoom = (roomData) => {
  if (!chatStore.isConnected) {
    alert("WebSocket 연결 중입니다. 잠시 후 다시 시도해주세요.")
    return
  }

  const success = chatStore.createRoom(roomData)
  if (!success) {
    alert("채팅방 생성에 실패했습니다.")
  }
}

// 채팅방 선택
const selectRoom = async (room) => {
  console.log('🔍 채팅방 선택:', room)
  selectedRoom.value = room
  messages.value = []

  try {
    // 기존 메시지 로드
    const res = await api.post(`${API_BASE}/messages`, {
      chatId: room.chatId
    })
    messages.value = res.data || []
    console.log('🔍 채팅방 메시지 로드 완료:', messages.value.length, '개')

    // 메시지 로드 후 마지막 메시지 정보 업데이트
    if (messages.value.length > 0) {
      const lastMsg = messages.value[messages.value.length - 1]
      console.log('🔍 선택한 채팅방의 마지막 메시지:', lastMsg)
      
      // 전역 Store에 마지막 메시지 업데이트
      chatStore.updateLastMessage(room.chatId, {
        content: lastMsg.content,
        regdate: lastMsg.regdate,
        userId: lastMsg.userId
      })
    }
    
    // 전역 Store에서 읽음 처리
    chatStore.markRoomAsRead(room.chatId)

  } catch (e) {
    console.error("메시지 불러오기 실패", e)
  }

  // 채팅방 구독
  console.log('🔍 WebSocket 연결 상태:', isConnected.value)
  
  if (isConnected.value) {
    console.log('🔍 즉시 구독 시도')
    subscribeToChatRoom(room.chatId)
  } else {
    console.log('🔍 WebSocket 연결 대기 중, 연결 후 구독 예정')
    
    // WebSocket 연결 대기 후 구독
    let attempts = 0
    const maxAttempts = 50 // 5초 대기
    
    const checkConnection = setInterval(() => {
      attempts++
      console.log(`🔍 WebSocket 연결 확인 시도 ${attempts}/${maxAttempts}`)
      
      if (isConnected.value) {
        console.log('🔍 WebSocket 연결됨, 이제 구독 시도')
        subscribeToChatRoom(room.chatId)
        clearInterval(checkConnection)
      } else if (attempts >= maxAttempts) {
        console.error('🔍 WebSocket 연결 타임아웃 - 실시간 채팅 불가능')
        clearInterval(checkConnection)
        alert('실시간 채팅 연결에 실패했습니다. 페이지를 새로고침해주세요.')
      }
    }, 100)
  }
}

// 메시지 전송
const sendMessage = async (messageData) => {
  console.log('🔍 sendMessage 호출됨:', messageData)
  
  if (!chatStore.isConnected) {
    console.error('🔍 WebSocket이 연결되어 있지 않습니다.')
    alert("WebSocket이 연결되어 있지 않습니다.")
    return
  }

  if (!selectedRoom.value) {
    console.error('🔍 선택된 채팅방이 없습니다.')
    alert("채팅방을 선택해주세요.")
    return
  }

  const msg = {
    ...messageData,
    userId: currentUserId.value,
    regdate: new Date().toISOString(),
  }

  console.log('🔍 전송할 메시지:', msg)

  try {
    // lastMessages는 즉시 업데이트 (ChatList 표시용)
    chatStore.updateLastMessage(selectedRoom.value.chatId, {
      content: msg.content,
      regdate: msg.regdate,
      userId: msg.userId
    })

    // 서버로 메시지 전송
    console.log('🔍 서버로 메시지 전송 중...')
    const success = chatStore.sendMessage(msg)
    
    if (success) {
      console.log('🔍 메시지 전송 완료')
    } else {
      throw new Error('메시지 전송 실패')
    }
  } catch (error) {
    console.error('🔍 메시지 전송 실패:', error)
    alert('메시지 전송에 실패했습니다. 다시 시도해주세요.')
  }
}

// 채팅방 나가기
const quitChatRoom = async () => {
  if (!selectedRoom.value || !currentUserId.value) {
    alert('나갈 채팅방이 선택되지 않았습니다.')
    return
  }

  if (!chatStore.isConnected) {
    alert('WebSocket이 연결되어 있지 않습니다. 잠시 후 다시 시도해주세요.')
    return
  }

  try {
    const quitData = {
      userId: currentUserId.value,
      chatId: selectedRoom.value.chatId,
      action: 'quit'
    }

    console.log('채팅방 나가기 요청:', quitData)

    const success = chatStore.quitRoom(quitData)
    
    if (success) {
      // 즉시 UI 업데이트
      chatStore.removeRoom(selectedRoom.value.chatId)
      
      // 현재 선택된 채팅방 초기화
      if (currentChatSubscription) {
        currentChatSubscription.unsubscribe()
        currentChatSubscription = null
      }
      
      selectedRoom.value = null
      messages.value = []
      
      alert('채팅방에서 나갔습니다.')
    } else {
      throw new Error('채팅방 나가기 실패')
    }

  } catch (error) {
    console.error('채팅방 나가기 실패:', error)
    alert('채팅방 나가기에 실패했습니다. 다시 시도해주세요.')
    
    // 실패 시 채팅방 목록 다시 로드
    if (currentUserId.value) {
      await loadChatRoomsByUser(currentUserId.value)
    }
  }
}

// 새로 생성된 채팅방 확인 및 자동 선택
const checkAndSelectNewRoom = async (newRoom) => {
  const { boardId } = route.query
  
  // URL에 boardId가 있고, 새로 생성된 채팅방이 해당 게시글의 채팅방이면 자동 선택
  if (boardId && parseInt(newRoom.boardId) === parseInt(boardId) && !selectedRoom.value) {
    console.log('새로 생성된 채팅방 자동 선택:', newRoom)
    await selectRoom(newRoom)
  }
}

// 채팅방 나가기 이벤트 핸들러
const handleRoomQuitEvent = (event) => {
  const quitInfo = event.detail
  
  // 현재 선택된 채팅방이 나간 방이면 초기화
  if (selectedRoom.value && selectedRoom.value.chatId === quitInfo.chatId) {
    if (currentChatSubscription) {
      currentChatSubscription.unsubscribe()
      currentChatSubscription = null
    }
    
    selectedRoom.value = null
    messages.value = []
    
    if (quitInfo.userId !== currentUserId.value) {
      alert('상대방이 채팅방을 나갔습니다. 채팅방이 종료됩니다.')
    }
  }
}

// 전역 메시지 이벤트 핸들러
const handleNewMessageEvent = (event) => {
  const messageNotification = event.detail
  
  // 현재 선택된 채팅방의 메시지인 경우 messages 배열에 추가
  if (selectedRoom.value && messageNotification.chatId === selectedRoom.value.chatId) {
    console.log('🔍 전역 이벤트로 메시지 수신:', messageNotification)
    
    const fullMessage = {
      chatId: messageNotification.chatId,
      content: messageNotification.content,
      regdate: messageNotification.regdate,
      userId: messageNotification.userId,
      boardId: selectedRoom.value.boardId
    }
    
    // 중복 체크
    const exists = messages.value.some(msg => 
      msg.regdate === fullMessage.regdate && 
      msg.content === fullMessage.content &&
      msg.userId === fullMessage.userId
    )
    
    if (!exists) {
      messages.value.push(fullMessage)
      messages.value = [...messages.value]
    }
  }
}

// 현재 채팅방 확인 이벤트 핸들러
const handleCheckCurrentRoom = (event) => {
  const { chatId } = event.detail
  const isCurrentRoom = selectedRoom.value && selectedRoom.value.chatId === chatId
  
  // 응답 이벤트 발생
  const responseEvent = new CustomEvent('currentRoomResponse', {
    detail: { isCurrentRoom }
  })
  window.dispatchEvent(responseEvent)
}

// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  console.log('🔍 ChatPages 마운트됨')
  
  // 로그인된 사용자 ID 설정
  if (loggedInUserId.value) {
    chatStore.currentUserId = loggedInUserId.value
  }
  
  // URL 쿼리에서 사용자 ID 확인
  const { userId } = route.query
  if (userId) {
    chatStore.currentUserId = userId
  }
  
  // 전역 WebSocket이 연결되지 않았다면 연결
  if (!chatStore.isConnected && currentUserId.value) {
    console.log('🔍 전역 WebSocket 연결 시작')
    chatStore.connectGlobalWebSocket(currentUserId.value)
    
    // WebSocket 연결 시 자동으로 채팅방 목록을 로드하므로 여기서는 하지 않음
  } else if (chatRooms.value.length > 0) {
    // 이미 채팅방 목록이 있으면 재로드하지 않고 자동 선택만 실행
    console.log('🔍 기존 채팅방 목록 사용')
    await handleAutoSelectRoom()
  }
  
  // 이벤트 리스너 등록
  window.addEventListener('chatRoomQuit', handleRoomQuitEvent)
  window.addEventListener('newChatMessage', handleNewMessageEvent)
  window.addEventListener('checkCurrentRoom', handleCheckCurrentRoom)
})

onUnmounted(() => {
  console.log('🔍 ChatPages 언마운트됨')
  
  // 개별 구독만 해제 (전역 WebSocket은 유지)
  if (currentChatSubscription) {
    currentChatSubscription.unsubscribe()
    currentChatSubscription = null
  }
  
  // 이벤트 리스너 제거
  window.removeEventListener('chatRoomQuit', handleRoomQuitEvent)
  window.removeEventListener('newChatMessage', handleNewMessageEvent)
  window.removeEventListener('checkCurrentRoom', handleCheckCurrentRoom)
})

// Store 상태 변화 감지
watch(
  () => chatStore.isConnected,
  (newValue) => {
    console.log('🔍 전역 WebSocket 연결 상태 변경:', newValue)
  }
)

watch(
  () => chatRooms.value.length,
  (newLength) => {
    console.log('🔍 채팅방 목록 길이 변경:', newLength)
    
    // 채팅방 목록이 로드된 후 자동 선택 재시도
    if (newLength > 0 && !selectedRoom.value) {
      handleAutoSelectRoom()
    }
  }
)

// 새로 생성된 채팅방 감지
watch(
  () => chatStore.chatRooms,
  (newRooms, oldRooms = []) => {
    if (newRooms.length > oldRooms.length) {
      // 새로 추가된 채팅방 찾기
      const newRoom = newRooms.find(room => 
        !oldRooms.some(oldRoom => oldRoom.chatId === room.chatId)
      )
      
      if (newRoom && (
        newRoom.buyerId === currentUserId.value ||
        newRoom.sellerId === currentUserId.value
      )) {
        console.log('🔍 새 채팅방 감지:', newRoom)
        checkAndSelectNewRoom(newRoom)
      }
    }
  },
  { deep: true }
)


</script>