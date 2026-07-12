import React from 'react';
import { 
  useGetMaintenanceRequestsQuery as useGetMaintenanceQuery, 
  useCreateMaintenanceRequestMutation as useCreateMaintenanceMutation 
} from '../../store/apiSlice';

export default function MaintenanceDesk() {
  const { data, isLoading, error } = useGetMaintenanceQuery();
  const [createRequest, { isLoading: isCreating }] = useCreateMaintenanceMutation();

  const maintenanceList = data?.data || [];

  const handleNewRequest = async () => {
    try {
      await createRequest({
        assetId: '00000000-0000-0000-0000-000000000000', // Mock assetId for now until form is added
        issueDescription: 'New maintenance request',
        priority: 'Medium',
      }).unwrap();
      alert('Request created successfully!');
    } catch (err) {
      console.error('Failed to create request:', err);
      alert('Failed to create request. Check console for details.');
    }
  };

  if (isLoading) {
    return <div className="text-white p-6">Loading maintenance requests...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-6">Failed to load maintenance requests.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="text-sm text-slate-400">Maintenance requests overview</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">Maintenance Desk</h2>
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-slate-700/70 shadow-2xl overflow-hidden relative bg-slate-800/30">
        <div className="p-6 pb-4 border-b border-slate-700/70 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white">AssetFlow</h3>
          </div>
          <button 
            onClick={handleNewRequest}
            disabled={isCreating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {isCreating ? 'Creating...' : 'New Request'}
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
                      <td className="px-6 py-4">{req.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4">{req.assetName || req.assetId || 'Unknown'}</td>
                      <td className="px-6 py-4 truncate max-w-xs" title={req.issueDescription}>
                        {req.issueDescription}
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
    </div>
  );
}
