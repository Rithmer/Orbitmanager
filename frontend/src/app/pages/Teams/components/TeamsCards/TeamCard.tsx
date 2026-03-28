import { CheckCircle2, Crown, Eye, MoreVertical, Trash2, UserPlus, Users } from 'lucide-react'
import { TEAM_ROLE_LABELS, TeamRole } from '@/app/types'
import type { TeamCardProps } from '@/app/pages/Teams/types'

export function TeamCard(props: TeamCardProps) {
  const {
    team, members, idx, isDark, cardBg, cardBorder, textPrimary, textSecondary, dividerColor, avatarBg, color, textColor, lightBg, openMenuId, canManage, currentUserId,
    getUserName, getUserRole, onToggleMenu, onEdit, onAddMember, onDelete,
  } = props

  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl p-6 card-hover transition-all duration-200 stagger-row`} style={{ animationDelay: `${idx * 80}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>{team.name.charAt(0)}</div>
          <div className="min-w-0">
            <h3 className={`font-bold truncate ${textPrimary}`}>{team.name}</h3>
            {team.description ? <p className={`text-xs mt-0.5 line-clamp-2 ${textSecondary}`}>{team.description}</p> : null}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => onToggleMenu(team.id)} className={`p-1 rounded ${isDark ? 'text-[#94a3b8] hover:text-[#f4f3f2]' : 'text-gray-400 hover:text-gray-600'}`}><MoreVertical className="w-4 h-4" /></button>
          {openMenuId === team.id ? (
            <div className={`absolute right-0 top-8 z-[80] w-48 rounded-xl shadow-xl border overflow-hidden ${isDark ? 'bg-[#273142] border-[#313d4f]' : 'bg-white border-[#e8e8e8]'}`}>
              {canManage ? (
                <>
                  <button onClick={() => onEdit(team)} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${textPrimary}`}>Редактировать</button>
                  <button onClick={() => onAddMember(team.id)} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${textPrimary}`}><UserPlus className="w-4 h-4" /> Добавить участника</button>
                  <button onClick={() => onDelete(team.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500"><Trash2 className="w-4 h-4" /> Удалить</button>
                </>
              ) : <div className={`px-4 py-2.5 text-xs ${textSecondary}`}>Только владелец может управлять</div>}
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`${lightBg} rounded-lg px-3 py-2 flex items-center gap-2`}>
          <Users className={`w-4 h-4 ${textColor}`} />
          <div><div className={`text-sm font-bold ${textColor}`}>{members.length}</div><div className={`text-xs ${textSecondary}`}>Участников</div></div>
        </div>
        <div className={`${lightBg} rounded-lg px-3 py-2 flex items-center gap-2`}>
          <CheckCircle2 className={`w-4 h-4 ${textColor}`} />
          <div><div className={`text-sm font-bold ${textColor}`}>{new Date(team.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div><div className={`text-xs ${textSecondary}`}>Создана</div></div>
        </div>
      </div>
      <div className={`border-t ${dividerColor} pt-4`}>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textSecondary}`}>Участники</p>
        <div className="space-y-2.5">
          {members.slice(0, 5).map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={`w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-xs font-bold ${textSecondary}`}>{getUserName(member.userId).charAt(0)}</div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold flex items-center gap-1 ${textPrimary}`}>
                    <span className="truncate">{getUserName(member.userId)}</span>
                    {member.teamRole === TeamRole.OWNER ? <Crown className="w-3 h-3 text-amber-500" /> : null}
                    {member.teamRole === TeamRole.OBSERVER ? <Eye className="w-3 h-3 text-purple-500" /> : null}
                  </div>
                  <div className={`text-xs ${textSecondary} truncate`}>
                    {TEAM_ROLE_LABELS[member.teamRole as TeamRole] || member.teamRole}
                    {getUserRole(member.userId) ? ` · ${getUserRole(member.userId)}` : ''}
                    {member.userId === currentUserId ? ' · вы' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
