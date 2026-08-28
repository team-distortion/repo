import { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { 
  useGetBookingsQuery, 
  useCreateBookingMutation,
  useGetAssetsQuery 
} from '../../store/apiSlice';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const timeline = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function ResourceBooking() {
  const { data: bookingsData, isLoading, error } = useGetBookingsQuery();
  const { data: assetsData } = useGetAssetsQuery({ pageSize: 100 });
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    assetId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });

  const bookings = bookingsData?.data || [];
  const sharedAssets = (assetsData?.data || []).filter(a => a.is_shared || a.status === 'Available');

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await createBooking({
        assetId: newBooking.assetId || sharedAssets[0]?.id,
        startTime: new Date(newBooking.startTime).toISOString(),
        endTime: new Date(newBooking.endTime).toISOString(),
        purpose: newBooking.purpose,
      }).unwrap();
      setIsModalOpen(false);
      setNewBooking({ assetId: '', startTime: '', endTime: '', purpose: '' });
    } catch (err) {
      console.error('Failed to book resource:', err);
    }
  };

  if (isLoading) return <div className="text-[var(--color-text-secondary)] text-[14px] p-8">Loading bookings...</div>;
  if (error) return <div className="text-[var(--color-error)] text-[14px] p-8">Failed to load bookings.</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
            Resource Booking
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Reserve conference rooms, shared projectors, and company equipment
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          <Plus className="w-4 h-4" strokeWidth={1.75} /> Book a Slot
        </Button>
      </div>

      {/* Main Schedule View Card */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.75} />
            <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight">
              Daily Schedule View
            </h2>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="space-y-3">
          {timeline.map((time, idx) => {
            const activeBooking = bookings[idx % Math.max(1, bookings.length)];
            const hasBooking = bookings.length > 0 && idx < bookings.length;

            return (
              <div key={time} className="grid grid-cols-[100px_1fr] items-center gap-4 py-2 border-b border-[var(--color-border)] last:border-b-0">
                <span className="text-[13px] font-mono text-[var(--color-text-secondary)]">{time}</span>
                {hasBooking && activeBooking ? (
                  <div className="h-10 px-4 rounded-lg bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/50 flex items-center justify-between text-[var(--color-text)]">
                    <span className="text-[14px] font-medium truncate">
                      {activeBooking.purpose || activeBooking.name || 'Team Reservation'}
                    </span>
                    <span className="text-[12px] text-[var(--color-primary)]">Booked</span>
                  </div>
                ) : (
                  <div className="h-10 px-4 rounded-lg border border-dashed border-[var(--color-border-strong)] flex items-center text-[13px] text-[var(--color-text-tertiary)]">
                    Available for reservation
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Book Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Reserve Resource"
        size="md"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
              Resource
            </label>
            <select
              required
              value={newBooking.assetId}
              onChange={e => setNewBooking({ ...newBooking, assetId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer"
            >
              <option value="">Select Resource...</option>
              {sharedAssets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.asset_tag || a.tag || 'Shared'})
                </option>
              ))}
            </select>
          </div>

          <Input
            id="start-time"
            label="Start Date & Time"
            type="datetime-local"
            required
            value={newBooking.startTime}
            onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })}
          />

          <Input
            id="end-time"
            label="End Date & Time"
            type="datetime-local"
            required
            value={newBooking.endTime}
            onChange={e => setNewBooking({ ...newBooking, endTime: e.target.value })}
          />

          <Input
            id="booking-purpose"
            label="Purpose"
            required
            placeholder="e.g. Client presentation, Sprint planning"
            value={newBooking.purpose}
            onChange={e => setNewBooking({ ...newBooking, purpose: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isBooking}>
              {isBooking ? 'Reserving...' : 'Confirm Reservation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
