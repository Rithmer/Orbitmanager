import { RiskAssigneeScoringService } from './risk-assignee-scoring.service';
import type { TaskRiskOutput } from '@/domain/services/risk-assessment.interface';
import type {
  ProjectMemberRecord,
  TaskRecord,
} from './risk-page-read-model.service';

describe('RiskAssigneeScoringService', () => {
  let service: RiskAssigneeScoringService;

  beforeEach(() => {
    service = new RiskAssigneeScoringService();
  });

  const makeTask = (overrides: Partial<TaskRecord> = {}): TaskRecord => ({
    id: 1,
    projectId: 10,
    name: 'Test task',
    status: 'in_progress',
    difficulty: 3,
    deadline: new Date('2026-04-10'),
    createdAt: new Date('2026-03-01'),
    assigneeIds: [100, 101],
    ...overrides,
  });

  const makePrediction = (
    overrides: Partial<TaskRiskOutput> = {},
  ): TaskRiskOutput => ({
    predictedCompletionDate: '2026-04-12T00:00:00.000Z',
    delayProbability: 0.5,
    riskLevel: 'medium',
    riskFactors: ['Близкий дедлайн'],
    recommendation: 'Контролируйте ход выполнения.',
    ...overrides,
  });

  const makeMembers = (): ProjectMemberRecord[] => [
    {
      userId: 100,
      role: 'developer',
      fullName: 'Alice',
      profession: 'Backend',
      accountStatus: 'active',
    },
    {
      userId: 101,
      role: 'team_lead',
      fullName: 'Bob',
      profession: 'Lead',
      accountStatus: 'active',
    },
    {
      userId: 102,
      role: 'developer',
      fullName: 'Charlie',
      profession: 'Frontend',
      accountStatus: 'active',
    },
    {
      userId: 103,
      role: 'observer',
      fullName: 'Diana',
      profession: 'PM',
      accountStatus: 'active',
    },
    {
      userId: 104,
      role: 'developer',
      fullName: 'Eve',
      profession: 'Backend',
      accountStatus: 'blocked',
    },
  ];

  describe('buildAssigneeBreakdown', () => {
    it('returns breakdown only for current assignees', () => {
      const task = makeTask();
      const result = service.buildAssigneeBreakdown(
        task,
        makePrediction(),
        makeMembers(),
        new Map([
          [100, 3],
          [101, 2],
        ]),
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.userId).sort()).toEqual([100, 101]);
    });

    it('returns empty for unassigned task', () => {
      const task = makeTask({ assigneeIds: [] });
      const result = service.buildAssigneeBreakdown(
        task,
        makePrediction(),
        makeMembers(),
        new Map(),
      );
      expect(result).toHaveLength(0);
    });

    it('applies overload penalty for high-load risk factor', () => {
      const prediction = makePrediction({
        riskFactors: ['Высокая нагрузка на исполнителей'],
      });
      const result = service.buildAssigneeBreakdown(
        makeTask(),
        prediction,
        makeMembers(),
        new Map([
          [100, 5],
          [101, 1],
        ]),
      );

      const alice = result.find((r) => r.userId === 100)!;
      expect(alice.impactScore).toBeLessThan(0);
    });

    it('clamps impactScore between -1 and 1', () => {
      const prediction = makePrediction({
        riskFactors: ['Высокая нагрузка на исполнителей'],
      });
      const result = service.buildAssigneeBreakdown(
        makeTask(),
        prediction,
        makeMembers(),
        new Map([
          [100, 20],
          [101, 20],
        ]),
      );

      for (const item of result) {
        expect(item.impactScore).toBeGreaterThanOrEqual(-1);
        expect(item.impactScore).toBeLessThanOrEqual(1);
      }
    });

    it('sets confidence between 0.55 and 0.90', () => {
      const result = service.buildAssigneeBreakdown(
        makeTask(),
        makePrediction(),
        makeMembers(),
        new Map([
          [100, 1],
          [101, 1],
        ]),
      );

      for (const item of result) {
        expect(item.confidence).toBeGreaterThanOrEqual(0.55);
        expect(item.confidence).toBeLessThanOrEqual(0.9);
      }
    });
  });

  describe('buildRecommendedAssignees', () => {
    it('returns at most 5 candidates', () => {
      const result = service.buildRecommendedAssignees(
        makeTask(),
        makePrediction(),
        makeMembers(),
        new Map([
          [100, 3],
          [101, 2],
          [102, 1],
          [103, 0],
        ]),
      );
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('excludes blocked users', () => {
      const result = service.buildRecommendedAssignees(
        makeTask(),
        makePrediction(),
        makeMembers(),
        new Map(),
      );
      const userIds = result.map((r) => r.userId);
      expect(userIds).not.toContain(104);
    });

    it('sorts by fitScore descending', () => {
      const result = service.buildRecommendedAssignees(
        makeTask(),
        makePrediction(),
        makeMembers(),
        new Map([
          [100, 1],
          [101, 1],
          [102, 0],
        ]),
      );

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].fitScore).toBeGreaterThanOrEqual(
          result[i].fitScore,
        );
      }
    });

    it('gives assignment continuity bonus to current assignees', () => {
      const task = makeTask({ assigneeIds: [100] });
      const result = service.buildRecommendedAssignees(
        task,
        makePrediction(),
        makeMembers(),
        new Map([
          [100, 1],
          [102, 1],
        ]),
      );

      const alice = result.find((r) => r.userId === 100);
      const charlie = result.find((r) => r.userId === 102);
      if (alice && charlie) {
        expect(alice.fitScore).toBeGreaterThanOrEqual(charlie.fitScore);
      }
    });

    it('gives unassigned bonus to developers and leads', () => {
      const task = makeTask({ assigneeIds: [] });
      const result = service.buildRecommendedAssignees(
        task,
        makePrediction(),
        makeMembers(),
        new Map(),
      );

      const developers = result.filter(
        (r) => r.role === 'developer' || r.role === 'team_lead',
      );
      const observers = result.filter((r) => r.role === 'observer');

      if (developers.length > 0 && observers.length > 0) {
        expect(developers[0].fitScore).toBeGreaterThan(observers[0].fitScore);
      }
    });

    it('clamps fitScore between -1 and 1', () => {
      const result = service.buildRecommendedAssignees(
        makeTask(),
        makePrediction(),
        makeMembers(),
        new Map(),
      );

      for (const item of result) {
        expect(item.fitScore).toBeGreaterThanOrEqual(-1);
        expect(item.fitScore).toBeLessThanOrEqual(1);
      }
    });
  });
});
