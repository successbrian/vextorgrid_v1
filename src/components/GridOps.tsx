import { MasterActivityLedger } from './MasterActivityLedger';

export function GridOps() {
  const handleRefreshAll = async () => {
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          GRID OPS
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      <MasterActivityLedger onRefreshAll={handleRefreshAll} />
    </div>
  );
}
