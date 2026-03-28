/**
 * Shared risk assessment constants (audit M1).
 *
 * Single source of truth for risk thresholds and summary templates
 * used across RiskStubService, RiskPageProjectionService, and DashboardService.
 */

/** Tasks with delay probability above this are considered "at risk". */
export const RISK_THRESHOLD_AT_RISK = 0.3;

/** Tasks with delay probability above this are considered "high risk". */
export const RISK_THRESHOLD_HIGH = 0.6;

export function getRiskLevel(probability: number): 'low' | 'medium' | 'high' {
  if (probability > RISK_THRESHOLD_HIGH) return 'high';
  if (probability > RISK_THRESHOLD_AT_RISK) return 'medium';
  return 'low';
}

export function buildProjectRiskSummary(
  riskLevel: 'low' | 'medium' | 'high',
  riskScore: number,
  totalActive: number,
  atRiskCount: number,
  highRiskCount: number,
): string {
  if (riskLevel === 'low') {
    return `Проект в зелёной зоне (${riskScore}/100). Из ${totalActive} активных задач нет задач с высоким риском.`;
  }
  if (riskLevel === 'medium') {
    return `Проект имеет средний уровень риска (${riskScore}/100). ${atRiskCount} из ${totalActive} активных задач требуют внимания.`;
  }
  return `Проект имеет высокий риск срыва сроков (${riskScore}/100): ${highRiskCount} задач с вероятностью задержки > 60%.`;
}

export const EMPTY_PROJECT_SUMMARY =
  'В проекте нет активных задач. Риски отсутствуют.';
