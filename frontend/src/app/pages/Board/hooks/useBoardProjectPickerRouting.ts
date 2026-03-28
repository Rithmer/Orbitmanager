import { useEffect } from 'react'
import { clearLastBoardProjectId, persistLastBoardProjectId, readLastBoardProjectId } from '@/app/utils/lastBoardProjectStorage'

type PickerProject = { id: number }

type UseBoardProjectPickerRoutingParams = {
  forceProjectPicker: boolean
  hasProjectId: boolean
  pickerProjectsAll: PickerProject[]
  projectId: number
  projectPickerLoaded: boolean
  navigateToProject: (projectId: number) => void
}

export function useBoardProjectPickerRouting({
  forceProjectPicker,
  hasProjectId,
  pickerProjectsAll,
  projectId,
  projectPickerLoaded,
  navigateToProject,
}: UseBoardProjectPickerRoutingParams) {
  useEffect(() => {
    if (!hasProjectId) {
      return
    }

    persistLastBoardProjectId(projectId)
  }, [hasProjectId, projectId])

  useEffect(() => {
    if (hasProjectId || forceProjectPicker || !projectPickerLoaded) {
      return
    }

    const accessibleIds = new Set(pickerProjectsAll.map((project) => project.id))
    const lastProjectId = readLastBoardProjectId()

    if (lastProjectId && !accessibleIds.has(lastProjectId)) {
      clearLastBoardProjectId()
    }

    if (lastProjectId && accessibleIds.has(lastProjectId)) {
      navigateToProject(lastProjectId)
    }
  }, [forceProjectPicker, hasProjectId, navigateToProject, pickerProjectsAll, projectPickerLoaded])
}
