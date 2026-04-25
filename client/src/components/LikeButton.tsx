import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communityService } from '../services/community'
import { Heart } from 'lucide-react'
import { useState } from 'react'

interface LikeButtonProps {
  postId: string
  isLiked: boolean
  likeCount: number
}

const LikeButton = ({ postId, isLiked: initialIsLiked, likeCount: initialLikeCount }: LikeButtonProps) => {
  const queryClient = useQueryClient()
  const [optimisticLiked, setOptimisticLiked] = useState(initialIsLiked)
  const [optimisticCount, setOptimisticCount] = useState(initialLikeCount)

  const mutation = useMutation({
    mutationFn: () => communityService.toggleLike(postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community'] })
      const previousData = queryClient.getQueryData(['community'])
      
      queryClient.setQueryData(['community'], (old: any) => {
        if (!old?.posts) return old
        return {
          ...old,
          posts: old.posts.map((post: any) => 
            post._id === postId
              ? { ...post, isLiked: !optimisticLiked, likeCount: optimisticLiked ? post.likeCount - 1 : post.likeCount + 1 }
              : post
          ),
        }
      })
      
      setOptimisticLiked(!optimisticLiked)
      setOptimisticCount(prev => optimisticLiked ? prev - 1 : prev + 1)
      
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['community'], context.previousData)
      }
      setOptimisticLiked(initialIsLiked)
      setOptimisticCount(initialLikeCount)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`flex items-center gap-1 transition-colors ${
        optimisticLiked ? 'text-red-500 fill-red-500' : 'text-gray-500 hover:text-red-500'
      }`}
    >
      <Heart className={`w-5 h-5 ${optimisticLiked ? 'fill-current' : ''}`} />
      <span className="text-sm">{optimisticCount}</span>
    </button>
  )
}

export default LikeButton