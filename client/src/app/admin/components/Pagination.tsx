import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, pages, total, onPageChange }: PaginationProps) => {
  if (pages <= 1) return null;

  const getPages = () => {
    const items: (number | 'ellipsis')[] = [];
    const delta = 1;
    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(pages - 1, page + delta);

    items.push(1);
    if (rangeStart > 2) items.push('ellipsis');
    for (let i = rangeStart; i <= rangeEnd; i++) items.push(i);
    if (rangeEnd < pages - 1) items.push('ellipsis');
    if (pages > 1) items.push(pages);

    return items;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-limestone">
      <span className="text-label text-gravel">
        {total} total
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-trail-gray hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPages().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="w-7 text-center text-label text-dust">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? 'bg-forest-canopy text-peak-white'
                  : 'text-trail-gray hover:bg-stone'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg text-trail-gray hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
