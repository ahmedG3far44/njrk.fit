interface GroceryItem {
  name: string
  category: string
  quantity: string
  checked: boolean
}

interface CategorySectionProps {
  category: string
  emoji: string
  items: GroceryItem[]
  onToggleItem: (name: string, checked: boolean) => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  Proteins: '🥩',
  Vegetables: '🥬',
  Dairy: '🧀',
  Grains: '🌾',
  Fruits: '🍎',
  Spices: '🧂',
  Other: '📦',
}

const CategorySection = ({ category, items, onToggleItem }: CategorySectionProps) => {
  const emoji = CATEGORY_EMOJI[category] || '📦'
  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const ratio = `${checkedCount}/${totalCount}`

  if (totalCount === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-semibold">{category}</h3>
        <span className="ml-auto px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
          {ratio}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
          >
            <button
              onClick={() => onToggleItem(item.name, !item.checked)}
              className="shrink-0"
            >
              {item.checked ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${item.checked ? 'text-gray-400 line-through' : ''}`}>
                {item.name}
              </p>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {item.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategorySection