const columns = [
  {
    title: 'Pending',
    cards: [
      { id: 'AF-0062', title: 'Projector bulb not turning on', tone: 'border-slate-500/70 text-slate-100 bg-transparent' },
    ],
  },
  {
    title: 'Approved',
    cards: [
      { id: 'AF-003', title: 'ac unit noisy compressor', tone: 'border-slate-500/70 text-slate-100 bg-transparent' },
    ],
  },
  {
    title: 'Technician assigned',
    cards: [
      { id: 'AF-0078', title: 'forklift tech: R varma', tone: 'border-slate-500/70 text-slate-100 bg-transparent' },
    ],
  },
  {
    title: 'in progress',
    cards: [
      { id: 'AF-897', title: 'Printer Jam parts ordered', tone: 'border-slate-500/70 text-slate-100 bg-transparent' },
    ],
  },
  {
    title: 'Resolved',
    cards: [
      { id: 'AF-873', title: 'Chair repair resolved 7 Jul', tone: 'border-emerald-300/70 text-emerald-100 bg-emerald-900/55' },
    ],
  },
];

export default function MaintenanceManagement() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Screen 7 Maintenance Management ( approval workflow as kanban board ):</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Maintenance Management</h2>
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-slate-700/70 shadow-2xl overflow-hidden relative bg-slate-800/30">
        <div className="p-6 pb-4 border-b border-slate-700/70">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white">AssetFlow</h3>
          </div>
        </div>

        <section className="p-6 lg:p-8 relative">
          <div className="grid grid-cols-5 gap-0 max-w-full">
            {columns.map((column) => (
              <div key={column.title} className="min-h-140 border-r border-slate-700/60 last:border-r-0 px-4">
                <div className="text-center pb-4 border-b border-slate-600/80 mb-4">
                  <h4 className="text-[17px] font-medium text-slate-100 leading-tight">{column.title}</h4>
                </div>

                <div className="space-y-4">
                  {column.cards.map((card) => (
                    <div key={card.id} className={`rounded-xl border px-3 py-2.5 shadow-sm ${card.tone}`}>
                      <div className="text-[15px] leading-tight">
                        <div>{card.id}</div>
                        <div>{card.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="absolute left-6 right-6 bottom-6 text-center text-slate-200 text-[15px]">
            Approving a card moves the asset to under maintenance, resolving return it to availble
          </p>
        </section>
      </div>
    </div>
  );
}
