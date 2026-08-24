import { useState, useMemo, useEffect } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { 
  useGetAssetsQuery, 
  useGetUsersQuery, 
  useCreateTransferMutation, 
  useGetAllocationsQuery, 
  useGetDepartmentsQuery, 
  useGetTransfersQuery, 
  useCreateAllocationMutation 
} from '../../store/apiSlice';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

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

  const displayAssets = assets.length > 0 ? assets : [{ id: 'mock-1', tag: 'AF-0114', name: 'Dell laptop', status: 'Available' }];
  const selectedAsset = displayAssets.find((a) => a.id === (selectedAssetId || displayAssets[0]?.id)) || displayAssets[0];
  
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
          text: `Returned by ${assignedUser.name} — condition: ${alloc.condition_check_in_notes || 'good'}`
        });
      }
      
      history.push({
        timestamp: new Date(alloc.created_at).getTime(),
        date: new Date(alloc.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        text: `Allocated to ${assignedUser.name} (${deptName})`
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

  useEffect(() => {
    if (activeAllocation?.assigned_user_id) {
      setTransferFromId(activeAllocation.assigned_user_id);
    } else {
      setTransferFromId('');
    }
  }, [activeAllocation]);

  const activeAllocationUser = users.find(u => u.id === activeAllocation?.assigned_user_id);
  const activeAllocationDept = departments.find(d => d.id === activeAllocation?.assigned_dept_id || d.id === activeAllocationUser?.departmentId);

  const currentHolderName = activeAllocationUser?.name || selectedAsset?.holder?.name || 'Current Holder';
  const currentHolderDept = activeAllocationDept?.name || selectedAsset?.holder?.department || 'Department';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transferToId || !reason.trim() || !selectedAsset) return;
    
    try {
      if (isBlocked) {
        await createTransfer({
          assetId: selectedAsset.id,
          allocationId: activeAllocation?.id,
          requestedToType: 'Employee',
          requestedToId: transferToId,
          reason
        }).unwrap();
      } else {
        await createAllocation({
          assetId: selectedAsset.id,
          assignedUserId: transferToId,
          assignedDeptId: null,
          notes: reason
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
          Allocation & Transfer
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
          Manage equipment assignments, department handoffs, and transfer approvals
        </p>
      </div>

      {/* Main Request Form Card */}
      <Card className="space-y-6">
        <div className="space-y-1">
          <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
            Select Asset
          </label>
          <select
            value={selectedAssetId || (selectedAsset?.id || '')}
            onChange={(e) => {
              setSelectedAssetId(e.target.value);
              setTransferToId('');
              setReason('');
              setSubmitted(false);
            }}
            className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer"
          >
            {displayAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_tag || asset.tag} — {asset.name} ({asset.status})
              </option>
            ))}
          </select>
        </div>

        {/* Warning Alert if already allocated */}
        {isBlocked && (
          <div className="bg-[var(--color-error-tint)] border border-[var(--color-error)]/40 rounded-xl p-4 flex items-start gap-3 text-[var(--color-error)]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-[14px] font-medium">
                Already Allocated to {currentHolderName} ({currentHolderDept})
              </p>
              <p className="text-[13px] text-[var(--color-error)]/80 mt-0.5">
                Direct re-allocation is blocked — submit a transfer request below.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight">
            {isBlocked ? 'Transfer Request' : 'Allocation Request'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
                From (Current Holder)
              </label>
              <select
                value={transferFromId}
                disabled={isBlocked}
                onChange={(e) => setTransferFromId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-disabled)] disabled:border-[var(--color-border)]"
              >
                <option value="">None / Storage</option>
                {users.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role || 'Employee'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
                To (New Recipient)
              </label>
              <select
                required
                value={transferToId}
                onChange={(e) => setTransferToId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer"
              >
                <option value="">Select Recipient Employee...</option>
                {users.filter(emp => emp.id !== transferFromId).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role || 'Employee'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
              Reason for Transfer / Allocation
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the operational reason for this assignment..."
              className="w-full p-3 rounded-lg text-[14px] text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={!transferToId || !reason.trim() || isLoading}
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
              {isLoading ? 'Submitting...' : isBlocked ? 'Submit Transfer Request' : 'Allocate Asset'}
            </Button>

            {submitted && (
              <p className="text-[13px] text-[var(--color-primary)] font-medium animate-in fade-in">
                Request submitted successfully.
              </p>
            )}
          </div>
        </form>
      </Card>

      {/* Asset History Section */}
      <Card className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight">
          Allocation History
        </h2>
        <div className="space-y-3">
          {assetHistory.length > 0 ? (
            assetHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)] py-1 border-b border-[var(--color-surface-3)] last:border-b-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                <p className="leading-relaxed">
                  <span className="text-[var(--color-text-tertiary)] font-mono text-[13px] mr-2">{entry.date}</span>
                  {entry.text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[var(--color-text-tertiary)] py-4 text-center">
              No historical records found for this asset.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
