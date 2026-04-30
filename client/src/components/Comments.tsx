import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communityService } from '../services/community'
import { MessageCircle, Loader2, Send } from 'lucide-react'

interface CommentsProps {
  postId: string
}

const Comments = ({ postId }: CommentsProps) => {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => communityService.getComments(postId),
    enabled: showComments,
  })

  const mutation = useMutation({
    mutationFn: () => communityService.commentPost(postId, newComment),
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      mutation.mutate()
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm">{data?.comments?.length} Comments</span>
      </button>

      {showComments && (
        <div className="mt-3 pl-3 border-l-2 border-gray-200">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {data?.comments?.length ? (
                <div className="space-y-4 mb-3">
                  {data.comments.map((comment) => (
                    <div key={comment._id} className="text-sm flex items-start p-3 rounded-md  bg-zinc-200/50 mb-1.5">
                      <span className="font-semibold w-6 h-6 flex items-center justify-center text-orange-600 bg-orange-100 rounded-full p-2 text-xs">cm</span>
                      <span className="text-gray-700 ml-2 text-sm">{comment.content}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">No comments yet</p>
              )}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                />
                <button
                  type="submit"
                  disabled={mutation.isPending || !newComment.trim()}
                  className="text-emerald-600 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Comments