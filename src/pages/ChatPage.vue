<template>
  <div class="container-fluid">
    <div class="row" style="height: 90vh;">
      <!-- 왼쪽: 채팅 목록 -->
      <div class="col-md-4 border-end overflow-auto">
        <ChatList 
          :chatRooms="chatRooms" 
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
import { ref, onMounted, onUnmounted } from 'vue'
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

let stompClient = null;
const isConnected = ref(false);
let currentChatSubscription = null;

// 로그인된 사용자 정보 가져오기
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { userId: loggedInUserId } = storeToRefs(authStore);

// WebSocket 연결 및 구독
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

      // 실시간 채팅방 추가/업데이트 구독
      stompClient.subscribe("/topic/rooms", (msg) => {
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

// 새로 생성된 채팅방 확인 및 자동 선택
const checkAndSelectNewRoom = async (newRoom) => {
  const { boardId } = route.query;
  
  // URL에 boardId가 있고, 새로 생성된 채팅방이 해당 게시글의 채팅방이면 자동 선택
  if (boardId && parseInt(newRoom.boardId) === parseInt(boardId) && !selectedRoom.value) {
    console.log('새로 생성된 채팅방 자동 선택:', newRoom);
    await selectRoom(newRoom);
  }
};

// 특정 채팅방 구독
const subscribeToChatRoom = (chatId) => {
  if (!stompClient || !isConnected.value) {
    console.error("WebSocket이 연결되어 있지 않습니다.");
    return;
  }

  // 이전 채팅방 구독 해제
  if (currentChatSubscription) {
    currentChatSubscription.unsubscribe();
    currentChatSubscription = null;
  }

  // 새 채팅방 구독
  currentChatSubscription = stompClient.subscribe(`/topic/chat/${chatId}`, (msg) => {
    const message = JSON.parse(msg.body);
    messages.value.push(message);
  });
};

// 채팅방 목록 불러오기
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
    
    // 채팅방 목록 로드 후 URL 쿼리에 따른 자동 선택 실행
    await handleAutoSelectRoom();
    
  } catch (e) {
    console.error("채팅방 목록 불러오기 실패", e);
  }
};

// URL 쿼리에 따른 자동 채팅방 선택
const handleAutoSelectRoom = async () => {
  const { roomId, boardId, newBoardId } = route.query;
  
  if (roomId) {
    // 1. roomId가 있으면 해당 채팅방 직접 선택
    const targetRoom = chatRooms.value.find(room => room.chatId === parseInt(roomId));
    if (targetRoom) {
      console.log('URL roomId로 채팅방 자동 선택:', targetRoom);
      await selectRoom(targetRoom);
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

// 채팅방 선택
const selectRoom = async (room) => {
  selectedRoom.value = room;
  messages.value = [];

  try {
    // 기존 메시지 로드
    const res = await axios.get(`${API_BASE}/messages`, {
      params: { chatId: room.chatId },
    });
    messages.value = res.data || [];
    console.log('채팅방 메시지 로드 완료:', messages.value.length, '개');
  } catch (e) {
    console.error("메시지 불러오기 실패", e);
  }

  // 채팅방 구독
  if (isConnected.value) {
    subscribeToChatRoom(room.chatId);
  }
};

// 메시지 전송
const sendMessage = (messageData) => {
  if (!isConnected.value) {
    alert("WebSocket이 연결되어 있지 않습니다.");
    return;
  }

  const msg = {
    ...messageData,
    userId: currentUserId.value,
    regdate: new Date().toISOString(),
  };

  stompClient.send("/app/chat/send", {}, JSON.stringify(msg));
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