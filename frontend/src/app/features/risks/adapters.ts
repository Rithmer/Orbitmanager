import { RiskLevel } from '../../types'
import type {
  RiskAssigneeContribution,
  RiskFactor,
  RiskRecommendation,
  RisksProjectCard,
  RiskTaskInsight,
} from './types'

type RawProjectRisk = {
  riskScore?: number
  riskLevel?: RiskLevel
  summary?: string
  tasksAtRisk?: Array<{ taskId?: number; taskName?: string; delayProbability?: number }>
}

type RawTaskRisk = {
  predictedCompletionDate?: string
  delayProbability?: number
  riskLevel?: RiskLevel
  riskFactors?: string[]
  recommendation?: string
}

const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)))

function inferSeverity(text: string): RiskFactor['severity'] {
  const lowered = text.toLowerCase()
  if (lowered.includes('high') || lowered.includes('высок') || lowered.includes('крит')) return 'high'
  if (lowered.includes('low') || lowered.includes('низк')) return 'low'
  return 'medium'
}

function toRiskFactors(taskRisk?: RawTaskRisk): RiskFactor[] {
  const labels = taskRisk?.riskFactors ?? []
  return labels.map((label, index) => ({
    id: `factor-${index}`,
    label,
    severity: inferSeverity(label),
  }))
}

function toTaskInsight(taskId: number, taskName: string, taskRisk?: RawTaskRisk): RiskTaskInsight {
  const delayProbability = typeof taskRisk?.delayProbability === 'number' ? taskRisk.delayProbability : 0
  const delayPercent = clampPercent(delayProbability * 100)
  const success = clampPercent(100 - delayPercent)
  const severityWeight = taskRisk?.riskLevel === RiskLevel.HIGH ? 1 : taskRisk?.riskLevel === RiskLevel.MEDIUM ? 0.6 : 0.35
  const fallbackAssignees: RiskAssigneeContribution[] = [
    {
      userId: 0,
      userName: 'Команда задачи',
      impactScore: Math.max(-1, Number((1 - delayProbability * severityWeight).toFixed(2))),
      confidence: 0.5,
      note: 'Временная оценка до подключения ML-детализации исполнителей.',
    },
  ]

  return {
    taskId,
    taskName,
    taskSuccessProbability: success,
    coordinationPenalty: clampPercent(delayPercent * 0.45),
    assigneeBreakdown: fallbackAssignees,
    reason: taskRisk?.recommendation,
  }
}

function toRecommendations(taskInsights: RiskTaskInsight[]): RiskRecommendation[] {
  const highRiskTasks = taskInsights.filter((task) => task.taskSuccessProbability < 45)
  if (highRiskTasks.length === 0) {
    return []
  }

  return highRiskTasks.map((task) => ({
    id: `rec-${task.taskId}`,
    type: task.coordinationPenalty > 35 ? 'swap_members' : 'add_member',
    title:
      task.coordinationPenalty > 35
        ? `Перераспределить исполнителей для задачи «${task.taskName}»`
        : `Добавить исполнителя в задачу «${task.taskName}»`,
    reason:
      task.reason ??
      'Низкая вероятность выполнения в срок. Рекомендуется скорректировать состав исполнителей.',
  }))
}

export function adaptProjectRisksPayload(
  rawProjectRisks: Record<number, RawProjectRisk> | undefined,
  rawTaskRisksByProject: Record<number, Record<number, RawTaskRisk>>,
  projectNamesById: Record<number, string>,
): RisksProjectCard[] {
  if (!rawProjectRisks) return []

  return Object.entries(rawProjectRisks).map(([projectIdStr, projectRisk]) => {
    const projectId = Number(projectIdStr)
    const taskRisks = rawTaskRisksByProject[projectId] ?? {}
    const rawTasksAtRisk = projectRisk.tasksAtRisk ?? []

    const taskInsights = rawTasksAtRisk.map((task) => {
      const taskId = task.taskId ?? 0
      return toTaskInsight(taskId, task.taskName ?? `Задача #${taskId}`, taskRisks[taskId])
    })

    const topFactors = taskInsights.flatMap((task) => toRiskFactors(taskRisks[task.taskId])).slice(0, 5)
    const recommendations = toRecommendations(taskInsights)
    const riskScore = typeof projectRisk.riskScore === 'number' ? projectRisk.riskScore : 0

    return {
      projectId,
      projectName: projectNamesById[projectId] ?? `Проект #${projectId}`,
      successProbability: clampPercent(100 - riskScore),
      riskLevel: projectRisk.riskLevel ?? RiskLevel.LOW,
      riskFactors: topFactors,
      taskInsights,
      recommendations,
    }
  })
}
