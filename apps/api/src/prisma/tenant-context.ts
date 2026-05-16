import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string | null;
}

const als = new AsyncLocalStorage<TenantStore>();

export function setTenantContext(tenantId: string | null, fn: () => void): void {
  als.run({ tenantId }, fn);
}

export function getTenantId(): string | null {
  return als.getStore()?.tenantId ?? null;
}
