import { Navigate } from 'react-router'
import { useAdminPageController } from '@/app/pages/Admin/hooks/useAdminPageController'
import { AdminPageView } from '@/app/pages/Admin/components/AdminPageView'

export function AdminPageContent() {
  const model = useAdminPageController()

  if (!model.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <AdminPageView model={model} />
}
