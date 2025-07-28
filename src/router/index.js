import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/pages/MainPage.vue'
import MyPage from '@/pages/MyPage.vue'
import RegisterForm from '@/pages/RegisterForm.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ListPage from '@/pages/ListPage.vue'
const routes = [
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
})

export default router
