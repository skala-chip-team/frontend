import { create } from 'zustand';

// 백엔드 districtId 기준. 'all'은 전체 대시보드(아직 미연결).
export type DistrictId = 'all' | 'DST-01' | 'DST-02';

export interface DistrictOptionMeta {
  value: DistrictId;
  label: string;
}

/** 헤더 구역 셀렉터 옵션 */
export const DISTRICT_OPTIONS: DistrictOptionMeta[] = [
  { value: 'all', label: '전체' },
  { value: 'DST-01', label: '구역 A' },
  { value: 'DST-02', label: '구역 B' },
];

/** 브레드크럼/제목용 라벨 */
export const districtLabels: Record<DistrictId, string> = {
  all: '전체 대시보드',
  'DST-01': '구역 A',
  'DST-02': '구역 B',
};

interface DistrictState {
  selectedDistrict: DistrictId;
  setDistrict: (district: DistrictId) => void;
}

export const useDistrictStore = create<DistrictState>((set) => ({
  selectedDistrict: 'all',
  setDistrict: (district) => set({ selectedDistrict: district }),
}));
