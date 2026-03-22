import * as fs from 'fs';
import * as path from 'path';

const TOTAL_RECORDS = 1200;
const STATUSES = ['new', 'in_progress', 'review', 'done', 'cancelled'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface TrainingRecord {
  difficulty: number;
  daysUntilDeadline: number;
  daysSinceCreation: number;
  status: string;
  assigneeCount: number;
  assigneeLoad: number;
  statusChangesCount: number;
  plannedDurationDays: number;
  actualCompletionDays: number;
  isDelayed: number;
}

function generateRecord(): TrainingRecord {
  const difficulty = randomInt(1, 5);
  const plannedDurationDays = randomInt(3, 60);
  const daysSinceCreation = randomInt(0, plannedDurationDays + 20);
  const daysUntilDeadline = plannedDurationDays - daysSinceCreation;
  const status = STATUSES[randomInt(0, STATUSES.length - 1)];
  const assigneeCount = Math.random() > 0.15 ? 1 : 0;
  const assigneeLoad = assigneeCount > 0 ? randomInt(0, 12) : 0;
  const statusChangesCount = randomInt(0, 8);

  let delayFactor = 1.0;

  delayFactor += (difficulty - 3) * 0.15;

  if (assigneeLoad > 5) delayFactor += 0.3;
  if (assigneeLoad > 8) delayFactor += 0.2;

  if (assigneeCount === 0) delayFactor += 0.4;

  if (statusChangesCount > 3) delayFactor += 0.2;

  delayFactor *= randomFloat(0.6, 1.5);

  const actualCompletionDays = Math.max(1, Math.round(plannedDurationDays * delayFactor));
  const isDelayed = actualCompletionDays > plannedDurationDays ? 1 : 0;

  return {
    difficulty,
    daysUntilDeadline,
    daysSinceCreation,
    status,
    assigneeCount,
    assigneeLoad,
    statusChangesCount,
    plannedDurationDays,
    actualCompletionDays,
    isDelayed,
  };
}

function main(): void {
  const headers = [
    'difficulty',
    'daysUntilDeadline',
    'daysSinceCreation',
    'status',
    'assigneeCount',
    'assigneeLoad',
    'statusChangesCount',
    'plannedDurationDays',
    'actualCompletionDays',
    'isDelayed',
  ];

  const rows: string[] = [headers.join(',')];

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const record = generateRecord();
    rows.push(
      [
        record.difficulty,
        record.daysUntilDeadline,
        record.daysSinceCreation,
        record.status,
        record.assigneeCount,
        record.assigneeLoad,
        record.statusChangesCount,
        record.plannedDurationDays,
        record.actualCompletionDays,
        record.isDelayed,
      ].join(','),
    );
  }

  const outputPath = path.join(__dirname, '..', 'data', 'training_data.csv');
  fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');
  console.log(`Сгенерировано ${TOTAL_RECORDS} записей → ${outputPath}`);
}

main();
