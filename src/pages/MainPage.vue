<template>
  <div class="container-fluid">
    <div class="row">
      <!-- 왼쪽 필터 영역 -->
      <div class="col-md-3 border-end">
        <h5>Category</h5>
        <div>
          <span class="badge bg-secondary me-1">Electronics ✕</span>
          <span class="badge bg-secondary me-1">Books ✕</span>
          <span class="badge bg-secondary me-1">Clothings ✕</span>
        </div>

        <div class="form-check mt-3" v-for="n in 3" :key="n">
          <input class="form-check-input" type="checkbox" :id="'label' + n" checked>
          <label class="form-check-label" :for="'label' + n">Label</label>
        </div>

        <label class="form-label mt-3">Price</label>
        <input type="range" class="form-range" min="0" max="100">
      </div>

      <!-- 오른쪽 콘텐츠 영역 -->
      <div class="col-md-9">
        <!-- 검색 & 정렬 -->
        <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
          <div class="input-group w-50">
            <input type="text" class="form-control" placeholder="Search">
            <button class="btn btn-outline-secondary" type="button">🔍</button>
          </div>
          <div class="btn-group">
            <button class="btn btn-dark">New</button>
            <button class="btn btn-outline-secondary">Price ascending</button>
            <button class="btn btn-outline-secondary">Price descending</button>
          </div>
        </div>

        <!-- 카드 영역 -->
        <div class="d-flex flex-wrap gap-3">
          <div class="card" style="width: 12rem;" v-for="i in 6" :key="i">
            <img src="https://via.placeholder.com/150" class="card-img-top" alt="...">
            <div class="card-body">
              <p class="card-text">Text</p>
              <p class="card-text fw-bold">$0</p>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <nav class="mt-4">
          <ul class="pagination justify-content-center">
            <li class="page-item disabled"><a class="page-link">← Previous</a></li>
            <li class="page-item active"><a class="page-link">1</a></li>
            <li class="page-item"><a class="page-link">2</a></li>
            <li class="page-item"><a class="page-link">3</a></li>
            <li class="page-item"><a class="page-link">…</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage'
}
</script>

<style scoped>
.card img {
  height: 150px;
  object-fit: cover;
}
</style>
