import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { Search, X, Loader2 } from 'lucide-react'

interface UserSearchResult {
  id: string
  name: string
  avatarUrl?: string
  username: string
}

interface AddMemberModalProps {
  onClose: () => void
  onInvited?: () => void
}

const AddMemberModal = ({ onClose, onInvited }: AddMemberModalProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await api.get<{ results: UserSearchResult[] }>('/family/search', {
        params: { q: query },
      })
      return response.data
    },
    onSuccess: (data) => {
      setSearchResults(data?.results || [])
      setIsSearching(false)
    },
    onError: () => {
      setSearchResults([])
      setIsSearching(false)
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<{ success: boolean; message: string }>('/family/invite', {
        targetUserId: userId,
      })
      return response.data
    },
    onSuccess: () => {
      onInvited?.()
      onClose()
    },
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        searchMutation.mutate(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Family Member</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          )}

          {!isSearching && searchResults?.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-purple-600 font-medium">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => inviteMutation.mutate(user.id)}
                    disabled={inviteMutation.isPending}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50"
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Invite'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery.length >= 2 && searchResults?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching "{searchQuery}"
            </div>
          )}

          {searchQuery.length < 2 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Type to search for users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddMemberModal