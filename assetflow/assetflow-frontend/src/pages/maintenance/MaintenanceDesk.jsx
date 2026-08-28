import { useState } from 'react';
import { Plus } from 'lucide-react';
import { 
  useGetMaintenanceRequestsQuery as useGetMaintenanceQuery, 
  useCreateMaintenanceRequestMutation as useCreateMaintenanceMutation,
  useGetAssetsQuery,
  useUploadAttachmentMutation
} from '../../store/apiSlice';
import FileUploadDropzone from '../../components/ui/FileUploadDropzone';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function MaintenanceDesk() {
  const { data, isLoading, error } = useGetMaintenanceQuery();
  const { data: assetsData } = useGetAssetsQuery({ pageSize: 1000 });
  const [createRequest, { isLoading: isCreating }] = useCreateMaintenanceMutation();
  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ assetId: '', issueDescription: '', priority: 'Medium' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const maintenanceList = data?.data || [];
  const assets = assetsData?.data || [];

  const handleNewRequest = async (e) => {
    e.preventDefault();
    try {
      const createdRes = await createRequest({
        assetId: newRequest.assetId,
        description: newRequest.issueDescription,
        priority: newRequest.priority,
      }).unwrap();
      
      const maintenanceId = createdRes.data?.id || createdRes.id;
      
      if (maintenanceId && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('entity_type', 'MaintenanceRequest');
          formData.append('entity_id', maintenanceId);
          await uploadAttachment(formData).unwrap();
        }
      }

      setIsModalOpen(false);
      setNewRequest({ assetId: '', issueDescription: '', priority: 'Medium' });
      setSelectedFiles([]);
    } catch (err) {
      console.error('Failed to create request or upload files:', err);
    }
  };

  if (isLoading) return <div className="text-[var(--color-text-secondary)] text-[14px] p-8">Loading maintenance requests...</div>;
  if (error) return <div className="text-[var(--color-error)] text-[14px] p-8">Failed to load maintenance requests.</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
            Maintenance Desk
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Track equipment repairs, work orders, and technical servicing
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          <Plus className="w-4 h-4" strokeWidth={1.75} /> Raise Request
        </Button>
      </div>

      {/* Table Card Surface */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="h-11 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Ticket ID</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Asset</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Issue Description</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Priority</th>
                <th className="px-4 text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Requested By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {maintenanceList.map((req) => (
                <tr key={req.id} className="h-14 hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-4 text-[13px] font-mono text-[var(--color-text-secondary)]">
                    {req.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 text-[14px] font-medium text-[var(--color-text)]">
                    {req.assetName || req.assetId || 'Asset Item'}
                  </td>
                  <td className="px-4 text-[14px] text-[var(--color-text-secondary)] max-w-xs truncate" title={req.description}>
                    {req.description}
                  </td>
                  <td className="px-4">
                    <Badge status={req.status}>{req.status}</Badge>
                  </td>
                  <td className="px-4 text-[14px] text-[var(--color-text)]">
                    {req.priority}
                  </td>
                  <td className="px-4 text-[14px] text-[var(--color-text-secondary)]">
                    {req.requestedBy || 'N/A'}
                  </td>
                </tr>
              ))}
              {maintenanceList.length === 0 && (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-[var(--color-text-tertiary)] text-[14px]">
                    No active maintenance tickets recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raise Maintenance Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Raise Maintenance Request"
        size="md"
      >
        <form onSubmit={handleNewRequest} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
              Select Asset
            </label>
            <select
              required
              value={newRequest.assetId}
              onChange={e => setNewRequest({ ...newRequest, assetId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer"
            >
              <option value="">Select Asset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.asset_tag || a.tag})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
              Issue Description
            </label>
            <textarea
              required
              rows={3}
              value={newRequest.issueDescription}
              onChange={e => setNewRequest({ ...newRequest, issueDescription: e.target.value })}
              placeholder="Describe the failure, damage, or required servicing..."
              className="w-full p-3 rounded-lg text-[14px] text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
              Priority Level
            </label>
            <select
              required
              value={newRequest.priority}
              onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}
              className="w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25 cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="pt-1">
            <FileUploadDropzone 
              onFilesChange={setSelectedFiles} 
              maxFiles={2} 
              label="Diagnostic Photos / Documents (Max 2)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating || isUploading}>
              {isCreating || isUploading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
