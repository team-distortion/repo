const timeline = ['9:00', '10:00', '11:00', '12:00', '1:00'];

export default function ResourceBooking() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Screen 6 Resource booking</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Resource Booking</h2>
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-slate-700/70 shadow-2xl overflow-hidden relative bg-slate-800/30">
        <div className="p-6 pb-4 border-b border-slate-700/70">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white">AssetFlow</h3>
          </div>
        </div>

        <section className="p-6 lg:p-8 relative">
          <div className="space-y-2 max-w-4xl">
            <label className="block text-sm text-slate-400 font-medium">Resource</label>
            <div className="rounded-lg border border-slate-500/70 bg-transparent px-4 py-2.5 text-white text-[15px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)_inset]">
              Conference room B2 - Tue, 7 Jul
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[64px_minmax(0,1fr)] gap-3 max-w-4xl">
            <div className="pt-3 space-y-8.5 text-slate-200 text-[15px]">
              {timeline.map((time) => (
                <div key={time}>{time}</div>
              ))}
            </div>

            <div className="relative h-65 mt-1">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  top="0px"
                  height="58px"
                  label={booking.title}
                  tone="bg-[#194f78] text-slate-100 border-slate-300/70"
                />
              ))}
            </div>
          </div>

          <div className="mt-10 max-w-4xl pl-16">
            <button className="bg-[#0e3b14] border border-emerald-200/40 text-slate-100 px-16 py-3 rounded-lg text-[15px] font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              Book a slot
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function BookingCard({ label, tone, top, height, dashed = false, muted = false }) {
  return (
    <div
      className={`absolute left-0 right-0 rounded-xl border px-4 py-2 ${tone} ${muted ? 'bg-transparent' : ''}`}
      style={{ top, height }}
    >
      <div className={`text-[15px] leading-tight ${dashed ? 'border-t border-dashed border-red-300/80 pt-1 mt-1' : ''}`}>
        {label}
      </div>
    </div>
  );
}
