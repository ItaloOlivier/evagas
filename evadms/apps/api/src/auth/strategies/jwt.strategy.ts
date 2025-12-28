import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get('JWT_SECRET');
    console.log('[JwtStrategy] Initializing with JWT_SECRET:', jwtSecret ? '***SET***' : '***NOT SET***');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      console.log('[JwtStrategy] validate - payload:', { sub: payload.sub, email: payload.email, roles: payload.roles });
      const user = await this.authService.validateUser(payload);

      if (!user) {
        console.log('[JwtStrategy] validate - user not found for payload');
        throw new UnauthorizedException();
      }

      console.log('[JwtStrategy] validate - user validated:', { id: user.id, email: user.email, roles: user.roles });
      return user;
    } catch (error) {
      console.error('[JwtStrategy] validate - ERROR:', error);
      throw error;
    }
  }
}
