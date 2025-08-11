# TUNI - Trade University (Frontend)

## 📖 프로젝트 개요 (Overview)

**TUNI**는 같은 대학교 학생들 간의 신뢰 기반 중고 거래를 위한 웹 플랫폼입니다. Vue.js 3 (Composition API)를 기반으로 구축되었으며, 사용자가 상품을 탐색하고, 등록하며, 다른 학생들과 상호작용할 수 있는 직관적이고 반응형적인 UI를 제공합니다.

## ✨ 핵심 기능 (Core Features)

- **사용자 인증**: 대학교 이메일 기반의 간편 로그인 및 회원가입, JWT 토큰을 이용한 인증 상태 관리
- **상품 탐색**: 전체 상품 목록 조회, 카테고리 및 가격 기반의 필터링 기능
- **상품 관리**: 상품 등록, 상세 조회, 수정, 삭제 기능
- **이미지 처리**: 다중 이미지 업로드, 클라이언트 사이드 미리보기, 대표 이미지 선택 기능
- **마이페이지**: 내가 등록한 상품, 좋아요 누른 상품 목록 조회, 프로필 수정
- **실시간 채팅**: WebSocket을 이용한 사용자 간 1:1 채팅

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 |
| :--- | :--- |
| **Framework** | Vue.js 3 (Composition API) |
| **State Management**| Pinia |
| **Routing** | Vue Router |
| **Styling** | Tailwind CSS, Bootstrap |
| **HTTP Client** | Axios (Interceptors for Token Handling) |
| **Icons** | Lucide Icons (`lucide-vue-next`) |
