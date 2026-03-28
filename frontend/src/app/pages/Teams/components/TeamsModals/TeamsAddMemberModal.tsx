import { ErrorMessage, InputField, Modal } from '@/app/components/Modal'
import { TeamRole } from '@/app/types'
import type { TeamsAddMemberModalProps } from '@/app/pages/Teams/types'

export function TeamsAddMemberModal({ model }: TeamsAddMemberModalProps) {
  const { memberModal, teamForm, handlers, ui, isDark, candidateUsers } = model
  const { formError } = teamForm
  const {
    showAddMemberModal,
    setShowAddMemberModal,
    addMemberSearch,
    setAddMemberSearch,
    memberRole,
    setMemberRole,
  } = memberModal
  const { handleAddMember } = handlers

  return (
    <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Добавить участника">
      <ErrorMessage message={formError} />
      <div className="space-y-3">
        <InputField
          label="Поиск"
          value={addMemberSearch}
          onChange={setAddMemberSearch}
          placeholder="Логин или ФИО"
          required={false}
        />
        <select
          value={memberRole}
          onChange={(e) => setMemberRole(e.target.value as TeamRole)}
          className={`w-full px-3 py-2 rounded-lg border text-sm ${ui.inputBg}`}
        >
          <option value={TeamRole.MEMBER}>Участник</option>
          <option value={TeamRole.OBSERVER}>Наблюдатель</option>
        </select>
        <div className={`max-h-56 overflow-y-auto rounded-lg border ${ui.cardBorder} ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
          {candidateUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => void handleAddMember(u.id)}
              className={`w-full text-left px-3 py-2 text-sm ${isDark ? 'hover:bg-[#273142]' : 'hover:bg-white'}`}
            >
              <div className={`font-semibold ${ui.textPrimary}`}>{u.login}</div>
              <div className={`text-xs ${ui.textSecondary}`}>{u.fullName}</div>
            </button>
          ))}
          {candidateUsers.length === 0 ? <p className={`text-xs p-3 ${ui.textSecondary}`}>Нет пользователей</p> : null}
        </div>
      </div>
    </Modal>
  )
}
