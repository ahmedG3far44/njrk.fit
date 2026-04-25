import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { communityService } from '../services/community'
import { X, Image, Send } from 'lucide-react'

interface PostComposerProps {
  onPosted: () => void
}

const PostComposer = ({ onPosted }: PostComposerProps) => {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: () => communityService.createPost(content, media || undefined),
    onSuccess: () => {
      setContent('')
      setMedia(null)
      onPosted()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      mutation.mutate()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your progress..."
        className="w-full resize-none border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        rows={3}
      />
      <div className="flex items-center justify-between mt-3">
        <label className="cursor-pointer text-gray-500 hover:text-gray-700">
          <Image className="w-5 h-5" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setMedia(e.target.files?.[0] || null)}
          />
        </label>
        <button
          type="submit"
          disabled={mutation.isPending || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {mutation.isPending ? 'Posting...' : 'Post'}
        </button>
      </div>
      {media && (
        <div className="mt-2 relative inline-block">
          <img
            src={URL.createObjectURL(media)}
            alt="Preview"
            className="w-20 h-20 object-cover rounded"
          />
          <button
            type="button"
            onClick={() => setMedia(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </form>
  )
}

export default PostComposer