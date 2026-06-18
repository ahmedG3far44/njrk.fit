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
import { useTranslation } from 'react-i18next';
import { groceryService, GroceryItem } from "../services/groceryService";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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

  const { t } = useTranslation();

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

  const categoryLabels: Record<string, string> = {
    Proteins: t('grocery.categoryProteins'),
    Vegetables: t('grocery.categoryVegetables'),
    Dairy: t('grocery.categoryDairy'),
    Grains: t('grocery.categoryGrains'),
    Fruits: t('grocery.categoryFruits'),
    Spices: t('grocery.categorySpices'),
    Other: t('grocery.categoryOther'),
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
      toast.success(`${t('grocery.synced')} ${syncDuration} days!`);
    } catch (error) {
      console.error("Failed to sync grocery list:", error);
      toast.error(t('grocery.syncFailed'));
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
      toast.error(t('grocery.itemUpdateFailed'));
    }
  };

  const handleExportPdf = () => {
    window.open(`${API_URL}/export/groceries/pdf`, "_blank");
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
      toast.success(t('grocery.itemAdded'));
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error(t('grocery.itemAddFailed'));
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
            className="fixed w-full min-h-screen start-0 top-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSyncModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-card-foreground text-lg">
                    {t('grocery.syncModalTitle')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t('grocery.syncModalSubtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                    {t('grocery.duration')}
                  </label>
                  <div className="relative">
                    <select
                      value={syncDuration}
                      onChange={(e) =>
                        setSyncDuration(Number(e.target.value) as 7 | 30)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-forest-canopy/50 outline-none text-sm appearance-none bg-card"
                    >
                      <option value={7}>{t('grocery.days7')}</option>
                      <option value={30}>{t('grocery.days30')}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                    {t('grocery.familyMode')}
                  </label>
                  <button
                    onClick={() => setIsFamilyMode(!isFamilyMode)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                      isFamilyMode
                        ? "border-forest-canopy/40 bg-forest-canopy/10 ring-1 ring-forest-canopy/30"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isFamilyMode ? (
                        <Users className="w-5 h-5 text-forest-canopy" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="font-medium text-card-foreground">
                        {isFamilyMode
                          ? t('grocery.includeFamily')
                          : t('grocery.myListOnly')}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isFamilyMode
                          ? "bg-forest-canopy border-forest-canopy"
                          : "border-border"
                      }`}
                    >
                      {isFamilyMode && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                </div>

                <button
                  onClick={handleSync}
                  disabled={refreshing}
                  className="w-full bg-gradient-to-r from-forest-deep to-forest-canopy rtl:bg-gradient-to-l text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_16px_35px_-16px_rgba(74,222,128,0.8)]"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('grocery.syncing')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      {t('grocery.syncButton')}
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
          <h1 className="text-3xl font-bold text-card-foreground">{t('grocery.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isFamilyMode
              ? t('grocery.descFamily')
              : t('grocery.descPersonal')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFamilyMode(!isFamilyMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isFamilyMode ? "bg-forest-canopy/15 text-forest-canopy shadow-sm shadow-forest-canopy/10" : "bg-muted text-muted-foreground"}`}
          >
            {isFamilyMode ? (
              <Users className="w-4 h-4 text-forest-canopy" />
            ) : (
              <User className="w-4 h-4" />
            )}
            {isFamilyMode ? t('grocery.familyList') : t('grocery.myList')}
          </button>

          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {t('grocery.syncFromPlan')}
          </button>

          <div className="flex gap-2 ps-2 ms-1">
            <button
              onClick={handleExportPdf}
              disabled={items.length === 0}
              className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground bg-card border border-border hover:bg-muted hover:text-forest-canopy hover:border-forest-canopy/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border"
              title={t('grocery.exportPdfTitle')}
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">{t('grocery.pdf')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-card-foreground text-sm">
              {t('grocery.shoppingProgress')}
            </span>
            <span className="text-sm font-bold text-card-foreground">
              {checkedCount}/{items.length} {t('grocery.items')}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-forest-deep to-forest-canopy rtl:bg-gradient-to-l rounded-full shadow-[0_0_18px_rgba(74,222,128,0.25)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{progress}{t('grocery.percentComplete')}</span>
            <span>{items.length - checkedCount} {t('grocery.remaining')}</span>
          </div>
        </div>
      )}

      {/* Add Item */}
      <div className="bg-card p-2 rounded-2xl border border-border shadow-sm flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={t('grocery.addItem')}
          className="flex-1 px-4 py-2 outline-none text-card-foreground placeholder:text-muted-foreground text-sm"
        />
        <button
          onClick={addItem}
          className="bg-green-900/80 hover:bg-green-800 text-green-300 border border-green-700/50 shadow-sm transition-all duration-200 p-3 rounded-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Grouped Items */}
      {loading ? (
        <div className="bg-card rounded-3xl border border-border shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-forest-canopy" />
          <p className="text-muted-foreground">{t('grocery.loading')}</p>
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
                className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
              >
                <div
                  className="bg-muted px-5 py-3 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: isCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                    <span className="text-lg">
                      {categoryEmoji[category] || "📦"}
                    </span>
                    <h3 className="font-bold text-card-foreground">{categoryLabels[category] || category}</h3>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
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
                          className={`flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/70 transition-colors group ${item.checked ? "bg-muted/50" : ""}`}
                        >
                          <button
                            onClick={() => toggleItem(item.name)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              item.checked
                                ? "bg-forest-canopy border-forest-canopy"
                                : "border-border hover:border-forest-canopy"
                            }`}
                          >
                            {item.checked && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium text-sm transition-all ${item.checked ? "text-muted-foreground line-through" : "text-card-foreground"}`}
                            >
                              {item.name}
                            </div>
                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {item.quantity}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteItem(item.name)}
                            className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 flex-shrink-0"
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
        <div className="bg-card rounded-3xl border border-border shadow-sm p-12 text-center text-muted-foreground">
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t('grocery.noItemsTitle')}</p>
          <p className="text-sm">
            {t('grocery.noItemsDesc')}
          </p>
        </div>
      )}
    </div>
  );
};
