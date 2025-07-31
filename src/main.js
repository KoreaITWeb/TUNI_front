import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/styles/global/layout.css';
import axios from 'axios'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

// createApp(App).use(router).use(router).use(router).mount('#app')
// app.use(pinia)

app.use(router)
app.use(pinia) // ◀️ Vue 앱에 Pinia 연결

app.mount('#app')

axios.defaults.baseURL = 'http://localhost:8443'  // 백엔드 서버 주소
axios.defaults.withCredentials = true 
