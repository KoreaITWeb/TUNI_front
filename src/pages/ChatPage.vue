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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import ChatList from '@/components/chat/ChatList.vue'
import ChatDetail from '@/components/chat/ChatDetail.vue'
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import axios from "axios";

const API_BASE = "http://localhost:8443/api/chat";
const route = useRoute();

const currentUserId = ref('');
const chatRooms = ref([]);
const selectedRoom = ref(null);
const messages = ref([]);

// 각 채팅방의 마지막 메시지 저장
const lastMessages = ref(new Map()); // chatId -> { content, regdate, userId }


let stompClient = null;
const isConnected = ref(false);
let currentChatSubscription = null;

// 로그인된 사용자 정보 가져오기
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { userId: loggedInUserId } = storeToRefs(authStore);

// ✅ 새로 추가: ChatDetail에서 전달받은 마지막 메시지 처리
const handleLastMessageUpdate = (messageInfo) => {
  console.log('🔍 ChatPages - 이벤트 수신:', messageInfo);
  
  lastMessages.value.set(messageInfo.chatId, {
    content: messageInfo.lastMessage,
    regdate: messageInfo.lastMessageTime,
    userId: messageInfo.lastMessageUserId
  });
  
  console.log('🔍 ChatPages - lastMessages Map:', lastMessages.value);
  
  // Vue 반응성 트리거를 위해 새로운 Map 생성
  lastMessages.value = new Map(lastMessages.value);
}

// lastMessage 정보가 포함된 채팅방 목록 계산
const enhancedChatRooms = computed(() => {
  return chatRooms.value.map(room => {
    const lastMsg = lastMessages.value.get(room.chatId);
    return {
      ...room,
      lastMessage: lastMsg?.content || null,
      lastMessageTime: lastMsg?.regdate || room.updatedAt,
      lastMessageUserId: lastMsg?.userId || null,
      unreadCount: room.unreadCount || 0
    };
  }).sort((a, b) => {
    // 최신 메시지 시간 순으로 정렬
    const timeA = new Date(a.lastMessageTime || 0);
    const timeB = new Date(b.lastMessageTime || 0);
    return timeB - timeA;
  });
});

// ✅ 새로 추가: 모든 채팅방의 마지막 메시지 로드 함수 (성능 최적화)
const loadAllLastMessages = async () => {
  console.log('🔍 모든 채팅방의 마지막 메시지 로드 시작 (선택하지 않아도 표시)');
  
  // 성능 최적화: 병렬로 모든 채팅방의 마지막 메시지 로드
  const promises = chatRooms.value.map(async (room) => {
    try {
      const res = await axios.get(`${API_BASE}/messages`, {
        params: { chatId: room.chatId },
      });
      const roomMessages = res.data || [];
      
      if (roomMessages.length > 0) {
        const lastMsg = roomMessages[roomMessages.length - 1]; // 마지막 메시지
        console.log(`🔍 Room ${room.chatId} (${getOtherUserNameForRoom(room)}) 마지막 메시지:`, lastMsg.content);
        
        return {
          chatId: room.chatId,
          lastMessage: {
            content: lastMsg.content,
            regdate: lastMsg.regdate,
            userId: lastMsg.userId
          }
        };
      }
      return { chatId: room.chatId, lastMessage: null };
    } catch (error) {
      console.error(`채팅방 ${room.chatId} 마지막 메시지 로드 실패:`, error);
      return { chatId: room.chatId, lastMessage: null };
    }
  });
  
  // 모든 요청이 완료될 때까지 대기
  const results = await Promise.all(promises);
  
  // 결과를 lastMessages Map에 저장
  results.forEach(({ chatId, lastMessage }) => {
    if (lastMessage) {
      lastMessages.value.set(chatId, lastMessage);
    }
  });
  
  console.log('🔍 모든 마지막 메시지 로드 완료 (총 ' + results.filter(r => r.lastMessage).length + '개):', lastMessages.value);
  
  // Vue 반응성 트리거 - ChatList에서 즉시 표시됨
  lastMessages.value = new Map(lastMessages.value);
};

// ✅ 새로 추가: 채팅방의 상대방 이름 가져오기 헬퍼 함수
const getOtherUserNameForRoom = (room) => {
  return room.buyerId === currentUserId.value ? room.sellerId : room.buyerId;
};

// ✅ 수정: WebSocket 연결 및 구독 (전역 사용자 알림 추가)
const connectWebSocket = () => {
  if (stompClient) {
    return;
  }

  const socket = new SockJS("http://localhost:8443/ws-chat");
  stompClient = Stomp.over(socket);

  stompClient.connect(
    {},
    () => {
      isConnected.value = true;

      // ✅ 새로 추가: 전역 사용자 알림 구독 (모든 채팅방의 메시지를 받기 위함)
      if (currentUserId.value) {
        console.log(`🔍 전역 사용자 알림 구독 시작: /topic/user/${currentUserId.value}`);
        stompClient.subscribe(`/topic/user/${currentUserId.value}`, (msg) => {
          console.log('🔍 전역 메시지 알림 수신:', msg.body);
          try {
            const messageNotification = JSON.parse(msg.body);
            console.log('🔍 파싱된 전역 알림:', messageNotification);
            
            // 전역 메시지 알림 처리
            handleGlobalMessageNotification(messageNotification);
            
          } catch (error) {
            console.error('🔍 전역 알림 파싱 실패:', error);
          }
        });
      }

      // 실시간 채팅방 추가/업데이트 구독
      stompClient.subscribe("/topic/rooms", async (msg) => {
        const roomUpdate = JSON.parse(msg.body);
        
        if (roomUpdate.action === 'quit') {
          handleRoomQuitUpdate(roomUpdate);
        } else {
          // 새 채팅방 추가
          if (
            roomUpdate.buyerId === currentUserId.value ||
            roomUpdate.sellerId === currentUserId.value
          ) {
            const existingRoom = chatRooms.value.find(room => room.chatId === roomUpdate.chatId);
            if (!existingRoom) {
              chatRooms.value.push(roomUpdate);
              
              // ✅ 새 채팅방의 마지막 메시지도 즉시 로드
              try {
                const res = await axios.get(`${API_BASE}/messages`, {
                  params: { chatId: roomUpdate.chatId },
                });
                const roomMessages = res.data || [];
                
                if (roomMessages.length > 0) {
                  const lastMsg = roomMessages[roomMessages.length - 1];
                  lastMessages.value.set(roomUpdate.chatId, {
                    content: lastMsg.content,
                    regdate: lastMsg.regdate,
                    userId: lastMsg.userId
                  });
                  // Vue 반응성 트리거
                  lastMessages.value = new Map(lastMessages.value);
                  console.log(`🔍 새 채팅방 ${roomUpdate.chatId}의 마지막 메시지 로드됨:`, lastMsg.content);
                }
              } catch (error) {
                console.error(`새 채팅방 ${roomUpdate.chatId} 마지막 메시지 로드 실패:`, error);
              }
              
              // 새로 생성된 채팅방이 현재 찾고 있는 게시글의 채팅방인지 확인
              checkAndSelectNewRoom(roomUpdate);
            }
          }
        }
      });
    },
    (error) => {
      console.error("WebSocket 연결 실패:", error);
      isConnected.value = false;
      
      // 재연결 시도
      setTimeout(() => {
        stompClient = null;
        connectWebSocket();
      }, 5000);
    }
  );
};

// ✅ 새로 추가: 전역 메시지 알림 처리 함수
const handleGlobalMessageNotification = (messageNotification) => {
  console.log('🔍 전역 메시지 알림 처리 시작:', messageNotification);
  
  // 메시지 정보 추출
  const { chatId, content, regdate, userId, messageType } = messageNotification;
  
  // ✅ 모든 채팅방의 lastMessages 업데이트 (현재 선택 여부와 관계없이)
  lastMessages.value.set(chatId, {
    content: content,
    regdate: regdate,
    userId: userId
  });
  
  console.log(`🔍 채팅방 ${chatId}의 lastMessage 업데이트됨:`, content);
  
  // ✅ 읽지 않은 메시지 수 관리
  if (userId !== currentUserId.value) { // 내가 보낸 메시지가 아닌 경우
    const roomIndex = chatRooms.value.findIndex(room => room.chatId === chatId);
    if (roomIndex !== -1) {
      // 현재 선택된 채팅방이 아니면 읽지 않은 메시지 수 증가
      if (!selectedRoom.value || selectedRoom.value.chatId !== chatId) {
        chatRooms.value[roomIndex].unreadCount = (chatRooms.value[roomIndex].unreadCount || 0) + 1;
        console.log(`🔍 채팅방 ${chatId} 읽지 않은 메시지 수 증가:`, chatRooms.value[roomIndex].unreadCount);
      }
    }
  }
  
  // ✅ 현재 선택된 채팅방의 메시지라면 messages 배열에도 추가
  if (selectedRoom.value && chatId === selectedRoom.value.chatId) {
    console.log('🔍 현재 채팅방 메시지 - messages 배열에 추가');
    
    // 전체 메시지 객체 구성
    const fullMessage = {
      chatId: chatId,
      content: content,
      regdate: regdate,
      userId: userId,
      boardId: selectedRoom.value.boardId
    };
    
    messages.value.push(fullMessage);
    messages.value = [...messages.value];
  }
  
  // ✅ Vue 반응성 트리거 - ChatList 즉시 업데이트
  lastMessages.value = new Map(lastMessages.value);
  
  console.log('🔍 전역 메시지 알림 처리 완료');
};

// 새로 생성된 채팅방 확인 및 자동 선택
const checkAndSelectNewRoom = async (newRoom) => {
  const { boardId } = route.query;
  
  // URL에 boardId가 있고, 새로 생성된 채팅방이 해당 게시글의 채팅방이면 자동 선택
  if (boardId && parseInt(newRoom.boardId) === parseInt(boardId) && !selectedRoom.value) {
    console.log('새로 생성된 채팅방 자동 선택:', newRoom);
    await selectRoom(newRoom);
  }
};

// ✅ 수정: 특정 채팅방 구독 (중복 제거 및 역할 명확화)
const subscribeToChatRoom = (chatId) => {
  console.log('🔍 subscribeToChatRoom 호출됨, chatId:', chatId);
  
  if (!stompClient || !isConnected.value) {
    console.error("🔍 WebSocket이 연결되어 있지 않습니다.");
    return;
  }

  if (stompClient.connected !== true) {
    console.error("🔍 STOMP 클라이언트가 연결되지 않음");
    return;
  }

  // 이전 채팅방 구독 해제
  if (currentChatSubscription) {
    console.log('🔍 이전 채팅방 구독 해제');
    currentChatSubscription.unsubscribe();
    currentChatSubscription = null;
  }

  console.log(`🔍 채팅방 ${chatId} 개별 구독 시작 (현재 채팅방 전용)`);

  try {
    // ✅ 개별 채팅방 구독 (현재 선택된 채팅방의 실시간 메시지만 처리)
    currentChatSubscription = stompClient.subscribe(`/topic/chat/${chatId}`, (msg) => {
      console.log('🔍 개별 채팅방 메시지 수신:', msg.body);
      try {
        const message = JSON.parse(msg.body);
        console.log('🔍 파싱된 개별 채팅방 메시지:', message);
        
        // ✅ 현재 선택된 채팅방의 메시지만 messages 배열에 추가
        if (selectedRoom.value && message.chatId === selectedRoom.value.chatId) {
          console.log('🔍 현재 채팅방 메시지 - messages 배열에 추가');
          
          // 서버 응답 메시지만 추가 (Optimistic Update 없음)
          messages.value.push(message);
          
          // 강제로 Vue 반응성 트리거
          messages.value = [...messages.value];
          
          console.log('🔍 현재 메시지 목록 길이:', messages.value.length);
        }
        
        // ✅ 주의: lastMessages와 unreadCount는 전역 구독에서 처리
        // 여기서는 중복 처리하지 않음 (전역 알림이 더 포괄적)
        
      } catch (error) {
        console.error('🔍 개별 채팅방 메시지 파싱 실패:', error);
        console.log('🔍 파싱 실패한 원본 메시지:', msg.body);
      }
    });
    
    console.log('🔍 개별 채팅방 구독 성공:', currentChatSubscription);
  } catch (error) {
    console.error('🔍 개별 채팅방 구독 실패:', error);
  }
};

// ✅ 수정: 채팅방 목록 불러오기 (전역 구독 재시도 로직 추가)
const loadChatRoomsByUser = async (userId) => {
  if (!userId) {
    alert("사용자 ID를 입력하세요.");
    return;
  }

  currentUserId.value = userId;

  try {
    const res = await axios.get(`${API_BASE}/rooms`, {
      params: { userId: userId },
    });
    chatRooms.value = res.data || [];

    console.log('채팅방 목록 로드 완료:', chatRooms.value);

    // ✅ 모든 채팅방의 마지막 메시지 로드 (채팅방 선택 전에 미리 로드)
    await loadAllLastMessages();
    
    console.log('🔍 모든 채팅방의 마지막 메시지 로드 완료 - 선택하지 않아도 표시됨');
    
    // ✅ 새로 추가: 전역 사용자 구독 재시도 (userId가 변경된 경우 대비)
    if (isConnected.value && stompClient?.connected === true) {
      console.log(`🔍 전역 사용자 알림 재구독 시도: /topic/user/${userId}`);
      try {
        stompClient.subscribe(`/topic/user/${userId}`, (msg) => {
          console.log('🔍 전역 메시지 알림 수신:', msg.body);
          try {
            const messageNotification = JSON.parse(msg.body);
            handleGlobalMessageNotification(messageNotification);
          } catch (error) {
            console.error('🔍 전역 알림 파싱 실패:', error);
          }
        });
      } catch (error) {
        console.error('🔍 전역 사용자 구독 실패:', error);
      }
    }
    
    // 채팅방 목록 로드 후 URL 쿼리에 따른 자동 선택 실행
    await handleAutoSelectRoom();
    
  } catch (e) {
    console.error("채팅방 목록 불러오기 실패", e);
  }
};

// URL 쿼리에 따른 자동 채팅방 선택
const handleAutoSelectRoom = async () => {
  const { roomId, boardId, newBoardId } = route.query;
  
  console.log('자동 채팅방 선택 시작, 쿼리:', { roomId, boardId, newBoardId });
  console.log('WebSocket 연결 상태:', isConnected.value);
  
  // WebSocket 연결이 안 되어 있으면 잠시 대기
  if (!isConnected.value) {
    console.log('WebSocket 연결 대기 중...');
    setTimeout(handleAutoSelectRoom, 500);
    return;
  }
  
  if (roomId) {
    // 1. roomId가 있으면 해당 채팅방 직접 선택
    const targetRoom = chatRooms.value.find(room => room.chatId === parseInt(roomId));
    if (targetRoom) {
      console.log('URL roomId로 채팅방 자동 선택:', targetRoom);
      await selectRoom(targetRoom);
      
      // ✅ 주석 해제: 추가로 구독 상태 확인 및 재구독
      setTimeout(() => {
        if (!currentChatSubscription && isConnected.value) {
          console.log('구독이 안되어 있어서 재구독 시도');
          subscribeToChatRoom(targetRoom.chatId);
        }
      }, 1000);
      return;
    }
  }
  
  if (newBoardId) {
    // 2. newBoardId가 있으면 해당 게시글의 채팅방 선택 (기존 채팅방에서 새 게시글로)
    const targetRoom = chatRooms.value.find(room => 
      parseInt(room.boardId) === parseInt(newBoardId)
    );
    if (targetRoom) {
      console.log('URL newBoardId로 채팅방 자동 선택:', targetRoom);
      await selectRoom(targetRoom);
      
      // ✅ 주석 해제: 추가로 구독 상태 확인 및 재구독
      setTimeout(() => {
        if (!currentChatSubscription && isConnected.value) {
          console.log('구독이 안되어 있어서 재구독 시도');
          subscribeToChatRoom(targetRoom.chatId);
        }
      }, 1000);
      return;
    }
  }
  
  if (boardId) {
    // 3. boardId가 있으면 해당 게시글의 채팅방 찾기 (새 채팅방 생성용)
    const targetRoom = chatRooms.value.find(room => 
      parseInt(room.boardId) === parseInt(boardId)
    );
    if (targetRoom) {
      console.log('URL boardId로 채팅방 자동 선택:', targetRoom);
      await selectRoom(targetRoom);
      
      // ✅ 주석 해제: 추가로 구독 상태 확인 및 재구독
      setTimeout(() => {
        if (!currentChatSubscription && isConnected.value) {
          console.log('구독이 안되어 있어서 재구독 시도');
          subscribeToChatRoom(targetRoom.chatId);
        }
      }, 1000);
      return;
    } else {
      console.log('boardId에 해당하는 채팅방을 찾을 수 없음. 채팅방 생성 대기 중...');
      // 새 채팅방이 생성될 때까지 대기 (checkAndSelectNewRoom에서 처리)
    }
  }
};

// 채팅방 생성
const createChatRoom = (roomData) => {
  if (!isConnected.value) {
    alert("WebSocket 연결 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  stompClient.send("/app/createRoom", {}, JSON.stringify(roomData));
};

// ✅ 수정: 채팅방 선택 (구독 주석 해제)
const selectRoom = async (room) => {
  console.log('🔍 채팅방 선택:', room);
  selectedRoom.value = room;
  messages.value = [];

  try {
    // 기존 메시지 로드
    const res = await axios.get(`${API_BASE}/messages`, {
      params: { chatId: room.chatId },
    });
    messages.value = res.data || [];
    console.log('🔍 채팅방 메시지 로드 완료:', messages.value.length, '개');

    // ✅ 메시지 로드 후 마지막 메시지 정보 업데이트
    if (messages.value.length > 0) {
      const lastMsg = messages.value[messages.value.length - 1];
      console.log('🔍 선택한 채팅방의 마지막 메시지:', lastMsg);
      
      lastMessages.value.set(room.chatId, {
        content: lastMsg.content,
        regdate: lastMsg.regdate,
        userId: lastMsg.userId
      });
      
      // Vue 반응성 트리거
      lastMessages.value = new Map(lastMessages.value);
    }
    
    // ✅ 채팅방 선택 시 읽지 않은 메시지 수 초기화
    const roomIndex = chatRooms.value.findIndex(r => r.chatId === room.chatId);
    if (roomIndex !== -1) {
      chatRooms.value[roomIndex].unreadCount = 0;
    }

  } catch (e) {
    console.error("메시지 불러오기 실패", e);
  }

  // ✅ 수정: 채팅방 구독 (주석 해제 및 개선)
  console.log('🔍 WebSocket 연결 상태:', isConnected.value);
  console.log('🔍 stompClient 상태:', stompClient?.connected);
  
  if (isConnected.value && stompClient?.connected === true) {
    console.log('🔍 즉시 구독 시도');
    subscribeToChatRoom(room.chatId);
  } else {
    console.log('🔍 WebSocket 연결 대기 중, 연결 후 구독 예정');
    
    // WebSocket 연결 대기 후 구독 (개선된 로직)
    let attempts = 0;
    const maxAttempts = 50; // 5초 대기
    
    const checkConnection = setInterval(() => {
      attempts++;
      console.log(`🔍 WebSocket 연결 확인 시도 ${attempts}/${maxAttempts}`);
      
      if (isConnected.value && stompClient?.connected === true) {
        console.log('🔍 WebSocket 연결됨, 이제 구독 시도');
        subscribeToChatRoom(room.chatId);
        clearInterval(checkConnection);
      } else if (attempts >= maxAttempts) {
        console.error('🔍 WebSocket 연결 타임아웃 - 실시간 채팅 불가능');
        clearInterval(checkConnection);
        alert('실시간 채팅 연결에 실패했습니다. 페이지를 새로고침해주세요.');
      }
    }, 100);
  }
};

// ✅ 수정: 메시지 전송 (Optimistic Update 제거)
const sendMessage = (messageData) => {
  console.log('🔍 sendMessage 호출됨:', messageData);
  
  if (!isConnected.value) {
    console.error('🔍 WebSocket이 연결되어 있지 않습니다.');
    alert("WebSocket이 연결되어 있지 않습니다.");
    return;
  }

  if (!selectedRoom.value) {
    console.error('🔍 선택된 채팅방이 없습니다.');
    alert("채팅방을 선택해주세요.");
    return;
  }

  if (!stompClient || stompClient.connected !== true) {
    console.error('🔍 STOMP 클라이언트가 연결되지 않음');
    alert("실시간 채팅 연결에 문제가 있습니다. 페이지를 새로고침해주세요.");
    return;
  }

  const msg = {
    ...messageData,
    userId: currentUserId.value,
    regdate: new Date().toISOString(),
  };

  console.log('🔍 전송할 메시지:', msg);

  try {
    // ✅ Optimistic Update 제거 - 서버 응답만 기다림
    // 즉시 화면에 표시하지 않고 서버 응답을 기다림
    
    // ✅ lastMessages는 즉시 업데이트 (ChatList 표시용)
    lastMessages.value.set(selectedRoom.value.chatId, {
      content: msg.content,
      regdate: msg.regdate,
      userId: msg.userId
    });

    // 서버로 메시지 전송
    console.log('🔍 서버로 메시지 전송 중...');
    stompClient.send("/app/chat/send", {}, JSON.stringify(msg));
    console.log('🔍 서버로 메시지 전송 완료 - 서버 응답 대기 중');
    
  } catch (error) {
    console.error('🔍 메시지 전송 실패:', error);
    alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
  }
};

// 채팅방 나가기
const quitChatRoom = async () => {
  if (!selectedRoom.value || !currentUserId.value) {
    alert('나갈 채팅방이 선택되지 않았습니다.');
    return;
  }

  if (!isConnected.value) {
    alert('WebSocket이 연결되어 있지 않습니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  try {
    // WebSocket으로 나가기 요청
    const quitData = {
      userId: currentUserId.value,
      chatId: selectedRoom.value.chatId,
      action: 'quit'
    };

    console.log('채팅방 나가기 요청:', quitData);
    stompClient.send("/app/chat/quit", {}, JSON.stringify(quitData));

    // 즉시 UI 업데이트 (Optimistic Update)
    chatRooms.value = chatRooms.value.filter(room => room.chatId !== selectedRoom.value.chatId);
    
// ✅ 새로 추가: 나간 채팅방의 마지막 메시지 정보도 제거
    lastMessages.value.delete(selectedRoom.value.chatId);

    // 현재 선택된 채팅방 초기화
    if (currentChatSubscription) {
      currentChatSubscription.unsubscribe();
      currentChatSubscription = null;
    }
    
    selectedRoom.value = null;
    messages.value = [];
    
    alert('채팅방에서 나갔습니다.');

  } catch (error) {
    console.error('채팅방 나가기 실패:', error);
    alert('채팅방 나가기에 실패했습니다. 다시 시도해주세요.');
    
    // 실패 시 채팅방 목록 다시 로드
    if (currentUserId.value) {
      loadChatRoomsByUser(currentUserId.value);
    }
  }
};

// 채팅방 나가기 업데이트 처리
const handleRoomQuitUpdate = (quitInfo) => {
  console.log('채팅방 나가기 업데이트:', quitInfo);
  
  if (quitInfo.userId === currentUserId.value) {
    // 현재 사용자가 나간 경우 (이미 Optimistic Update로 처리됨)
    console.log('본인이 채팅방을 나갔습니다.');
  } else {
    // 다른 사용자가 나간 경우
    console.log('상대방이 채팅방을 나갔습니다.');
    
    // 채팅방 목록에서 해당 채팅방 제거
    chatRooms.value = chatRooms.value.filter(room => room.chatId !== quitInfo.chatId);
    
// ✅ 새로 추가: 나간 채팅방의 마지막 메시지 정보도 제거
    lastMessages.value.delete(quitInfo.chatId);

    // 현재 선택된 채팅방이 나간 방이면 초기화
    if (selectedRoom.value && selectedRoom.value.chatId === quitInfo.chatId) {
      if (currentChatSubscription) {
        currentChatSubscription.unsubscribe();
        currentChatSubscription = null;
      }
      
      selectedRoom.value = null;
      messages.value = [];
      
      alert('상대방이 채팅방을 나갔습니다. 채팅방이 종료됩니다.');
    }
    
    // 전체 채팅방 목록 새로고침
    if (currentUserId.value) {
      loadChatRoomsByUser(currentUserId.value);
    }
  }
};

// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  // 로그인된 사용자 ID 설정
  if (loggedInUserId.value) {
    currentUserId.value = loggedInUserId.value;
  }
  
  // URL 쿼리에서 사용자 ID 확인 (ProductDetail에서 전달된 경우)
  const { userId } = route.query;
  if (userId) {
    currentUserId.value = userId;
  }
  
  // WebSocket 연결
  connectWebSocket();
  
  // 사용자 ID가 있으면 채팅방 목록 자동 로드
  if (currentUserId.value) {
    await loadChatRoomsByUser(currentUserId.value);
  }
});

onUnmounted(() => {
  if (currentChatSubscription) {
    currentChatSubscription.unsubscribe();
  }
  if (stompClient) {
    stompClient.disconnect();
  }
});
</script>