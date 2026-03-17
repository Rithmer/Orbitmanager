import { AuditAction } from '@/common/enums/audit-action.enum';

export interface AuditLog {
  id: number;
  userId: number;
  action: AuditAction;
  entityType: string;
  entityId: number | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  description: string;
}
