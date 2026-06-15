# 장비 설정 API 요청서

> 장비 설정 화면(ADMIN, `/machines`)의 추가/수정/삭제·공정 매핑용 API.
> 연결 전까지 프론트는 mock(세션 메모리)으로 동작하며, 연결 시 `apis/machines.ts`의 `MACHINE_API_READY` 를 true로 전환한다.

공통 응답 래퍼: `{ "success": true, "code": 0, "message": "string", "data": ... }`

---

### 장비 목록 조회

GET `/api/machines`

- query parameters (선택):

  districtId (string) — 구역 필터

  stepId (string) — STEP 필터

- responses:

  ```
  {
    "success": true, "code": 0, "message": "string",
    "data": [
      {
        "machineId": "MACHINE-01",
        "machineType": "TYPE_A",      // TYPE_A ~ TYPE_D
        "districtId": "DST-01",
        "stepId": "STEP-DST-01-A",
        "processStep": "STEP_A",      // STEP_A ~ STEP_D (표시용)
        "machineStatus": "가동"        // 가동 / 대기 / 정지 / 점검중
      }
    ]
  }
  ```

### 공정 STEP 옵션 조회

GET `/api/process-steps`

- 장비-공정 매핑 드롭다운용. 구역별 STEP A~D.
- responses:

  ```
  {
    "success": true, "code": 0, "message": "string",
    "data": [
      { "stepId": "STEP-DST-01-A", "processStep": "STEP_A", "districtId": "DST-01" }
    ]
  }
  ```

### 장비 추가

POST `/api/machines`

- machineId는 서버가 생성(MACHINE-NN).
- request body:

  ```
  {
    "machineType": "TYPE_A",
    "districtId": "DST-01",
    "stepId": "STEP-DST-01-A",
    "machineStatus": "가동"
  }
  ```

- responses: 생성된 장비 1건 (목록 항목과 동일 구조, machineId 포함)

### 장비 수정

PUT `/api/machines/{machineId}`

- request body: 추가와 동일 (machineType / districtId / stepId / machineStatus)
- responses: 수정된 장비 1건

### 장비 삭제

DELETE `/api/machines/{machineId}`

- responses: 204 No Content
- 비고: 진행 중 스케줄이 있는 장비 삭제 시 서버가 4xx + message로 거절할 수 있음(프론트는 에러 메시지 노출).
