import { describe, expect, it } from 'vitest'
import { adaptProjectRisksPayload } from '../adapters'
import { RiskLevel } from '../../../types'

describe('risk adapters', () => {
  it('adapts backend payload to frontend cards', () => {
    const data = adaptProjectRisksPayload(
      {
        42: {
          riskScore: 35,
          riskLevel: RiskLevel.MEDIUM,
          tasksAtRisk: [{ taskId: 1001, taskName: 'Implement auth', delayProbability: 0.41 }],
          summary: 'Risk summary',
        },
      },
      {
        42: {
          1001: {
            predictedCompletionDate: '2026-04-01T10:00:00.000Z',
            delayProbability: 0.41,
            riskLevel: RiskLevel.MEDIUM,
            riskFactors: ['Deadline pressure'],
            recommendation: 'Add one more backend engineer',
          },
        },
      },
      { 42: 'Apollo' },
    )

    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe(42)
    expect(data[0].projectName).toBe('Apollo')
    expect(data[0].successProbability).toBe(65)
    expect(data[0].taskInsights[0].taskSuccessProbability).toBe(59)
    expect(data[0].taskInsights[0].assigneeBreakdown.length).toBeGreaterThan(0)
  })
})
