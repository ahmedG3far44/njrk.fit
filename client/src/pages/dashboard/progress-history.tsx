import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { progressService } from '../../services/progress'
import { Scale, Loader2 } from 'lucide-react'

const ProgressHistoryPage = () => {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['progressHistory', page],
    queryFn: () => progressService.getHistory(page),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progress History</h1>

      <div className="space-y-4">
        {data?.logs?.length ? (
          data.logs.map((log) => (
            <div key={log._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{log.weightKg} kg</p>
                    <p className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {log.notes && <p className="mt-2 text-gray-600">{log.notes}</p>}
              {log.tags?.length ? (
                <div className="flex gap-2 mt-2">
                  {log.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No progress logs yet</p>
          </div>
        )}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded ${
                p === page ? 'bg-emerald-600 text-white' : 'bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProgressHistoryPage