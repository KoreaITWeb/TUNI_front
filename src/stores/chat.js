// stores/chat.js - 전역 채팅 상태 관리
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import SockJS from "sockjs-client"
import { Stomp } from "@stomp/stompjs"
import api from '@/api'


// 로컬스토리지에 unreadCount 저장/불러오기
const UnreadCountStorage = {
  getKey(userId) {
    return `tuni_unread_${userId}`
  },
  
  // 저장된 unreadCount 가져오기
  load(userId) {
    try {
      const data = localStorage.getItem(this.getKey(userId))
      return data ? JSON.parse(data) : {}
    } catch (error) {
      // console.error('unreadCount 로드 실패:', error)
      return {}
    }
  },
  
  // unreadCount 저장
  save(userId, chatRooms) {
    try {
      const unreadData = {}
      chatRooms.forEach(room => {
        if (room.unreadCount > 0 || room.isNew || room.isOtherUserLeft) {
          unreadData[room.chatId] = {
            unreadCount: room.unreadCount || 0,
            isNew: room.isNew || false,
            isOtherUserLeft: room.isOtherUserLeft || false
          }
        }
      })
      localStorage.setItem(this.getKey(userId), JSON.stringify(unreadData))
    } catch (error) {
      // console.error('unreadCount 저장 실패:', error)
    }
  }
}

export const useChatStore = defineStore('chat', () => {
  // 상태
  const isConnected = ref(false)
  const currentUserId = ref('')
  const chatRooms = ref([])
  const lastMessages = ref(new Map())
  const totalUnreadCount = ref(0)
  const currentViewingRoomId = ref(null)
  const isInitialLoadComplete = ref(false)
  const boardNumber = ref('');
  
  
  // const title =ref('')
  
  // WebSocket 관련
  let stompClient = null
  let globalUserSubscription = null
  let roomsSubscription = null
  
  const API_BASE = "/api/chat"

  const getBoardProduct = computed(() => {
    
    return boardNumber
  })

  // Computed - 총 읽지 않은 메시지 수
  const unreadMessagesCount = computed(() => {
    return chatRooms.value.reduce((total, room) => {
      return total + (room.unreadCount || 0)
    }, 0)
  })

  // Computed - 읽지 않은 메시지가 있는지
  const hasUnreadMessages = computed(() => {
    return unreadMessagesCount.value > 0
  })

  // ✅ 사용자 ID 설정
  const setCurrentUserId = (userId) => {
    currentUserId.value = userId
    // console.log('🔍 전역 Store - 사용자 ID 설정:', userId)
  }

  // ✅ 현재 보고 있는 채팅방 설정
  const setCurrentViewingRoom = (chatId) => {
    currentViewingRoomId.value = chatId
    // console.log('🔍 현재 보고 있는 채팅방 설정:', chatId)
  }

  // ✅ 마지막 메시지 업데이트
  const updateLastMessage = (chatId, messageInfo) => {
    lastMessages.value.set(chatId, messageInfo)
    // Vue 반응성 트리거
    lastMessages.value = new Map(lastMessages.value)
    // console.log(`🔍 전역 Store - 채팅방 ${chatId} 마지막 메시지 업데이트`)
  }

  // ✅ 채팅방 제거
  const removeRoom = (chatId) => {
    chatRooms.value = chatRooms.value.filter(room => room.chatId !== chatId)
    lastMessages.value.delete(chatId)
    
    // 로컬스토리지 업데이트
    UnreadCountStorage.save(currentUserId.value, chatRooms.value)
    
    // console.log(`🔍 전역 Store - 채팅방 ${chatId} 제거`)
  }

  // ✅ 메시지 전송
  const sendMessage = (messageData) => {
    if (!stompClient || !isConnected.value) {
      // console.error('🔍 전역 Store - WebSocket이 연결되어 있지 않습니다')
      return false
    }
    
    try {
      // console.log('🔍 전역 Store - 메시지 전송:', messageData)
      stompClient.send("/app/chat/send", {}, JSON.stringify(messageData))
      return true
    } catch (error) {
      // console.error('🔍 전역 Store - 메시지 전송 실패:', error)
      return false
    }
  }

  // ✅ 채팅방 생성
  const createRoom = (roomData) => {
    if (!stompClient || !isConnected.value) {
      // console.error('🔍 전역 Store - WebSocket이 연결되어 있지 않습니다')
      return false
    }
    
    try {
      stompClient.send("/app/createRoom", {}, JSON.stringify(roomData))
      return true
    } catch (error) {
      // console.error('🔍 전역 Store - 채팅방 생성 실패:', error)
      return false
    }
  }

  // ✅ 채팅방 나가기
  const quitRoom = (quitData) => {
    if (!stompClient || !isConnected.value) {
      // console.error('🔍 전역 Store - WebSocket이 연결되어 있지 않습니다')
      return false
    }
    
    try {
      // 시스템 메시지 포함하여 전송
      const quitMessage = {
        ...quitData,
        systemMessage: `${currentUserId.value}님이 채팅방을 나갔습니다.`
      }
      
      stompClient.send("/app/chat/quit", {}, JSON.stringify(quitMessage))
      return true
    } catch (error) {
      // console.error('🔍 전역 Store - 채팅방 나가기 실패:', error)
      return false
    }
  }

  // ✅ 전역 WebSocket 연결
  const connectGlobalWebSocket = (userId) => {
    if (!userId) {
      // console.error('🔍 사용자 ID가 없어 WebSocket 연결 불가')
      return
    }

    if (stompClient && isConnected.value) {
      // console.log('🔍 이미 WebSocket이 연결되어 있음')
      return
    }

    // console.log('🔍 전역 WebSocket 연결 시작:', userId)
    currentUserId.value = userId

    const socket = new SockJS("http://localhost:8443/ws-chat")
    
    stompClient = Stomp.over(socket)
    stompClient.debug = () => {}
    stompClient.connect(
      {},
      () => {
        isConnected.value = true
        // console.log('🔍 전역 WebSocket 연결 성공')

        // 전역 사용자 알림 구독
        subscribeToGlobalNotifications(userId)
        
        // 채팅방 업데이트 구독
        subscribeToRoomUpdates()
        
        // 채팅방 목록 로드
        loadChatRooms(userId)
      },
      (error) => {
        // console.error("🔍 전역 WebSocket 연결 실패:", error)
        isConnected.value = false
        
        // 재연결 시도
        setTimeout(() => {
          stompClient = null
          connectGlobalWebSocket(userId)
        }, 5000)
      }
    )
  }

  // ✅ 특정 채팅방 구독 (ChatPages에서 호출용)
  const subscribeToChatRoom = (chatId, callback) => {
    if (!stompClient || !isConnected.value) {
      // console.error('🔍 WebSocket이 연결되어 있지 않습니다')
      return null
    }
// 
    // console.log(`🔍 전역 Store - 채팅방 ${chatId} 구독`)
    
    try {
      const subscription = stompClient.subscribe(`/topic/chat/${chatId}`, (msg) => {
        // console.log('🔍 채팅방 메시지 수신:', msg.body)
        try {
          const message = JSON.parse(msg.body)
          // 콜백 함수 실행
          if (callback) {
            callback(message)
          }
        } catch (error) {
          // console.error('🔍 메시지 파싱 실패:', error)
        }
      })
      
      return subscription
    } catch (error) {
      // console.error('🔍 채팅방 구독 실패:', error)
      return null
    }
  }

  // ✅ 전역 사용자 알림 구독
  const subscribeToGlobalNotifications = (userId) => {
    if (!stompClient || !isConnected.value) return

    // console.log(`🔍 전역 사용자 알림 구독: /topic/user/${userId}`)
    
    globalUserSubscription = stompClient.subscribe(`/topic/user/${userId}`, (msg) => {
      // console.log('🔍 전역 메시지 알림 수신:', msg.body)
      try {
        const messageNotification = JSON.parse(msg.body)
        handleGlobalMessageNotification(messageNotification)
      } catch (error) {
        // console.error('🔍 전역 알림 파싱 실패:', error)
      }
    })
  }

  // ✅ 채팅방 업데이트 구독
  const subscribeToRoomUpdates = () => {
    if (!stompClient || !isConnected.value) return

    // console.log('🔍 채팅방 업데이트 구독: /topic/rooms')
    
    roomsSubscription = stompClient.subscribe("/topic/rooms", async (msg) => {
      const roomUpdate = JSON.parse(msg.body)
      
      if (roomUpdate.action === 'quit') {
        handleRoomQuit(roomUpdate)
      } else {
        handleNewRoom(roomUpdate)
      }
    })
  }

  // ✅ 전역 메시지 알림 처리
  const handleGlobalMessageNotification = (messageNotification) => {
    // console.log('🔍 전역 메시지 알림 처리:', messageNotification)
    
    const { chatId, content, regdate, userId } = messageNotification
    
    // lastMessages 업데이트
    lastMessages.value.set(chatId, {
      content: content,
      regdate: regdate,
      userId: userId
    })
    
    // 읽지 않은 메시지 수 증가 (내가 보낸 메시지가 아닌 경우)
    if (userId !== currentUserId.value) {
      const roomIndex = chatRooms.value.findIndex(room => room.chatId === chatId)
      if (roomIndex !== -1) {
        // 현재 보고 있는 채팅방이 아닐 때만 unreadCount 증가
        if (currentViewingRoomId.value !== chatId) {
          // Vue 반응성을 위해 새 객체로 교체
          const updatedRoom = {
            ...chatRooms.value[roomIndex],
            unreadCount: (chatRooms.value[roomIndex].unreadCount || 0) + 1
          }
          
          // console.log(`🔍 채팅방 ${chatId} 읽지 않은 메시지 수:`, updatedRoom.unreadCount)
          
          // 배열의 해당 항목을 새 객체로 교체
          chatRooms.value = [
            ...chatRooms.value.slice(0, roomIndex),
            updatedRoom,
            ...chatRooms.value.slice(roomIndex + 1)
          ]
          
          // 로컬스토리지에 저장
          UnreadCountStorage.save(currentUserId.value, chatRooms.value)
        }
      }
    }
    
    // Vue 반응성 트리거
    lastMessages.value = new Map(lastMessages.value)
    
    // 토스트 알림 발생
    emitNewMessageEvent(messageNotification)
  }

  // ✅ 새 메시지 이벤트 발생
  const emitNewMessageEvent = (messageNotification) => {
    // CustomEvent로 전역 이벤트 발생
    const event = new CustomEvent('newChatMessage', {
      detail: messageNotification
    })
    window.dispatchEvent(event)
  }

  // ✅ 채팅방 목록 로드 (로컬스토리지의 unreadCount 적용)
  const loadChatRooms = async (userId, forceReload = false) => {
    if (!userId) return
    
    if (isInitialLoadComplete.value && !forceReload) {
      // console.log('🔍 채팅방 목록 이미 로드됨, 스킵')
      return
    }

    try {
      const res = await api.post(`${API_BASE}/rooms`, {
        userId: userId
      })
      
      // 로컬스토리지에서 unreadCount 불러오기
      const savedUnreadData = UnreadCountStorage.load(userId)
      
      // 서버 데이터에 로컬스토리지의 unreadCount 적용
      chatRooms.value = (res.data || []).map(room => ({
        ...room,
        unreadCount: savedUnreadData[room.chatId]?.unreadCount || 0,
        isNew: savedUnreadData[room.chatId]?.isNew || false,
        isOtherUserLeft: savedUnreadData[room.chatId]?.isOtherUserLeft || false
      }))
      
      // console.log('🔍 전역 채팅방 목록 로드 완료:', chatRooms.value.length, '개')
      // console.log('🔍 로컬스토리지에서 복원한 데이터:', savedUnreadData)
      
      // 모든 채팅방의 마지막 메시지 로드
      await loadAllLastMessages()
      
      isInitialLoadComplete.value = true
      
    } catch (error) {
      // console.error("🔍 전역 채팅방 목록 로드 실패:", error)
    }
  }

  // ✅ 모든 채팅방의 마지막 메시지 로드
  const loadAllLastMessages = async () => {
    // console.log('🔍 전역 - 모든 마지막 메시지 로드 시작')
    
    const promises = chatRooms.value.map(async (room) => {
      try {
        const res = await api.post(`${API_BASE}/messages`, {
          chatId: room.chatId
        })
        const roomMessages = res.data || []
        
        if (roomMessages.length > 0) {
          const lastMsg = roomMessages[roomMessages.length - 1]
          return {
            chatId: room.chatId,
            lastMessage: {
              content: lastMsg.content,
              regdate: lastMsg.regdate,
              userId: lastMsg.userId
            }
          }
        }
        return { chatId: room.chatId, lastMessage: null }
      } catch (error) {
        // console.error(`전역 - 채팅방 ${room.chatId} 마지막 메시지 로드 실패:`, error)
        return { chatId: room.chatId, lastMessage: null }
      }
    })
    
    const results = await Promise.all(promises)
    
    results.forEach(({ chatId, lastMessage }) => {
      if (lastMessage) {
        lastMessages.value.set(chatId, lastMessage)
      }
    })
    
    // Vue 반응성 트리거
    lastMessages.value = new Map(lastMessages.value)
    // console.log('🔍 전역 - 모든 마지막 메시지 로드 완료')
  }

  // ✅ 새 채팅방 처리
  const handleNewRoom = async (roomUpdate) => {
    if (
      roomUpdate.buyerId === currentUserId.value ||
      roomUpdate.sellerId === currentUserId.value
    ) {
      const existingRoom = chatRooms.value.find(room => room.chatId === roomUpdate.chatId)
      if (!existingRoom) {
        // 새 채팅방 추가 (상대방이 생성한 경우 unreadCount 1)
        const newRoom = {
          ...roomUpdate,
          isNew: true,
          unreadCount: roomUpdate.sellerId === currentUserId.value ? 1 : 0
        }
        
        chatRooms.value.push(newRoom)
        // console.log('🔍 전역 - 새 채팅방 추가:', roomUpdate.chatId)
        
        // 로컬스토리지 업데이트
        UnreadCountStorage.save(currentUserId.value, chatRooms.value)
        
        // 새 채팅방의 마지막 메시지도 즉시 로드
        try {
          const res = await api.post(`${API_BASE}/messages`, {
            chatId: roomUpdate.chatId
          })
          const roomMessages = res.data || []
          
          if (roomMessages.length > 0) {
            const lastMsg = roomMessages[roomMessages.length - 1]
            lastMessages.value.set(roomUpdate.chatId, {
              content: lastMsg.content,
              regdate: lastMsg.regdate,
              userId: lastMsg.userId
            })
            // Vue 반응성 트리거
            lastMessages.value = new Map(lastMessages.value)
          }
        } catch (error) {
          // console.error(`새 채팅방 ${roomUpdate.chatId} 마지막 메시지 로드 실패:`, error)
        }
      }
    }
  }

  // ✅ 채팅방 나가기 처리
  const handleRoomQuit = (quitInfo) => {
    // console.log('🔍 전역 - 채팅방 나가기:', quitInfo)
    
    if (quitInfo.userId === currentUserId.value) {
      // 본인이 나간 경우 - 채팅방 목록에서 제거
      chatRooms.value = chatRooms.value.filter(room => room.chatId !== quitInfo.chatId)
      lastMessages.value.delete(quitInfo.chatId)
    } else {
      // 상대방이 나간 경우
      const roomIndex = chatRooms.value.findIndex(room => room.chatId === quitInfo.chatId)
      if (roomIndex !== -1) {
        // 상태 업데이트 및 unreadCount 증가
        const updatedRoom = {
          ...chatRooms.value[roomIndex],
          isOtherUserLeft: true,
          unreadCount: (chatRooms.value[roomIndex].unreadCount || 0) + 1
        }
        
        // 시스템 메시지를 lastMessage로 설정
        lastMessages.value.set(quitInfo.chatId, {
          content: quitInfo.systemMessage || `${quitInfo.userId}님이 채팅방을 나갔습니다.`,
          regdate: new Date().toISOString(),
          userId: 'system'
        })
        
        // 배열의 해당 항목을 새 객체로 교체
        chatRooms.value = [
          ...chatRooms.value.slice(0, roomIndex),
          updatedRoom,
          ...chatRooms.value.slice(roomIndex + 1)
        ]
        
        // console.log(`🔍 상대방이 나간 채팅방 ${quitInfo.chatId} - unreadCount 증가`)
      }
    }
    
    // 로컬스토리지 업데이트
    UnreadCountStorage.save(currentUserId.value, chatRooms.value)
    
    // 이벤트 발생 (ChatPages에서 감지용)
    const event = new CustomEvent('chatRoomQuit', {
      detail: quitInfo
    })
    window.dispatchEvent(event)
  }

  // ✅ 특정 채팅방의 읽지 않은 메시지 수 초기화
  const markRoomAsRead = (chatId) => {
    const roomIndex = chatRooms.value.findIndex(room => room.chatId === chatId)
    if (roomIndex !== -1) {
      // isNew 플래그도 함께 제거
      const updatedRoom = {
        ...chatRooms.value[roomIndex],
        unreadCount: 0,
        isNew: false
      }
      
      chatRooms.value = [
        ...chatRooms.value.slice(0, roomIndex),
        updatedRoom,
        ...chatRooms.value.slice(roomIndex + 1)
      ]
      
      // console.log(`🔍 채팅방 ${chatId} 읽음 처리 완료`)
      
      // 로컬스토리지 업데이트
      UnreadCountStorage.save(currentUserId.value, chatRooms.value)
    }
  }

  // ✅ WebSocket 연결 해제
  const disconnectGlobalWebSocket = () => {
    // console.log('🔍 전역 WebSocket 연결 해제')
    
    if (globalUserSubscription) {
      globalUserSubscription.unsubscribe()
      globalUserSubscription = null
    }
    
    if (roomsSubscription) {
      roomsSubscription.unsubscribe()
      roomsSubscription = null
    }
    
    if (stompClient) {
      stompClient.disconnect()
      stompClient = null
    }
    
    isConnected.value = false
    isInitialLoadComplete.value = false
  }

  // ✅ 채팅방 목록을 최신 메시지 순으로 정렬
  const sortedChatRooms = computed(() => {
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
      // isNew인 채팅방을 먼저 표시
      if (a.isNew && !b.isNew) return -1
      if (!a.isNew && b.isNew) return 1
      
      // 그 다음 최신 메시지 시간 순
      const timeA = new Date(a.lastMessageTime || 0)
      const timeB = new Date(b.lastMessageTime || 0)
      return timeB - timeA
    })
  })

  // stores/chat.js에 추가
const pendingRoom = ref(null)

// 채팅 페이지로 이동할 때 사용할 정보 저장
const setPendingRoom = (roomInfo) => {
  pendingRoom.value = roomInfo
  // console.log('🔍 대기 중인 채팅방 정보 저장:', roomInfo)
}

// 대기 중인 채팅방 정보 가져오기 및 초기화
const getPendingRoom = () => {
  const room = pendingRoom.value
  pendingRoom.value = null  // 한 번 사용하면 초기화
  return room
}

  return {
    // 상태
    isConnected,
    currentUserId,
    chatRooms,
    lastMessages,
    totalUnreadCount,
    currentViewingRoomId,
    isInitialLoadComplete,
    boardNumber,
    
    // Computed
    unreadMessagesCount,
    hasUnreadMessages,
    sortedChatRooms,
    getBoardProduct,
    
    // 액션
    connectGlobalWebSocket,
    disconnectGlobalWebSocket,
    loadChatRooms,
    markRoomAsRead,
    handleGlobalMessageNotification,
    setCurrentUserId,
    setCurrentViewingRoom,
    updateLastMessage,
    removeRoom,
    sendMessage,
    createRoom,
    quitRoom,
    subscribeToChatRoom,
    setPendingRoom,
    getPendingRoom,
  }
})