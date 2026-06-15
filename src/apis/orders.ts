import { apiClient } from './axios';
import type { ApiResponse, OrderDetailDto, OrderListDto } from './types';

const ORDERS_BASE = '/api/orders';

/** 주문 목록 조회. status·districtId 쿼리(옵션). units는 없고 집계 필드만 옴. */
export async function getOrders(params?: {
  status?: string;
  districtId?: string;
}): Promise<OrderListDto> {
  const { data } = await apiClient.get<ApiResponse<OrderListDto>>(ORDERS_BASE, { params });
  return data.data;
}

/** 주문 상세 조회 — 헤더 + 유닛별 공정(units, steps). */
export async function getOrderDetail(orderId: string): Promise<OrderDetailDto> {
  const { data } = await apiClient.get<ApiResponse<OrderDetailDto>>(`${ORDERS_BASE}/${orderId}`);
  return data.data;
}
