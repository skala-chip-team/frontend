import { useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { UserInfo } from "./UserInfo";

const summaryData = {
  target: 16000,
  production: 12450,
  achievementRate: 78,
  utilization: 82,
  defectRate: 2.1,
  delayedLots: 4,
  urgentOrders: 2,
};

const clusterOptions = ["전체 라인", "Cluster A", "Cluster B", "Cluster C"];

export function Header() {
  const [isClusterOpen, setIsClusterOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState("전체 라인");

  return (
    <header className="relative z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-[#fcfcfa] px-6">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsClusterOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          {selectedCluster}
          <span className="text-[10px] text-gray-400">
            {isClusterOpen ? "▲" : "▼"}
          </span>
        </button>

        {isClusterOpen && (
          <div className="absolute left-0 top-12 z-50 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
            {clusterOptions.map((cluster) => (
              <button
                key={cluster}
                type="button"
                onClick={() => {
                  setSelectedCluster(cluster);
                  setIsClusterOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {cluster}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4 text-xs">
        <div>
          <span className="text-gray-500">생산 </span>
          <strong className="font-black text-gray-950">
            {summaryData.production.toLocaleString()}
          </strong>
          <span className="text-gray-400"> / </span>
          <span className="text-gray-500">
            {summaryData.target.toLocaleString()} EA
          </span>
        </div>

        <div className="h-3 w-px bg-gray-200" />

        <div>
          <span className="text-gray-500">달성률 </span>
          <strong className="font-black text-gray-950">
            {summaryData.achievementRate}%
          </strong>
        </div>

        <div>
          <span className="text-gray-500">가동률 </span>
          <strong className="font-black text-gray-950">
            {summaryData.utilization}%
          </strong>
        </div>

        <div>
          <span className="text-gray-500">불량률 </span>
          <strong className="font-black text-gray-950">
            {summaryData.defectRate}%
          </strong>
        </div>

        <div>
          <span className="text-gray-500">지연 LOT </span>
          <strong className="font-black text-red-600">
            {summaryData.delayedLots}건
          </strong>
        </div>

        <div>
          <span className="text-gray-500">긴급 주문 </span>
          <strong className="font-black text-gray-950">
            {summaryData.urgentOrders}건
          </strong>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserInfo />
      </div>
    </header>
  );
}