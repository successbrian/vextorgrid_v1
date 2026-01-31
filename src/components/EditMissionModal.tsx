import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';

interface EditMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionId: string;
  currentOrigin: string;
  currentDestination: string;
  currentEstimatedMiles: number;
  currentOfferAmount: number;
  currentDate?: string;
  currentNotes?: string;
  currentLoadId?: string;
  currentIsFactored?: boolean;
  onSuccess: () => void;
  onRefreshAll?: () => void | Promise<void>;
}

export function EditMissionModal({
  isOpen,
  onClose,
  missionId,
  currentOrigin,
  currentDestination,
  currentEstimatedMiles,
  currentOfferAmount,
  currentDate,
  currentNotes,
  currentLoadId,
  currentIsFactored,
  onSuccess,
  onRefreshAll,
}: EditMissionModalProps) {
  const [editOrigin, setEditOrigin] = useState(currentOrigin);
  const [editDestination, setEditDestination] = useState(currentDestination);
  const [editMiles, setEditMiles] = useState(currentEstimatedMiles.toString());
  const [editAmount, setEditAmount] = useState(currentOfferAmount.toString());
  const [editDate, setEditDate] = useState(currentDate ? new Date(currentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [editNotes, setEditNotes] = useState(currentNotes || '');
  const [editLoadId, setEditLoadId] = useState(currentLoadId || '');
  const [editIsFactored, setEditIsFactored] = useState(currentIsFactored || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!editOrigin || !editDestination || !editMiles || !editAmount || !editDate) {
      setError('All fields are required');
      return;
    }

    const miles = parseFloat(editMiles);
    const amount = parseFloat(editAmount);

    if (miles <= 0 || amount <= 0) {
      setError('Miles and amount must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const completedAt = new Date(editDate);
      completedAt.setHours(12, 0, 0, 0);

      const { error: updateError } = await supabase
        .from('vextor_missions')
        .update({
          origin: editOrigin,
          destination: editDestination,
          estimated_miles: miles,
          offer_amount: amount,
          completed_at: completedAt.toISOString(),
          notes: editNotes,
          load_id: editLoadId || null,
          is_factored: editIsFactored,
        })
        .eq('id', missionId);

      if (updateError) throw updateError;

      onSuccess();
      if (onRefreshAll) {
        await onRefreshAll();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mission');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
            EDIT MISSION
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Origin
            </label>
            <input
              type="text"
              value={editOrigin}
              onChange={(e) => setEditOrigin(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <input
              type="text"
              value={editDestination}
              onChange={(e) => setEditDestination(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estimated Miles
            </label>
            <input
              type="number"
              step="0.1"
              value={editMiles}
              onChange={(e) => setEditMiles(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Offer Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mission Date
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reference / Notes
            </label>
            <input
              type="text"
              placeholder="e.g., Broker Load ID: XYZ-123"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Load ID / Rate Con #
            </label>
            <input
              type="text"
              placeholder="e.g., LC-123456"
              value={editLoadId}
              onChange={(e) => setEditLoadId(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#333] rounded">
            <input
              type="checkbox"
              id="isFactored"
              checked={editIsFactored}
              onChange={(e) => setEditIsFactored(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isFactored" className="text-sm font-medium text-gray-300 cursor-pointer flex-1">
              Sent to Factoring
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-[#333]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#333] text-gray-300 hover:bg-[#444] rounded font-medium"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </div>
      </div>
    </div>
  );
}
