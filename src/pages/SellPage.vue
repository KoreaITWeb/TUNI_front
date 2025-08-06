<template>
  <div class="container max-w-2xl mx-auto my-16 p-8 border rounded-lg bg-white shadow-md">
    <form @submit.prevent="submitItem">
      <h3 class="text-2xl font-bold mb-6">{{ isEditMode ? 'Update Item' : 'Upload Item' }}</h3>

      <div class="space-y-4">
        <div>
          <label for="title" class="form-label font-semibold">Item Name</label>
          <input v-model="title" id="title" placeholder="제목" class="form-control" required/>
        </div>

        <div>
          <label for="category" class="form-label font-semibold">Category</label>
          <select v-model="category" id="category" class="form-select" required>
            <option value="" disabled>-- 카테고리를 선택하세요 --</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <div>
          <label for="price" class="form-label font-semibold">Price</label>
          <input v-model="price" id="price" placeholder="가격" type="number" class="form-control" required/>
        </div>
        
        <div>
          <label for="content" class="form-label font-semibold">Description</label>
          <textarea v-model="content" id="content" placeholder="설명" class="form-control" rows="4" required></textarea>
        </div>
        
        <div v-if="isEditMode" class="space-y-4">
          <div>
            <label class="form-label font-semibold">Photos</label>
            <p class="text-sm text-gray-500">대표 이미지를 클릭하여 변경하고, X 버튼으로 삭제하세요.</p>
            <div class="flex flex-wrap gap-4 mt-2">
              <div v-for="image in existingImages" :key="image.uuid"
                   class="relative cursor-pointer border-3 rounded-lg overflow-hidden transition-all"
                   :class="{
                      'border-blue-500': representativeSelection.type === 'existing' && representativeSelection.id === image.uuid,
                      'border-gray-300': !(representativeSelection.type === 'existing' && representativeSelection.id === image.uuid)
                    }"
                   @click="setRepresentative('existing', image.uuid)">
                <img :src="`/images/display?fileName=${image.uploadPath}/${image.uuid}_${image.fileName}`" class="w-24 h-24 object-cover block" />
                <div v-if="representativeSelection.type === 'existing' && representativeSelection.id === image.uuid" class="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">✓</div>
                <button type="button" @click.stop="deleteExistingImage(image.uuid)" class="delete-btn" style="top: 1px; left: 1px; overflow: visible;">×</button>
              </div>
              
            </div>
          </div>
          <div>
            <label for="photo-add" class="form-label font-semibold">Add New Photos</label>
            <input type="file" id="photo-add" @change="handleFileUpload" multiple accept="image/*" class="form-control"/>
          </div>
          <div class="flex flex-wrap gap-4 mt-2">
            <div v-for="(image, index) in newImagePreviews" :key="image.url"
                  class="relative cursor-pointer border-3 rounded-lg overflow-hidden transition-all"
                  :class="{
                    'border-blue-500': representativeSelection.type === 'new' && representativeSelection.id === index,
                    'border-gray-300': !(representativeSelection.type === 'new' && representativeSelection.id === index)
                  }"
                  @click="setRepresentative('new', index)">
              <img :src="image.url" class="w-24 h-24 object-cover block"/>
              <div v-if="representativeSelection.type === 'new' && representativeSelection.id === index" class="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">✓</div>
            </div>
          </div>
        </div>
        
        <div v-else>
          <label for="photo" class="form-label font-semibold">Photo</label>
          <input type="file" @change="handleFileUpload" multiple accept="image/*" class="form-control"/>
          <p v-if="newImagePreviews.length > 0" class="text-sm text-gray-500">대표 이미지로 사용할 사진을 클릭하세요.</p>
          <div v-if="newImagePreviews.length > 0" class="flex flex-wrap gap-4 mt-2">
            <div
              v-for="(image, index) in newImagePreviews" :key="index"
              class="relative cursor-pointer border-3 rounded-lg overflow-hidden transition-all"
              :class="{
                'border-blue-500': representativeSelection.type === 'new' && representativeSelection.id === index,
                'border-transparent': !(representativeSelection.type === 'new' && representativeSelection.id === index)
              }"
              @click="setRepresentative('new', index)">
              <img :src="image.url" class="w-24 h-24 object-cover block" alt="미리보기 이미지"/>
              <div v-if="representativeSelection.type === 'new' && representativeSelection.id === index" class="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">✓</div>
            </div>
          </div>
        </div>
        
      </div>

      <button type="submit" class="btn btn-dark w-full mt-6 py-2.5">Upload Item</button>
    </form>
  </div>
</template>

<script setup>
import api from '@/api';
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const { isLogin, userId, schoolId } = storeToRefs(authStore)
const router = useRouter()
const route = useRoute()

// 수정 모드인지 판별하는 computed 속성
const productId = ref(route.params.id || null)
const isEditMode = computed(() => !!productId.value)

// --- 폼 데이터 상태 ---
const title = ref('')
const price = ref('')
const content = ref('')
const category = ref(''); // 선택된 카테고리를 저장할 변수
const categories = ref([
  'Electronics', 'Books', 'Clothings', 'Home & kitchen', 
  'Shoes', 'Beauty', 'Hobby'
]);

// 이미지 상태 변수
const existingImages = ref([]);
const newFiles = ref([]);
const newImagePreviews = ref([]);
const deletedImages = ref([]); // 삭제할 이미지 객체 전체를 저장 (복구 대비)
const representativeSelection = ref({ type: null, id: null }); // { type: 'existing' | 'new', id: uuid | index }

// 폼 초기화
function resetForm() {
  productId.value = null;
  title.value = ''; 
  price.value = ''; 
  content.value = ''; 
  category.value = '';
  existingImages.value = []; 
  newFiles.value = []; 
  newImagePreviews.value = []; 
  deletedImages.value = [];
  representativeSelection.value = { type: null, id: null };
}

// 라우트 변경을 감시하는 watch 로직
watch(() => route.params.id, (newId) => {
  // URL의 id 파라미터가 변경될 때마다 이 코드가 실행됩니다.
  if (!newId) {
    // newId가 없다는 것은 /sell 경로로 이동했다는 의미입니다.
    // console.log('등록 모드로 전환합니다.');
    resetForm();
  }
});

// 수정 모드일 때 기존 데이터를 불러오는 함수
async function fetchProductForEdit() {
  if (!isEditMode.value) return;
  try {
    const response = await api.get(`/board/${productId.value}`);
    const product = response.data.board;
    const images = response.data.images;
    
    // 폼 상태를 불러온 데이터로 채움
    title.value = product.title;
    price.value = product.price;
    content.value = product.content;
    category.value = product.category;
    existingImages.value = images; 
    // 기본 대표 이미지 설정
    const repImage = images.find(img => img.representative);
    if (repImage) {
      representativeSelection.value = { type: 'existing', id: repImage.uuid };
    }
    
  } catch (err) {
    console.error('상품 정보 로딩 실패:', err);
    alert('기존 상품 정보를 불러오는 데 실패했습니다.');
    router.push('/shop');
  }
}

// 기존 이미지 삭제/복구 처리
function deleteExistingImage(uuid) {
  const imageIndex = existingImages.value.findIndex(img => img.uuid === uuid);
  if (imageIndex > -1) {
    const [deletedImage] = existingImages.value.splice(imageIndex, 1);
    deletedImages.value.push(deletedImage);

    // 삭제된 이미지가 대표 이미지였다면, 남은 이미지 중 첫 번째를 대표로 지정
    if (representativeSelection.value.id === uuid) {
      if (existingImages.value.length > 0) {
        setRepresentative('existing', existingImages.value[0].uuid);
      } else if (newFiles.value.length > 0) {
        setRepresentative('new', 0);
      } else {
        setRepresentative(null, null);
      }
    }
  }
}

onMounted(() => {
  if (!isLogin.value) {
    alert('로그인 후 이용가능합니다.');
    router.push('/login');
  }
  fetchProductForEdit();
});

// 대표 이미지 설정 함수
function setRepresentative(type, id) {
  representativeSelection.value = { type, id };
}

// 파일 핸들링
function handleFileUpload(event) {
  const files = event.target.files;
  if (!files) return;
  newFiles.value = Array.from(files);
  newImagePreviews.value = [];
  for (const file of newFiles.value) {
    newImagePreviews.value.push({ url: URL.createObjectURL(file) });
  }
  // 새 파일 업로드 시, 기존 이미지가 없다면 새 파일의 첫 번째를 대표로 자동 선택
  if (existingImages.value.length === 0) {
    setRepresentative('new', 0);
  }
}

async function submitItem() {
  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  if (isEditMode.value) {
    // --- 수정 로직 ---
    try {
      const remainingImageCount = existingImages.value.length;
      const newImageCount = newFiles.value.length;
      if (remainingImageCount + newImageCount === 0) {
        alert('최소 한 개 이상의 이미지가 필요합니다.');
        return;
      }
      
      await api.post('/board/update', {
        boardId: productId.value,
        title: title.value,
        price: price.value,
        content: content.value,
        category: category.value,
      },
      {
        headers
      });

      // 삭제하기로 선택한 이미지들 삭제 API 호출
      await Promise.all(
        deletedImages.value.map(img => api.delete(`/images/${img.uuid}`, { headers: {...headers} }))
      );

      // 새로 추가된 이미지가 있다면 업로드
      let uploadedImages = [];
      if (newFiles.value.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append('boardId', productId.value);
        newFiles.value.forEach(file => {
          imageFormData.append('uploadFile', file);
        });
        
        const uploadResponse = await api.post('/images/upload', imageFormData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            ...headers
          }
        });
        uploadedImages = uploadResponse.data;
      }
      // 최종 대표 이미지 설정 API 호출
      if (representativeSelection.value.id !== null) {
        let repUuid;
        if (representativeSelection.value.type === 'existing') {
          repUuid = representativeSelection.value.id;
        } else { // 'new'
          // 업로드된 파일 중 대표로 선택된 파일의 uuid 찾기
          const repFile = newFiles.value[representativeSelection.value.id];
          const uploadedRepImage = uploadedImages.find(img => img.fileName === repFile.name);
          if(uploadedRepImage) repUuid = uploadedRepImage.uuid;
        }
        if (repUuid) {
          await api.patch(`/images/${productId.value}/representative`, { uuid: repUuid });
        }
      }

      alert('상품 수정을 완료하였습니다.');
      router.push(`/details/${productId.value}`); // 수정 후 상세 페이지로 이동
    } catch (err) {
      console.error('상품 수정 실패:', err);
      alert('상품 수정에 실패하였습니다.');
    }
  }
  else{
    if (!title.value || !category.value || !price.value || !content.value) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const boardResponse = await api.post('/board/register', {
        title: title.value,
        category: category.value,
        price: price.value,
        content: content.value,
        userId: userId.value,
        schoolId: schoolId.value,
      });

      const newBoardId = boardResponse.data.boardId;

      if (!newBoardId) {
        throw new Error('게시물 ID를 받아오지 못했습니다.');
      }

      const imageFormData = new FormData();
      imageFormData.append('boardId', newBoardId);
      newFiles.value.forEach(file => imageFormData.append('uploadFile', file));
      const uploadResponse = await api.post('/images/upload', imageFormData, 
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          ...headers
        });
      const uploadedImages = uploadResponse.data;

      if (uploadedImages && uploadedImages.length > 0) {
        const repFileName = newFiles.value[representativeSelection.value.id].name;
        const repImage = uploadedImages.find(img => img.fileName === repFileName);
        if (repImage) {
          await api.patch(`/images/${newBoardId}/representative`, { uuid: repImage.uuid });
        }
      }

      alert('상품 등록을 완료하였습니다.');
      router.push('/shop');

    } catch (err) {
      console.log('상품등록 실패:', err);
      alert('상품 등록 실패하였습니다.');
    }
  }
}
</script>
<style scoped>
.preview-item { position: relative; cursor: pointer; /* ... */ }
.delete-btn {
  position: absolute; top: -10px; left: -10px;
  background-color: rgba(0,0,0,0.7); color: white;
  width: 20px; height: 20px; border-radius: 50%;
  border: none; display: flex; justify-content: center; align-items: center;
  font-size: 12px; line-height: 1; cursor: pointer;
}
</style>