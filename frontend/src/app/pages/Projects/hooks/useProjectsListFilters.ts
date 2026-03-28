import { useState } from 'react'
import type { ProjectStatus } from '@/app/types'

export function useProjectsListFilters() {
  const [filterTeamId, setFilterTeamId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('')

  return { filterTeamId, setFilterTeamId, filterStatus, setFilterStatus }
}

export type ProjectsListFilters = ReturnType<typeof useProjectsListFilters>
