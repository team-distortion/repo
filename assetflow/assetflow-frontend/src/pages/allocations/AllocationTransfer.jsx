import { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

const mockAssets = [
  { tag: 'AF-0114', name: 'Dell laptop', holder: { name: 'Priya Shah', department: 'Engineering' }, isAllocated: true },
  { tag: 'AF-0201', name: 'Office chair', holder: null, isAllocated: false },
];

const mockEmployees = [
  { id: 1, name: 'Raj Kumar', department: 'Engineering' },
  { id: 2, name: 'Arjun Nair', department: 'IT' },
  { id: 3, name: 'Sana Iqbal', department: 'Field Ops' },
  { id: 4, name: 'Aditi Rao', department: 'Engineering' },
];

const mockHistory = [
  { date: 'Mar 12', text: 'Allocated to Priya shah - Engineering' },
  { date: 'Jan 04', text: 'Returned by Arjun Nair - condition: good' },
];

export default function AllocationTransfer() {
  const [selectedTag, setSelectedTag] = useState('AF-0114');
  const [transferTo, setTransferTo] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedAsset = mockAssets.find((a) => a.tag === selectedTag) ?? mockAssets[0];
  const isBlocked = selectedAsset.isAllocated && selectedAsset.holder;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transferTo || !reason.trim()) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Allocation & Transfer</h2>
        <p className="text-slate-400 mt-2 text-sm">Manage asset assignments and transfer requests.</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 space-y-6 border border-slate-700/60 shadow-2xl">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Asset</label>
          <select
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setTransferTo('');
              setReason('');
              setSubmitted(false);
            }}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            {mockAssets.map((asset) => (
              <option key={asset.tag} value={asset.tag}>
                {asset.tag} - {asset.name}
              </option>
            ))}
          </select>
        </div>

        {isBlocked && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Already Allocated to {selectedAsset.holder.name} ({selectedAsset.holder.department})
              </p>
              <p className="text-sm mt-1 text-red-400/80">
                Direct re-allocation is blocked — submit a transfer request below
              </p>
            </div>
          </div>
        )}

        {!isBlocked && (
          <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-xl p-4 text-emerald-400 text-sm">
            This asset is available for direct allocation.
          </div>
        )}

        {isBlocked && (
          <div className="space-y-5 pt-2">
            <h3 className="text-lg font-semibold text-white">Transfer Request</h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
              <input
                type="text"
                readOnly
                value={selectedAsset.holder.name}
                className="w-full bg-slate-900/30 border border-slate-700/60 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="">Select Employee....</option>
                {mockEmployees
                  .filter((emp) => emp.name !== selectedAsset.holder.name)
                  .map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} — {emp.department}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-600"
                placeholder="Describe why this transfer is needed..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!transferTo || !reason.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Request
            </button>

            {submitted && (
              <p className="text-emerald-400 text-sm font-medium animate-in fade-in">
                Transfer request submitted for approval.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Allocation history</h3>
        <div className="space-y-3">
          {mockHistory.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
              <p className="text-[15px]">
                <span className="text-slate-500">{entry.date}</span>
                {' — '}
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
