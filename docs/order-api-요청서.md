### 주문 목록 조회

/api/orders

- query parameters:

  status (string)

  districtId (string)

- responses:

  {
  "success": true,
  "code": 0,
  "message": "string",
  "data": {
  "totalCount": 0,
  "imminentCount": 0,
  "orders": [
  {
  "orderId": "string",
  "districtId": "string",
  "districtName": "string",
  "planDate": "2026-06-14",
  "dueDate": "2026-06-14T06:52:17.577Z",
  "plannedOutputQty": 0,
  "priority": 0,
  "priorityLabel": "string",
  "status": "string",
  "totalUnits": 0,
  "completedUnits": 0,
  "progressRatio": 0,
  "dueImminent": true,
  "urgent": true
  }
  ]
  }

### 주문 상세 조회

/api/orders/{orderId}

- responses

  {
  "success": true,
  "code": 0,
  "message": "string",
  "data": {
  "orderId": "string",
  "districtId": "string",
  "districtName": "string",
  "planDate": "2026-06-14",
  "dueDate": "2026-06-14T06:56:13.230Z",
  "plannedOutputQty": 0,
  "priority": 0,
  "priorityLabel": "string",
  "status": "string",
  "totalUnits": 0,
  "completedUnits": 0,
  "progressRatio": 0,
  "dueImminent": true,
  "urgent": true,
  "units": [
  {
  "unitId": "string",
  "unitSizeQty": 0,
  "unitStatus": "string",
  "actualStartTime": "2026-06-14T06:56:13.230Z",
  "actualCompleteTime": "2026-06-14T06:56:13.230Z",
  "currentStepId": "string",
  "currentMachineId": "string",
  "estimatedCompleteTime": "2026-06-14T06:56:13.230Z",
  "steps": [
  {
  "stepId": "string",
  "processStep": "string",
  "stepOrder": 0,
  "stepStatus": "string"
  }
  ]
  }
  ]
  }
  }
