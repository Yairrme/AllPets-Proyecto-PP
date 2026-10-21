import { Request } from 'express';
import { UserRole } from 'y/contracts';

export interface JwtUser {
  sub: string;
  email: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & {
  user: JwtUser;
};
