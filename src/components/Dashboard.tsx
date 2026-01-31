import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingWizard } from './OnboardingWizard';
import { TrueCPMCalculator } from './TrueCPMCalculator';
import { FleetReadiness } from './FleetReadiness';
import { QuickFuelLogModal } from './QuickFuelLogModal';
import { QuickMissionModal } from './QuickMissionModal';
import { CompleteMissionModal } from './CompleteMissionModal';
import { LogExpenseModal } from './LogExpenseModal';
import { CreditCard as Edit2 } from 'lucide-react';
import { ReassignMissionModal } from './ReassignMissionModal';
import { PendingTasks } from './PendingTasks';
import { Analytics } from './Analytics';
import { FleetHeartbeat } from './FleetHeartbeat';

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

interface Mission {
  id: string;
  origin: string;
  destination: string;
  estimated_miles: number;
  offer_amount: number;
  cost_per_mile: number | null;
  vehicle_id: string;
  pod_required: boolean;
}

export function Dashboard() {
  const { profile, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [showCompleteMissionModal, setShowCompleteMissionModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const fleetReadinessRef = useRef<{ refresh: () => void }>(null);
  const analyticsRef = useRef<{ refresh: () => void }>(null);
  const fleetHeartbeatRef = useRef<{ refresh: () => void }>(null);

  useEffect(() => {
    checkOnboarding();
    loadVehicles();
    loadActiveMission();
  }, [profile, user]);

  const checkOnboarding = () => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  };

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveMission = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('vextor_missions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveMission(data || null);
    } catch (err) {
      console.error('Error loading active mission:', err);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    window.location.reload();
  };

  const handleRefreshAll = async () => {
    if (analyticsRef.current) {
      analyticsRef.current.refresh();
    }
    if (fleetHeartbeatRef.current) {
      fleetHeartbeatRef.current.refresh();
    }
  };

  const displayName = profile?.full_name || 'Operator';
  const userRole = profile?.user_role || 'personal';
  const isProfessional = userRole === 'professional' || userRole === 'fleet_manager';

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          WELCOME BACK, {displayName.toUpperCase()}
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      {isProfessional && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
            MISSION PROFIT CALCULATOR
          </h2>
          <TrueCPMCalculator />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FleetReadiness />

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#008080] mb-2" style={{ fontFamily: 'monospace' }}>
              OPERATOR PROFILE
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">ROLE</span>
              <span className="text-white font-bold uppercase" style={{ fontFamily: 'monospace' }}>
                {userRole.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">VEHICLES</span>
              <span className="text-white font-bold" style={{ fontFamily: 'monospace' }}>
                {vehicles.length} / 4
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'monospace' }}>
              {isProfessional ? 'PROFESSIONAL MODE ACTIVE' : 'PERSONAL MODE ACTIVE'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#008080] mb-2" style={{ fontFamily: 'monospace' }}>
              MISSION STATUS
            </h3>
          </div>
          <div className="space-y-3">
            {activeMission ? (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-[#00FF00] rounded-full animate-pulse"></div>
                    <p className="text-sm font-bold text-[#00FF00]" style={{ fontFamily: 'monospace' }}>
                      ACTIVE MISSION
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    Vehicle: <span className="text-white font-semibold">{vehicles.find(v => v.id === activeMission.vehicle_id)?.name || 'Unknown'}</span>
                  </p>
                </div>
                <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">FROM</span>
                    <span className="text-white">{activeMission.origin}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">TO</span>
                    <span className="text-white">{activeMission.destination}</span>
                  </div>
                  <div className="border-t border-[#333] my-2"></div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">MILES</div>
                      <div className="text-white font-bold">{activeMission.estimated_miles.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">PAYOUT</div>
                      <div className="text-white font-bold">${activeMission.offer_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">CPM</div>
                      <div className="text-white font-bold">${(activeMission.cost_per_mile || activeMission.offer_amount / activeMission.estimated_miles).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#333] space-y-3">
                  <Button
                    onClick={() => setShowCompleteMissionModal(true)}
                    className="w-full"
                  >
                    COMPLETE MISSION
                  </Button>
                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#333] text-gray-300 font-semibold hover:bg-[#444] transition-colors"
                  >
                    <Edit2 size={16} />
                    REASSIGN VEHICLE
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 border-4 border-[#008080] rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#008080] rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    STANDING BY
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <FleetHeartbeat ref={fleetHeartbeatRef} />
      </div>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-bold text-[#FF4500] mb-4" style={{ fontFamily: 'monospace' }}>
            SYSTEM OVERVIEW
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm text-gray-400 mb-3">ACTIVE MODULES</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF00] rounded-full"></div>
                  <span className="text-gray-300" style={{ fontFamily: 'monospace' }}>
                    DASHBOARD [ONLINE]
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF00] rounded-full"></div>
                  <span className="text-gray-300" style={{ fontFamily: 'monospace' }}>
                    VEHICLE GARAGE [ONLINE]
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF00] rounded-full"></div>
                  <span className="text-gray-300" style={{ fontFamily: 'monospace' }}>
                    FUEL LOG [ONLINE]
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF00] rounded-full"></div>
                  <span className="text-gray-300" style={{ fontFamily: 'monospace' }}>
                    GRID OPS [ONLINE]
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-3">QUICK TIPS</h4>
              <div className="space-y-2 text-sm text-gray-400">
                {vehicles.length === 0 ? (
                  <p>Add your first vehicle in the Vehicle Garage to get started.</p>
                ) : (
                  <>
                    <p>Log your fuel fill-ups in Grid Ops to track MPG automatically.</p>
                    {isProfessional && (
                      <p className="mt-2">Use the Mission Profit Calculator to analyze delivery profitability.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {showFuelModal && (
        <QuickFuelLogModal
          onClose={() => setShowFuelModal(false)}
          onSuccess={() => {
            loadVehicles();
            if (analyticsRef.current) {
              analyticsRef.current.refresh();
            }
            if (fleetHeartbeatRef.current) {
              fleetHeartbeatRef.current.refresh();
            }
          }}
        />
      )}

      {showMissionModal && (
        <QuickMissionModal
          onClose={() => setShowMissionModal(false)}
          onSuccess={() => {
            loadActiveMission();
            if (analyticsRef.current) {
              analyticsRef.current.refresh();
            }
            if (fleetHeartbeatRef.current) {
              fleetHeartbeatRef.current.refresh();
            }
          }}
        />
      )}

      {showCompleteMissionModal && activeMission && (
        <CompleteMissionModal
          missionId={activeMission.id}
          vehicleId={activeMission.vehicle_id}
          currentOdometer={vehicles.find(v => v.id === activeMission.vehicle_id)?.current_odometer || 0}
          estimatedMiles={activeMission.estimated_miles}
          podRequired={activeMission.pod_required}
          onClose={() => setShowCompleteMissionModal(false)}
          onSuccess={() => {
            loadActiveMission();
            loadVehicles();
            if (fleetReadinessRef.current) {
              fleetReadinessRef.current.refresh();
            }
            if (analyticsRef.current) {
              analyticsRef.current.refresh();
            }
            if (fleetHeartbeatRef.current) {
              fleetHeartbeatRef.current.refresh();
            }
          }}
        />
      )}

      {showReassignModal && activeMission && (
        <ReassignMissionModal
          missionId={activeMission.id}
          currentVehicleId={activeMission.vehicle_id}
          estimatedMiles={activeMission.estimated_miles}
          offerAmount={activeMission.offer_amount}
          userId={user?.id || ''}
          onClose={() => setShowReassignModal(false)}
          onSuccess={() => {
            loadActiveMission();
            if (fleetReadinessRef.current) {
              fleetReadinessRef.current.refresh();
            }
            if (analyticsRef.current) {
              analyticsRef.current.refresh();
            }
            if (fleetHeartbeatRef.current) {
              fleetHeartbeatRef.current.refresh();
            }
          }}
        />
      )}

      {showExpenseModal && (
        <LogExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            loadVehicles();
            if (analyticsRef.current) {
              analyticsRef.current.refresh();
            }
            if (fleetHeartbeatRef.current) {
              fleetHeartbeatRef.current.refresh();
            }
          }}
        />
      )}

      <div className="mt-8">
        <PendingTasks
          onRefresh={() => {
            loadActiveMission();
            if (fleetReadinessRef.current) {
              fleetReadinessRef.current.refresh();
            }
            if (analyticsRef.current) {
              analyticsRef.current.refresh();
            }
            if (fleetHeartbeatRef.current) {
              fleetHeartbeatRef.current.refresh();
            }
          }}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
          VEHICLE ANALYTICS
        </h2>
        <Analytics ref={analyticsRef} onRefreshAll={handleRefreshAll} />
      </div>
    </div>
  );
}
