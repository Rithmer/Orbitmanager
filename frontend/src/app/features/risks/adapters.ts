import type { RiskLevel } from '@/app/types'
import type { RisksProjectRiskResponse } from '@/app/api/risks'
import type { RisksProjectCard } from '@/app/features/risks/types'

export function adaptProjectRisksPayload(
  raw: RisksProjectRiskResponse | undefined,
  projectNamesById: Record<number, string>,
): RisksProjectCard[] {
  if (!raw) return []

  return Object.entries(raw).map(([projectIdStr, project]) => {
    const projectId = Number(projectIdStr)

    return {
      projectId,
      projectName: projectNamesById[projectId] ?? `Проект #${projectId}`,
      successProbability: project.successProbability,
      riskLevel: project.riskLevel as RiskLevel,
      riskFactors: project.riskFactors ?? [],
      taskInsights: (project.taskInsights ?? []).map((t) => ({
        taskId: t.taskId,
        taskName: t.taskName,
        predictedCompletionDate: t.predictedCompletionDate,
        delayProbability: t.delayProbability,
        riskLevel: t.riskLevel,
        riskFactors: t.riskFactors,
        recommendation: t.recommendation,
        taskSuccessProbability: t.taskSuccessProbability,
        coordinationPenalty: t.coordinationPenalty,
        assigneeBreakdown: t.assigneeBreakdown ?? [],
        recommendedAssignees: t.recommendedAssignees ?? [],
      })),
      recommendations: project.recommendations ?? [],
      predictionSource: project.predictionSource ?? 'stub',
    }
  })
}
