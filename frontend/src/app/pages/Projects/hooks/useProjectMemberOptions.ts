import { useMemo } from 'react'

type UserOption = {
  id: number
  fullName: string
  login: string
}

type TeamMember = {
  userId: number
}

type ProjectMember = {
  userId: number
}

type UseProjectMemberOptionsParams = {
  memberUsers: UserOption[]
  projectMembers: ProjectMember[]
  teamMembers: TeamMember[]
}

export function useProjectMemberOptions({
  memberUsers,
  projectMembers,
  teamMembers,
}: UseProjectMemberOptionsParams) {
  const projectMemberNames = useMemo(() => {
    const names = new Map<number, string>()

    for (const user of memberUsers) {
      names.set(user.id, user.fullName)
    }

    return names
  }, [memberUsers])

  const availableProjectMemberOptions = useMemo(() => {
    const teamMemberIds = new Set(teamMembers.map((member) => member.userId))
    const projectMemberIds = new Set(projectMembers.map((member) => member.userId))
    return memberUsers.filter((user) => teamMemberIds.has(user.id) && !projectMemberIds.has(user.id))
  }, [memberUsers, projectMembers, teamMembers])

  return {
    availableProjectMemberOptions,
    projectMemberNames,
  }
}
