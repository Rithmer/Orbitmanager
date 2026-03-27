import { ArrowLeft, LoaderCircle, Trash2, UserPlus } from 'lucide-react'
import { ErrorMessage, Modal, SelectField, SubmitButton } from '@/app/components/Modal'
import { PageRefreshOverlay } from '@/app/components/PageShell'
import { ProjectRole, PROJECT_ROLE_LABELS } from '@/app/types'
import type { ProjectsPageViewModel } from '@/app/pages/Projects/hooks/useProjectsPageController'

type ProjectsMembersModalProps = {
  vm: ProjectsPageViewModel
}

export function ProjectsMembersModal({ vm }: ProjectsMembersModalProps) {
  const { members, shell } = vm
  const { theme } = shell
  const {
    showMembersModal,
    closeMembersModal,
    membersStep,
    goToMembersAddStep,
    backToMembersListStep,
    selectedProject,
    projectMembersQuery,
    projectMembersLoading,
    projectMembersError,
    selectedProjectMembers,
    pendingRemoveMemberId,
    projectMemberNames,
    handleRemoveProjectMember,
    formError,
    memberUserId,
    setMemberUserId,
    memberRole,
    setMemberRole,
    formLoading,
    memberUsersError,
    projectTeamMembersError,
    memberUsersLoading,
    projectTeamMembersLoading,
    noAvailableProjectMemberOptions,
    availableProjectMemberOptions,
    projectMemberUsersQuery,
    handleAddProjectMember,
  } = members

  const modalTitle =
    membersStep === 'add'
      ? 'Добавить в проект'
      : `Участники: ${selectedProject?.name || ''}`

  return (
    <Modal open={showMembersModal} onClose={closeMembersModal} title={modalTitle}>
      {selectedProject && membersStep === 'list' ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={goToMembersAddStep}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#4880ff] hover:underline"
          >
            <UserPlus className="h-4 w-4" />
            Добавить участника
          </button>

          {projectMembersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`project-member-skeleton-${index}`}
                  className="h-12 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5"
                />
              ))}
            </div>
          ) : projectMembersError && !projectMembersQuery.data ? (
            <div className="space-y-3">
              <ErrorMessage message={projectMembersError} />
              <button
                type="button"
                onClick={() => void projectMembersQuery.refetch()}
                className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
              >
                Повторить
              </button>
            </div>
          ) : selectedProjectMembers.length > 0 ? (
            <PageRefreshOverlay
              show={projectMembersQuery.isFetching && !!projectMembersQuery.data}
              label="Обновление участников"
            >
              <div className="space-y-0.5">
                {selectedProjectMembers.map((member) => {
                  const isMemberRemoving = pendingRemoveMemberId === member.id

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between border-b py-2 last:border-0 ${theme.dividerColor}`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                          {projectMemberNames.get(member.userId) || `#${member.userId}`}
                        </p>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {PROJECT_ROLE_LABELS[member.role as ProjectRole] || member.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveProjectMember(member.id)}
                        disabled={isMemberRemoving}
                        className="rounded p-1 text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isMemberRemoving ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </PageRefreshOverlay>
          ) : (
            <p className={`py-4 text-center text-sm ${theme.textSecondary}`}>Участников пока нет</p>
          )}
        </div>
      ) : null}

      {selectedProject && membersStep === 'add' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={backToMembersListStep}
            className={`mb-2 flex items-center gap-2 text-sm font-semibold text-[#4880ff] hover:underline`}
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к списку
          </button>
          <ErrorMessage message={formError} />
          {memberUsersError || projectTeamMembersError ? (
            <div className="mb-4 space-y-3">
              <ErrorMessage message={memberUsersError || projectTeamMembersError} />
              <button
                type="button"
                onClick={() => void projectMemberUsersQuery.refetch()}
                className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
              >
                Повторить
              </button>
            </div>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleAddProjectMember()
            }}
            className="space-y-4"
          >
            <SelectField
              label="Пользователь"
              value={memberUserId}
              onChange={setMemberUserId}
              required
              disabled={Boolean(
                memberUsersLoading ||
                  projectTeamMembersLoading ||
                  memberUsersError ||
                  projectTeamMembersError ||
                  noAvailableProjectMemberOptions ||
                  formLoading,
              )}
              hint={
                memberUsersError || projectTeamMembersError
                  ? 'Не удалось загрузить список пользователей.'
                  : memberUsersLoading || projectTeamMembersLoading
                    ? 'Подбираем подходящих пользователей...'
                    : noAvailableProjectMemberOptions
                      ? 'Все подходящие участники уже добавлены.'
                      : 'Можно добавить только участников команды.'
              }
              options={[
                {
                  value: '',
                  label:
                    memberUsersLoading || projectTeamMembersLoading
                      ? 'Загрузка...'
                      : memberUsersError || projectTeamMembersError
                        ? 'Источник недоступен'
                        : noAvailableProjectMemberOptions
                          ? 'Нет доступных пользователей'
                          : 'Выберите...',
                },
                ...availableProjectMemberOptions.map((user) => ({
                  value: String(user.id),
                  label: `${user.fullName} (${user.login})`,
                })),
              ]}
            />
            <SelectField
              label="Роль в проекте"
              value={memberRole}
              onChange={(value) => setMemberRole(value as ProjectRole)}
              hint="Роль задаётся только для этого проекта."
              options={Object.entries(PROJECT_ROLE_LABELS)
                .filter(([value]) => value !== ProjectRole.TEAM_LEAD)
                .map(([value, label]) => ({
                  value,
                  label,
                }))}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={backToMembersListStep}
                className={`px-4 py-2 text-sm font-semibold ${theme.textSecondary}`}
              >
                Отмена
              </button>
              <SubmitButton
                loading={formLoading}
                disabled={Boolean(
                  memberUsersLoading ||
                    projectTeamMembersLoading ||
                    memberUsersError ||
                    projectTeamMembersError ||
                    noAvailableProjectMemberOptions,
                )}
                className="min-w-28"
              >
                Добавить
              </SubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </Modal>
  )
}
