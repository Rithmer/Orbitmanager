import { AccountRole } from '@/common/enums/account-role.enum';

export interface AuthenticatedUser {
  id: number;
  login: string;
  accountRole: AccountRole;
}
