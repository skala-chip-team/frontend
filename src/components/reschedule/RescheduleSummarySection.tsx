const SUMMARY_ITEMS = [
  {
    label: '승인 대기',
    value: '3건',
    description: '검토 필요한 재조정안',
  },
  {
    label: '예상 지연 감소',
    value: '2.5시간',
    description: '승인 시 단축 예상',
  },
  {
    label: '가동률 개선',
    value: '+8.2%',
    description: '평균 장비 가동률',
  },
  {
    label: '영향 UNIT',
    value: '7개',
    description: '재조정 대상 UNIT',
  },
];

export default function RescheduleSummarySection() {
  return (
    <section className="grid grid-cols-4 gap-4">
      {SUMMARY_ITEMS.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">{item.label}</p>

          <p className="mt-2 text-2xl font-black text-gray-950">
            {item.value}
          </p>

          <p className="mt-1 text-xs font-medium text-gray-400">
            {item.description}
          </p>
        </div>
      ))}
    </section>
  );
}