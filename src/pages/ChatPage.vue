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
import ChatList from '@/components/chat/ChatList.vue'
import ChatDetail from '@/components/chat/ChatDetail.vue'
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import axios from "axios";

const API_BASE = "http://localhost:8443/api/chat";

const currentUserId = ref('');
const chatRooms = ref([]);
const selectedRoom = ref(null);
const messages = ref([]);

let stompClient = null;
const isConnected = ref(false);
let currentChatSubscription = null;

// 로그인된 사용자 정보 가져오기 (예시 - 실제로는 auth store에서)
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { userId: loggedInUserId } = storeToRefs(authStore);

// 컴포넌트 마운트 시 로그인된 사용자 ID 설정
onMounted(() => {
  if (loggedInUserId.value) {
    currentUserId.value = loggedInUserId.value;
  }
  connectWebSocket();
});

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
  } catch (e) {
    console.error("채팅방 목록 불러오기 실패", e);
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

onMounted(() => {
  connectWebSocket();
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