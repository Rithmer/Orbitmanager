import { AuditAction } from '@/common/enums/audit-action.enum';

/** Prisma `AuditLog` create input inside `$transaction`. */
export function auditLogCreateInput(
  userId: number,
  action: AuditAction,
  entityType: string,
  entityId: number | null,
  description: string,
  timestamp: Date,
  oldValue?: string | null,
  newValue?: string | null,
) {
  return {
    userId,
    action,
    entityType,
    entityId,
    description,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    timestamp,
  };
}
