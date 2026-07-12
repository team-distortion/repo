import React from 'react';
import { useGetAuditsQuery, useGetAuditDetailsQuery, useCloseAuditMutation } from '../../store/apiSlice';

const verificationStyles = {
  Pending: 'border-slate-300/60 text-slate-100 bg-slate-700/90',
  Verified: 'border-emerald-400/50 text-emerald-100 bg-emerald-900/70',
  Missing: 'border-red-300/50 text-red-100 bg-red-900/70',
  Damaged: 'border-amber-300/60 text-amber-100 bg-amber-900/70',
};

function AuditCycleCard({ audit }) {
  const { data: auditDetails, isLoading } = useGetAuditDetailsQuery(audit.id);
  const [closeAudit, { isLoading: isClosing }] = useCloseAuditMutation();

  if (isLoading) return <div className="p-4 text-slate-400">Loading audit details...</div>;
  if (!auditDetails) return null;

  const { items, auditors, status, scopeType, scopeValue, startDate, endDate } = auditDetails.data;
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const period = `${formatDate(startDate)} - ${formatDate(endDate)}`;
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
    <section className="p-6 lg:p-8 space-y-6">
      <div className="rounded-2xl border border-slate-500/60 bg-[#3b2d28]/90 px-5 py-4 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex justify-between items-center">
        <div>
          <div className="text-[17px] leading-tight font-medium">
            {scopeType} audit: {scopeValue} - {period}
          </div>
          <div className="text-[16px] leading-tight text-slate-200/90">Auditors: {auditorNames}</div>
        </div>
        <div>
          <span className={`px-3 py-1 rounded-full text-sm border ${status === 'Closed' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-emerald-900/50 border-emerald-500 text-emerald-300'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-500/60 bg-slate-900/35 overflow-hidden">
        <div className="grid grid-cols-[1.7fr_1.2fr_1fr] gap-4 px-5 py-4 border-b border-slate-600/70 text-[15px] text-slate-200 font-medium">
          <div>Asset</div>
          <div>Asset Tag</div>
          <div>Verification</div>
        </div>

        <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
          {items.map((row) => (
            <div key={row.id} className="grid grid-cols-[1.7fr_1.2fr_1fr] gap-4 px-5 py-4 items-center text-[15px]">
              <div className="text-slate-100">{row.assetName}</div>
              <div className="text-slate-200/90">{row.assetTag}</div>
              <div className="justify-self-start">
                <span className={`inline-flex min-w-24 justify-center rounded-full border px-4 py-1 text-sm ${verificationStyles[row.verification] || verificationStyles.Pending}`}>
                  {row.verification}
                </span>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-5 py-4 text-slate-400">No items found for this audit cycle.</div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <div className="h-px bg-slate-600/70" />
      </div>

      {flaggedCount > 0 && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-950/75 px-5 py-3 text-amber-50 text-[15px] shadow-[0_10px_24px_rgba(120,53,15,0.25)]">
          {flaggedCount} assets flagged - discrepancy report generated automatically
        </div>
      )}

      {status !== 'Closed' && (
        <button
          onClick={handleClose}
          disabled={isClosing}
          className="rounded-xl border border-emerald-300/70 bg-emerald-950/50 px-5 py-2.5 text-[15px] text-emerald-100 transition-colors hover:bg-emerald-900/70 disabled:opacity-50"
        >
          {isClosing ? 'Closing...' : 'Close audit cycle'}
        </button>
      )}
    </section>
  );
}

export default function AssetAudit() {
  const { data, isLoading, error } = useGetAuditsQuery({ page: 1, pageSize: 10 });

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Screen 8 Asset Audit ( audit cycle, checklist, auto-generated discrepancy report):</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Asset Audit</h2>
      </div>

      <div className="rounded-[2.5rem] border border-slate-700/70 bg-slate-800/35 shadow-2xl overflow-hidden">
        {isLoading && <div className="p-8 text-slate-300">Loading audit cycles...</div>}
        {error && <div className="p-8 text-red-400">Failed to load audits.</div>}
        {data?.data?.map(audit => (
          <AuditCycleCard key={audit.id} audit={audit} />
        ))}
        {data?.data?.length === 0 && (
          <div className="p-8 text-slate-400">No audit cycles found.</div>
        )}
      </div>
    </div>
  );
}
