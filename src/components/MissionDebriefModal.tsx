import { useState } from 'react';
import { Button } from './Button';
import { Camera, CheckCircle } from 'lucide-react';

interface MissionDebriefModalProps {
  mission: {
    id: string;
    destination: string;
    estimated_miles: number;
    pod_required?: boolean;
  };
  onComplete: (missionId: string, actualMiles: number) => void;
  onClose: () => void;
}

export function MissionDebriefModal({ mission, onComplete, onClose }: MissionDebriefModalProps) {
  const missionMiles = mission.estimated_miles;
  const [actualMiles, setActualMiles] = useState(missionMiles.toString());
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const miles = parseFloat(actualMiles);
    if (!miles || miles <= 0) {
      setError('Actual miles must be greater than 0');
      return;
    }
    setError('');
    onComplete(mission.id, miles);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border-4 border-[#00FF00] max-w-2xl w-full">
        <div className="bg-[#00FF00] p-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} className="text-black" />
            <h3 className="text-xl font-bold text-black" style={{ fontFamily: 'monospace' }}>
              MISSION DEBRIEF
            </h3>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-white text-lg mb-2" style={{ fontFamily: 'monospace' }}>
              DESTINATION: {mission.destination}
            </h4>
            <p className="text-gray-400 text-sm">
              Planned Miles: <span className="text-[#FF4500]">{missionMiles}</span>
            </p>
            {mission.pod_required && (
              <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded">
                <p className="text-yellow-400 text-xs font-bold">PROOF OF DELIVERY REQUIRED</p>
                <p className="text-yellow-600 text-xs">This mission requires POD submission after completion.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500 text-red-200 text-sm rounded">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                ACTUAL MILEAGE (FINAL)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualMiles}
                onChange={(e) => {
                  setActualMiles(e.target.value);
                  setError('');
                }}
                placeholder={missionMiles.toString()}
                className="w-full bg-[#252525] border-2 border-[#008080] text-white px-4 py-3 focus:outline-none focus:border-[#00FF00] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the actual miles driven to calculate final profit
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                PROOF OF DELIVERY / RECEIPT
              </label>
              <div className="border-2 border-dashed border-[#333] bg-[#252525] p-8 text-center hover:border-[#008080] transition-colors cursor-pointer">
                <Camera size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                  UPLOAD EVIDENCE
                </p>
                <p className="text-xs text-gray-500">Photo Upload Feature</p>
                <div className="mt-3 bg-[#1a1a1a] border border-[#333] p-2 inline-block">
                  <p className="text-[#008080] text-xs font-bold" style={{ fontFamily: 'monospace' }}>
                    [COMING SOON]
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmit} variant="secondary" className="flex-1">
              COMPLETE MISSION
            </Button>
            <Button onClick={onClose} variant="ghost" className="flex-1">
              CANCEL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
