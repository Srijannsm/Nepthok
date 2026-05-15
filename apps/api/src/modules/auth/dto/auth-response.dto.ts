import { UserRole } from "@nepthok/database";

export class AuthResponseDto {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string | null;
  };
}
