import { Flame, Beef, Wheat, Droplet } from 'lucide-react'

interface MacroCardProps {
  label: string
  current: number
  target: number
  unit?: string
  color: 'orange' | 'red' | 'amber' | 'yellow'
}

const ICONS = {
  orange: Flame,
  red: Beef,
  amber: Wheat,
  yellow: Droplet,
}

const COLORS = {
  orange: { bg: 'bg-orange-100', text: 'text-orange-500', bar: 'bg-orange-500' },
  red: { bg: 'bg-red-100', text: 'text-red-500', bar: 'bg-red-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-500', bar: 'bg-amber-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-500', bar: 'bg-yellow-500' },
}

const MacroCard = ({ label, current, target, unit = '', color }: MacroCardProps) => {
  const Icon = ICONS[color]
  const colors = COLORS[color]
  const percentage = Math.min((current / target) * 100, 100)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">
        {current}
        <span className="text-sm font-normal text-gray-400">/{target}{unit}</span>
      </p>
      <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
        <div 
          className={`h-full ${colors.bar} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default MacroCard