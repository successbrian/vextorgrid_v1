import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Gauge, Activity, Wrench, Edit2, Trash2 } from 'lucide-react';
import { Card } from './Card';

interface Vehicle {
  id: string;
  name: string;
  year: number;
  make: string;
  model: string;
  vehicle_type: string;
  current_odometer: number;
  oil_change_interval: number;
  last_oil_change_odometer: number;
  usage_type: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicleId: string) => void;
}

interface FuelStats {
  avgMpg: number | null;
  totalMiles: number;
  totalGallons: number;
  lastOdometer: number;
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const [fuelStats, setFuelStats] = useState<FuelStats>({
    avgMpg: null,
    totalMiles: 0,
    totalGallons: 0,
    lastOdometer: vehicle.current_odometer,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFuelStats();
  }, [vehicle.id]);

  const loadFuelStats = async () => {
    try {
      const { data: fuelLogs, error } = await supabase
        .from('vextor_fuel_logs')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (fuelLogs && fuelLogs.length > 0) {
        const totalMiles = fuelLogs.reduce((sum, log) => sum + (log.trip_miles || 0), 0);
        const totalGallons = fuelLogs.reduce((sum, log) => sum + parseFloat(log.gallons_added), 0);
        const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : null;
        const lastLog = fuelLogs[fuelLogs.length - 1];

        setFuelStats({
          avgMpg: avgMpg,
          totalMiles,
          totalGallons,
          lastOdometer: lastLog.odometer_reading,
        });
      } else {
        setFuelStats({
          avgMpg: null,
          totalMiles: 0,
          totalGallons: 0,
          lastOdometer: vehicle.current_odometer,
        });
      }
    } catch (err) {
      console.error('Error loading fuel stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const milesSinceOilChange = fuelStats.lastOdometer - vehicle.last_oil_change_odometer;
  const milesUntilOilChange = vehicle.oil_change_interval - milesSinceOilChange;
  const oilChangeOverdue = milesUntilOilChange < 0;
  const oilChangeWarning = !oilChangeOverdue && milesUntilOilChange < 1000;

  return (
    <Card className="hover:border-[#008080] transition-all">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="px-2 py-0.5 bg-[#1a1a1a] rounded">{vehicle.vehicle_type}</span>
              <span className="px-2 py-0.5 bg-[#1a1a1a] rounded capitalize">{vehicle.usage_type}</span>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(vehicle)}
                  className="p-2 text-gray-400 hover:text-[#008080] hover:bg-[#1a1a1a] rounded transition-colors"
                  title="Edit vehicle"
                >
                  <Edit2 size={18} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(vehicle.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] rounded transition-colors"
                  title="Delete vehicle"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="text-[#008080]" size={20} />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Avg MPG</span>
            </div>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : fuelStats.avgMpg !== null ? (
              <div className="text-2xl font-bold text-white">
                {fuelStats.avgMpg.toFixed(1)}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No data yet</div>
            )}
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-[#008080]" size={20} />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Odometer</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {fuelStats.lastOdometer.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">miles</div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench
                className={
                  oilChangeOverdue
                    ? 'text-red-500'
                    : oilChangeWarning
                    ? 'text-orange-500'
                    : 'text-[#00FF00]'
                }
                size={20}
              />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Oil Change</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                oilChangeOverdue
                  ? 'text-red-500'
                  : oilChangeWarning
                  ? 'text-orange-500'
                  : 'text-[#00FF00]'
              }`}
            >
              {oilChangeOverdue ? Math.abs(milesUntilOilChange).toLocaleString() : milesUntilOilChange.toLocaleString()}
            </div>
            <div
              className={`text-xs mt-1 ${
                oilChangeOverdue
                  ? 'text-red-400'
                  : oilChangeWarning
                  ? 'text-orange-400'
                  : 'text-gray-500'
              }`}
            >
              {oilChangeOverdue
                ? 'miles OVERDUE!'
                : oilChangeWarning
                ? 'miles (due soon!)'
                : 'miles'}
            </div>
          </div>
        </div>

        {fuelStats.totalMiles > 0 && (
          <div className="pt-4 border-t border-gray-700 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Total tracked miles:</span>
              <span className="text-white">{fuelStats.totalMiles.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Total gallons consumed:</span>
              <span className="text-white">{fuelStats.totalGallons.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
