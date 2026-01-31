import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Plus, Trash2, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

interface ShoppingItem {
  id: string;
  item_name: string;
  is_checked: boolean;
}

type TabType = 'stockpile' | 'resupply';

export function SupplyDepot() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('stockpile');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadShoppingList();
    }
  }, [user]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShoppingList = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_shopping_list_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShoppingItems(data || []);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  const addInventoryItem = async () => {
    if (!newItemName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('vextor_inventory_items')
        .insert([
          {
            user_id: user.id,
            item_name: newItemName.trim(),
            quantity: parseFloat(newItemQuantity) || 0,
            unit: 'units',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setInventoryItems([data, ...inventoryItems]);
      setNewItemName('');
      setNewItemQuantity('');
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vextor_inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInventoryItems(inventoryItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  const addShoppingItem = async () => {
    if (!newShoppingItem.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('vextor_shopping_list_items')
        .insert([
          {
            user_id: user.id,
            item_name: newShoppingItem.trim(),
            is_checked: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setShoppingItems([data, ...shoppingItems]);
      setNewShoppingItem('');
    } catch (error) {
      console.error('Error adding shopping item:', error);
    }
  };

  const toggleShoppingItem = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('vextor_shopping_list_items')
        .update({ is_checked: !currentState })
        .eq('id', id);

      if (error) throw error;

      setShoppingItems(
        shoppingItems.map((item) =>
          item.id === id ? { ...item, is_checked: !currentState } : item
        )
      );
    } catch (error) {
      console.error('Error toggling shopping item:', error);
    }
  };

  const deleteShoppingItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vextor_shopping_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShoppingItems(shoppingItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting shopping item:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          SUPPLY DEPOT
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('stockpile')}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === 'stockpile'
              ? 'bg-[#008080] text-white'
              : 'bg-[#252525] text-gray-400 hover:text-white'
          }`}
          style={{ fontFamily: 'monospace' }}
        >
          STOCKPILE
        </button>
        <button
          onClick={() => setActiveTab('resupply')}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === 'resupply'
              ? 'bg-[#008080] text-white'
              : 'bg-[#252525] text-gray-400 hover:text-white'
          }`}
          style={{ fontFamily: 'monospace' }}
        >
          RESUPPLY MANIFEST
        </button>
      </div>

      {activeTab === 'stockpile' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-[#008080] mb-4" style={{ fontFamily: 'monospace' }}>
              QUICK ADD
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInventoryItem()}
                placeholder="Item name"
                className="flex-1 bg-[#252525] border border-[#333] text-white px-4 py-2 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInventoryItem()}
                placeholder="Qty"
                className="w-24 bg-[#252525] border border-[#333] text-white px-4 py-2 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
              <Button onClick={addInventoryItem} variant="secondary" className="px-6">
                <Plus size={20} />
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-[#008080] mb-4" style={{ fontFamily: 'monospace' }}>
              CURRENT INVENTORY
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                  LOADING...
                </p>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto mb-3 text-gray-600" size={48} />
                <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                  NO ITEMS IN STOCKPILE
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Use Quick Add to start tracking your inventory
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryItems.map((item) => {
                  const maxQuantity = 100;
                  const percentage = Math.min((item.quantity / maxQuantity) * 100, 100);
                  const barColor =
                    percentage > 50 ? 'bg-[#00FF00]' : percentage > 25 ? 'bg-[#FFD700]' : 'bg-[#FF4500]';

                  return (
                    <div key={item.id} className="bg-[#252525] border border-[#333] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold" style={{ fontFamily: 'monospace' }}>
                          {item.item_name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#008080]" style={{ fontFamily: 'monospace' }}>
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => deleteInventoryItem(item.id)}
                            className="text-gray-500 hover:text-[#FF4500] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-[#1a1a1a] h-2 overflow-hidden">
                        <div className={`h-full ${barColor} transition-all`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'resupply' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-[#008080] mb-4" style={{ fontFamily: 'monospace' }}>
              ADD TO MANIFEST
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newShoppingItem}
                onChange={(e) => setNewShoppingItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addShoppingItem()}
                placeholder="Item to purchase"
                className="flex-1 bg-[#252525] border border-[#333] text-white px-4 py-2 focus:outline-none focus:border-[#008080] transition-colors"
                style={{ fontFamily: 'monospace' }}
              />
              <Button onClick={addShoppingItem} variant="secondary" className="px-6">
                <Plus size={20} />
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-[#008080] mb-4" style={{ fontFamily: 'monospace' }}>
              SHOPPING CHECKLIST
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                  LOADING...
                </p>
              </div>
            ) : shoppingItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto mb-3 text-gray-600" size={48} />
                <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
                  NO ITEMS ON MANIFEST
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Add items you need to purchase
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#252525] border border-[#333] p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.is_checked}
                        onChange={() => toggleShoppingItem(item.id, item.is_checked)}
                        className="w-5 h-5 bg-[#1a1a1a] border-2 border-[#008080] accent-[#008080] cursor-pointer"
                      />
                      <span
                        className={`${
                          item.is_checked ? 'text-gray-500 line-through' : 'text-white'
                        } transition-colors`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {item.item_name}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="text-gray-500 hover:text-[#FF4500] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {shoppingItems.length > 0 && (
            <Button variant="secondary" className="w-full text-lg py-4">
              DEPLOY RAPID RESUPPLY
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
