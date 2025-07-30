import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainPage from '@/pages/MainPage.vue'
import MyPage from '@/pages/MyPage.vue'
import RegisterForm from '@/pages/RegisterForm.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ListPage from '@/pages/ListPage.vue'
import SellPage from '@/pages/SellPage.vue'
import ChatPage from '@/pages/ChatPage.vue'

const routes = [
  { path: '/Chat',
    name: 'chat',
    component: ChatPage
  },
  {
    path: '/main',
    name: 'main',
    component: MainPage
  },
  {
    path: '/Shop',
    name: 'shop',
    component: ListPage
  },
  {
    path: '/Profile',
    name: 'profile',
    component: MyPage
  },
  {
    path: '/Login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/Sell',
    name: 'Sell',
    component: SellPage
  },
  {
    path: '/register-form',
    name: 'RegisterForm',
    component: RegisterForm,
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  // Pinia 스토어는 앱이 생성될 때 초기화되므로,
  // 라우터 가드에서 로그인 상태를 확인하는 것이 안전합니다.
  authStore.checkLoginStatus();
  next();
});
export default router
