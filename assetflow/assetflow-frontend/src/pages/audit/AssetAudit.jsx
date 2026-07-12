const auditRows = [
  { asset: 'AF-003 Dell laptop', expectedLocation: 'Desk E12', verification: 'Verified', tone: 'verified' },
  { asset: 'AF-9921 office chair', expectedLocation: 'Desk E14', verification: 'Missing', tone: 'missing' },
  { asset: 'AF-9838 Monitor', expectedLocation: 'Desk E15', verification: 'Damaged', tone: 'damaged' },
];

const verificationStyles = {
  Verified: 'border-emerald-400/50 text-emerald-100 bg-emerald-900/70',
  Missing: 'border-red-300/50 text-red-100 bg-red-900/70',
  Damaged: 'border-slate-300/60 text-slate-100 bg-slate-700/90',
};

export default function AssetAudit() {
  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Screen 8 Asset Audit ( audit cycle, checklist, auto-generated discrepancy report):</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Asset Audit</h2>
      </div>

      <div className="rounded-[2.5rem] border border-slate-700/70 bg-slate-800/35 shadow-2xl overflow-hidden">
        <section className="p-6 lg:p-8 space-y-6">
          <div className="rounded-2xl border border-slate-500/60 bg-[#3b2d28]/90 px-5 py-4 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="text-[17px] leading-tight font-medium">Q3 audit: Engineering dept - 1-15 Jul</div>
            <div className="text-[16px] leading-tight text-slate-200/90">Auditors: A. Rao, S. Iqbal</div>
          </div>

          <div className="rounded-2xl border border-slate-500/60 bg-slate-900/35 overflow-hidden">
            <div className="grid grid-cols-[1.7fr_1.2fr_1fr] gap-4 px-5 py-4 border-b border-slate-600/70 text-[15px] text-slate-200 font-medium">
              <div>Asset</div>
              <div>Expected location</div>
              <div>Verification</div>
            </div>

            <div className="divide-y divide-slate-700/50">
              {auditRows.map((row) => (
                <div key={row.asset} className="grid grid-cols-[1.7fr_1.2fr_1fr] gap-4 px-5 py-4 items-center text-[15px]">
                  <div className="text-slate-100">{row.asset}</div>
                  <div className="text-slate-200/90">{row.expectedLocation}</div>
                  <div className="justify-self-start">
                    <span className={`inline-flex min-w-24 justify-center rounded-full border px-4 py-1 text-sm ${verificationStyles[row.verification]}`}>
                      {row.verification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="h-px bg-slate-600/70" />
          </div>

          <div className="rounded-xl border border-amber-300/40 bg-amber-950/75 px-5 py-3 text-amber-50 text-[15px] shadow-[0_10px_24px_rgba(120,53,15,0.25)]">
            2 assets flagged - discrepancy report generated automatically
          </div>

          <button className="rounded-xl border border-emerald-300/70 bg-emerald-950/50 px-5 py-2.5 text-[15px] text-emerald-100 transition-colors hover:bg-emerald-900/70">
            Close audit cycle
          </button>
        </section>
      </div>
    </div>
  );
}
