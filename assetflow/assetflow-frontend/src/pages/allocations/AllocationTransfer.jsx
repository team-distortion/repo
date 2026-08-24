import { useState, useMemo, useEffect } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { useGetAssetsQuery, useGetUsersQuery, useCreateTransferMutation, useGetAllocationsQuery, useGetDepartmentsQuery, useGetTransfersQuery, useCreateAllocationMutation } from '../../store/apiSlice';

export default function AllocationTransfer() {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: assetsRes } = useGetAssetsQuery({ pageSize: 100 });
  const { data: usersRes } = useGetUsersQuery();
  const { data: allocsRes } = useGetAllocationsQuery({ pageSize: 100 });
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: transfersRes } = useGetTransfersQuery({ pageSize: 100 });
  const [createTransfer, { isLoading: isTransferLoading }] = useCreateTransferMutation();
  const [createAllocation, { isLoading: isAllocLoading }] = useCreateAllocationMutation();
  
  const isLoading = isTransferLoading || isAllocLoading;

  const assets = assetsRes?.data || [];
  const users = usersRes?.data || [];
  const allocations = allocsRes?.data || [];
  const departments = deptsRes?.data || [];
  const transfers = transfersRes?.data || [];

  const allocatedAssets = useMemo(() => {
    return assets.filter(a => a.status === 'Allocated');
  }, [assets]);

  const displayAssets = assets.length > 0 ? assets : [{ id: 'mock-1', tag: 'AF-0114', name: 'Dell laptop', status: 'Available' }];
  
  const selectedAsset = displayAssets.find((a) => a.id === (selectedAssetId || displayAssets[0]?.id)) || displayAssets[0];
  
  // Reverted: Only block/show warning if truly allocated
  const isBlocked = selectedAsset?.status === 'Allocated';

  const assetHistory = useMemo(() => {
    if (!selectedAsset || selectedAsset.id === 'mock-1') return [];
    
    const assetAllocs = allocations.filter(a => a.asset_id === selectedAsset.id);
    const assetTransfers = transfers.filter(t => t.asset_id === selectedAsset.id);
    const history = [];
    
    assetAllocs.forEach(alloc => {
      const assignedUser = users.find(u => u.id === alloc.assigned_user_id) || { name: 'Unknown User' };
      const dept = departments.find(d => d.id === alloc.assigned_dept_id || d.id === assignedUser.departmentId);
      const deptName = dept ? dept.name : 'Unassigned';
      
      if (alloc.returned_at) {
        history.push({
          timestamp: new Date(alloc.returned_at).getTime(),
          date: new Date(alloc.returned_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
          text: `Returned by ${assignedUser.name} - condition: ${alloc.condition_check_in_notes || 'good'}`
        });
      }
      
      history.push({
        timestamp: new Date(alloc.created_at).getTime(),
        date: new Date(alloc.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        text: `Allocated to ${assignedUser.name} - ${deptName}`
      });
    });

    assetTransfers.forEach(tr => {
      const toUser = users.find(u => u.id === tr.requested_to_id) || { name: 'Unknown User' };
      const statusText = tr.status === 'Requested' ? '(Pending)' : tr.status === 'Approved' ? '(Approved)' : tr.status === 'Rejected' ? '(Rejected)' : '';
      history.push({
        timestamp: new Date(tr.created_at).getTime(),
        date: new Date(tr.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        text: `Transfer request submitted for ${toUser.name} ${statusText}`
      });
    });
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }, [allocations, transfers, selectedAsset, users, departments]);

  const activeAllocation = useMemo(() => {
    return allocations.find(a => a.asset_id === selectedAsset?.id && !a.returned_at);
  }, [allocations, selectedAsset]);

  // Sync transferFromId when selectedAsset changes
  useEffect(() => {
    if (activeAllocation?.assigned_user_id) {
      setTransferFromId(activeAllocation.assigned_user_id);
    } else {
      setTransferFromId(''); // Clear "From" if asset is available
    }
  }, [activeAllocation]);

  // Fallback for current holder if populated in backend, else use activeAllocation
  const activeAllocationUser = users.find(u => u.id === activeAllocation?.assigned_user_id);
  const activeAllocationDept = departments.find(d => d.id === activeAllocation?.assigned_dept_id || d.id === activeAllocationUser?.departmentId);

  const currentHolderName = activeAllocationUser?.name || selectedAsset?.holder?.name || 'Current Holder';
  const currentHolderDept = activeAllocationDept?.name || selectedAsset?.holder?.department || 'Department';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For Allocation (Available): Reason is optional? Let's keep it required just in case, but usually not required for allocation.
    // The user's prompt says "Add text box for reason of transfer". We'll require it for both.
    if (!transferToId || !reason.trim() || !selectedAsset) return;
    
    try {
      if (isBlocked) {
        // Submit a Transfer Request
        await createTransfer({
          assetId: selectedAsset.id,
          allocationId: activeAllocation?.id,
          requestedToType: 'Employee',
          requestedToId: transferToId,
          reason
        }).unwrap();
      } else {
        // Submit an Allocation Request
        await createAllocation({
          assetId: selectedAsset.id,
          assignedUserId: transferToId,
          assignedDeptId: null,
          notes: reason // Assuming notes or just send it anyway
        }).unwrap();
      }
      
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setTransferToId('');
      setReason('');
    } catch (err) {
      console.error('Failed to submit request:', err);
    }
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
            value={selectedAssetId || (selectedAsset?.id || '')}
            onChange={(e) => {
              setSelectedAssetId(e.target.value);
              setTransferToId('');
              setReason('');
              setSubmitted(false);
            }}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            {displayAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_tag || asset.tag} - {asset.name}
              </option>
            ))}
          </select>
        </div>

        {isBlocked && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Already Allocated to {currentHolderName} ({currentHolderDept})
              </p>
              <p className="text-sm mt-1 text-red-400/80">
                Direct re-allocation is blocked — submit a transfer request below
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5 pt-2">
          <h3 className="text-lg font-semibold text-white">{isBlocked ? 'Transfer Request' : 'Allocation Request'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
              <select
                value={transferFromId}
                onChange={(e) => setTransferFromId(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="">Select Employee....</option>
                {users.filter(emp => emp.id !== transferToId).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role || 'Employee'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
              <select
                value={transferToId}
                onChange={(e) => setTransferToId(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="">Select Employee....</option>
                {users.filter(emp => emp.id !== transferFromId).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role || 'Employee'}
                  </option>
                ))}
              </select>
            </div>
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
            disabled={!transferToId || !reason.trim() || isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>

          {submitted && (
            <p className="text-emerald-400 text-sm font-medium animate-in fade-in">
              Transfer request submitted for approval.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Allocation history</h3>
        <div className="space-y-3">
          {assetHistory.length > 0 ? (
            assetHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                <p className="text-[15px]">
                  <span className="text-slate-500">{entry.date}</span>
                  {' — '}
                  {entry.text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">No allocation history found for this asset.</p>
          )}
        </div>
      </div>
    </div>
  );
}
