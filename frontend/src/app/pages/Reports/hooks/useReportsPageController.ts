import { useNavigate } from 'react-router'
import { useReportsPageModel } from '@/app/pages/Reports/hooks/useReportsPageModel'

export function useReportsPageController() {
  const navigate = useNavigate()
  const model = useReportsPageModel()
  return {
    model,
    onNavigateToBoard: (projectId: number) => navigate(`/board/${projectId}`),
  }
}
