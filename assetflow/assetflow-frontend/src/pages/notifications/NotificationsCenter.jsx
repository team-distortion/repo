const filterTabs = ['All', 'Alerts', 'Approvals', 'Bookings'];

const notifications = [
  { id: 1, tone: 'bg-blue-500', category: 'Alert', title: 'Laptop AF-0014 assigned to Priya Shah', time: '2m ago', detail: 'IT Engineering desk allocation completed from warehouse stock.' },
  { id: 2, tone: 'bg-emerald-500', category: 'Approval', title: 'Maintenance request AF-0055 approved', time: '18m ago', detail: 'Technician visit scheduled for tomorrow at 10:00 AM.' },
  { id: 3, tone: 'bg-sky-500', category: 'Booking', title: 'Booking confirmed: Room B2 : 2:00 to 3:00 PM', time: '1h ago', detail: 'Conference room reserved for product review meeting.' },
  { id: 4, tone: 'bg-violet-500', category: 'Approval', title: 'Transfer approved: AF-0033 to Facilities dept', time: '3h ago', detail: 'Asset ownership changed to Facilities inventory.' },
  { id: 5, tone: 'bg-amber-500', category: 'Alert', title: 'Overdue return: AF-0021 was due 3 days ago', time: '1d ago', detail: 'Return reminder sent to the borrowing department.' },
  { id: 6, tone: 'bg-orange-500', category: 'Alert', title: 'Audit discrepancy flagged: AF-0088 damaged', time: '2d ago', detail: 'Audit cycle created a discrepancy report automatically.' },
];

export default function NotificationsCenter() {
  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Screen 10 Activity logs &amp; Notifications</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Notifications</h2>
      </div>

      <div className="rounded-[2.5rem] border border-slate-700/70 bg-slate-800/35 shadow-2xl overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-700/70">
          <h3 className="text-2xl font-bold text-white">AssetFlow</h3>
        </div>

        <section className="p-6 lg:p-8 space-y-6">
          <div className="flex flex-wrap gap-3">
            {filterTabs.map((tab, index) => (
              <button
                key={tab}
                className={`rounded-lg border px-6 py-2 text-[15px] font-medium transition-colors ${index === 0 ? 'border-emerald-300/60 bg-emerald-950/60 text-emerald-50' : 'border-slate-600/80 bg-[#3a2c2b] text-slate-100 hover:bg-[#4a3735]'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-600/70 bg-slate-900/35 overflow-hidden">
            <div className="divide-y divide-slate-700/50">
              {notifications.map((item) => (
                <article key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 items-start px-5 py-4">
                  <div className={`mt-1 h-3 w-3 rounded-sm ${item.tone} shadow-[0_0_0_1px_rgba(255,255,255,0.12)]`} />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-[16px] font-medium text-slate-100 leading-tight">{item.title}</h4>
                      <span className="rounded-full border border-slate-600/80 bg-slate-800/60 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[14px] text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>

                  <div className="pt-1 text-[14px] text-slate-400 whitespace-nowrap">{item.time}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InfoCard title="Unread" value="12" tone="text-emerald-200" />
            <InfoCard title="Today" value="6 events" tone="text-sky-200" />
            <InfoCard title="Auto-generated" value="4 reports" tone="text-amber-200" />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ title, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-600/70 bg-slate-900/30 px-5 py-4">
      <p className="text-sm text-slate-400">{title}</p>
      <div className={`mt-2 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}