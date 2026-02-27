import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '@config/jwt.config';
import { UsersService } from '@modules/users/users.service';
import { HARDCODED_USER } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(_payload: { sub: string; productionId: string; role: string }) {
    // PROTOTYPE: always return hardcoded user
    return HARDCODED_USER;
  }
}
