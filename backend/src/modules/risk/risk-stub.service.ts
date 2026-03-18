import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type {
  TaskRiskInput,
  TaskRiskOutput,
  ProjectRiskOutput,
} from './risk.types';
import { buildTaskRiskInput } from './helpers/build-task-risk-input';

@Injectable()
export class RiskStubService {
  constructor(private readonly prisma: PrismaService) {}

  async assessTask(input: TaskRiskInput): Promise<TaskRiskOutput> {
    const { delayProbability, riskFactors } = this.calculateTaskRisk(input);
    const riskLevel = this.getRiskLevel(delayProbability);

    const predictedCompletionDate = this.predictCompletionDate(input);
    const recommendation = this.generateRecommendation(riskFactors, riskLevel);

    return {
      predictedCompletionDate,
      delayProbability: Math.round(delayProbability * 100) / 100,
      riskLevel,
      riskFactors,
      recommendation,
    };
  }

  async assessProject(projectId: number): Promise<ProjectRiskOutput> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${projectId} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });
    const activeTasks = tasks.filter(
      (task) =>
        task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED,
    );

    if (activeTasks.length === 0) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        tasksAtRisk: [],
        summary: 'Р’ РїСЂРѕРµРєС‚Рµ РЅРµС‚ Р°РєС‚РёРІРЅС‹С… Р·Р°РґР°С‡. Р РёСЃРєРё РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚.',
      };
    }

    const allAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'task',
        entityId: { in: activeTasks.map((task) => task.id) },
      },
    });

    const taskRisks: {
      taskId: number;
      taskName: string;
      delayProbability: number;
    }[] = [];
    let totalDelay = 0;

    for (const task of activeTasks) {
      const statusChangesCount = allAuditLogs.filter(
        (log) =>
          log.entityId === task.id && log.action === AuditAction.STATUS_CHANGE,
      ).length;

      const assigneeLoad = task.assigneeId
        ? activeTasks.filter(
            (candidate) =>
              candidate.assigneeId === task.assigneeId &&
              candidate.id !== task.id,
          ).length
        : 0;

      const input = buildTaskRiskInput(task, statusChangesCount, assigneeLoad);
      const { delayProbability } = this.calculateTaskRisk(input);
      totalDelay += delayProbability;

      if (delayProbability > 0.3) {
        taskRisks.push({
          taskId: task.id,
          taskName: task.name,
          delayProbability: Math.round(delayProbability * 100) / 100,
        });
      }
    }

    const avgDelay = totalDelay / activeTasks.length;
    const riskScore = Math.round(avgDelay * 100);
    const riskLevel = this.getRiskLevel(avgDelay);

    taskRisks.sort((a, b) => b.delayProbability - a.delayProbability);

    const highRiskCount = taskRisks.filter((task) => task.delayProbability > 0.6)
      .length;
    const summary = this.generateProjectSummary(
      riskLevel,
      riskScore,
      activeTasks.length,
      taskRisks.length,
      highRiskCount,
    );

    return { riskScore, riskLevel, tasksAtRisk: taskRisks, summary };
  }

  private calculateTaskRisk(input: TaskRiskInput): {
    delayProbability: number;
    riskFactors: string[];
  } {
    const riskFactors: string[] = [];
    let delayProbability: number;

    if (input.daysUntilDeadline < 0) {
      delayProbability = 0.95;
      riskFactors.push('Р”РµРґР»Р°Р№РЅ СѓР¶Рµ РїСЂРѕС€С‘Р»');
    } else if (
      input.daysUntilDeadline <= 2 &&
      input.status !== TaskStatus.REVIEW
    ) {
      delayProbability = 0.7;
      riskFactors.push(
        'Р”Рѕ РґРµРґР»Р°Р№РЅР° РјРµРЅРµРµ 2 РґРЅРµР№, Р·Р°РґР°С‡Р° РЅРµ РЅР° СЂРµРІСЊСЋ',
      );
    } else if (input.difficulty >= 4 && input.assigneeLoad > 5) {
      delayProbability = 0.6;
      riskFactors.push('Р’С‹СЃРѕРєР°СЏ СЃР»РѕР¶РЅРѕСЃС‚СЊ Р·Р°РґР°С‡Рё');
      riskFactors.push(
        'Р’С‹СЃРѕРєР°СЏ РЅР°РіСЂСѓР·РєР° РЅР° РёСЃРїРѕР»РЅРёС‚РµР»СЏ (Р±РѕР»РµРµ 5 Р·Р°РґР°С‡)',
      );
    } else if (input.difficulty >= 3 && input.daysUntilDeadline <= 5) {
      delayProbability = 0.4;
      riskFactors.push('РЎСЂРµРґРЅСЏСЏ/РІС‹СЃРѕРєР°СЏ СЃР»РѕР¶РЅРѕСЃС‚СЊ РїСЂРё Р±Р»РёР·РєРѕРј РґРµРґР»Р°Р№РЅРµ');
    } else {
      delayProbability = 0.1 + input.difficulty * 0.05;
    }

    if (input.assigneeCount === 0) {
      riskFactors.push('Р—Р°РґР°С‡Р° РЅРµ РЅР°Р·РЅР°С‡РµРЅР° РёСЃРїРѕР»РЅРёС‚РµР»СЋ');
    }
    if (input.statusChangesCount > 3) {
      riskFactors.push(
        'Р§Р°СЃС‚С‹Рµ РёР·РјРµРЅРµРЅРёСЏ СЃС‚Р°С‚СѓСЃР° (РІРѕР·РјРѕР¶РЅР°СЏ РЅРµСЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ)',
      );
    }

    return { delayProbability: Math.min(delayProbability, 1.0), riskFactors };
  }

  private getRiskLevel(probability: number): 'low' | 'medium' | 'high' {
    if (probability > 0.6) return 'high';
    if (probability > 0.3) return 'medium';
    return 'low';
  }

  private predictCompletionDate(input: TaskRiskInput): string {
    const deadline = new Date(input.deadline);
    const now = new Date();

    if (input.status === TaskStatus.DONE) {
      return now.toISOString();
    }

    const { delayProbability } = this.calculateTaskRisk(input);
    const totalDuration =
      deadline.getTime() - new Date(input.createdAt).getTime();
    const delayMs = totalDuration * delayProbability * 0.5;

    const predicted = new Date(deadline.getTime() + delayMs);
    return predicted < now ? now.toISOString() : predicted.toISOString();
  }

  private generateRecommendation(
    riskFactors: string[],
    riskLevel: 'low' | 'medium' | 'high',
  ): string {
    if (riskLevel === 'low') {
      return 'Р—Р°РґР°С‡Р° РЅР°С…РѕРґРёС‚СЃСЏ РІ Р·РµР»С‘РЅРѕР№ Р·РѕРЅРµ. РџСЂРѕРґРѕР»Р¶Р°Р№С‚Рµ РІ С‚РµРєСѓС‰РµРј СЂРµР¶РёРјРµ.';
    }

    const recommendations: string[] = [];

    if (riskFactors.some((factor) => factor.includes('Р”РµРґР»Р°Р№РЅ СѓР¶Рµ РїСЂРѕС€С‘Р»'))) {
      recommendations.push(
        'РќРµРѕР±С…РѕРґРёРјРѕ СЃСЂРѕС‡РЅРѕ РїРµСЂРµСЃРјРѕС‚СЂРµС‚СЊ СЃСЂРѕРєРё РёР»Рё РїРµСЂРµСЂР°СЃРїСЂРµРґРµР»РёС‚СЊ СЂРµСЃСѓСЂСЃС‹.',
      );
    }
    if (riskFactors.some((factor) => factor.includes('РЅРµ РЅР° СЂРµРІСЊСЋ'))) {
      recommendations.push(
        'Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ СѓСЃРєРѕСЂРёС‚СЊ Р·Р°РІРµСЂС€РµРЅРёРµ Р·Р°РґР°С‡Рё Рё РїРµСЂРµРґР°С‚СЊ РЅР° СЂРµРІСЊСЋ.',
      );
    }
    if (riskFactors.some((factor) => factor.includes('РЅР°РіСЂСѓР·РєР° РЅР° РёСЃРїРѕР»РЅРёС‚РµР»СЏ'))) {
      recommendations.push(
        'Р Р°СЃСЃРјРѕС‚СЂРёС‚Рµ РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ РїРµСЂРµРЅР°Р·РЅР°С‡РµРЅРёСЏ Р·Р°РґР°С‡Рё РёР»Рё СЃРЅРёР¶РµРЅРёСЏ РЅР°РіСЂСѓР·РєРё РёСЃРїРѕР»РЅРёС‚РµР»СЏ.',
      );
    }
    if (riskFactors.some((factor) => factor.includes('РЅРµ РЅР°Р·РЅР°С‡РµРЅР°'))) {
      recommendations.push('РќР°Р·РЅР°С‡СЊС‚Рµ РёСЃРїРѕР»РЅРёС‚РµР»СЏ РґР»СЏ Р·Р°РґР°С‡Рё.');
    }
    if (riskFactors.some((factor) => factor.includes('Р±Р»РёР·РєРѕРј РґРµРґР»Р°Р№РЅРµ'))) {
      recommendations.push(
        'РљРѕРЅС‚СЂРѕР»РёСЂСѓР№С‚Рµ С…РѕРґ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РґР°С‡Рё РµР¶РµРґРЅРµРІРЅРѕ.',
      );
    }

    return recommendations.length > 0
      ? recommendations.join(' ')
      : 'РћР±СЂР°С‚РёС‚Рµ РІРЅРёРјР°РЅРёРµ РЅР° С„Р°РєС‚РѕСЂС‹ СЂРёСЃРєР° Рё РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё СЃРєРѕСЂСЂРµРєС‚РёСЂСѓР№С‚Рµ РїР»Р°РЅ.';
  }

  private generateProjectSummary(
    riskLevel: 'low' | 'medium' | 'high',
    riskScore: number,
    totalActive: number,
    atRiskCount: number,
    highRiskCount: number,
  ): string {
    if (riskLevel === 'low') {
      return `РџСЂРѕРµРєС‚ РІ Р·РµР»С‘РЅРѕР№ Р·РѕРЅРµ (${riskScore}/100). РР· ${totalActive} Р°РєС‚РёРІРЅС‹С… Р·Р°РґР°С‡ РЅРµС‚ Р·Р°РґР°С‡ СЃ РІС‹СЃРѕРєРёРј СЂРёСЃРєРѕРј.`;
    }
    if (riskLevel === 'medium') {
      return `РџСЂРѕРµРєС‚ РёРјРµРµС‚ СЃСЂРµРґРЅРёР№ СѓСЂРѕРІРµРЅСЊ СЂРёСЃРєР° (${riskScore}/100). ${atRiskCount} РёР· ${totalActive} Р°РєС‚РёРІРЅС‹С… Р·Р°РґР°С‡ С‚СЂРµР±СѓСЋС‚ РІРЅРёРјР°РЅРёСЏ.`;
    }
    return `РџСЂРѕРµРєС‚ РёРјРµРµС‚ РІС‹СЃРѕРєРёР№ СЂРёСЃРє СЃСЂС‹РІР° СЃСЂРѕРєРѕРІ (${riskScore}/100): ${highRiskCount} Р·Р°РґР°С‡ СЃ РІРµСЂРѕСЏС‚РЅРѕСЃС‚СЊСЋ Р·Р°РґРµСЂР¶РєРё > 60%.`;
  }
}
