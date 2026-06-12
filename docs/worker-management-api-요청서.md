# 작업자 관리 페이지 — 백엔드 API 요청서

프론트의 **작업자 관리(/workers)** 페이지를 실제 데이터로 연결하려면 아래 API가 필요합니다.
현재 백엔드에는 `PATCH /api/users/{userId}/role` 과 `DELETE /api/users/{userId}` 만 존재하여,
**사용자 목록 조회·구역 권한 배정이 불가능**합니다.

> 공통 응답 래퍼: `{ "success": true, "code": 200, "message": "...", "data": <본문> }`

---

## 1) 🔴 [필수] 사용자 목록 조회 — `GET /api/users`

작업자 관리 테이블을 채우는 핵심. **이게 없으면 페이지 자체를 연결할 수 없습니다.** (현재 전체 GET은 `/`, `/health` 뿐)

**Query (선택)**
| param | 설명 |
|---|---|
| `role` | 역할 필터 (예: `WORKER`) |
| `districtId` | 구역 필터 (예: `DST-01`) |

**응답 `data`: 배열**
```json
[
  {
    "userId": "65abb0fc-...",
    "username": "김현수",
    "email": "user@chipscheduler.com",
    "role": "OPERATOR",              // 역할 enum (아래 4번)
    "districts": ["DST-01", "DST-02"],// 권한 구역 목록(없으면 [])
    "status": "ACTIVE",              // 근무 상태 (있으면)
    "lastLoginAt": "2026-06-09T08:12:00"
  }
]
```
> `status`, `lastLoginAt` 은 있으면 함께 주세요(없으면 프론트에서 숨김 처리).

---

## 2) 🔴 [필수] 구역 권한 배정 — 예) `PUT /api/users/{userId}/districts`

요청 핵심 기능(“admin이 구역 권한 부여”). **현재 관련 엔드포인트가 전혀 없습니다.**

**요청 바디**
```json
{ "districtIds": ["DST-01", "DST-02"] }   // 해당 유저의 권한 구역 전체를 이 목록으로 설정
```
**응답 `data`**: 갱신된 유저(1번 항목과 동일 구조) 또는 `{ userId, districtIds }`

> 단일 추가/삭제(`POST`/`DELETE .../districts/{districtId}`) 방식이어도 무방합니다. 방식만 알려주세요.

---

## 3) 역할 변경 — `PATCH /api/users/{userId}/role`  ✅ (이미 있음)

**요청 바디**
```json
{ "roleName": "OPERATOR" }
```
- 정상 동작 확인됨. 프론트에서 그대로 사용 예정.

---

## 4) ❓ [확인 필요] 역할(role) enum 값

`roleName` 이 문자열이라 **유효한 값 목록**이 필요합니다. login 응답에서 `"WORKER"` 를 확인했습니다.
- 예상: `ADMIN`, `OPERATOR`, `WORKER`, (미배치=?)
- **전체 enum 값과 의미**를 알려주세요. (프론트 표시: 운영자/작업자/미배치 등으로 매핑)

---

## 5) 사용자 삭제 — `DELETE /api/users/{userId}`  ✅ (이미 있음)

- 정상 존재. 프론트에서 그대로 사용 예정.

---

## 권한(인가) 관련
- 위 1·2·3·5 는 **ADMIN 토큰**으로만 호출 가능하게 보호해주세요.
- 프론트는 이미 `role === ADMIN` 일 때만 작업자 관리 메뉴/페이지에 접근하도록 막아두었습니다(클라이언트 가드). **서버 측 인가도 반드시 필요**합니다.

---

## 요약 (프론트가 막혀 있는 지점)
| 기능 | 필요 API | 상태 |
|---|---|---|
| 사용자 목록 | `GET /api/users` | 🔴 없음 → **추가 필요** |
| 구역 권한 배정 | `PUT /api/users/{userId}/districts` (또는 동등) | 🔴 없음 → **추가 필요** |
| 역할 변경 | `PATCH /api/users/{userId}/role` | ✅ 있음 |
| 사용자 삭제 | `DELETE /api/users/{userId}` | ✅ 있음 |
| 역할 enum 정의 | — | ❓ 확인 필요 |

1·2번이 추가되면 작업자 관리 페이지를 바로 연결하겠습니다.
