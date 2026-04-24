import { useEffect, useState } from 'react'
import { LayoutGrid, List as ListIcon } from 'lucide-react'

export type ViewMode = 'grid' | 'list'

/**
 * Hook lưu view mode vào localStorage theo key riêng từng page.
 * Dùng: const [view, setView] = useViewMode('docs-list', 'grid')
 */
export function useViewMode(storageKey: string, defaultMode: ViewMode = 'grid'): [ViewMode, (m: ViewMode) => void] {
  const key = `l2sc_view_${storageKey}`
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      const v = localStorage.getItem(key)
      return v === 'grid' || v === 'list' ? v : defaultMode
    } catch {
      return defaultMode
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, mode)
    } catch {
      // ignore
    }
  }, [key, mode])

  return [mode, setMode]
}

interface Props {
  mode: ViewMode
  onChange: (m: ViewMode) => void
  className?: string
}

/**
 * 2-button toggle: grid ↔ list. Dùng chung pattern với L2S WorkflowList.
 */
export default function ViewToggle({ mode, onChange, className = '' }: Props) {
  return (
    <div className={`inline-flex items-center gap-0.5 p-0.5 bg-slate-800 border border-slate-700 rounded-lg ${className}`}>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`flex items-center justify-center w-8 h-8 rounded transition ${
          mode === 'grid'
            ? 'bg-slate-700 text-white'
            : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Hiển thị dạng lưới card"
        aria-label="Grid view"
      >
        <LayoutGrid size={15} />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex items-center justify-center w-8 h-8 rounded transition ${
          mode === 'list'
            ? 'bg-slate-700 text-white'
            : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Hiển thị dạng danh sách"
        aria-label="List view"
      >
        <ListIcon size={15} />
      </button>
    </div>
  )
}
