<template>
  <div v-if="room" class="flex-grow-1 d-flex flex-column">
    <!-- 채팅 헤더 -->
    <div class="p-3 border-bottom">
      <h6 class="mb-0">{{ room.name }}</h6>
      <small class="text-muted">상세 채팅 보기</small>
    </div>

    <!-- 채팅 내용 (위로 고정) -->
    <div ref="chatArea" class="flex-grow-1 overflow-auto p-3 bg-light" style="display: flex; flex-direction: column;">
      <div
        v-for="msg in messages" :key="msg.id"
        class="mb-2"
        :class="msg.from === 'me' ? 'text-end' : 'text-start'"
      >
        <span
          class="badge"
          :class="msg.from === 'me' ? 'bg-primary' : 'bg-secondary'"
        >
          {{ msg.text }}
        </span>
      </div>
    </div>

    <!-- 입력창 -->
    <div class="p-3 border-top d-flex">
      <input type="text" class="form-control me-2" v-model="message" @keyup.enter="sendMessage" />
      <button class="btn btn-primary" @click="sendMessage">전송</button>
    </div>
  </div>

  <!-- 채팅방 선택 안 한 상태 -->
  <div v-else class="text-center text-muted mt-5">
    채팅을 선택해주세요.
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps(['room'])

const message = ref('')
const messages = ref([
  { id: 0, text: '안녕하세요', from: 'them' },
  { id: 1, text: '네, 안녕하세요!', from: 'me' },
])

const nextId = ref(2)

const chatArea = ref(null)

function sendMessage() {
  if (!message.value.trim()) return
  messages.value.push({ id: nextId.value++, text: message.value, from: 'me' })
  message.value = ''
}

watch(() => props.room, () => {
  // room 바뀌면 필요시 초기화 등 처리
})

watch(messages, () => {
  if (chatArea.value) {
    chatArea.value.scrollTop = chatArea.value.scrollHeight
  }
})
</script>
