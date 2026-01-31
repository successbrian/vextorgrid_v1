import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Truck, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VehicleCard } from './VehicleCard';

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

const FREEMIUM_LIMIT = 4;

export function VehicleGarage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    vehicle_type: 'Car',
    usage_type: 'personal',
    current_odometer: '',
    oil_change_interval: '5000',
  });

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.year || !formData.make || !formData.model || !formData.current_odometer || !user) return;

    try {
      const vehicleName = `${formData.year} ${formData.make} ${formData.model}`;
      const odometerValue = parseInt(formData.current_odometer);

      const { data, error } = await supabase
        .from('vextor_vehicles')
        .insert([
          {
            user_id: user.id,
            name: vehicleName,
            year: parseInt(formData.year),
            make: formData.make.trim(),
            model: formData.model.trim(),
            vehicle_type: formData.vehicle_type,
            usage_type: formData.usage_type,
            current_odometer: odometerValue,
            last_oil_change_odometer: odometerValue,
            oil_change_interval: parseInt(formData.oil_change_interval),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setVehicles([data, ...vehicles]);
      setFormData({
        year: '',
        make: '',
        model: '',
        vehicle_type: 'Car',
        usage_type: 'personal',
        current_odometer: '',
        oil_change_interval: '5000',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This will also delete all associated fuel logs.')) {
      return;
    }

    try {
      const { error } = await supabase.from('vextor_vehicles').delete().eq('id', id);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleAddButtonClick = () => {
    if (vehicles.length >= FREEMIUM_LIMIT) {
      setShowLimitModal(true);
    } else {
      setShowForm(true);
    }
  };

  const atCapacity = vehicles.length >= FREEMIUM_LIMIT;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          VEHICLE GARAGE
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
              YOUR FLEET
            </h2>
            <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>
              {vehicles.length} / {FREEMIUM_LIMIT} VEHICLES
            </div>
          </div>

          <Button
            onClick={handleAddButtonClick}
            variant={atCapacity ? 'ghost' : 'secondary'}
            className="w-full mb-6"
            disabled={atCapacity && !showLimitModal}
          >
            {atCapacity ? (
              <>
                <AlertCircle size={20} className="mr-2" />
                MAX CAPACITY REACHED (PREMIUM)
              </>
            ) : (
              <>
                <Plus size={20} className="mr-2" />
                ADD VEHICLE
              </>
            )}
          </Button>

          {showForm && (
            <div className="bg-[#252525] border-2 border-[#008080] p-6 mb-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
                NEW VEHICLE
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      YEAR
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      MAKE
                    </label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      placeholder="Ford"
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      MODEL
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="F-150"
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      VEHICLE TYPE
                    </label>
                    <select
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    >
                      <option value="Car">Car</option>
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="SUV">SUV</option>
                      <option value="Box Truck">Box Truck</option>
                      <option value="Semi">Semi</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      USAGE TYPE
                    </label>
                    <select
                      value={formData.usage_type}
                      onChange={(e) => setFormData({ ...formData, usage_type: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    >
                      <option value="personal">Personal</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      CURRENT ODOMETER
                    </label>
                    <input
                      type="number"
                      value={formData.current_odometer}
                      onChange={(e) => setFormData({ ...formData, current_odometer: e.target.value })}
                      placeholder="50000"
                      min="0"
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      OIL CHANGE INTERVAL (MILES)
                    </label>
                    <input
                      type="number"
                      value={formData.oil_change_interval}
                      onChange={(e) => setFormData({ ...formData, oil_change_interval: e.target.value })}
                      placeholder="5000"
                      min="1000"
                      max="15000"
                      className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#008080] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddVehicle} variant="secondary" className="flex-1">
                    SAVE VEHICLE
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        year: '',
                        make: '',
                        model: '',
                        vehicle_type: 'Car',
                        usage_type: 'personal',
                        current_odometer: '',
                        oil_change_interval: '5000',
                      });
                    }}
                    variant="ghost"
                    className="flex-1"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                LOADING VEHICLES...
              </p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto mb-4 text-gray-600" size={64} />
              <p className="text-gray-500 mb-2" style={{ fontFamily: 'monospace' }}>
                NO VEHICLES CONFIGURED
              </p>
              <p className="text-gray-600 text-sm">
                Add your first vehicle to start tracking fuel and maintenance
              </p>
            </div>
          ) : null}
        </Card>

        {vehicles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onDelete={handleDeleteVehicle}
              />
            ))}
          </div>
        )}
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border-4 border-[#DC143C] max-w-lg w-full">
            <div className="bg-[#DC143C] p-4">
              <div className="flex items-center gap-3">
                <AlertCircle size={32} className="text-white" />
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  CAPACITY LIMIT REACHED
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-white mb-4" style={{ fontFamily: 'monospace' }}>
                Operator, your Garage is full (4/4 vehicles).
              </p>
              <p className="text-gray-400 mb-6">
                Manual upgrade required for 5+ vehicles. Contact via Cash App or UEX Bank Transfer for pricing and activation.
              </p>
              <div className="bg-[#252525] border border-[#333] p-4 mb-6 space-y-2">
                <p className="text-[#FF4500] text-sm font-bold">UPGRADE OPTIONS:</p>
                <p className="text-gray-400 text-sm">Cash App: @VextorGrid</p>
                <p className="text-gray-400 text-sm">UEX Bank Transfer: Contact support</p>
              </div>
              <Button onClick={() => setShowLimitModal(false)} variant="secondary" className="w-full">
                UNDERSTOOD
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
