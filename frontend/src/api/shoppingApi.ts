// src/api/shoppingApi.ts
import type {
  ShoppingConfigBundle,
  ShoppingListItem,
  ShoppingListSummary,
  ShoppingPriceCreatePayload,
  ShoppingProductOption,
  ShoppingSupplierOption,
} from '@/types/shopping';

const SHOPPING_API_BASE = '/api/shopping';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function apiRequest<T>(
  path: string,
  options?: {
    method?: RequestMethod;
    body?: unknown;
    signal?: AbortSignal;
  }
): Promise<T> {
  const response = await fetch(`${SHOPPING_API_BASE}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Shopping API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* =========================
 * Query keys
 * ========================= */

export const shoppingQueryKeys = {
  all: ['shopping'] as const,

  lists: () => [...shoppingQueryKeys.all, 'lists'] as const,
  list: (listId: number) => [...shoppingQueryKeys.all, 'lists', listId] as const,

  items: (listId: number | null) =>
    [...shoppingQueryKeys.all, 'items', listId] as const,

  suppliers: () => [...shoppingQueryKeys.all, 'suppliers'] as const,
  supplier: (supplierId: number) =>
    [...shoppingQueryKeys.all, 'suppliers', supplierId] as const,

  config: () => [...shoppingQueryKeys.all, 'config'] as const,
  products: () => [...shoppingQueryKeys.all, 'products'] as const,

  productSuggestions: (query: string) =>
    [...shoppingQueryKeys.all, 'product-suggestions', query.trim().toLowerCase()] as const,

  productInsights: (productId: number | null) =>
    [...shoppingQueryKeys.all, 'product-insights', productId] as const,
} as const;

/* =========================
 * Read models
 * ========================= */

export async function fetchShoppingLists(
  signal?: AbortSignal
): Promise<ShoppingListSummary[]> {
  return apiRequest<ShoppingListSummary[]>('/lists', { signal });
}

export async function fetchShoppingListItems(
  listId: number,
  signal?: AbortSignal
): Promise<ShoppingListItem[]> {
  return apiRequest<ShoppingListItem[]>(`/lists/${listId}/items`, { signal });
}

export async function fetchShoppingSuppliers(
  signal?: AbortSignal
): Promise<ShoppingSupplierOption[]> {
  return apiRequest<ShoppingSupplierOption[]>('/suppliers', { signal });
}

export async function fetchShoppingConfig(
  signal?: AbortSignal
): Promise<ShoppingConfigBundle> {
  return apiRequest<ShoppingConfigBundle>('/config', { signal });
}

export async function fetchShoppingProducts(
  signal?: AbortSignal
): Promise<ShoppingProductOption[]> {
  return apiRequest<ShoppingProductOption[]>('/products', { signal });
}

/* =========================
 * Mutation payloads
 * ========================= */

export interface ShoppingListCreatePayload {
  name: string;
  description?: string;
  groupId?: number | null;
  visibilityId: number;
  statusId?: number | null;
}

export interface ShoppingListUpdatePayload {
  name?: string;
  description?: string | null;
  groupId?: number | null;
  visibilityId?: number | null;
  statusId?: number | null;
}

export interface ShoppingListItemCreatePayload {
  shoppingListId: number;
  productId?: number | null;
  nameOriginal: string;
  quantity?: number | null;
  unitId?: number | null;
  notes?: string | null;
  statusId?: number | null;
}

export interface ShoppingListItemUpdatePayload {
  quantity?: number | null;
  unitId?: number | null;
  notes?: string | null;
  statusId?: number | null;
  nameOriginal?: string;
}

export interface ToggleShoppingListItemPurchasedPayload {
  isPurchased: boolean;
}

export interface ShoppingSupplierCreatePayload {
  name: string;
  statusId?: number | null;
}

export interface ShoppingSupplierUpdatePayload {
  name?: string;
  statusId?: number | null;
}

export interface ShoppingPriceUpdatePayload {
  supplierId?: number | null;
  purchaseDate?: string;
  price?: number;
  currencyId?: number | null;
  offerFlagId?: number | null;
  expirationDate?: string | null;
}

/* =========================
 * Mutations
 * ========================= */

export async function createShoppingList(
  payload: ShoppingListCreatePayload
): Promise<ShoppingListSummary> {
  return apiRequest<ShoppingListSummary>('/lists', {
    method: 'POST',
    body: payload,
  });
}

export async function updateShoppingList(
  id: number,
  payload: ShoppingListUpdatePayload
): Promise<ShoppingListSummary> {
  return apiRequest<ShoppingListSummary>(`/lists/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteShoppingList(id: number): Promise<void> {
  return apiRequest<void>(`/lists/${id}`, {
    method: 'DELETE',
  });
}

export async function createShoppingListItem(
  payload: ShoppingListItemCreatePayload
): Promise<ShoppingListItem> {
  return apiRequest<ShoppingListItem>(`/lists/${payload.shoppingListId}/items`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateShoppingListItem(
  id: number,
  payload: ShoppingListItemUpdatePayload
): Promise<ShoppingListItem> {
  return apiRequest<ShoppingListItem>(`/items/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteShoppingListItem(id: number): Promise<void> {
  return apiRequest<void>(`/items/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleShoppingListItemPurchased(
  id: number,
  payload: ToggleShoppingListItemPurchasedPayload
): Promise<ShoppingListItem> {
  return apiRequest<ShoppingListItem>(`/items/${id}/toggle-purchased`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function createShoppingSupplier(
  payload: ShoppingSupplierCreatePayload
): Promise<ShoppingSupplierOption> {
  return apiRequest<ShoppingSupplierOption>('/suppliers', {
    method: 'POST',
    body: payload,
  });
}

export async function updateShoppingSupplier(
  id: number,
  payload: ShoppingSupplierUpdatePayload
): Promise<ShoppingSupplierOption> {
  return apiRequest<ShoppingSupplierOption>(`/suppliers/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteShoppingSupplier(id: number): Promise<void> {
  return apiRequest<void>(`/suppliers/${id}`, {
    method: 'DELETE',
  });
}

export async function createShoppingPrice(
  payload: ShoppingPriceCreatePayload
): Promise<void> {
  return apiRequest<void>('/prices', {
    method: 'POST',
    body: payload,
  });
}

export async function updateShoppingPrice(
  priceId: number,
  payload: ShoppingPriceUpdatePayload
): Promise<void> {
  return apiRequest<void>(`/prices/${priceId}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteShoppingPrice(priceId: number): Promise<void> {
  return apiRequest<void>(`/prices/${priceId}`, {
    method: 'DELETE',
  });
}