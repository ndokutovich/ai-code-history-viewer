# Tauri 업데이터 로컬 테스트 가이드

이 디렉토리는 Tauri 네이티브 업데이터를 로컬에서 테스트하기 위한 서버와 설정을 포함합니다.

## 📋 테스트 완료 체크리스트

✅ **테스트 성공 확인 사항:**

- HTTP 권한 설정 (`capabilities/http.json`)
- Updater 권한 설정 (`capabilities/default.json`)
- 플랫폼별 바이너리 지원 (`darwin-aarch64`, `darwin-x86_64`, `darwin-universal`)
- GitHub API 연동 및 릴리즈 노트 표시
- 자동/수동 업데이트 확인 기능
- 다운로드 진행률 표시
- 우선순위별 업데이트 모달 (일반/중요/긴급)

## 🚀 테스트 방법

### 1. 테스트 서버 시작

```bash
cd test-server
node server.cjs  # 주의: .cjs 확장자 사용
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 2. 개발 모드 설정

`src-tauri/tauri.conf.json`에서 임시 설정:

```json
"updater": {
  "active": true,
  "endpoints": ["http://localhost:3000/latest.json"],
  "dangerousInsecureTransportProtocol": true,
  "dialog": false,
  "pubkey": "..."
}
```

`src/hooks/useGitHubUpdater.ts`에서 로컬 서버 사용:

```typescript
// 테스트용: 로컬 서버로 요청
const response = await fetch('http://localhost:3000/latest.json', {
```

### 3. 버전 설정

- 현재 앱 버전: `1.0.0-beta.1` (tauri.conf.json)
- 테스트 서버 버전: `1.0.0-beta.4` (latest.json)

### 4. 필수 권한 확인

`src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "core:default",
    "dialog:allow-open",
    "dialog:default",
    "updater:default",
    "updater:allow-check"
  ]
}
```

`src-tauri/capabilities/http.json`:

```json
{
  "permissions": [
    "http:default",
    {
      "identifier": "http:allow-fetch",
      "allow": [
        { "url": "https://api.github.com/**" },
        { "url": "http://localhost:3000/**" }
      ]
    }
  ]
}
```

### 5. 테스트 실행

1. **자동 업데이트**: 앱 시작 5초 후 자동 확인
2. **수동 업데이트**: 설정 → "업데이트 확인" 클릭
3. **콘솔 로그 확인**: F12 → Console 탭에서 디버깅 정보 확인

### 6. 테스트 시나리오

#### ✅ 정상 업데이트

- 업데이트 모달 표시
- 릴리즈 노트 마크다운 렌더링
- 다운로드/설치 진행률 표시

#### ✅ 네트워크 오류

- 서버 중지 후 오류 메시지 확인

#### ✅ 우선순위 테스트

- `latest.json`의 `notes`에 키워드 추가:
  - "critical", "security", "hotfix" → 빨간색 긴급 모달
  - "recommended", "important" → 파란색 권장 모달

#### ✅ 취소/건너뛰기 테스트

- "이 버전 건너뛰기" 버튼 동작 확인

## 🔧 트러블슈팅

### 자주 발생하는 오류와 해결책:

1. **"http.fetch not allowed"**
   → `capabilities/http.json` 권한 확인

2. **"updater.check not allowed"**
   → `capabilities/default.json`에 updater 권한 추가

3. **"platform not found"**
   → `latest.json`에 현재 플랫폼 정보 추가

4. **"dangerousInsecureTransportProtocol"**
   → HTTP 테스트 시 필수 설정

## 📝 프로덕션 배포 전 복원 체크리스트

### 1. `tauri.conf.json` 복원

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://api.github.com/repos/ndokutovich/ai-code-history-viewer/releases/latest"
  ],
  "dialog": false,
  "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDhCMDAzQUUxMEEzNEFDRTcKUldUbnJEUUs0VG9BaXpzVXFxU2NKTjBOYnFIOVlMWWlHY0NkRHBjVHlFUjdvWkdrMXgyaUFXeXYK"
  // dangerousInsecureTransportProtocol 제거!
}
```

### 2. `useGitHubUpdater.ts` 복원

```typescript
// 프로덕션: GitHub API 사용
const response = await fetch(
  "https://api.github.com/repos/ndokutovich/ai-code-history-viewer/releases/latest",
  {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Claude-Code-History-Viewer",
    },
  }
);
```

### 3. GitHub Secrets 설정

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### 4. 버전 번호 업데이트

- 실제 릴리즈 버전으로 변경

## 🏗️ 아키텍처 요약

### 업데이트 플로우:

1. **자동 체크** (앱 시작 5초 후) 또는 **수동 체크** (설정 메뉴)
2. **GitHub API** 호출하여 최신 릴리즈 정보 가져오기
3. **Tauri 업데이터**로 실제 업데이트 파일 확인
4. **업데이트 모달** 표시 (우선순위별 디자인)
5. **다운로드/설치** 진행률 표시
6. **앱 재시작** (자동)

### 주요 컴포넌트:

- `useGitHubUpdater`: GitHub API 연동 및 상태 관리
- `GitHubUpdateModal`: 업데이트 UI 및 다운로드 처리
- `UpdateManager`: 전체 업데이트 플로우 관리
- `UpToDateNotification`: 최신 버전 알림 (수동 체크 시에만)

✨ **이제 Tauri 네이티브 업데이터가 완전히 통합되었습니다!**
