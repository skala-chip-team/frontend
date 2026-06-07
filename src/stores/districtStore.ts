import { create } from 'zustand';

export type DistrictId = 'all' | 'A' | 'B' | 'C';

interface DistrictState {
  selectedDistrict: DistrictId;
  setDistrict: (district: DistrictId) => void;
}

export const useDistrictStore = create<DistrictState>((set) => ({
  selectedDistrict: 'all',
  setDistrict: (district) => set({ selectedDistrict: district }),
}));
