import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../services/user'
import { Camera } from 'lucide-react'

interface AvatarUploaderProps {
  currentAvatarUrl?: string
  name: string
}

const AvatarUploader = ({ currentAvatarUrl, name }: AvatarUploaderProps) => {
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setPreview(null)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and WebP are allowed')
        return
      }
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
    const file = fileInput.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await uploadMutation.mutateAsync(file)
    } finally {
      setIsUploading(false)
    }
  }

  const displayUrl = preview || currentAvatarUrl

  return (
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden">
        {displayUrl ? (
          <img src={displayUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          name?.charAt(0).toUpperCase()
        )}
      </div>
      
      <label
        htmlFor="avatar-upload"
        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700"
      >
        <Camera className="w-4 h-4 text-white" />
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {preview && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Save'}
          </button>
          <button
            onClick={() => setPreview(null)}
            className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default AvatarUploader