import { describe, expect, it } from 'vitest'
import { adaptProjectRisksPayload } from '@/app/features/risks/adapters'
import { RiskLevel } from '@/app/types'

describe('risk adapters', () => {
  it('adapts backend payload to frontend cards with all server-provided fields', () => {
    const data = adaptProjectRisksPayload(
      {
        42: {
          riskScore: 35,
          riskLevel: RiskLevel.MEDIUM,
          tasksAtRisk: [{ taskId: 1001, taskName: 'Implement auth', delayProbability: 0.41 }],
          summary: 'Risk summary',
          predictionSource: 'ml',
          successProbability: 65,
          riskFactors: [{ id: 'f-0', label: 'Deadline pressure', severity: 'medium' }],
          taskInsights: [
            {
              taskId: 1001,
              taskName: 'Implement auth',
              predictedCompletionDate: '2026-04-01T10:00:00.000Z',
              delayProbability: 0.41,
              riskLevel: RiskLevel.MEDIUM,
              riskFactors: ['Deadline pressure'],
              recommendation: 'Add one more backend engineer',
              taskSuccessProbability: 59,
              coordinationPenalty: 12,
              assigneeBreakdown: [
                { userId: 7, userName: 'Jane Doe', impactScore: 0.72, confidence: 0.91, note: 'Primary owner' },
              ],
              recommendedAssignees: [
                { userId: 9, fullName: 'Alex Doe', profession: 'Backend Developer', role: 'developer', fitScore: 0.81, reason: 'Has available capacity' },
              ],
            },
          ],
          recommendations: [
            { id: 'rec-1', type: 'add_member', title: 'Add backend help', reason: 'Deadline pressure is high', taskId: 1001 },
          ],
        },
      },
      { 42: 'Apollo' },
    )

    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe(42)
    expect(data[0].projectName).toBe('Apollo')
    expect(data[0].predictionSource).toBe('ml')
    expect(data[0].successProbability).toBe(65)
    expect(data[0].riskLevel).toBe(RiskLevel.MEDIUM)
    expect(data[0].riskFactors[0].label).toBe('Deadline pressure')
    expect(data[0].taskInsights).toHaveLength(1)
    expect(data[0].taskInsights[0].taskSuccessProbability).toBe(59)
    expect(data[0].taskInsights[0].coordinationPenalty).toBe(12)
    expect(data[0].taskInsights[0].assigneeBreakdown).toHaveLength(1)
    expect(data[0].taskInsights[0].recommendedAssignees).toHaveLength(1)
    expect(data[0].recommendations).toHaveLength(1)
    expect(data[0].recommendations[0].type).toBe('add_member')
  })

  it('returns empty array for undefined input', () => {
    expect(adaptProjectRisksPayload(undefined, {})).toEqual([])
  })

  it('does not compute successProbability client-side', () => {
    const data = adaptProjectRisksPayload(
      {
        1: {
          riskScore: 40,
          riskLevel: RiskLevel.MEDIUM,
          tasksAtRisk: [],
          summary: 'Test',
          predictionSource: 'stub',
          successProbability: 60,
          riskFactors: [],
          taskInsights: [],
          recommendations: [],
        },
      },
      { 1: 'P1' },
    )

    expect(data[0].successProbability).toBe(60)
  })
})
