import { Printer, Share2 } from 'lucide-react'

interface PageActionButtonsProps {
  onShare: () => void
  onPrint: () => void
}

const PageActionButtons = ({ onShare, onPrint }: PageActionButtonsProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onShare}
        className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>

      <button
        onClick={onPrint}
        className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
        title="Export PDF"
      >
        <Printer className="w-5 h-5" />
      </button>
    </div>
  )
}

export default PageActionButtons
