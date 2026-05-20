import { useState } from "react";

import ClusterStatusSection from "@/components/dashboard/ClusterStatusSection";
import EquipmentStatusSection from "@/components/dashboard/EquipmentStatusSection";
import ProductionScheduleSection from "@/components/dashboard/ProductionScheduleSection";
import QueueStatusSection from "@/components/dashboard/QueueStatusSection";
import RiskAlertPanel from "@/components/dashboard/RiskAlertPanel";

export default function DashboardPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fcfaf6] p-6">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-950">
                공정 구역별 상태
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                실시간 공정 상태 및 장비 부하 현황
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAlertOpen((prev) => !prev)}
              className="
                rounded-2xl border border-red-100
                bg-[#fcfcfa]
                px-4 py-3
                shadow-sm
                transition-all duration-300
                hover:bg-red-50
                hover:shadow-md
              "
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
                </div>

                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">
                    실시간 위험 알림
                  </p>

                  <p className="text-xs font-medium text-gray-500">
                    현재 위험 3건 감지
                  </p>
                </div>
              </div>
            </button>
          </div>

          <ClusterStatusSection />
        </section>

        <section className="space-y-6">
          <EquipmentStatusSection />
          <QueueStatusSection />
          <ProductionScheduleSection />
        </section>

        <RiskAlertPanel
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
        />
      </div>
    </div>
  );
}