import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { User, Truck, Users, X } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type UserRole = 'personal' | 'professional' | 'fleet_manager';
type UsageType = 'personal' | 'delivery';

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userRole, setUserRole] = useState<UserRole>('personal');

  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [oilChangeInterval, setOilChangeInterval] = useState('5000');
  const [usageType, setUsageType] = useState<UsageType>('personal');
  const [vehicleType, setVehicleType] = useState('Car');

  const handleStep1Next = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('vextor_profiles')
        .update({ user_role: userRole })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user role');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Complete = async () => {
    if (!year || !make || !model) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const vehicleName = `${year} ${make} ${model}`;
      const odometerValue = currentOdometer ? parseInt(currentOdometer) : 0;

      const { error: vehicleError } = await supabase
        .from('vextor_vehicles')
        .insert({
          user_id: user?.id,
          name: vehicleName,
          year: parseInt(year),
          make,
          model,
          vehicle_type: vehicleType,
          current_odometer: odometerValue,
          last_oil_change_odometer: odometerValue,
          oil_change_interval: parseInt(oilChangeInterval),
          usage_type: usageType,
        });

      if (vehicleError) throw vehicleError;

      const { error: profileError } = await supabase
        .from('vextor_profiles')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#2a2a2a] rounded-lg max-w-2xl w-full p-8 relative">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Welcome to VextorGrid</h2>
            <div className="text-sm text-gray-400">Step {step} of 2</div>
          </div>
          <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#008080] transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">How do you use Vextor?</h3>
              <p className="text-gray-400 text-sm mb-6">
                This helps us personalize your dashboard with the right tools.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setUserRole('personal')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
                    userRole === 'personal'
                      ? 'border-[#008080] bg-[#008080] bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <User className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-white font-medium">Personal / Commuter</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Track your personal vehicle fuel economy and maintenance.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUserRole('professional')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
                    userRole === 'professional'
                      ? 'border-[#008080] bg-[#008080] bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Truck className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-white font-medium">Professional Driver</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Manage deliveries, track fuel costs, and calculate mission profitability.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUserRole('fleet_manager')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-4 ${
                    userRole === 'fleet_manager'
                      ? 'border-[#008080] bg-[#008080] bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Users className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-white font-medium">Fleet Manager</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Oversee multiple vehicles and drivers across your fleet.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleStep1Next} disabled={loading}>
                {loading ? 'Saving...' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Add Your First Vehicle</h3>
              <p className="text-gray-400 text-sm mb-6">
                Tell us about the vehicle you'll be tracking.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Year <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Make <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="Ford"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Model <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="F-150"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    >
                      <option value="Car">Car</option>
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="SUV">SUV</option>
                      <option value="Motorcycle">Motorcycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Odometer (optional)
                    </label>
                    <input
                      type="number"
                      value={currentOdometer}
                      onChange={(e) => setCurrentOdometer(e.target.value)}
                      placeholder="50000"
                      min="0"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Oil Change Interval (miles)
                    </label>
                    <input
                      type="number"
                      value={oilChangeInterval}
                      onChange={(e) => setOilChangeInterval(e.target.value)}
                      placeholder="5000"
                      min="1000"
                      max="15000"
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Usage Type
                    </label>
                    <select
                      value={usageType}
                      onChange={(e) => setUsageType(e.target.value as UsageType)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
                    >
                      <option value="personal">Personal</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button onClick={handleStep2Complete} disabled={loading}>
                {loading ? 'Creating...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
