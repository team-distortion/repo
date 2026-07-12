import React from 'react';
import { useGetBookingsQuery, useCreateBookingMutation } from '../../store/apiSlice';

const timeline = ['9:00', '10:00', '11:00', '12:00', '1:00'];

export default function ResourceBooking() {
  const { data, isLoading, error } = useGetBookingsQuery();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();

  const bookings = data?.data || [];

  const handleBookSlot = async () => {
    try {
      // Basic implementation for booking a slot
      await createBooking({
        assetId: '123', // Replace with real asset selection in full implementation
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        purpose: 'Meeting',
      }).unwrap();
    } catch (err) {
      console.error('Failed to book:', err);
    }
  };

  if (isLoading) {
    return <div className="text-white p-6">Loading bookings...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-6">Failed to load bookings.</div>;
  }

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
              {bookings.length === 0 ? (
                <div className="text-slate-400 py-4">No bookings for this resource yet.</div>
              ) : (
                bookings.map((booking, index) => (
                  <BookingCard
                    key={booking.id || index}
                    top={`${index * 60}px`} // Simple positioning logic based on index for demonstration
                    height="58px"
                    label={booking.purpose || booking.title || 'Reserved'}
                    tone="bg-[#194f78] text-slate-100 border-slate-300/70"
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-10 max-w-4xl pl-16">
            <button 
              onClick={handleBookSlot}
              disabled={isBooking}
              className="bg-[#0e3b14] border border-emerald-200/40 text-slate-100 px-16 py-3 rounded-lg text-[15px] font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] disabled:opacity-50"
            >
              {isBooking ? 'Booking...' : 'Book a slot'}
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
