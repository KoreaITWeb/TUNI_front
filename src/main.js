import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/styles/global/layout.css';
import axios from 'axios'

createApp(App).use(router).use(router).use(router).mount('#app')
axios.defaults.baseURL = 'http://localhost:8443'  // 백엔드 서버 주소
axios.defaults.withCredentials = true 
