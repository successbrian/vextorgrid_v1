import { useState, useEffect } from 'react';
import { Fuel, Package, Settings, TrendingUp, TrendingDown, DollarSign, Calendar, MapPin, CreditCard as Edit2, Trash2, Plus, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { Button } from './Button';
import { EditFuelLogModal } from './EditFuelLogModal';
import { EditMissionModal } from './EditMissionModal';
import { LogExpenseModal } from './LogExpenseModal';
import { ConfirmModal } from './ConfirmModal';

interface ActivityEntry {
  id: string;
  type: 'fuel' | 'mission' | 'vehicle' | 'expense';
  timestamp: string;
  details: string;
  vehicleName: string;
  financialImpact: number | null;
  isIncome: boolean;
  icon: React.ReactNode;
  reference?: string;
  rawData?: any;
}

interface MasterActivityLedgerProps {
  onRefreshAll?: () => void | Promise<void>;
}

export function MasterActivityLedger({ onRefreshAll }: MasterActivityLedgerProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'fuel' | 'mission' | 'vehicle' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditFuelModal, setShowEditFuelModal] = useState(false);
  const [showEditMissionModal, setShowEditMissionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadActivityData();
    }
  }, [user]);

  const loadActivityData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allActivities: ActivityEntry[] = [];

      const { data: vehicles } = await supabase
        .from('vextor_vehicles')
        .select('id, name')
        .eq('user_id', user.id);

      const vehicleMap = (vehicles || []).reduce((acc, v) => {
        acc[v.id] = v.name;
        return acc;
      }, {} as Record<string, string>);

      const { data: fuelLogs } = await supabase
        .from('vextor_fuel_logs')
        .select('*')
        .eq('user_id', user.id);

      (fuelLogs || []).forEach((log) => {
        let details = log.gallons_added
          ? `Refueled ${log.gallons_added.toFixed(1)} gal @ ${(log.total_cost / log.gallons_added).toFixed(2)}/gal`
          : `Odometer reading: ${log.odometer_reading.toLocaleString()} mi`;
        if (log.merchant) {
          details += ` @ ${log.merchant}`;
        }
        allActivities.push({
          id: `fuel-${log.id}`,
          type: 'fuel',
          timestamp: log.created_at,
          details: details,
          vehicleName: vehicleMap[log.vehicle_id] || 'Unknown Vehicle',
          financialImpact: log.total_cost || null,
          isIncome: false,
          icon: <Fuel size={18} className="text-blue-400" />,
          reference: log.notes || undefined,
          rawData: log,
        });
      });

      const { data: missions } = await supabase
        .from('vextor_missions')
        .select('*')
        .eq('user_id', user.id);

      (missions || []).forEach((mission) => {
        const isCompleted = mission.status === 'completed';
        let reference = mission.notes || '';
        if (mission.load_id) {
          reference = reference ? `${reference} | LC: ${mission.load_id}` : `LC: ${mission.load_id}`;
        }
        if (mission.is_factored) {
          reference = reference ? `${reference} [FACTORED]` : '[FACTORED]';
        }
        allActivities.push({
          id: `mission-${mission.id}`,
          type: 'mission',
          timestamp: isCompleted ? mission.completed_at : mission.created_at,
          details: isCompleted
            ? `Completed: ${mission.origin} → ${mission.destination} (${mission.actual_miles?.toFixed(1) || mission.estimated_miles} mi)`
            : `Created: ${mission.origin} → ${mission.destination} (${mission.estimated_miles} mi)`,
          vehicleName: vehicleMap[mission.vehicle_id] || 'Unknown Vehicle',
          financialImpact: mission.offer_amount,
          isIncome: true,
          icon: <Package size={18} className="text-orange-400" />,
          reference: reference || undefined,
          rawData: mission,
        });
      });

      const { data: vehicleList } = await supabase
        .from('vextor_vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      (vehicleList || []).forEach((vehicle) => {
        allActivities.push({
          id: `vehicle-${vehicle.id}`,
          type: 'vehicle',
          timestamp: vehicle.created_at,
          details: `Added ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vehicle_type})`,
          vehicleName: vehicle.name,
          financialImpact: null,
          isIncome: false,
          icon: <Settings size={18} className="text-teal-400" />,
          rawData: vehicle,
        });
      });

      const { data: expenses } = await supabase
        .from('vextor_expenses')
        .select('*')
        .eq('user_id', user.id);

      (expenses || []).forEach((expense) => {
        allActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          timestamp: expense.expense_date,
          details: expense.category,
          vehicleName: vehicleMap[expense.vehicle_id] || 'Unknown Vehicle',
          financialImpact: expense.amount,
          isIncome: false,
          icon: <Wrench size={18} className="text-red-400" />,
          reference: expense.notes || undefined,
          rawData: expense,
        });
      });

      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (activity: ActivityEntry) => {
    setEditingActivity(activity);
    if (activity.type === 'fuel') {
      setShowEditFuelModal(true);
    } else if (activity.type === 'mission') {
      setShowEditMissionModal(true);
    }
  };

  const handleDeleteClick = (activity: ActivityEntry) => {
    if (activity.type === 'vehicle') {
      return;
    }

    setEditingActivity(activity);
    setShowDeleteConfirm(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('vextor_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      loadActivityData();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingActivity || editingActivity.type === 'vehicle') return;

    setDeleting(true);
    try {
      const realId = editingActivity.rawData?.id;

      if (editingActivity.type === 'fuel') {
        const { error } = await supabase
          .from('vextor_fuel_logs')
          .delete()
          .eq('id', realId);

        if (error) throw error;
      } else if (editingActivity.type === 'mission') {
        const { error } = await supabase
          .from('vextor_missions')
          .delete()
          .eq('id', realId);

        if (error) throw error;
      }

      setShowDeleteConfirm(false);
      setEditingActivity(null);
      loadActivityData();
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditFuelModal(false);
    setShowEditMissionModal(false);
    setEditingActivity(null);
    loadActivityData();
  };

  const filteredActivities = (filterType === 'all' ? activities : activities.filter(a => a.type === filterType))
    .filter(a => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        a.details.toLowerCase().includes(searchLower) ||
        a.vehicleName.toLowerCase().includes(searchLower) ||
        (a.reference && a.reference.toLowerCase().includes(searchLower))
      );
    });

  const totalIncome = filteredActivities
    .filter(a => a.isIncome && a.financialImpact !== null)
    .reduce((sum, a) => sum + (a.financialImpact || 0), 0);

  const totalExpenses = filteredActivities
    .filter(a => !a.isIncome && a.financialImpact !== null)
    .reduce((sum, a) => sum + (a.financialImpact || 0), 0);

  const netCashFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                TOTAL INCOME
              </p>
              <p className="text-2xl font-bold text-green-400" style={{ fontFamily: 'monospace' }}>
                ${totalIncome.toFixed(2)}
              </p>
            </div>
            <TrendingUp size={32} className="text-green-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                TOTAL EXPENSES
              </p>
              <p className="text-2xl font-bold text-red-400" style={{ fontFamily: 'monospace' }}>
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
            <TrendingDown size={32} className="text-red-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                NET CASH FLOW
              </p>
              <p
                className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-[#00FF00]' : 'text-red-400'}`}
                style={{ fontFamily: 'monospace' }}
              >
                ${netCashFlow.toFixed(2)}
              </p>
            </div>
            <DollarSign size={32} className={netCashFlow >= 0 ? 'text-[#00FF00]' : 'text-red-400'} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
              MASTER ACTIVITY LEDGER
            </h2>
            <Button onClick={() => setShowExpenseModal(true)} variant="secondary" className="flex items-center gap-2 whitespace-nowrap">
              <Plus size={18} />
              LOG EXPENSE
            </Button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by details, vehicle, or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-[#252525] border border-[#333] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#008080] transition-colors"
            />
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['all', 'fuel', 'mission', 'vehicle', 'expense'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition-colors ${
                  filterType === type
                    ? 'bg-[#008080] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'
                }`}
              >
                {type === 'all' ? 'ALL ACTIVITIES' : type === 'fuel' ? 'FUEL LOGS' : type === 'mission' ? 'MISSIONS' : type === 'vehicle' ? 'VEHICLES' : 'EXPENSES'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
              LOADING ACTIVITY DATA...
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2" style={{ fontFamily: 'monospace' }}>
              NO ACTIVITIES FOUND
            </p>
            <p className="text-gray-600 text-sm">Start logging fuel, creating missions, or adding vehicles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    TYPE
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    DATE
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    VEHICLE
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    DETAILS
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    REFERENCE
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    FINANCIAL IMPACT
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold" style={{ fontFamily: 'monospace' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <tr
                    key={activity.id}
                    className={`border-b border-[#252525] transition-colors ${
                      index % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#1a1a1a]'
                    } hover:bg-[#252525]`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {activity.icon}
                        <span className="text-gray-500 text-xs uppercase leading-relaxed">{activity.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-600" />
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{activity.vehicleName}</td>
                    <td className="py-4 px-4 text-gray-400 max-w-sm leading-relaxed">
                      <div className="flex items-center gap-2">
                        {activity.type === 'mission' && <MapPin size={14} className="text-gray-600 flex-shrink-0" />}
                        {activity.details}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-sm max-w-xs truncate leading-relaxed" title={activity.reference}>
                      {activity.reference ? (
                        <span className="px-2 py-1 bg-[#252525] rounded border border-[#333] text-gray-300">
                          {activity.reference}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-bold whitespace-nowrap leading-relaxed">
                      {activity.financialImpact !== null ? (
                        <span
                          className={activity.isIncome ? 'text-green-400' : 'text-red-400'}
                        >
                          {activity.isIncome ? '+' : '-'}${Math.abs(activity.financialImpact).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {activity.type === 'fuel' || activity.type === 'mission' ? (
                          <>
                            <button
                              onClick={() => handleEditClick(activity)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(activity)}
                              disabled={deleting}
                              className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : activity.type === 'expense' ? (
                          <button
                            onClick={() => handleDeleteExpense(activity.rawData?.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingActivity && editingActivity.type === 'fuel' && (
        <EditFuelLogModal
          isOpen={showEditFuelModal}
          onClose={() => {
            setShowEditFuelModal(false);
            setEditingActivity(null);
          }}
          fuelLogId={editingActivity.rawData?.id}
          vehicleId={editingActivity.rawData?.vehicle_id}
          currentOdometer={editingActivity.rawData?.odometer_reading}
          currentGallons={editingActivity.rawData?.gallons_added}
          currentCost={editingActivity.rawData?.total_cost}
          onSuccess={handleEditSuccess}
          onRefreshAll={onRefreshAll}
        />
      )}

      {editingActivity && editingActivity.type === 'mission' && (
        <EditMissionModal
          isOpen={showEditMissionModal}
          onClose={() => {
            setShowEditMissionModal(false);
            setEditingActivity(null);
          }}
          missionId={editingActivity.rawData?.id}
          currentOrigin={editingActivity.rawData?.origin}
          currentDestination={editingActivity.rawData?.destination}
          currentEstimatedMiles={editingActivity.rawData?.estimated_miles}
          currentOfferAmount={editingActivity.rawData?.offer_amount}
          currentDate={editingActivity.rawData?.completed_at || editingActivity.rawData?.created_at}
          onSuccess={handleEditSuccess}
          onRefreshAll={onRefreshAll}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setEditingActivity(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${editingActivity?.type === 'fuel' ? 'fuel log' : 'mission'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        isDangerous={true}
      />

      {showExpenseModal && (
        <LogExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            loadActivityData();
            if (onRefreshAll) {
              onRefreshAll();
            }
          }}
        />
      )}
    </div>
  );
}
