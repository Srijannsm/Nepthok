import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TenantStatus, UserRole } from "@nepthok/database";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

const TENANT_WITH_OWNER = {
  owner: {
    select: { id: true, name: true, email: true, phone: true },
  },
  subscription: true,
} as const;

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const [slugTaken, emailTaken] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug: dto.slug } }),
      this.prisma.user.findUnique({ where: { email: dto.email } }),
    ]);

    if (slugTaken) throw new ConflictException("Slug is already taken");
    if (emailTaken) throw new ConflictException("Email is already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          name: dto.ownerName,
          phone: dto.phone,
          role: UserRole.SELLER_ADMIN,
          isActive: true,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          ownerId: user.id,
          status: TenantStatus.PENDING,
        },
        include: TENANT_WITH_OWNER,
      });

      await tx.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      return tenant;
    });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        include: TENANT_WITH_OWNER,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: TENANT_WITH_OWNER,
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: TENANT_WITH_OWNER,
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async approve(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    if (tenant.status === TenantStatus.ACTIVE)
      throw new BadRequestException("Tenant is already active");

    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
      include: TENANT_WITH_OWNER,
    });
  }

  async suspend(id: string, reason: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    if (tenant.status === TenantStatus.SUSPENDED)
      throw new BadRequestException("Tenant is already suspended");

    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
      include: TENANT_WITH_OWNER,
    });
  }

  async update(id: string, tenantId: string, dto: UpdateTenantDto) {
    if (id !== tenantId) throw new NotFoundException("Tenant not found");

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.banner !== undefined && { banner: dto.banner }),
      },
      include: TENANT_WITH_OWNER,
    });
  }

  async getMyTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        ...TENANT_WITH_OWNER,
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }
}
