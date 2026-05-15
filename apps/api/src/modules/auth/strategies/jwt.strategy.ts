import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserRole } from "@nepthok/database";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET")!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const user = await this.authService.validateUser(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Unauthorized — valid JWT required");
    }
    return { id: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
  }
}
