import { AsyncLocalStorage } from 'async_hooks';

export const context = new AsyncLocalStorage<{ staffId?: number }>();

export function getContext() {
  return context.getStore();
}
