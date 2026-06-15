import { useQuery } from '@tanstack/react-query';

import { getOrderDetail, getOrders } from '@apis/index';
import { orderDetailToOrder, orderListItemToOrder } from '@/utils/orderTransform';
import type { Order } from '@/types';

export interface OrdersResult {
  orders: Order[]; // 모든 상태(필터는 화면에서 처리)
  imminentCount: number; // 납기 임박(구역 단위, 상태 필터 무관)
  totalCount: number;
}

/**
 * 주문 목록. GET /api/orders.
 * districtId만 쿼리로 전달하고 상태 필터는 화면에서(서버 status 문자열 의존 회피).
 * units가 없으므로 집계값으로 합성한다. 실패 시 useQuery error → 화면 mock fallback.
 */
export function useOrders(districtId?: string) {
  return useQuery<OrdersResult>({
    queryKey: ['orders', districtId ?? 'all'],
    retry: 1,
    queryFn: async () => {
      const list = await getOrders(districtId ? { districtId } : undefined);
      return {
        orders: list.orders.map(orderListItemToOrder),
        imminentCount: list.imminentCount,
        totalCount: list.totalCount,
      };
    },
  });
}

/**
 * 주문 상세(유닛별 공정). GET /api/orders/{orderId}.
 * orderId 있을 때만 실행. 실패 시 화면에서 목록/ mock 주문으로 fallback.
 */
export function useOrderDetail(orderId: string | null) {
  return useQuery<Order>({
    queryKey: ['order', orderId],
    enabled: !!orderId,
    retry: 1,
    queryFn: async () => orderDetailToOrder(await getOrderDetail(orderId as string)),
  });
}
