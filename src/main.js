import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/styles/global/layout.css';
import axios from 'axios'
import { isLogin, userNickname } from '@/composables/useAuth' 

// 로그인 상태 복원 (추가)
const token = localStorage.getItem('token')
const nickname = localStorage.getItem('nickname')
const app = createApp(App)

if (token && nickname) {
  isLogin.value = true
  userNickname.value = nickname
}

createApp(App).use(router).use(router).use(router).mount('#app')

axios.defaults.baseURL = 'http://localhost:8443'  // 백엔드 서버 주소
axios.defaults.withCredentials = true 

app.use(createPinia())  // Pinia 등록
app.use(router)
app.mount('#app')
