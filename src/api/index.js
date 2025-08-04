import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: 'http://localhost:8443',
  headers: {
    'Content-Type': 'application/json',
  },
  // 쿠키 전송이 필요하면
  // withCredentials: true
});

// --- 요청(Request) 인터셉터 ---
// 요청을 보내기 전에 실행
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ---응답(Response) 인터셉터 ---
// 응답을 받은 후 실행
api.interceptors.response.use(
  (response) => {
    // 정상 응답은 그대로 반환
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();

    // 401 에러이고, 재시도한 요청이 아닐 경우
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        // 1. Refresh Token으로 새로운 Access Token 요청
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshResponse = await axios.post('http://localhost:8443/api/auth/refresh', {}, {
          headers: { 'Authorization-Refresh': `Bearer ${refreshToken}` }
        });

        const newAccessToken = refreshResponse.data.accessToken;

        // 2. 새로운 Access Token으로 스토어와 localStorage 업데이트
        authStore.login({ accessToken: newAccessToken, refreshToken: refreshToken });
        
        // 3. 실패했던 원래 요청의 헤더에 새로운 토큰을 넣어서 다시 요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh Token도 만료되었을 경우 -> 로그아웃 처리
        authStore.logout();
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;