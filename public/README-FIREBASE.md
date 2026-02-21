# 🚀 Firebase 호스팅 가이드

## 📌 중요 사항
**젠스파크 AI와 Firebase는 직접 연동되지 않습니다.**  
젠스파크는 코드 생성만 하며, 생성된 코드를 다운로드 후 Firebase CLI로 배포해야 합니다.

---

## 🔄 전체 워크플로우

```
젠스파크 AI (코드 생성)
    ↓ 다운로드
로컬 컴퓨터 (테스트)
    ↓ Git Push
GitHub (버전 관리)
    ↓ GitHub Actions (자동 배포)
Firebase Hosting (운영 서버)
```

---

## 📥 1단계: Firebase CLI 설치

```bash
# Node.js 필요 (https://nodejs.org/)
npm install -g firebase-tools

# 로그인
firebase login
```

---

## 🔧 2단계: 프로젝트 초기화

```bash
# 프로젝트 폴더로 이동
cd bible-app-integrated

# Firebase 초기화
firebase init hosting

# 질문에 답변:
# - Use an existing project? Yes → 프로젝트 선택
# - Public directory? . (현재 폴더)
# - Configure as SPA? Yes
# - Set up automatic builds? No
```

---

## 🚀 3단계: 배포

```bash
# 배포
firebase deploy

# 결과: https://your-project-id.web.app
```

---

## 🤖 4단계: GitHub Actions 자동 배포 (선택)

### 1️⃣ GitHub 레포지토리 생성 후 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/bible-app.git
git push -u origin main
```

### 2️⃣ Firebase Service Account 키 생성

1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" → JSON 파일 다운로드
3. GitHub 레포지토리 → Settings → Secrets and variables → Actions
4. New repository secret → `FIREBASE_SERVICE_ACCOUNT` 생성 후 JSON 내용 붙여넣기

### 3️⃣ `.github/workflows/firebase-hosting.yml` 생성

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

이제 `main` 브랜치에 푸시하면 **자동 배포**됩니다!

---

## 📂 권장 폴더 구조

```
bible-app-integrated/
├── .github/
│   └── workflows/
│       └── firebase-hosting.yml    # GitHub Actions 설정
├── index.html                       # 메인 HTML
├── styles.css                       # 스타일
├── app.js                          # 메인 로직
├── auth.js                         # 인증 로직
├── bible-data.js                   # 성경 데이터
├── firebase.json                   # Firebase 호스팅 설정
├── .firebaserc                     # Firebase 프로젝트 설정
├── .gitignore                      # Git 제외 파일
└── README-FIREBASE.md              # 이 파일
```

---

## 🛠️ 로컬 테스트

### 방법 1: Python (간단)
```bash
python -m http.server 8000
# http://localhost:8000 접속
```

### 방법 2: Firebase Preview
```bash
firebase serve
# http://localhost:5000 접속
```

---

## 🔄 일상 작업 흐름

1. **로컬에서 수정**
   ```bash
   # 코드 수정 후
   python -m http.server 8000  # 테스트
   ```

2. **Git 커밋 & 푸시**
   ```bash
   git add .
   git commit -m "설교 수정 기능 추가"
   git push
   ```

3. **자동 배포 확인**
   - GitHub Actions 탭에서 진행 상황 확인
   - 완료 후 웹사이트 접속

---

## 🔥 빠른 수정 (Hot Fix)

```bash
# 1. 로컬에서 긴급 수정
# 2. 즉시 배포
firebase deploy

# 3. 나중에 Git 동기화
git add .
git commit -m "긴급 수정"
git push
```

---

## 🎯 추가 명령어

```bash
# 프로젝트 전환
firebase use another-project-id

# 배포 롤백 (이전 버전 복원)
firebase hosting:clone source-project:source-site target-project:target-site

# 배포 기록 확인
firebase hosting:channel:list

# 특정 버전 배포
firebase hosting:channel:deploy preview-branch
```

---

## ⚠️ 보안 주의사항

### API 키 관리

1. `.env` 파일 생성 (Git에 커밋 안 됨)
   ```
   FIREBASE_API_KEY=your-api-key
   FIREBASE_PROJECT_ID=your-project-id
   ```

2. `.gitignore`에 추가 (이미 포함됨)
   ```
   .env
   .env.local
   ```

3. 코드에서 사용
   ```javascript
   const apiKey = process.env.FIREBASE_API_KEY;
   ```

---

## 🚫 문제 해결

### 1. CORS 오류
- Firebase Console → Hosting → 고급 설정 → CORS 허용

### 2. 캐시 문제
- 브라우저 캐시 삭제: `Ctrl + Shift + R`
- Firebase 캐시 설정:
  ```json
  {
    "hosting": {
      "headers": [{
        "source": "**/*.@(js|css|html)",
        "headers": [{
          "key": "Cache-Control",
          "value": "max-age=3600"
        }]
      }]
    }
  }
  ```

### 3. 배포 실패
```bash
# 로그 확인
firebase deploy --debug

# 프로젝트 재설정
firebase use --clear
firebase use your-project-id
```

---

## 📊 비용 (무료 플랜)

- **저장 용량**: 10GB
- **전송량**: 월 360MB
- **커스텀 도메인**: 지원
- **SSL 인증서**: 자동

---

## 🎓 학습 자료

- [Firebase Hosting 공식 문서](https://firebase.google.com/docs/hosting)
- [GitHub Actions 공식 문서](https://docs.github.com/actions)
- [Firebase CLI 참고](https://firebase.google.com/docs/cli)

---

## 💡 팁

1. **커스텀 도메인 연결**
   - Firebase Console → Hosting → 도메인 추가
   - DNS 레코드 설정 (자동 안내됨)

2. **여러 환경 관리**
   ```bash
   # 개발 환경
   firebase use dev
   firebase deploy
   
   # 운영 환경
   firebase use prod
   firebase deploy
   ```

3. **Preview 채널 (테스트 배포)**
   ```bash
   firebase hosting:channel:deploy preview
   # 임시 URL 생성됨
   ```

---

**🎉 완료! 이제 전문적인 배포 환경이 구축되었습니다.**
