import { TenantStatus } from "@nepthok/database";

export class TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  status: TenantStatus;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  subscription: unknown | null;
  createdAt: Date;
}
