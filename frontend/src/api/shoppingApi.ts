// src/api/shoppingApi.ts
import { apiClient } from '@/api/client';

import type {
  ShoppingListDetail,
  ShoppingListItem,
  ShoppingListSummary,
  ShoppingPriceCreatePayload,
  ShoppingSupplierOption,
} from '@/types/shopping';

export const shoppingQueryKeys = {
  all: ['shopping'] as const,
  lists: () => [...shoppingQueryKeys.all, 'lists'] as const,
  listDetail: (listId: number) =>
    [...shoppingQueryKeys.all, 'lists', listId] as const,
  items: (listId: number) =>
    [...shoppingQueryKeys.all, 'items', listId] as const,
  suppliers: () => [...shoppingQueryKeys.all, 'suppliers'] as const,
};

export interface ShoppingListCreatePayload {
  groupId?: number | null;
  visibilityId: number;
  statusId?: number;
  name: string;
  description?: string | null;
}

export interface ShoppingListUpdatePayload {
  groupId?: number | null;
  visibilityId?: number;
  statusId?: number;
  name?: string;
  description?: string | null;
}

export interface ShoppingListItemCreatePayload {
  shoppingListId: number;
  nameOriginal: string;
  quantity?: number | null;
  unitId?: number | null;
  notes?: string | null;
}

export interface ShoppingListItemUpdatePayload {
  nameOriginal?: string;
  quantity?: number | null;
  unitId?: number | null;
  statusId?: number;
  notes?: string | null;
}

export interface ToggleShoppingListItemPurchasedPayload {
  isPurchased: boolean;
}

export interface ShoppingSupplierCreatePayload {
  name: string;
  statusId: number;
}

export interface ShoppingSupplierUpdatePayload {
  name?: string;
  statusId?: number;
}

export interface ShoppingPriceUpdatePayload {
  supplierId?: number | null;
  purchaseDate?: string;
  price?: number;
  currencyId?: number | null;
  offerFlagId?: number | null;
  expirationDate?: string | null;
}

export async function fetchShoppingLists(): Promise<ShoppingListSummary[]> {
  const response = await apiClient.get<ShoppingListSummary[]>('/shopping/lists');
  return response.data;
}

export async function fetchShoppingListDetail(
  listId: number
): Promise<ShoppingListDetail> {
  const response = await apiClient.get<ShoppingListDetail>(
    `/shopping/lists/${listId}`
  );
  return response.data;
}

export async function fetchShoppingListItems(
  listId: number
): Promise<ShoppingListItem[]> {
  const response = await apiClient.get<ShoppingListItem[]>(
    `/shopping/lists/${listId}/items`
  );
  return response.data;
}

export async function createShoppingList(
  payload: ShoppingListCreatePayload
): Promise<ShoppingListSummary> {
  const response = await apiClient.post<ShoppingListSummary>(
    '/shopping/lists',
    payload
  );
  return response.data;
}

export async function updateShoppingList(
  id: number,
  payload: ShoppingListUpdatePayload
): Promise<ShoppingListSummary> {
  const response = await apiClient.patch<ShoppingListSummary>(
    `/shopping/lists/${id}`,
    payload
  );
  return response.data;
}

export async function deleteShoppingList(id: number): Promise<void> {
  await apiClient.delete(`/shopping/lists/${id}`);
}

export async function createShoppingListItem(
  payload: ShoppingListItemCreatePayload
): Promise<ShoppingListItem> {
  const response = await apiClient.post<ShoppingListItem>(
    `/shopping/lists/${payload.shoppingListId}/items`,
    {
      nameOriginal: payload.nameOriginal,
      quantity: payload.quantity,
      unitId: payload.unitId,
      notes: payload.notes,
    }
  );
  return response.data;
}

export async function updateShoppingListItem(
  id: number,
  payload: ShoppingListItemUpdatePayload
): Promise<ShoppingListItem> {
  const response = await apiClient.patch<ShoppingListItem>(
    `/shopping/items/${id}`,
    payload
  );
  return response.data;
}

export async function deleteShoppingListItem(id: number): Promise<void> {
  await apiClient.delete(`/shopping/items/${id}`);
}

export async function toggleShoppingListItemPurchased(
  id: number,
  payload: ToggleShoppingListItemPurchasedPayload
): Promise<ShoppingListItem> {
  const response = await apiClient.patch<ShoppingListItem>(
    `/shopping/items/${id}/purchase`,
    payload
  );
  return response.data;
}

export async function createShoppingSupplier(
  payload: ShoppingSupplierCreatePayload
): Promise<ShoppingSupplierOption> {
  const response = await apiClient.post<ShoppingSupplierOption>(
    '/shopping/suppliers',
    payload
  );
  return response.data;
}

export async function updateShoppingSupplier(
  id: number,
  payload: ShoppingSupplierUpdatePayload
): Promise<ShoppingSupplierOption> {
  const response = await apiClient.patch<ShoppingSupplierOption>(
    `/shopping/suppliers/${id}`,
    payload
  );
  return response.data;
}

export async function deleteShoppingSupplier(id: number): Promise<void> {
  await apiClient.delete(`/shopping/suppliers/${id}`);
}

export async function createShoppingPrice(
  payload: ShoppingPriceCreatePayload
): Promise<void> {
  await apiClient.post('/shopping/prices', payload);
}

export async function updateShoppingPrice(
  priceId: number,
  payload: ShoppingPriceUpdatePayload
): Promise<void> {
  await apiClient.patch(`/shopping/prices/${priceId}`, payload);
}

export async function deleteShoppingPrice(priceId: number): Promise<void> {
  await apiClient.delete(`/shopping/prices/${priceId}`);
}