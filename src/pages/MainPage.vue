<template>
  <div class="page-container">
    <!-- 왼쪽 사이드바 공간 확보 -->
    <aside class="sidebar">
      <!-- 사이드바 내용 예시 -->
      <p>카테고리</p>
    </aside>

    <!-- 카드 영역 -->
    <div class="card-container">
      <div class="card" v-for="i in 6" :key="i">
        <img src="#" class="card-img-top" alt="#">
        <div class="card-body">
          <h5 class="card-title">Card title</h5>
          <p class="card-text">Some quick example text...</p>
          <a href="#" class="btn btn-primary">Go somewhere</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  padding: 20px;
}

/* 사이드바 */
.sidebar {
  width: 200px;
  margin-right: 20px;
}

/* 카드 영역 */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
  gap: 16px;
  flex: 1;
}

/* 카드 */
.card {
  width: 100%;
  box-sizing: border-box;
}
</style>

<script>
export default {
  name: 'MainPage'
}
</script>
