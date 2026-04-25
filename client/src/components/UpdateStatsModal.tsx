import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { progressService } from '../services/progress'
import { X, Upload, Loader2, Check, Sparkles } from 'lucide-react'

interface ExtractedInBody {
  weightKg: number
  bodyFatPercentage: number
  muscleMass: number
}

interface UpdateStatsModalProps {
  onClose: () => void
  onUpdated: () => void
}

const moodTags = [
  'Feeling energetic',
  'Feeling strong',
  'Lost some weight',
  'Muscles sore',
  'Better sleep',
  'More confident',
  'Need more rest',
  'Feeling tired',
]

const UpdateStatsModal = ({ onClose, onUpdated }: UpdateStatsModalProps) => {
  const [weightKg, setWeightKg] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedInBody | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractMutation = useMutation({
    mutationFn: () => progressService.extractInBody(scanFile!),
    onSuccess: (data) => {
      setExtractedData(data.extracted)
      if (data.extracted.weightKg) setWeightKg(String(data.extracted.weightKg))
    },
  })

  const logMutation = useMutation({
    mutationFn: () => progressService.logProgress({
      weightKg: weightKg ? Number(weightKg) : undefined,
      bodyFatPercentage: extractedData?.bodyFatPercentage,
      muscleMass: extractedData?.muscleMass,
      tags: selectedTags,
      notes,
      scanFile: scanFile || undefined,
    }),
    onSuccess: () => {
      onUpdated()
    },
  })

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setScanFile(file)
      extractMutation.mutate()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScanFile(file)
      extractMutation.mutate()
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    logMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Update My Stats</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Current Weight (kg)</label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter weight in kg"
              step="0.1"
            />
            {extractedData && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Extracted from scan: {extractedData.weightKg}kg, {extractedData.bodyFatPercentage}% BF, {extractedData.muscleMass}kg muscle
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload InBody / Body Composition Scan</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : scanFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {extractMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span className="text-gray-600">Analyzing scan...</span>
                </div>
              ) : scanFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">{scanFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">Drag & drop or browse</p>
                  <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tell the AI How You Feel</label>
            <div className="flex flex-wrap gap-2">
              {moodTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedTags.includes(tag)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="How are you feeling about your progress?"
            />
            <Sparkles className="w-4 h-4 text-gray-400 absolute bottom-3 right-3" />
          </div>

          <button
            type="submit"
            disabled={logMutation.isPending}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {logMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <span className="flex items-center gap-2">
                Submit Update
                <Sparkles className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UpdateStatsModal