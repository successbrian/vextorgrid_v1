import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertCircle, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ActiveMissions } from './ActiveMissions';
import { MissionDebriefModal } from './MissionDebriefModal';

interface Vehicle {
  id: string;
  name: string;
  vehicle_type: string;
  usage_type: 'personal' | 'delivery' | 'mixed';
}

interface Mission {
  id: string;
  origin: string;
  destination: string;
  estimated_miles: number;
  pay_amount: number;
  estimated_cpm: number;
  status: string;
  created_at: string;
  vehicle_id: string;
}

export function TrueCPMCalculator() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [totalMiles, setTotalMiles] = useState('');
  const [truckMPG, setTruckMPG] = useState('6.5');
  const [fuelCost, setFuelCost] = useState('');
  const [netProfit, setNetProfit] = useState<number | null>(null);
  const [estimatedCPM, setEstimatedCPM] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [missionToComplete, setMissionToComplete] = useState<Mission | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name, vehicle_type, usage_type')
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

  const handleCalculate = () => {
    const offer = parseFloat(offerAmount) || 0;
    const miles = parseFloat(totalMiles) || 0;
    const mpg = parseFloat(truckMPG) || 6.5;
    const fuel = parseFloat(fuelCost) || 0;

    const fuelCostTotal = (miles / mpg) * fuel;
    const profit = offer - fuelCostTotal;
    const cpm = miles > 0 ? fuelCostTotal / miles : 0;

    setNetProfit(profit);
    setEstimatedCPM(cpm);
    setCalculated(true);
  };

  const handleAcceptMission = async () => {
    if (!origin.trim() || !destination.trim() || !selectedVehicleId || !user || netProfit === null) return;

    try {
      const { error } = await supabase.from('vextor_active_missions').insert([
        {
          user_id: user.id,
          vehicle_id: selectedVehicleId,
          origin: origin.trim(),
          destination: destination.trim(),
          pay_amount: parseFloat(offerAmount) || 0,
          estimated_miles: parseFloat(totalMiles) || 0,
          estimated_cpm: estimatedCPM || 0,
          status: 'active',
        },
      ]);

      if (error) throw error;

      setOrigin('');
      setDestination('');
      setOfferAmount('');
      setTotalMiles('');
      setFuelCost('');
      setNetProfit(null);
      setEstimatedCPM(null);
      setCalculated(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error accepting mission:', error);
    }
  };

  const handleCompleteMission = async (missionId: string, actualMiles: number) => {
    try {
      const { error } = await supabase
        .from('active_missions')
        .update({
          status: 'completed',
          actual_miles: actualMiles,
          completed_at: new Date().toISOString(),
          proof_uploaded: false,
        })
        .eq('id', missionId);

      if (error) throw error;

      setMissionToComplete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  const isProfitable = netProfit !== null && netProfit > 0;
  const profitColor = netProfit !== null ? (isProfitable ? 'text-[#00FF00]' : 'text-[#FF0000]') : 'text-white';

  if (vehicles.length === 0) {
    return (
      <Card>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
            NO VEHICLES FOUND
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Please add a vehicle in the Vehicle Garage before using the Mission Calculator.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-[#008080] mb-6" style={{ fontFamily: 'monospace' }}>
            MISSION DATA
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                SELECT VEHICLE
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                ORIGIN / STARTING LOCATION
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g., Home Base, Warehouse A"
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                DESTINATION / MISSION NAME
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Downtown Delivery, Airport Run"
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                OFFER AMOUNT ($)
              </label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                TOTAL TRIP MILES
              </label>
              <input
                type="number"
                value={totalMiles}
                onChange={(e) => setTotalMiles(e.target.value)}
                placeholder="0"
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                TRUCK MPG
              </label>
              <input
                type="number"
                step="0.1"
                value={truckMPG}
                onChange={(e) => setTruckMPG(e.target.value)}
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                FUEL COST PER GALLON ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button onClick={handleCalculate} variant="secondary">
                CALCULATE
              </Button>
              <Button
                onClick={handleAcceptMission}
                variant="secondary"
                disabled={!calculated || !origin.trim() || !destination.trim() || netProfit === null}
                className={!calculated || !origin.trim() || !destination.trim() ? 'opacity-50 cursor-not-allowed' : ''}
              >
                ACCEPT MISSION
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-[#008080] mb-6" style={{ fontFamily: 'monospace' }}>
            MISSION ANALYSIS
          </h2>

          <div className="flex flex-col items-center justify-center min-h-[400px]">
            {!calculated ? (
              <div className="text-center">
                <div className="w-20 h-20 border-4 border-[#333] rounded-full flex items-center justify-center mb-4 mx-auto">
                  <div className="w-10 h-10 bg-[#333] rounded-full"></div>
                </div>
                <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                  AWAITING INPUT
                </p>
              </div>
            ) : (
              <div className="text-center w-full">
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    NET PROFIT
                  </p>
                  <div className={`text-6xl font-bold mb-6 ${profitColor}`} style={{ fontFamily: 'monospace' }}>
                    ${netProfit?.toFixed(2)}
                  </div>
                </div>

                {!isProfitable && netProfit !== null && (
                  <div className="bg-[#FF0000]/10 border-2 border-[#FF0000] p-4 mt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="text-[#FF0000]" size={24} />
                      <p className="text-[#FF0000] font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                        MISSION FAILURE
                      </p>
                    </div>
                    <p className="text-[#FF0000] text-sm" style={{ fontFamily: 'monospace' }}>
                      NEGATIVE REVENUE
                    </p>
                  </div>
                )}

                {isProfitable && (
                  <div className="bg-[#00FF00]/10 border-2 border-[#00FF00] p-4 mt-6">
                    <p className="text-[#00FF00] font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                      MISSION VIABLE
                    </p>
                    <p className="text-[#00FF00] text-sm mt-1" style={{ fontFamily: 'monospace' }}>
                      PROCEED WITH OPERATION
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <div className="text-sm text-gray-400 space-y-2" style={{ fontFamily: 'monospace' }}>
            <p className="text-[#008080] font-bold mb-3">CALCULATION BREAKDOWN:</p>
            <p>• FUEL CONSUMPTION = Total Miles ÷ Truck MPG</p>
            <p>• FUEL COST = Fuel Consumption × Cost per Gallon</p>
            <p>• NET PROFIT = Offer Amount - Fuel Cost</p>
            <p className="text-xs text-gray-500 mt-4">
              Note: This calculator provides a baseline profit analysis. Additional operating costs (maintenance, insurance, etc.) should be factored separately.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <ActiveMissions
          onComplete={(mission) => setMissionToComplete(mission)}
          key={refreshTrigger}
        />
      </div>

      {missionToComplete && (
        <MissionDebriefModal
          mission={missionToComplete}
          onComplete={handleCompleteMission}
          onClose={() => setMissionToComplete(null)}
        />
      )}
    </div>
  );
}
