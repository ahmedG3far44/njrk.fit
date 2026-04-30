import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groceryService } from '../../services/grocery'
import {
  ShoppingCart,
  Loader2,
  RefreshCw,
  Plus,
  X,
  Copy,
} from 'lucide-react'
import CategorySection from '../../components/CategorySection'
import PageActionButtons from '../../components/PageActionButtons'

type ListMode = 'my' | 'family'

const CATEGORIES = ['Proteins', 'Vegetables', 'Dairy', 'Grains', 'Fruits', 'Spices', 'Other']

const CATEGORY_EMOJI: Record<string, string> = {
  Proteins: '🥩',
  Vegetables: '🥬',
  Dairy: '🧀',
  Grains: '🌾',
  Fruits: '🍎',
  Spices: '🧂',
  Other: '📦',
}

const GroceriesPage = () => {
  const [listMode, setListMode] = useState<ListMode>('family')
  const [newItemName, setNewItemName] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const queryClient = useQueryClient()

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['groceries'],
    queryFn: () => groceryService.getGroceries(),
  })

  const items = apiData?.items || []
  const purchasedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0

  const syncMutation = useMutation({
    mutationFn: (isFamily: boolean) => groceryService.syncFromPlan(7, isFamily),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ name, checked }: { name: string; checked: boolean }) =>
      groceryService.toggleItem(name, checked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries'] })
    },
  })

  const addItemMutation = useMutation({
    mutationFn: (name: string) => groceryService.addItem(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries'] })
      setNewItemName('')
      setShowAddItem(false)
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => groceryService.createShare(),
    onSuccess: (data) => {
      if (data.success) {
        setShareUrl(data.shareUrl)
        setShowShareModal(true)
      }
    },
  })

  const handleToggleItem = (name: string, checked: boolean) => {
    toggleMutation.mutate({ name, checked })
  }

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItemMutation.mutate(newItemName.trim())
    }
  }

  const handleSync = () => {
    syncMutation.mutate(listMode === 'family')
  }

  const handleShare = () => {
    shareMutation.mutate()
  }

  const handlePrint = async () => {
    try {
      // 1. نجيب ملف الـ PDF من الباك إند
      const blob = await groceryService.exportPdf()
      
      // 2. نسوي رابط وهمي عشان المتصفح يحمله
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Grocery_List.pdf') // اسم الملف
      document.body.appendChild(link)
      
      // 3. محاكاة ضغطة التحميل
      link.click()
      
      // 4. تنظيف الرابط من الذاكرة
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('حدث خطأ أثناء تصدير ملف الـ PDF!')
    }
  }

  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof items> = {}
    for (const cat of CATEGORIES) {
      grouped[cat] = items.filter(item => item.category === cat)
    }
    return grouped
  }, [items])

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${shareUrl}`
    navigator.clipboard.writeText(fullUrl)
  }

  console.log(showAddItem)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grocery List</h1>
          <p className="text-gray-500 text-sm mt-1">
            For the next 7 days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setListMode('my')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${listMode === 'my' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
                }`}
            >
              My List
            </button>
            <button
              onClick={() => setListMode('family')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1 ${listMode === 'family' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
                }`}
            >
              Family
            </button>
          </div>

          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync
          </button>

          <PageActionButtons onShare={handleShare} onPrint={handlePrint} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Shopping Progress</h2>
          <span className="text-2xl font-bold">{purchasedCount}/{totalCount}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Add extra item..."
          className="w-full px-4 py-3 pr-14 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemName.trim() || addItemMutation.isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-4">
          {CATEGORIES.map(category => (
            <CategorySection
              key={category}
              category={category}
              emoji={CATEGORY_EMOJI[category]}
              items={itemsByCategory[category]}
              onToggleItem={handleToggleItem}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No items in your grocery list</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Generate a meal plan and sync to see groceries
          </p>
          <button
            onClick={handleSync}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
          >
            Sync from Meal Plan
          </button>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Share Grocery List</h2>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Share this link with family members. The link expires in 7 days.
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
              <input
                type="text"
                value={`${window.location.origin}${shareUrl}`}
                readOnly
                className="flex-1 bg-transparent text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroceriesPage
