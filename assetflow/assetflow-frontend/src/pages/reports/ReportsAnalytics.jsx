const utilizationBars = [54, 76, 92, 68, 55, 81];

const maintenanceSeries = [
  { x: 0, y: 72 },
  { x: 42, y: 44 },
  { x: 84, y: 52 },
  { x: 126, y: 26 },
  { x: 168, y: 42 },
  { x: 210, y: 10 },
  { x: 252, y: 6 },
];

export default function ReportsAnalytics() {
  const linePoints = maintenanceSeries.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Screen 9 Reports &amp; Analytics ( utilization, maintenance frequency, most-used/idle, booking heatmap):</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Reports &amp; Analytics</h2>
      </div>

      <div className="rounded-[2.5rem] border border-slate-700/70 bg-slate-800/35 shadow-2xl overflow-hidden">
        <section className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Utilization by department">
              <div className="flex h-full items-end gap-3 px-2 pt-5 pb-2">
                {utilizationBars.map((height, index) => (
                  <div key={height} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full max-w-10 rounded-t-md border border-[#f3d99c]/70 bg-[#5f470f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" style={{ height: `${height}%` }} />
                    <span className="text-[11px] text-slate-300">D{index + 1}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Maintenance Frequency">
              <div className="h-full px-2 pt-5 pb-2">
                <svg viewBox="0 0 280 120" className="h-full w-full overflow-visible">
                  <path d="M 0 104 L 280 104" stroke="rgba(226,232,240,0.6)" strokeWidth="1.2" />
                  <polyline points={linePoints} fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-[15px] text-slate-200">
            <div>
              <h3 className="mb-3 text-[18px] font-semibold text-slate-100">Most used assets</h3>
              <div className="space-y-1 text-slate-300">
                <div>Room B2: 34 booking this month</div>
                <div>Van AF-343: 21 trips this month</div>
                <div>Projector AF-335: 18 uses</div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-[18px] font-semibold text-slate-100">Idle assets</h3>
              <div className="space-y-1 text-slate-300">
                <div>Camera AF-0301 : unused 60+ days</div>
                <div>chair AF-0410 : unused 45 days</div>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="h-px bg-slate-600/70" />
          </div>

          <div className="space-y-3 text-[15px]">
            <h3 className="text-[18px] font-semibold text-slate-100">Assets due for maintenance / nearing retirement</h3>
            <div className="space-y-1 text-slate-300">
              <div>Forklift AF-0087 : service due in 5 days</div>
              <div>Laptop AF-0020 : 4 years old : nearing retirement</div>
            </div>

            <button className="mt-4 rounded-lg border border-slate-500/80 bg-[#3a2725] px-8 py-2.5 text-[15px] text-slate-100 transition-colors hover:bg-[#4a332f]">
              Export report
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-[2rem] border border-slate-500/60 bg-[#20496d]/90 px-5 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.22)] min-h-[220px]">
      <h3 className="text-[18px] font-medium text-slate-100">{title}</h3>
      <div className="h-[170px]">{children}</div>
    </div>
  );
}

