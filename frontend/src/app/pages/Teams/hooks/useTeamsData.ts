import { useCallback, useEffect, useState } from 'react'
import { teamsApi } from '@/app/api/teams'
import { usersApi } from '@/app/api/users'
import type { Team, TeamMember, User } from '@/app/types'

export function useTeamsData() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<number, TeamMember[]>>({})
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [teamsRes, usersRes, membersMap] = await Promise.all([
        teamsApi.list({ limit: 100 }),
        usersApi.list({ limit: 100 }),
        teamsApi.getAllMembersBatch().catch(() => ({} as Record<number, TeamMember[]>),
        ),
      ])
      setTeams(teamsRes.items)
      setAllUsers(usersRes.items)
      setTeamMembers(membersMap)
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return { teams, teamMembers, allUsers, loading, error, loadData }
}
