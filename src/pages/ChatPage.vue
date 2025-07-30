<template>
  <div class="container-fluid">
    <div class="row" style="height: 90vh;">
      <!-- 왼쪽: 채팅 목록 -->
      <div class="col-md-4 border-end overflow-auto">
        <ChatList :chatRooms="chatRooms" @selectRoom="selectRoom" />
      </div>

      <!-- 오른쪽: 채팅 내용 -->
      <div class="col-md-8 d-flex flex-column">
        <ChatDetail :room="selectedRoom" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatList from '@/components/chat/ChatList.vue'
import ChatDetail from '@/components/chat/ChatDetail.vue'


// 예시 채팅방 목록
const chatRooms = ref([
  {
    id: 1,
    name: '김민수',
    lastMessage: '오늘 거래 가능하신가요?',
    updatedAt: new Date(),
    profileImage: 'https://via.placeholder.com/45'
  },
  {
    id: 2,
    name: '박지은',
    lastMessage: '네 괜찮습니다!',
    updatedAt: new Date(),
    profileImage: 'https://via.placeholder.com/45'
  }
])

const selectedRoom = ref(null)

function selectRoom(room) {
  selectedRoom.value = room
}
</script>
