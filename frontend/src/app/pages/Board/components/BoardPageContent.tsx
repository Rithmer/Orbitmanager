import { useBoardPageController } from '@/app/pages/Board/hooks/useBoardPageController'
import { BoardPageView } from '@/app/pages/Board/components/BoardPageView'

export function BoardPageContent() {
  const model = useBoardPageController()
  return <BoardPageView model={model} />
}
