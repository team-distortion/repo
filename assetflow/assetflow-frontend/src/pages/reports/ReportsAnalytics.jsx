import { useGetReportsQuery } from '../../store/apiSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Download } from 'lucide-react';

export default function ReportsAnalytics() {
  const { data: reportData, isLoading, error } = useGetReportsQuery();

  if (isLoading) return <div className="p-8 text-[var(--color-text-secondary)] text-[14px]">Loading reports...</div>;
  if (error) return <div className="p-8 text-[var(--color-error)] text-[14px]">Error loading reports.</div>;

  const {
    utilizationBars = [65, 45, 80, 30, 90],
    maintenanceSeries = [{ x: 10, y: 80 }, { x: 70, y: 50 }, { x: 140, y: 90 }, { x: 210, y: 30 }, { x: 280, y: 60 }],
    mostUsedAssets = ['Dell XPS 15 (AF-0001)', 'MacBook Pro 16 (AF-0002)', 'Epson Projector EX9220 (AF-0003)'],
    idleAssets = ['Conference Mic Set A', 'Backup Monitor 27"'],
    maintenanceDue = ['MacBook Pro 16 (AF-0002) — Warranty expiring in 30 days', 'Dell XPS 15 (AF-0001) — Regular calibration due']
  } = reportData?.data || reportData || {};

  const linePoints = maintenanceSeries.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.15] text-[var(--color-text)] tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Department equipment utilization, maintenance frequencies, and lifecycle projections
          </p>
        </div>

        <Button variant="secondary" onClick={() => window.print()}>
          <Download className="w-4 h-4" strokeWidth={1.75} /> Export Report
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-[280px]">
          <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight mb-4">
            Utilization by Department
          </h2>
          <div className="flex-1 flex items-end gap-4 px-2 pb-2">
            {utilizationBars.map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  className="w-full max-w-10 rounded-t-lg bg-[var(--color-primary)] transition-all hover:bg-[var(--color-primary-hover)]" 
                  style={{ height: `${height}%` }} 
                />
                <span className="text-[12px] font-mono text-[var(--color-text-secondary)]">D{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col h-[280px]">
          <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight mb-4">
            Maintenance Frequency
          </h2>
          <div className="flex-1 px-2 pb-2">
            <svg viewBox="0 0 280 120" className="h-full w-full overflow-visible">
              <path d="M 0 104 L 280 104" stroke="var(--color-border)" strokeWidth="1" />
              <polyline 
                points={linePoints} 
                fill="none" 
                stroke="var(--color-warning)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </Card>
      </div>

      {/* Asset Insights Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight mb-3">
            Most Utilized Assets
          </h2>
          <div className="space-y-2 text-[14px]">
            {mostUsedAssets.map((asset, idx) => (
              <div key={idx} className="flex items-center gap-3 text-[var(--color-text)] py-1 border-b border-[var(--color-surface-3)] last:border-b-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                <span>{asset}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight mb-3">
            Idle Assets (Zero Allocations in 60d)
          </h2>
          <div className="space-y-2 text-[14px]">
            {idleAssets.map((asset, idx) => (
              <div key={idx} className="flex items-center gap-3 text-[var(--color-text-secondary)] py-1 border-b border-[var(--color-surface-3)] last:border-b-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] flex-shrink-0" />
                <span>{asset}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Maintenance Projections Card */}
      <Card className="space-y-3">
        <h2 className="text-[18px] font-semibold text-[var(--color-text)] tracking-tight">
          Assets Due for Maintenance & Lifecycle Reviews
        </h2>
        <div className="space-y-2 text-[14px]">
          {maintenanceDue.map((asset, idx) => (
            <div key={idx} className="flex items-center gap-3 text-[var(--color-warning)] py-1.5 border-b border-[var(--color-surface-3)] last:border-b-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] flex-shrink-0" />
              <span>{asset}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
