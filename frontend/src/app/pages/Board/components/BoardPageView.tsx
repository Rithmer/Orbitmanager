import { AlertTriangle } from 'lucide-react'
import { PageShell, PageShellHeaderSkeleton } from '@/app/components/PageShell'
import { BoardPickerSkeleton, BoardProjectPicker } from '@/app/features/board'
import { ProjectBoardSkeleton } from '@/app/features/board/board-view'
import { BoardPageActions, BoardPageLoadedBody } from '@/app/pages/Board/components/BoardPageLoaded'
import type { BoardPageViewModel } from '@/app/pages/Board/types'

type BoardPageViewProps = {
  model: BoardPageViewModel
}

export function BoardPageView({ model }: BoardPageViewProps) {
  if (model.phase === 'initial_skeleton') {
    return (
      <PageShell title="Доска проекта" description="Загрузка данных доски..." className={model.pageBg}>
        <PageShellHeaderSkeleton />
        <ProjectBoardSkeleton />
      </PageShell>
    )
  }

  if (model.phase === 'picker_skeleton') {
    return <BoardPickerSkeleton pageBg={model.pageBg} />
  }

  if (model.phase === 'picker') {
    return (
      <BoardProjectPicker
        pageBg={model.pageBg}
        textPrimary={model.textPrimary}
        textSecondary={model.textSecondary}
        isDark={model.isDark}
        projectPickerSearch={model.projectPickerSearch}
        onSearchChange={model.onSearchChange}
        pickerProjects={model.pickerProjects}
        pickerProjectsAll={model.pickerProjectsAll}
        projectPickerQuery={model.projectPickerQuery}
        onOpenProject={model.onOpenProject}
      />
    )
  }

  if (model.phase === 'board_error') {
    return (
      <PageShell
        title="Доска проекта"
        description="Не удалось загрузить данные доски."
        className={model.pageBg}
        actions={
          <button
            type="button"
            onClick={model.onRetry}
            className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
          >
            Повторить
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-black/10 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-[#273142]">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className={`text-lg font-bold ${model.textPrimary}`}>Ошибка загрузки</p>
          <p className={`max-w-xl text-sm ${model.textSecondary}`}>
            {model.error instanceof Error
              ? model.error.message
              : 'Не удалось получить данные доски. Попробуйте обновить страницу.'}
          </p>
        </div>
      </PageShell>
    )
  }

  if (model.phase === 'board_pending') {
    return null
  }

  const { pageBg, shell, body } = model

  return (
    <PageShell
      title={body.projectBoardView.project.name}
      description={`Канбан-доска · ${body.projectBoardView.tasks.length} задач`}
      className={pageBg}
      actions={<BoardPageActions shell={shell} body={body} />}
    >
      <BoardPageLoadedBody body={body} />
    </PageShell>
  )
}
