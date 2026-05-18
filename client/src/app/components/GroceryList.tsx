import React, { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Trash2,
  Users,
  User,
  RefreshCw,
  ChevronDown,
  X,
  Loader2,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { groceryService, GroceryItem } from "../services/groceryService";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const GroceryList: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isFamilyMode, setIsFamilyMode] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncDuration, setSyncDuration] = useState<7 | 30>(7);

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const categories = [
    "Proteins",
    "Vegetables",
    "Dairy",
    "Grains",
    "Fruits",
    "Spices",
    "Other",
  ];

  const categoryEmoji: Record<string, string> = {
    Proteins: "🥩",
    Vegetables: "🥦",
    Dairy: "🥛",
    Grains: "🌾",
    Fruits: "🍎",
    Spices: "🧂",
    Other: "🫙",
  };

  useEffect(() => {
    fetchGroceryList();
  }, []);

  const fetchGroceryList = async () => {
    setLoading(true);
    try {
      const response = await groceryService.getList();
      setItems(response.items);
    } catch (error) {
      console.error("Failed to fetch grocery list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setRefreshing(true);
    setShowSyncModal(false);
    try {
      const response = await groceryService.sync({
        duration: syncDuration,
        isFamily: isFamilyMode,
      });
      setItems(response.items);
      toast.success(`Grocery list synced for ${syncDuration} days!`);
    } catch (error) {
      console.error("Failed to sync grocery list:", error);
      toast.error("Failed to sync grocery list. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleItem = async (item: GroceryItem) => {
    const newCheckedState = !item.checked;

    // Optimistic update
    setItems(
      items.map((i) =>
        i.name === item.name ? { ...i, checked: newCheckedState } : i,
      ),
    );

    try {
      await groceryService.toggleItem({
        itemName: item.name,
        checked: newCheckedState,
      });
    } catch (error) {
      console.error("Failed to toggle item:", error);
      // Revert on error
      setItems(
        items.map((i) =>
          i.name === item.name ? { ...i, checked: !newCheckedState } : i,
        ),
      );
      toast.error("Failed to update item. Please try again.");
    }
  };

  const handleExportPdf = () => {
    window.open(`${API_URL}/export/groceries/pdf`, '_blank');
  };

  const toggleItem = (name: string) => {
    const item = items.find((i) => i.name === name);
    if (item) {
      handleToggleItem(item);
    }
  };

  const deleteItem = (name: string) =>
    setItems(items.filter((item) => item.name !== name));

  const addItem = async () => {
    if (!newItem.trim()) return;
    try {
      await groceryService.addItem({ name: newItem });
      await fetchGroceryList();
      setNewItem("");
      toast.success("Item added successfully!");
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error("Failed to add item. Please try again.");
    }
  };

  const handleRefreshClick = () => {
    setShowSyncModal(true);
  };

  const groupedItems = categories.reduce(
    (acc, cat) => {
      const catItems = items.filter((i) => i.category === cat);
      if (catItems.length > 0) acc[cat] = catItems;
      return acc;
    },
    {} as Record<string, GroceryItem[]>,
  );

  const checkedCount = items.filter((i) => i.checked).length;
  const progress =
    items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <div className="mx-auto space-y-6 pb-20">
      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed w-full min-h-screen left-0 top-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSyncModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Sync from Plan
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Generate grocery list from your meal plan
                  </p>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Duration
                  </label>
                  <div className="relative">
                    <select
                      value={syncDuration}
                      onChange={(e) =>
                        setSyncDuration(Number(e.target.value) as 7 | 30)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm appearance-none bg-white"
                    >
                      <option value={7}>7 Days (Week)</option>
                      <option value={30}>30 Days (Month)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Family Mode
                  </label>
                  <button
                    onClick={() => setIsFamilyMode(!isFamilyMode)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${isFamilyMode
                      ? "border-green-600 bg-green-50 ring-2 ring-green-200"
                      : "border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {isFamilyMode ? (
                        <Users className="w-5 h-5 text-green-700" />
                      ) : (
                        <User className="w-5 h-5 text-slate-500" />
                      )}
                      <span className="font-medium text-slate-700">
                        {isFamilyMode
                          ? "Include Family Members"
                          : "My List Only"}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isFamilyMode
                        ? "bg-green-600 border-green-600"
                        : "border-slate-300"
                        }`}
                    >
                      {isFamilyMode && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                </div>

                <button
                  onClick={handleSync}
                  disabled={refreshing}
                  className="w-full bg-gradient-to-r from-green-800 to-green-700 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Sync Grocery List
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Grocery List</h1>
          <p className="text-slate-500 mt-1">
            {isFamilyMode
              ? "Auto-aggregated from nutrition plans."
              : "Your personal shopping list for this week."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFamilyMode(!isFamilyMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isFamilyMode ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}
          >
            {isFamilyMode ? (
              <Users className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
            {isFamilyMode ? "Family List" : "My List"}
          </button>

          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Sync from Plan
          </button>

          <div className="flex gap-2 pl-2 ml-1">
            <button
              onClick={handleExportPdf}
              disabled={items.length === 0}
              className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-green-700 hover:border-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200"
              title="Export PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-slate-700 text-sm">
            Shopping Progress
          </span>
          <span className="text-sm font-bold text-slate-900">
            {checkedCount}/{items.length} items
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{progress}% complete</span>
          <span>{items.length - checkedCount} remaining</span>
        </div>
      </div>

      {/* Add Item */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add extra item..."
          className="flex-1 px-4 py-2 outline-none text-slate-700 placeholder:text-slate-400 text-sm"
        />
        <button
          onClick={addItem}
          className="bg-green-700 text-white p-3 rounded-xl hover:bg-green-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Grouped Items */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-600" />
          <p className="text-slate-500">Loading grocery list...</p>
        </div>
      ) : Object.keys(groupedItems).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const isCollapsed = collapsedCategories.has(category);
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div
                  className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: isCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                    <span className="text-lg">
                      {categoryEmoji[category] || "📦"}
                    </span>
                    <h3 className="font-bold text-slate-700">{category}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                    {categoryItems.filter((i) => i.checked).length}/
                    {categoryItems.length}
                  </span>
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {categoryItems.map((item) => (
                        <motion.div
                          key={item.name}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors group ${item.checked ? "bg-slate-50/50" : ""}`}
                        >
                          <button
                            onClick={() => toggleItem(item.name)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.checked
                              ? "bg-green-500 border-green-500"
                              : "border-slate-300 hover:border-green-500"
                              }`}
                          >
                            {item.checked && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium text-sm transition-all ${item.checked ? "text-slate-400 line-through" : "text-slate-900"}`}
                            >
                              {item.name}
                            </div>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {item.quantity}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteItem(item.name)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No items in your list</p>
          <p className="text-sm">
            Generate a nutrition plan or add items manually
          </p>
        </div>
      )}
    </div>
  );
};
