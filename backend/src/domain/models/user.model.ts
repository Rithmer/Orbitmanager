import { AccountRole } from '../../common/enums/account-role.enum';

export interface User {
  id: number;
  login: string;
  password: string;
  fullName: string;
  profession: string;
  accountStatus: 'active' | 'blocked';
  accountRole: AccountRole;
  createdAt: string;
  updatedAt: string;
}
