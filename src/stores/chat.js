// stores/chat.js - 전역 채팅 상태 관리
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import SockJS from "sockjs-client"
import { Stomp } from "@stomp/stompjs"
import api from '@/api'
import axios from 'axios'

export const useChatStore = defineStore('chat', () => {
  // 상태
  const isConnected = ref(false)
  const currentUserId = ref('')
  const chatRooms = ref([])
  const lastMessages = ref(new Map())
  const totalUnreadCount = ref(0)
  
  // WebSocket 관련
  let stompClient = null
  let globalUserSubscription = null
  let roomsSubscription = null
  
  const API_BASE = "/api/chat"

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
    console.log('🔍 전역 Store - 사용자 ID 설정:', userId)
  }

  // ✅ 마지막 메시지 업데이트
  const updateLastMessage = (chatId, messageInfo) => {
    lastMessages.value.set(chatId, messageInfo)
    // Vue 반응성 트리거
    lastMessages.value = new Map(lastMessages.value)
    console.log(`🔍 전역 Store - 채팅방 ${chatId} 마지막 메시지 업데이트`)
  }

  // ✅ 채팅방 제거
  const removeRoom = (chatId) => {
    chatRooms.value = chatRooms.value.filter(room => room.chatId !== chatId)
    lastMessages.value.delete(chatId)
    console.log(`🔍 전역 Store - 채팅방 ${chatId} 제거`)
  }

  // ✅ 메시지 전송
  const sendMessage = (messageData) => {
    if (!stompClient || !isConnected.value) {
      console.error('🔍 전역 Store - WebSocket이 연결되어 있지 않습니다')
      return false
    }
    
    try {
      console.log('🔍 전역 Store - 메시지 전송:', messageData)
      stompClient.send("/app/chat/send", {}, JSON.stringify(messageData))
      return true
    } catch (error) {
      console.error('🔍 전역 Store - 메시지 전송 실패:', error)
      return false
    }
  }

  // ✅ 채팅방 생성
  const createRoom = (roomData) => {
    if (!stompClient || !isConnected.value) {
      console.error('🔍 전역 Store - WebSocket이 연결되어 있지 않습니다')
      return false
    }
    
    try {
      stompClient.send("/app/createRoom", {}, JSON.stringify(roomData))
      return true
    } catch (error) {
      console.error('🔍 전역 Store - 채팅방 생성 실패:', error)
      return false
    }
  }

  // ✅ 채팅방 나가기
  const quitRoom = (quitData) => {
    if (!stompClient || !isConnected.value) {
      console.error('🔍 전역 Store - WebSocket이 연결되어 있지 않습니다')
      return false
    }
    
    try {
      stompClient.send("/app/chat/quit", {}, JSON.stringify(quitData))
      return true
    } catch (error) {
      console.error('🔍 전역 Store - 채팅방 나가기 실패:', error)
      return false
    }
  }

  // ✅ 전역 WebSocket 연결
  const connectGlobalWebSocket = (userId) => {
    if (!userId) {
      console.error('🔍 사용자 ID가 없어 WebSocket 연결 불가')
      return
    }

    if (stompClient && isConnected.value) {
      console.log('🔍 이미 WebSocket이 연결되어 있음')
      return
    }

    console.log('🔍 전역 WebSocket 연결 시작:', userId)
    currentUserId.value = userId

    const socket = new SockJS("http://localhost:8443/ws-chat")
    stompClient = Stomp.over(socket)

    stompClient.connect(
      {},
      () => {
        isConnected.value = true
        console.log('🔍 전역 WebSocket 연결 성공')

        // 전역 사용자 알림 구독
        subscribeToGlobalNotifications(userId)
        
        // 채팅방 업데이트 구독
        subscribeToRoomUpdates()
        
        // 채팅방 목록 로드
        loadChatRooms(userId)
      },
      (error) => {
        console.error("🔍 전역 WebSocket 연결 실패:", error)
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
      console.error('🔍 WebSocket이 연결되어 있지 않습니다')
      return null
    }

    console.log(`🔍 전역 Store - 채팅방 ${chatId} 구독`)
    
    try {
      const subscription = stompClient.subscribe(`/topic/chat/${chatId}`, (msg) => {
        console.log('🔍 채팅방 메시지 수신:', msg.body)
        try {
          const message = JSON.parse(msg.body)
          // 콜백 함수 실행
          if (callback) {
            callback(message)
          }
        } catch (error) {
          console.error('🔍 메시지 파싱 실패:', error)
        }
      })
      
      return subscription
    } catch (error) {
      console.error('🔍 채팅방 구독 실패:', error)
      return null
    }
  }

  // ✅ 전역 사용자 알림 구독
  const subscribeToGlobalNotifications = (userId) => {
    if (!stompClient || !isConnected.value) return

    console.log(`🔍 전역 사용자 알림 구독: /topic/user/${userId}`)
    
    globalUserSubscription = stompClient.subscribe(`/topic/user/${userId}`, (msg) => {
      console.log('🔍 전역 메시지 알림 수신:', msg.body)
      try {
        const messageNotification = JSON.parse(msg.body)
        handleGlobalMessageNotification(messageNotification)
      } catch (error) {
        console.error('🔍 전역 알림 파싱 실패:', error)
      }
    })
  }

  // ✅ 채팅방 업데이트 구독
  const subscribeToRoomUpdates = () => {
    if (!stompClient || !isConnected.value) return

    console.log('🔍 채팅방 업데이트 구독: /topic/rooms')
    
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
    console.log('🔍 전역 메시지 알림 처리:', messageNotification)
    
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
        // 현재 보고 있는 채팅방인지 확인 (CustomEvent로 확인)


        let isCurrentRoom = false
        
        const event = new CustomEvent('checkCurrentRoom', { 
          detail: { chatId }, 
          bubbles: true 
        })
        
        // 이벤트 리스너로 현재 채팅방 확인
        window.addEventListener('currentRoomResponse', (e) => {
          isCurrentRoom = e.detail.isCurrentRoom
        }, { once: true })
        
        window.dispatchEvent(event)
        
        // 현재 보고 있는 채팅방이 아니면 unreadCount 증가
        if (!isCurrentRoom) {
          chatRooms.value[roomIndex].unreadCount = (chatRooms.value[roomIndex].unreadCount || 0) + 1
          console.log(`🔍 채팅방 ${chatId} 읽지 않은 메시지 수:`, chatRooms.value[roomIndex].unreadCount)
        }
      }
    }
    
    // Vue 반응성 트리거
    lastMessages.value = new Map(lastMessages.value)
    
    // 토스트 알림 발생 (다른 컴포넌트에서 감지 가능)
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

  // ✅ 채팅방 목록 로드
 // ✅ 채팅방 목록 로드 (기존 unreadCount 유지)
const loadChatRooms = async (userId) => {
  if (!userId) return

  try {
    // 기존 unreadCount 저장
    const existingUnreadCounts = {}
    chatRooms.value.forEach(room => {
      if (room.unreadCount > 0) {
        existingUnreadCounts[room.chatId] = room.unreadCount
      }
    })
    
    console.log('🔍 기존 unreadCount 저장:', existingUnreadCounts)
    
    const res = await api.post(`${API_BASE}/rooms`, {
      userId: userId
    })
    
    // 새로 로드한 데이터에 기존 unreadCount 복원
    chatRooms.value = (res.data || []).map(room => ({
      ...room,
      unreadCount: existingUnreadCounts[room.chatId] || room.unreadCount || 0
    }))
    
    console.log('🔍 전역 채팅방 목록 로드 완료:', chatRooms.value.length, '개')
    console.log('🔍 unreadCount 복원 후:', chatRooms.value.map(r => ({
      id: r.chatId,
      unread: r.unreadCount
    })))
    
    // 모든 채팅방의 마지막 메시지 로드
    await loadAllLastMessages()
    
  } catch (error) {
    console.error("🔍 전역 채팅방 목록 로드 실패:", error)
  }
}

  // ✅ 모든 채팅방의 마지막 메시지 로드
  const loadAllLastMessages = async () => {
    console.log('🔍 전역 - 모든 마지막 메시지 로드 시작')
    
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
        console.error(`전역 - 채팅방 ${room.chatId} 마지막 메시지 로드 실패:`, error)
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
    console.log('🔍 전역 - 모든 마지막 메시지 로드 완료')
  }

  // ✅ 새 채팅방 처리
  const handleNewRoom = async (roomUpdate) => {
    if (
      roomUpdate.buyerId === currentUserId.value ||
      roomUpdate.sellerId === currentUserId.value
    ) {
      const existingRoom = chatRooms.value.find(room => room.chatId === roomUpdate.chatId)
      if (!existingRoom) {
        chatRooms.value.push(roomUpdate)
        console.log('🔍 전역 - 새 채팅방 추가:', roomUpdate.chatId)
        
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
          console.error(`새 채팅방 ${roomUpdate.chatId} 마지막 메시지 로드 실패:`, error)
        }
      }
    }
  }

  // ✅ 채팅방 나가기 처리
  const handleRoomQuit = (quitInfo) => {
    console.log('🔍 전역 - 채팅방 나가기:', quitInfo)
    
    chatRooms.value = chatRooms.value.filter(room => room.chatId !== quitInfo.chatId)
    lastMessages.value.delete(quitInfo.chatId)
    
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
      chatRooms.value[roomIndex].unreadCount = 0
      console.log(`🔍 채팅방 ${chatId} 읽음 처리 완료`)
    }
  }

  // ✅ WebSocket 연결 해제
  const disconnectGlobalWebSocket = () => {
    console.log('🔍 전역 WebSocket 연결 해제')
    
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
      const timeA = new Date(a.lastMessageTime || 0)
      const timeB = new Date(b.lastMessageTime || 0)
      return timeB - timeA
    })
  })

  return {
    // 상태
    isConnected,
    currentUserId,
    chatRooms,
    lastMessages,
    totalUnreadCount,
    
    // Computed
    unreadMessagesCount,
    hasUnreadMessages,
    sortedChatRooms,
    
    // 액션
    connectGlobalWebSocket,
    disconnectGlobalWebSocket,
    loadChatRooms,
    markRoomAsRead,
    handleGlobalMessageNotification,
    setCurrentUserId,
    updateLastMessage,
    removeRoom,
    sendMessage,
    createRoom,
    quitRoom,
    subscribeToChatRoom
  }
})