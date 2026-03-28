import { ErrorMessage, InputField, Modal } from '@/app/components/Modal'
import { TeamRole } from '@/app/types'
import type { TeamsAddMemberModalProps } from '@/app/pages/Teams/types'

export function TeamsAddMemberModal({ vm }: TeamsAddMemberModalProps) {
  const {
    showAddMemberModal,
    setShowAddMemberModal,
    formError,
    addMemberSearch,
    setAddMemberSearch,
    memberRole,
    setMemberRole,
    candidateUsers,
    handleAddMember,
    tokens,
    isDark,
  } = vm

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
          className={`w-full px-3 py-2 rounded-lg border text-sm ${tokens.inputBg}`}
        >
          <option value={TeamRole.MEMBER}>Участник</option>
          <option value={TeamRole.OBSERVER}>Наблюдатель</option>
        </select>
        <div className={`max-h-56 overflow-y-auto rounded-lg border ${tokens.cardBorder} ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
          {candidateUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => void handleAddMember(u.id)}
              className={`w-full text-left px-3 py-2 text-sm ${isDark ? 'hover:bg-[#273142]' : 'hover:bg-white'}`}
            >
              <div className={`font-semibold ${tokens.textPrimary}`}>{u.login}</div>
              <div className={`text-xs ${tokens.textSecondary}`}>{u.fullName}</div>
            </button>
          ))}
          {candidateUsers.length === 0 ? <p className={`text-xs p-3 ${tokens.textSecondary}`}>Нет пользователей</p> : null}
        </div>
      </div>
    </Modal>
  )
}
