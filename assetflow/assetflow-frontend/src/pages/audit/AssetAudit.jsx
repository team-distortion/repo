import { useGetAuditsQuery, useGetAuditDetailsQuery, useCloseAuditMutation } from '../../store/apiSlice';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function AuditCycleCard({ audit }) {
  const { data: auditDetails, isLoading } = useGetAuditDetailsQuery(audit.id);
  const [closeAudit, { isLoading: isClosing }] = useCloseAuditMutation();

  if (isLoading) return <div className="p-6 text-[#98989D] text-[14px]">Loading audit details...</div>;
  if (!auditDetails?.data) return null;

  const { items = [], auditors = [], status, scopeType, scopeValue, startDate, endDate } = auditDetails.data;
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const period = `${formatDate(startDate)} – ${formatDate(endDate)}`;
  const auditorNames = auditors.map(a => a.name).join(', ') || 'Unassigned';

  const flaggedCount = items.filter(i => i.verification === 'Missing' || i.verification === 'Damaged').length;

  const handleClose = async () => {
    try {
      await closeAudit(audit.id).unwrap();
    } catch (err) {
      console.error('Failed to close audit:', err);
    }
  };

  return (
    <Card className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#38383A]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight">
              {scopeType} Audit: {scopeValue || 'General'}
            </h2>
            <Badge status={status}>{status}</Badge>
          </div>
          <p className="text-[13px] text-[#98989D] mt-1">
            Period: {period} · Auditors: {auditorNames}
          </p>
        </div>

        {status !== 'Closed' && (
          <Button onClick={handleClose} disabled={isClosing} variant="secondary">
            <CheckCircle2 className="w-4 h-4 text-[#32D74B]" strokeWidth={1.75} />
            {isClosing ? 'Closing...' : 'Close Audit Cycle'}
          </Button>
        )}
      </div>

      {/* Discrepancy Alert Banner if items are missing/damaged */}
      {flaggedCount > 0 && (
        <div className="bg-[#332405] border border-[#FF9F0A]/40 rounded-xl p-4 flex items-center gap-3 text-[#FFB340]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
          <p className="text-[14px] font-medium">
            {flaggedCount} asset discrepancy flagged — discrepancy report logged automatically for review.
          </p>
        </div>
      )}

      {/* Audit Items Table (§9 Tables) */}
      <div className="bg-[#202022] border border-[#38383A] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="h-11 border-b border-[#38383A] bg-[#2C2C2E]">
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Asset Name</th>
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Asset Tag</th>
              <th className="px-4 text-[12px] font-medium text-[#98989D] uppercase tracking-wider">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#38383A]">
            {items.map((row) => (
              <tr key={row.id} className="h-14 hover:bg-[#2C2C2E] transition-colors">
                <td className="px-4 text-[14px] font-medium text-[#F5F5F7]">
                  {row.assetName}
                </td>
                <td className="px-4 text-[14px] font-mono text-[#0A84FF]">
                  {row.assetTag}
                </td>
                <td className="px-4">
                  <Badge status={row.verification}>{row.verification}</Badge>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="h-24 text-center text-[#6E6E73] text-[14px]">
                  No items listed in this audit cycle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AssetAudit() {
  const { data, isLoading, error } = useGetAuditsQuery({ page: 1, pageSize: 10 });
  const audits = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[36px] font-semibold leading-[1.15] text-[#F5F5F7] tracking-tight">
          Asset Audit
        </h1>
        <p className="text-[14px] text-[#98989D] mt-1">
          Review scheduled physical inventory cycles, verification status, and discrepancy flags
        </p>
      </div>

      {isLoading && <div className="text-[#98989D] text-[14px] p-8">Loading audit cycles...</div>}
      {error && <div className="text-[#FF6961] text-[14px] p-8">Failed to load audit records.</div>}

      <div className="space-y-6">
        {audits.map(audit => (
          <AuditCycleCard key={audit.id} audit={audit} />
        ))}
        {audits.length === 0 && !isLoading && (
          <Card className="text-center py-12 text-[#6E6E73] text-[14px]">
            No active audit cycles recorded.
          </Card>
        )}
      </div>
    </div>
  );
}
