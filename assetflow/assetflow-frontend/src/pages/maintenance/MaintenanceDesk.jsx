import React, { useState } from 'react';
import { X } from 'lucide-react';
import { 
  useGetMaintenanceRequestsQuery as useGetMaintenanceQuery, 
  useCreateMaintenanceRequestMutation as useCreateMaintenanceMutation,
  useGetAssetsQuery,
  useUploadAttachmentMutation
} from '../../store/apiSlice';
import FileUploadDropzone from '../../components/ui/FileUploadDropzone';

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

  if (isLoading) {
    return <div className="text-white p-6">Loading maintenance requests...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-6">Failed to load maintenance requests.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 relative">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Maintenance requests overview</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Maintenance Desk</h2>
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-slate-700/70 shadow-2xl overflow-hidden relative bg-slate-800/30">
        <div className="p-6 pb-4 border-b border-slate-700/70 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white">Requests</h3>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            New Request
          </button>
        </div>

        <section className="p-6 lg:p-8 relative">
          {maintenanceList.length === 0 ? (
            <div className="text-slate-400 py-10 text-center border border-slate-700/50 rounded-xl bg-slate-800/20">
              No maintenance requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">Asset ID / Name</th>
                    <th className="px-6 py-3 font-medium">Issue Description</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Priority</th>
                    <th className="px-6 py-3 font-medium">Requested By</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceList.map((req) => (
                    <tr key={req.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{req.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4">{req.assetName || req.assetId || 'Unknown'}</td>
                      <td className="px-6 py-4 truncate max-w-xs" title={req.description}>
                        {req.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                          ${req.status === 'Resolved' ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50' :
                            req.status === 'In Progress' ? 'bg-blue-900/30 text-blue-300 border-blue-800/50' :
                            'bg-slate-800 text-slate-300 border-slate-600/50'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{req.priority}</td>
                      <td className="px-6 py-4">{req.requestedBy || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed top-14 left-64 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Raise Maintenance Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleNewRequest} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Asset</label>
                <select required value={newRequest.assetId} onChange={e => setNewRequest({...newRequest, assetId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  <option value="">Select Asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.asset_tag || a.tag})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Issue Description</label>
                <textarea required rows={3} value={newRequest.issueDescription} onChange={e => setNewRequest({...newRequest, issueDescription: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Priority</label>
                <select required value={newRequest.priority} onChange={e => setNewRequest({...newRequest, priority: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="pt-2">
                <FileUploadDropzone 
                  onFilesChange={setSelectedFiles} 
                  maxFiles={2} 
                />
              </div>
              <button type="submit" disabled={isCreating || isUploading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg py-2.5 font-semibold transition-colors mt-4">
                {isCreating || isUploading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
