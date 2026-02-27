/**
 * PROTOTYPE: Auth is fully hardcoded.
 * Any email/password combo returns a valid token for the hardcoded admin user.
 * Replace with real DB-backed auth before production.
 */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

export const HARDCODED_USER = {
  id: 'dev-admin-user-id',
  productionId: 'dev-production-id',
  roleId: 'dev-role-id',
  role: 'ADMIN',
  name: 'Dev Admin',
  email: 'admin@dev.com',
  passwordHash: '',
  isActive: true,
  createdAt: new Date(),
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(_dto: LoginDto) {
    const payload = {
      sub: HARDCODED_USER.id,
      productionId: HARDCODED_USER.productionId,
      role: HARDCODED_USER.role,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      refreshToken: 'hardcoded-refresh-token',
      user: HARDCODED_USER,
    };
  }

  async refresh(_token: string) {
    return this.login({ email: '', password: '' });
  }

  async logout(_userId: string) {
    return { message: 'Logged out' };
  }
}
