import type { ReactNode } from 'react'

function PaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-[#e8e8e8] px-3 py-2 text-sm font-semibold text-[#202224] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#313d4f] dark:text-[#f4f3f2] dark:hover:bg-[#1c2534]"
    >
      {children}
    </button>
  )
}

export function ProjectsPagination({
  page,
  totalPages,
  textSecondary,
  onPageChange,
}: {
  page: number
  totalPages: number
  textSecondary: string
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className={`text-xs ${textSecondary}`}>Страница {page} из {totalPages}</div>
      <div className="flex items-center gap-2">
        <PaginationButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Назад</PaginationButton>
        <PaginationButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Вперед</PaginationButton>
      </div>
    </div>
  )
}
