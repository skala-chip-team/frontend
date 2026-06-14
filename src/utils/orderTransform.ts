import type { OrderDetailDto, OrderListItemDto, OrderUnitDto } from '@apis/index';
import type { Order, OrderDistrict, OrderUnit, OrderUnitStatus, StepCode } from '@/types';

// ── 시각/날짜 변환 (백엔드 ISO → 화면 표시 포맷) ──

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO datetime → 'YYYY-MM-DD HH:mm' (로컬). 파싱 실패 시 원본 앞부분. */
function isoToYmdHm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO datetime → 'HH:mm' (로컬). null·파싱 실패 시 null. */
function isoToHm(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── 상태/코드 매핑 (백엔드 문자열 → 화면 enum). 한글·영문 모두 수용 ──

/** unit/order 상태 문자열 → OrderUnitStatus */
export function mapUnitStatus(raw: string): OrderUnitStatus {
  const s = (raw ?? '').toUpperCase();
  if (raw === '완료' || s.includes('COMPLET') || s.includes('DONE') || s.includes('FINISH')) {
    return '완료';
  }
  if (raw === '진행중' || s.includes('PROGRESS') || s.includes('RUNNING') || s.includes('WORK')) {
    return '진행중';
  }
  return '대기';
}

/** processStep 문자열('STEP_A' | 'A' 등) → StepCode. 매칭 없으면 null. */
function toStepCode(raw: string | null | undefined): StepCode | null {
  if (!raw) return null;
  const m = raw.toUpperCase().match(/([ABCD])(?!.*[ABCD])/); // 마지막 A~D 문자
  return m ? (`STEP_${m[1]}` as StepCode) : null;
}

/** districtId 문자열 → OrderDistrict (알 수 없으면 원본 캐스팅) */
function toDistrict(id: string): OrderDistrict {
  return id as OrderDistrict;
}

// ── DTO → 화면 모델 ──

/** 목록 항목 → Order. units는 집계값(totalUnits/completedUnits/status)으로 합성. */
export function orderListItemToOrder(dto: OrderListItemDto): Order {
  const orderStatus = mapUnitStatus(dto.status);
  const size = dto.totalUnits > 0 ? Math.round(dto.plannedOutputQty / dto.totalUnits) : 25;
  const units: OrderUnit[] = Array.from({ length: dto.totalUnits }, (_, i) => {
    let unitStatus: OrderUnitStatus;
    if (i < dto.completedUnits) unitStatus = '완료';
    else if (orderStatus === '진행중' && i === dto.completedUnits) unitStatus = '진행중';
    else unitStatus = '대기';
    return {
      unit_id: `${dto.orderId}-U${i + 1}`,
      unit_status: unitStatus,
      unit_size_qty: size,
      current_step: null,
      current_machine: null,
      actual_start_time: null,
      estimated_complete_time: null,
      actual_complete_time: null,
    };
  });

  return {
    order_id: dto.orderId,
    district_id: toDistrict(dto.districtId),
    plan_date: dto.planDate,
    due_date: isoToYmdHm(dto.dueDate),
    planned_output_qty: dto.plannedOutputQty,
    order_priority: dto.priority,
    is_burst: dto.urgent,
    due_imminent: dto.dueImminent,
    units,
  };
}

/** 상세 unit DTO → OrderUnit (진짜 공정 정보) */
function unitDtoToUnit(u: OrderUnitDto): OrderUnit {
  const status = mapUnitStatus(u.unitStatus);
  // 현재 공정: currentStepId에 해당하는 step의 processStep을 코드로
  const currentStep = u.steps.find((s) => s.stepId === u.currentStepId);
  return {
    unit_id: u.unitId,
    unit_status: status,
    unit_size_qty: u.unitSizeQty,
    current_step: status === '진행중' ? toStepCode(currentStep?.processStep ?? u.currentStepId) : null,
    current_machine: status === '진행중' ? u.currentMachineId : null,
    actual_start_time: isoToHm(u.actualStartTime),
    estimated_complete_time: status === '완료' ? null : isoToHm(u.estimatedCompleteTime),
    actual_complete_time: status === '완료' ? isoToHm(u.actualCompleteTime) : null,
  };
}

/** 상세 DTO → Order (units 포함) */
export function orderDetailToOrder(dto: OrderDetailDto): Order {
  return {
    order_id: dto.orderId,
    district_id: toDistrict(dto.districtId),
    plan_date: dto.planDate,
    due_date: isoToYmdHm(dto.dueDate),
    planned_output_qty: dto.plannedOutputQty,
    order_priority: dto.priority,
    is_burst: dto.urgent,
    due_imminent: dto.dueImminent,
    units: dto.units.map(unitDtoToUnit),
  };
}
