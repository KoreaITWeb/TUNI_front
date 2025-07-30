<template>
  <div>
    <h5 class="p-3">💬 채팅 목록</h5>
    <ul class="list-group list-group-flush">
      <li
        v-for="room in props.chatRooms"
        :key="room.id"
        class="list-group-item list-group-item-action d-flex align-items-center"
        @click="$emit('selectRoom', room)"
        style="cursor: pointer;"
      >
        <!-- 프로필 이미지 -->
        <img
          :src="room.profileImage"
          alt="프로필"
          class="rounded-circle me-3"
          width="45"
          height="45"
        />

        <!-- 이름 + 메시지 -->
        <div class="flex-grow-1">
          <div class="fw-bold">{{ room.name }}</div>
          <small class="text-muted">{{ room.lastMessage }}</small>
        </div>

        <!-- 시간 -->
        <div class="text-muted ms-2" style="font-size: 0.8rem;">
          {{ formatTimeAgo(room.updatedAt) }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'
import ko from 'date-fns/locale/ko'

const props = defineProps(['chatRooms'])

function formatTimeAgo(timeString) {
  return formatDistanceToNow(new Date(timeString), {
    addSuffix: true,
    locale: ko,
  })
}
</script>
