import ClusterStatusCard from "./ClusterStatusCard";

const clusterData = [
  {
    name: "공정 A",
    process: "Photo 공정",
    utilization: 92,
    activeLots: 18,
    equipmentIssueCount: 2,
    productionCount: 4280,
    defectCount: 82,
    status: "danger" as const,
  },
  {
    name: "공정 B",
    process: "Etching 공정",
    utilization: 76,
    activeLots: 12,
    equipmentIssueCount: 0,
    productionCount: 3610,
    defectCount: 41,
    status: "normal" as const,
  },
  {
    name: "공정 C",
    process: "Inspection 공정",
    utilization: 84,
    activeLots: 15,
    equipmentIssueCount: 1,
    productionCount: 2940,
    defectCount: 57,
    status: "warning" as const,
  },
];

export default function ClusterStatusSection() {
  return (
    <section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {clusterData.map((cluster) => (
          <ClusterStatusCard key={cluster.name} {...cluster} />
        ))}
      </div>
    </section>
  );
}