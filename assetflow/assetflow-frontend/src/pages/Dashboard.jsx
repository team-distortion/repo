import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  AlertCircle, 
  Wrench, 
  ArrowRightLeft, 
  Clock, 
  Plus, 
  Check, 
  X 
} from 'lucide-react';
import { 
  useGetDashboardStatsQuery, 
  useGetTransfersQuery, 
  useGetUsersQuery, 
  useGetAssetsQuery, 
  useApproveTransferMutation, 
  useRejectTransferMutation 
} from '../store/apiSlice';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

export default function Dashboard() {
  const { role } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const { data: statsResponse, isLoading, error } = useGetDashboardStatsQuery();
  const { data: transfersRes } = useGetTransfersQuery({ pageSize: 100 });
  const { data: usersRes } = useGetUsersQuery();
  const { data: assetsRes } = useGetAssetsQuery({ pageSize: 100 });
  const [approveTransfer] = useApproveTransferMutation();
  const [rejectTransfer] = useRejectTransferMutation();

  if (isLoading) return <div className="text-[var(--color-text-secondary)] text-[14px] p-8">Loading dashboard...</div>;
  if (error) return <div className="text-[var(--color-error)] text-[14px] p-8">Failed to load dashboard stats.</div>;

  const stats = statsResponse?.data || {};
  const transfers = transfersRes?.data || [];
  const users = usersRes?.data || [];
  const assets = assetsRes?.data || [];
  
  const pendingTransfersList = transfers.filter(t => t.status === 'Requested');

  const handleApprove = async (id) => {
    try {
      await approveTransfer(id).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectTransfer(id).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            System overview and quick operations
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {['Admin', 'Asset Manager'].includes(role) && (
            <Button onClick={() => navigate('/assets')} variant="primary">
              <Plus className="w-4 h-4" strokeWidth={1.75} /> Register Asset
            </Button>
          )}
          <Button onClick={() => navigate('/bookings')} variant="secondary">
            Book Resource
          </Button>
          <Button onClick={() => navigate('/maintenance')} variant="secondary">
            Raise Request
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {stats.overdueReturns > 0 && (
        <div className="bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 rounded-xl p-4 flex items-center gap-3 text-[var(--color-error)]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
          <p className="text-[14px] font-medium">
            {stats.overdueReturns} asset{stats.overdueReturns > 1 ? 's' : ''} overdue for return — flagged for immediate follow-up.
          </p>
        </div>
      )}

      {/* KPI Section */}
      <div className="space-y-4">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-[var(--color-text)] tracking-tight">
          Today's Overview
        </h2>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard title="Total Assets" value={stats.totalAssets || 0} icon={Package} />
          <KpiCard title="Active Allocations" value={stats.activeAllocations || 0} icon={Package} />
          <KpiCard title="Open Maintenance" value={stats.openMaintenanceRequests || 0} icon={Wrench} />
          <KpiCard title="Active Bookings" value={stats.activeBookings || 0} icon={Calendar} />
          <KpiCard title="Pending Transfers" value={stats.pendingTransfers || 0} icon={ArrowRightLeft} />
          <KpiCard title="Upcoming Returns" value={stats.upcomingReturns || 0} icon={Clock} />
        </div>
      </div>

      {/* Activity & Approvals Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="flex flex-col h-[380px]">
          <h3 className="text-[18px] font-semibold text-[var(--color-text)] mb-4 tracking-tight">
            Recent Activity
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-[14px] text-[var(--color-text-secondary)] py-1 border-b border-[var(--color-surface-3)] last:border-b-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                  <p className="leading-relaxed">{activity}</p>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-[var(--color-text-tertiary)] py-6 text-center">No recent activity recorded.</p>
            )}
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight">
              Pending Approvals
            </h3>
            {pendingTransfersList.length > 0 && (
              <Badge status="Pending">{pendingTransfersList.length} Pending</Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {pendingTransfersList.length > 0 ? (
              pendingTransfersList.map((tr) => {
                const asset = assets.find(a => a.id === tr.asset_id) || {};
                const requestedBy = users.find(u => u.id === tr.requested_by)?.name || 'Unknown';
                const requestedTo = users.find(u => u.id === tr.requested_to_id)?.name || 'Unknown';
                return (
                  <div key={tr.id} className="bg-[var(--color-surface-2)] rounded-xl p-4 border border-[var(--color-border)] space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[14px] font-medium text-[var(--color-text)]">{asset.name || 'Asset Item'}</p>
                        <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                          {requestedBy} → {requestedTo}
                        </p>
                      </div>
                      <Badge status="Pending">Pending</Badge>
                    </div>
                    {tr.reason && (
                      <p className="text-[13px] text-[var(--color-text-secondary)] italic">"{tr.reason}"</p>
                    )}
                    {['Admin', 'Asset Manager'].includes(role) && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" variant="primary" onClick={() => handleApprove(tr.id)} className="flex-1">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(tr.id)} className="flex-1">
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-[13px] text-[var(--color-text-tertiary)] py-6 text-center">No pending approval requests.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon }) {
  return (
    <Card className="hover:border-[var(--color-border-strong)] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">{title}</p>
          <p className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] mt-2 tracking-tight">
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)]">
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  );
}
