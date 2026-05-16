import { Prisma } from '@nepthok/database';
import { getTenantId } from './tenant-context';

const TENANT_SCOPED_MODELS = new Set<string>([
  'Product',
  'Order',
  'OrderItem',
  'DiscountCode',
  'StoreAnalytics',
  'ContactMessage',
]);

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const tenantScopeMiddleware: Prisma.Middleware = async (params, next) => {
  const tenantId = getTenantId();

  if (tenantId && params.model && TENANT_SCOPED_MODELS.has(params.model)) {
    params.args ??= {};
    params.args.where ??= {};

    if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow') {
      // Convert to findFirst/findFirstOrThrow so tenantId can be added alongside a unique id lookup
      params.action = params.action === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
    }

    params.args.where = { ...params.args.where, tenantId };
  }

  return next(params);
};
