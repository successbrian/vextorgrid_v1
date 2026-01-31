import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { Button } from './Button';
import { Fuel, TrendingUp, DollarSign, Droplet, Edit2, Trash2 } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  current_odometer: number;
}

interface FuelLog {
  id: string;
  odometer_reading: number;
  gallons_added: number | null;
  total_cost: number | null;
  trip_miles: number | null;
  mpg: number | null;
  created_at: string;
}

export function FuelMileageLog() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [odometerReading, setOdometerReading] = useState('');
  const [gallonsAdded, setGallonsAdded] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [isOdometerOnly, setIsOdometerOnly] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOdometer, setEditOdometer] = useState('');
  const [editGallons, setEditGallons] = useState('');
  const [editCost, setEditCost] = useState('');

  useEffect(() => {
    loadVehicles();
  }, [user]);

  useEffect(() => {
    if (selectedVehicleId) {
      loadFuelLogs();
    }
  }, [selectedVehicleId]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name, current_odometer')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);

      if (data && data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  };

  const loadFuelLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_fuel_logs')
        .select('*')
        .eq('vehicle_id', selectedVehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFuelLogs(data || []);
    } catch (err) {
      console.error('Error loading fuel logs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId || !odometerReading) {
      setError('Please select a vehicle and enter odometer reading');
      return;
    }

    if (!isOdometerOnly && (!gallonsAdded || !totalCost)) {
      setError('Please fill in gallons and cost, or check "Odometer Only"');
      return;
    }

    const currentOdometer = parseInt(odometerReading);
    const gallons = gallonsAdded ? parseFloat(gallonsAdded) : null;
    const cost = totalCost ? parseFloat(totalCost) : null;

    if (currentOdometer <= 0) {
      setError('Odometer reading must be greater than zero');
      return;
    }

    if (!isOdometerOnly && (gallons === null || cost === null || gallons <= 0 || cost <= 0)) {
      setError('Gallons and cost must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: lastLog } = await supabase
        .from('vextor_fuel_logs')
        .select('odometer_reading')
        .eq('vehicle_id', selectedVehicleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let tripMiles: number | null = null;
      let mpg: number | null = null;

      if (lastLog) {
        if (currentOdometer <= lastLog.odometer_reading) {
          setError('Odometer reading must be greater than the previous reading');
          setLoading(false);
          return;
        }
        tripMiles = currentOdometer - lastLog.odometer_reading;
        if (gallons !== null && gallons > 0) {
          mpg = tripMiles / gallons;
        }
      }

      const { error: insertError } = await supabase
        .from('vextor_fuel_logs')
        .insert({
          user_id: user?.id,
          vehicle_id: selectedVehicleId,
          odometer_reading: currentOdometer,
          gallons_added: gallons,
          total_cost: cost,
          trip_miles: tripMiles,
          mpg: mpg,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('vextor_vehicles')
        .update({ current_odometer: currentOdometer })
        .eq('id', selectedVehicleId);

      if (updateError) throw updateError;

      setSuccess(isOdometerOnly ? 'Odometer reading logged successfully!' : 'Fuel log added successfully!');
      setOdometerReading('');
      setGallonsAdded('');
      setTotalCost('');
      setIsOdometerOnly(false);

      loadFuelLogs();
      loadVehicles();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fuel log');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (log: FuelLog) => {
    setEditingId(log.id);
    setEditOdometer(log.odometer_reading.toString());
    setEditGallons(log.gallons_added?.toString() || '');
    setEditCost(log.total_cost?.toString() || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditOdometer('');
    setEditGallons('');
    setEditCost('');
  };

  const handleSaveEdit = async (logId: string) => {
    if (!editOdometer) {
      setError('Odometer reading is required');
      return;
    }

    const newOdometer = parseInt(editOdometer);
    const newGallons = editGallons ? parseFloat(editGallons) : null;
    const newCost = editCost ? parseFloat(editCost) : null;

    if (newOdometer <= 0) {
      setError('Odometer must be greater than zero');
      return;
    }

    if (newGallons !== null && newGallons <= 0) {
      setError('Gallons must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const previousLog = fuelLogs.find(l => l.id === logId);
      if (!previousLog) throw new Error('Log not found');

      const nextLog = fuelLogs.find(l =>
        new Date(l.created_at) > new Date(previousLog.created_at)
      );

      if (nextLog && newOdometer >= nextLog.odometer_reading) {
        setError('Odometer cannot be greater than the next fuel log reading');
        setLoading(false);
        return;
      }

      const previousPreviousLog = fuelLogs
        .filter(l => new Date(l.created_at) < new Date(previousLog.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      let tripMiles: number | null = null;
      let mpg: number | null = null;

      if (previousPreviousLog) {
        if (newOdometer <= previousPreviousLog.odometer_reading) {
          setError('Odometer must be greater than the previous fuel log reading');
          setLoading(false);
          return;
        }
        tripMiles = newOdometer - previousPreviousLog.odometer_reading;
        if (newGallons !== null && newGallons > 0) {
          mpg = tripMiles / newGallons;
        }
      }

      const { error: updateError } = await supabase
        .from('vextor_fuel_logs')
        .update({
          odometer_reading: newOdometer,
          gallons_added: newGallons,
          total_cost: newCost,
          trip_miles: tripMiles,
          mpg: mpg,
        })
        .eq('id', logId);

      if (updateError) throw updateError;

      setSuccess('Fuel log updated successfully!');
      setEditingId(null);
      setEditOdometer('');
      setEditGallons('');
      setEditCost('');
      loadFuelLogs();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fuel log');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this fuel log?')) return;

    setLoading(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('vextor_fuel_logs')
        .delete()
        .eq('id', logId);

      if (deleteError) throw deleteError;

      setSuccess('Fuel log deleted successfully!');
      loadFuelLogs();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fuel log');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  if (vehicles.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
            FUEL & MILEAGE LOG
          </h1>
          <div className="h-1 w-24 bg-[#FF4500]"></div>
        </div>

        <Card>
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#252525] border-2 border-[#333] flex items-center justify-center mb-6 mx-auto">
              <Fuel size={48} className="text-[#008080]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
              NO VEHICLES FOUND
            </h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Please add a vehicle in the Vehicle Garage before logging fuel.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          FUEL & MILEAGE LOG
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
            Add Fuel Entry
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <p className="text-xs text-gray-500 mt-1">
                  Last odometer: {selectedVehicle.current_odometer.toLocaleString()} miles
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Odometer Reading (miles)
              </label>
              <input
                type="number"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                placeholder="50000"
                min="0"
                step="1"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#252525] rounded-lg border border-gray-700">
              <input
                type="checkbox"
                id="odometerOnly"
                checked={isOdometerOnly}
                onChange={(e) => {
                  setIsOdometerOnly(e.target.checked);
                  if (e.target.checked) {
                    setGallonsAdded('');
                    setTotalCost('');
                  }
                }}
                className="w-4 h-4 text-[#008080] bg-[#1a1a1a] border-gray-600 rounded focus:ring-[#008080] focus:ring-2"
              />
              <label htmlFor="odometerOnly" className="text-sm text-gray-300 cursor-pointer">
                Odometer reading only (no fuel purchase)
              </label>
            </div>

            {!isOdometerOnly && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gallons Added
                  </label>
                  <input
                    type="number"
                    value={gallonsAdded}
                    onChange={(e) => setGallonsAdded(e.target.value)}
                    placeholder="12.5"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    required={!isOdometerOnly}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Cost ($)
                  </label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder="45.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    required={!isOdometerOnly}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded text-green-400 text-sm">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Fuel Log'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
            Recent Fuel Logs
          </h2>

          {fuelLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Fuel size={48} className="mx-auto mb-4 text-gray-600" />
              <p>No fuel logs yet. Add your first entry!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {fuelLogs.map((log) => (
                <div key={log.id}>
                  {editingId === log.id ? (
                    <div className="bg-[#1a1a1a] border border-[#008080] rounded-lg p-4">
                      <h3 className="text-sm font-bold text-white mb-3">Edit Fuel Log</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Odometer Reading
                          </label>
                          <input
                            type="number"
                            value={editOdometer}
                            onChange={(e) => setEditOdometer(e.target.value)}
                            className="w-full px-2 py-1 bg-[#252525] border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Gallons (optional)
                          </label>
                          <input
                            type="number"
                            value={editGallons}
                            onChange={(e) => setEditGallons(e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 bg-[#252525] border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Cost (optional)
                          </label>
                          <input
                            type="number"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 bg-[#252525] border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(log.id)}
                            disabled={loading}
                            className="flex-1 px-2 py-1 bg-[#008080] text-white text-sm rounded hover:bg-[#006666] disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm text-gray-400">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(log)}
                            className="p-1 hover:bg-[#252525] rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-[#008080]" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 hover:bg-[#252525] rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="text-lg font-bold text-white mb-3">
                        {log.odometer_reading.toLocaleString()} mi
                      </div>

                      {log.gallons_added !== null ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <Droplet size={16} className="text-[#008080]" />
                            <div>
                              <div className="text-xs text-gray-500">Gallons</div>
                              <div className="text-sm font-medium text-white">
                                {log.gallons_added.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-[#008080]" />
                            <div>
                              <div className="text-xs text-gray-500">Cost</div>
                              <div className="text-sm font-medium text-white">
                                ${log.total_cost?.toFixed(2) || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-[#008080]" />
                            <div>
                              <div className="text-xs text-gray-500">MPG</div>
                              <div className="text-sm font-medium text-white">
                                {log.mpg ? log.mpg.toFixed(1) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          Odometer reading only (no fuel purchase)
                        </div>
                      )}

                      {log.trip_miles !== null && (
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                          Trip: {log.trip_miles.toLocaleString()} miles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
