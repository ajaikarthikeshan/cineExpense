import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '@modules/users/users.module';
import { jwtConfig } from '@config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({ secret: jwtConfig.secret, signOptions: { expiresIn: jwtConfig.accessTokenExpiry } }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
