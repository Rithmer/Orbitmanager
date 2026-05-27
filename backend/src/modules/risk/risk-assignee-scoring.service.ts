import { Injectable } from '@nestjs/common';
import type { TaskRiskOutput } from '@/domain/services/risk-assessment.interface';
import type {
  ProjectMemberRecord,
  TaskRecord,
} from './risk-page-read-model.service';
import type {
  AssigneeBreakdownDto,
  RecommendedAssigneeDto,
} from './dto/risk-page.types';

const ROLE_WEIGHTS: Record<string, number> = {
  developer: 0.3,
  team_lead: 0.2,
  observer: -0.1,
};

@Injectable()
export class RiskAssigneeScoringService {
  buildAssigneeBreakdown(
    task: TaskRecord,
    prediction: TaskRiskOutput,
    members: ProjectMemberRecord[],
    activeTaskCountByUser: Map<number, number>,
  ): AssigneeBreakdownDto[] {
    if (task.assigneeIds.length === 0) return [];

    const memberMap = new Map(members.map((m) => [m.userId, m]));
    const riskFactorsLower = prediction.riskFactors.map((f) => f.toLowerCase());

    return task.assigneeIds.map((uid) => {
      const member = memberMap.get(uid);
      const userName = member?.fullName ?? `Пользователь #${uid}`;
      const role = member?.role ?? 'developer';
      const activeCount = activeTaskCountByUser.get(uid) ?? 0;

      let impactScore = ROLE_WEIGHTS[role] ?? 0;
      const loadPenalty = Math.min(0.4, activeCount * 0.05);
      impactScore -= loadPenalty;

      const hasHighLoad = riskFactorsLower.some(
        (f) => f.includes('нагрузк') || f.includes('load'),
      );
      if (hasHighLoad) impactScore -= 0.25;

      impactScore = clamp(impactScore, -1, 1);

      let matchedRules = 0;
      if (role === 'developer') matchedRules++;
      if (role === 'team_lead') matchedRules++;
      if (hasHighLoad) matchedRules++;
      const confidence = clamp(0.55 + 0.1 * matchedRules, 0.55, 0.9);

      const note = this.buildAssigneeNote(role, activeCount, hasHighLoad);

      return {
        userId: uid,
        userName,
        impactScore: round2(impactScore),
        confidence: round2(confidence),
        note,
      };
    });
  }

  buildRecommendedAssignees(
    task: TaskRecord,
    prediction: TaskRiskOutput,
    projectMembers: ProjectMemberRecord[],
    activeTaskCountByUser: Map<number, number>,
  ): RecommendedAssigneeDto[] {
    const riskFactorsLower = prediction.riskFactors.map((f) => f.toLowerCase());
    const hasHighLoad = riskFactorsLower.some(
      (f) => f.includes('нагрузк') || f.includes('load'),
    );
    const hasCloseDeadline = riskFactorsLower.some(
      (f) =>
        f.includes('дедлайн') || f.includes('deadline') || f.includes('близк'),
    );
    const hasStatusInstability = riskFactorsLower.some(
      (f) =>
        f.includes('статус') ||
        f.includes('status') ||
        f.includes('нестабильн'),
    );
    const isUnassigned = task.assigneeIds.length === 0;

    const candidates = projectMembers
      .filter((m) => m.accountStatus !== 'blocked')
      .map((m) => {
        const role = m.role;
        const activeCount = activeTaskCountByUser.get(m.userId) ?? 0;
        const isCurrentAssignee = task.assigneeIds.includes(m.userId);

        const roleWeight = ROLE_WEIGHTS[role] ?? 0;
        const loadPenalty = Math.min(0.4, activeCount * 0.05);
        let bonuses = 0;
        let matchedRuleCount = 0;

        if (isCurrentAssignee) {
          bonuses += 0.15;
          matchedRuleCount++;
        }

        if (hasHighLoad && activeCount <= 1) {
          bonuses += 0.15;
          matchedRuleCount++;
        }

        if (
          (hasCloseDeadline || hasStatusInstability) &&
          role === 'team_lead'
        ) {
          bonuses += 0.1;
          matchedRuleCount++;
        }

        if (isUnassigned && (role === 'developer' || role === 'team_lead')) {
          bonuses += 0.1;
          matchedRuleCount++;
        }

        if (isCurrentAssignee && hasHighLoad) {
          bonuses -= 0.25;
          matchedRuleCount++;
        }

        const fitScore = clamp(roleWeight - loadPenalty + bonuses, -1, 1);
        const confidence = clamp(0.55 + 0.1 * matchedRuleCount, 0.55, 0.9);

        const reason = this.buildRecommendationReason(
          role,
          activeCount,
          isCurrentAssignee,
          hasHighLoad,
          hasCloseDeadline,
          isUnassigned,
        );

        return {
          userId: m.userId,
          fullName: m.fullName,
          profession: m.profession,
          role,
          fitScore: round2(fitScore),
          reason,
          confidence,
        };
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 5);

    return candidates.map(({ confidence: _, ...rest }) => rest);
  }

  private buildAssigneeNote(
    role: string,
    activeCount: number,
    hasHighLoad: boolean,
  ): string {
    if (hasHighLoad && activeCount > 3) {
      return 'Высокая нагрузка — рекомендуется перераспределить задачи.';
    }
    if (role === 'team_lead') {
      return 'Тимлид проекта — координация и контроль исполнения.';
    }
    if (role === 'developer') {
      return 'Разработчик — основной исполнитель задачи.';
    }
    return 'Участник проекта.';
  }

  private buildRecommendationReason(
    role: string,
    activeCount: number,
    isCurrentAssignee: boolean,
    hasHighLoad: boolean,
    hasCloseDeadline: boolean,
    isUnassigned: boolean,
  ): string {
    if (isUnassigned && (role === 'developer' || role === 'team_lead')) {
      return 'Задача без исполнителей — подходящий кандидат по роли.';
    }
    if (isCurrentAssignee && hasHighLoad) {
      return 'Текущий исполнитель с высокой нагрузкой — рассмотреть перераспределение.';
    }
    if (hasCloseDeadline && role === 'team_lead') {
      return 'Близкий дедлайн — координация тимлида может ускорить завершение.';
    }
    if (activeCount <= 1 && role === 'developer') {
      return 'Низкая нагрузка — может взять дополнительную задачу.';
    }
    if (isCurrentAssignee) {
      return 'Уже назначен на задачу — знаком с контекстом.';
    }
    return role === 'developer'
      ? 'Подходит по проектной роли для исполнения задачи.'
      : 'Можно привлечь как дополнительного участника.';
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
