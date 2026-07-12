// src/api/shoppingApi.ts
import { apiClient } from './client';
import type {
  ConfigOption,
  ShoppingConfigBundle,
  ShoppingListCreatePayload,
  ShoppingListItem,
  ShoppingListItemCreatePayload,
  ShoppingListItemUpdatePayload,
  ShoppingListSummary,
  ShoppingListUpdatePayload,
  ShoppingPriceCreatePayload,
  ShoppingPriceUpdatePayload,
  ShoppingProductOption,
  ShoppingSupplierCreatePayload,
  ShoppingSupplierOption,
  ShoppingSupplierUpdatePayload,
  ToggleShoppingListItemPurchasedPayload,
} from '@/types/shopping';

const SHOPPING_API_BASE = '/shopping';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// REFACTOR: Allineata la response ai nuovi parametri del backend
type ShoppingListItemApi = {
  id: number;
  shopping_list_id: number;
  product_id: number;
  product_name: string;
  name_normalized: string;
  quantity?: number | string | null;
  unit_id?: number | null;
  unit_name?: string | null;
  unit_code_name?: string | null;
  notes?: string | null;
  is_purchased: boolean;
  
  // Dati batch (se il backend li espone)
  last_price?: number | string | null;
  last_currency_id?: number | null;
  last_currency_code_name?: string | null;
  last_supplier_id?: number | null;
  last_supplier_name?: string | null;
  last_purchase_date?: string | null;
  
  created_at?: string;
  updated_at?: string | null;
};

type ShoppingListSummaryApi = {
  id: number;
  name: string;
  description?: string | null;
  group_id?: number | null;
  group_name?: string | null;
  visibility_id: number;
  visibility_code_name?: string | null;
  status_id?: number | null;
  status_code_name?: string | null;
  items?: ShoppingListItemApi[];
};

type ShoppingSupplierOptionApi = {
  id: number;
  name: string;
  status_id?: number | null;
  status_code_name?: string | null;
  is_active?: boolean;
};

type ConfigOptionApi = {
  id: number;
  value?: string | null;
  label?: string | null;
  code_value?: string | null;
  code_name?: string | null;
  display_name?: string | null;
  description?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
};

type ShoppingConfigBundleApi = {
  unitOptions?: ConfigOptionApi[];
  itemStatusOptions?: ConfigOptionApi[];
  currencyOptions?: ConfigOptionApi[];
  offerFlagOptions?: ConfigOptionApi[];
  visibilityOptions?: ConfigOptionApi[];
  listStatusOptions?: ConfigOptionApi[];
};

type ShoppingProductOptionApi = {
  id: number;
  name_normalized?: string | null;
  display_name?: string | null;
  default_unit_id?: number | null;
  default_unit_name?: string | null;
  default_unit_code_name?: string | null;
  last_purchase_price?: number | string | null;
  last_purchase_currency_id?: number | null;
  last_purchase_currency_code_name?: string | null;
  last_supplier_id?: number | null;
  last_supplier_name?: string | null;
  last_purchase_date?: string | null;
};

async function apiRequest<T>(
  path: string,
  options: {
    method: RequestMethod;
    body?: unknown;
    params?: Record<string, unknown>;
    signal?: AbortSignal;
  } = { method: 'GET' }
): Promise<T> {
  const response = await apiClient<T>({
    url: `${SHOPPING_API_BASE}${path}`,
    method: options.method,
    data: options.body,
    params: options.params,
    signal: options.signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  return response.data;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeConfigOption(option: ConfigOptionApi): ConfigOption {
  return {
    id: Number(option.id),
    codeName: option.code_name ?? option.label ?? option.value ?? '',
    codeValue: option.code_value ?? option.value ?? null,
    displayName:
      option.display_name ?? option.label ?? option.code_name ?? null,
    description: option.description ?? null,
    sortOrder: option.sort_order ?? null,
    isActive: option.is_active ?? true,
  };
}

// REFACTOR: Normalizzazione pulita, senza fallback strani sui legacy
function normalizeShoppingListItem(item: ShoppingListItemApi): ShoppingListItem {
  return {
    id: Number(item.id),
    shoppingListId: Number(item.shopping_list_id),
    productId: Number(item.product_id),

    productName: item.product_name,
    nameNormalized: item.name_normalized,

    quantity: toNumberOrNull(item.quantity),
    unitId: item.unit_id ?? null,
    unitCodeName: item.unit_code_name ?? item.unit_name ?? null,

    isPurchased: Boolean(item.is_purchased),
    notes: item.notes ?? null,

    lastPrice: toNumberOrNull(item.last_price),
    lastCurrencyId: item.last_currency_id ?? null,
    lastCurrencyCodeName: item.last_currency_code_name ?? null,
    lastSupplierId: item.last_supplier_id ?? null,
    lastSupplierName: item.last_supplier_name ?? null,
    lastPurchaseDate: item.last_purchase_date ?? null,

    createdAt: item.created_at ?? undefined,
    updatedAt: item.updated_at ?? undefined,
  };
}

function normalizeShoppingListSummary(
  list: ShoppingListSummaryApi
): ShoppingListSummary {
  const items = list.items ?? [];
  const openItemsCount = items.filter((item) => !item.is_purchased).length;
  const purchasedItemsCount = items.filter((item) => item.is_purchased).length;
  const totalItemsCount = items.length;

  return {
    id: Number(list.id),
    name: list.name,
    description: list.description ?? null,
    groupId: list.group_id ?? null,
    groupName: list.group_name ?? null,
    visibilityId: Number(list.visibility_id),
    visibilityCodeName: list.visibility_code_name ?? null,
    statusId: list.status_id ?? null,
    statusCodeName: list.status_code_name ?? null,
    openItemsCount,
    purchasedItemsCount,
    totalItemsCount,
    canEdit: true,
    canDelete: true,
    canArchive: false,
  };
}

function normalizeShoppingSupplierOption(
  supplier: ShoppingSupplierOptionApi
): ShoppingSupplierOption {
  return {
    id: Number(supplier.id),
    name: supplier.name,
    statusId: supplier.status_id ?? null,
    statusCodeName: supplier.status_code_name ?? null,
    isActive: supplier.is_active ?? true,
  };
}

function normalizeShoppingProductOption(
  product: ShoppingProductOptionApi
): ShoppingProductOption {
  return {
    id: Number(product.id),
    nameNormalized: product.name_normalized ?? '',
    displayName: product.display_name ?? product.name_normalized ?? '',
    defaultUnitId: product.default_unit_id ?? null,
    defaultUnitCodeName:
      product.default_unit_code_name ?? product.default_unit_name ?? null,
    lastPurchasePrice: toNumberOrNull(product.last_purchase_price),
    lastPurchaseCurrencyId: product.last_purchase_currency_id ?? null,
    lastPurchaseCurrencyCodeName:
      product.last_purchase_currency_code_name ?? null,
    lastSupplierId: product.last_supplier_id ?? null,
    lastSupplierName: product.last_supplier_name ?? null,
    lastPurchaseDate: product.last_purchase_date ?? null,
  };
}

function normalizeShoppingConfigBundle(
  config: ShoppingConfigBundleApi
): ShoppingConfigBundle {
  return {
    unitOptions: (config.unitOptions ?? []).map(normalizeConfigOption),
    itemStatusOptions: (config.itemStatusOptions ?? []).map(normalizeConfigOption),
    currencyOptions: (config.currencyOptions ?? []).map(normalizeConfigOption),
    offerFlagOptions: (config.offerFlagOptions ?? []).map(normalizeConfigOption),
    visibilityOptions: (config.visibilityOptions ?? []).map(normalizeConfigOption),
    listStatusOptions: (config.listStatusOptions ?? []).map(normalizeConfigOption),
  };
}

function serializeShoppingListPayload(
  payload: ShoppingListCreatePayload | ShoppingListUpdatePayload
) {
  return {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.groupId !== undefined ? { group_id: payload.groupId } : {}),
    ...(payload.visibilityId !== undefined
      ? { visibility_id: payload.visibilityId }
      : {}),
    ...(payload.statusId !== undefined ? { status_id: payload.statusId } : {}),
  };
}

// REFACTOR: Usiamo product_name come da nuovo schema Pydantic
function serializeShoppingListItemCreatePayload(
  payload: ShoppingListItemCreatePayload
) {
  return {
    shopping_list_id: payload.shoppingListId,
    product_name: payload.productName,
    ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
    ...(payload.unitId !== undefined ? { unit_id: payload.unitId } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
  };
}

// REFACTOR: Usiamo product_name come da nuovo schema Pydantic
function serializeShoppingListItemUpdatePayload(
  payload: ShoppingListItemUpdatePayload
) {
  return {
    ...(payload.productName !== undefined ? { product_name: payload.productName } : {}),
    ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
    ...(payload.unitId !== undefined ? { unit_id: payload.unitId } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
  };
}

function serializeShoppingSupplierPayload(
  payload: ShoppingSupplierCreatePayload | ShoppingSupplierUpdatePayload
) {
  return {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.statusId !== undefined ? { status_id: payload.statusId } : {}),
  };
}

function serializeShoppingPriceCreatePayload(
  payload: ShoppingPriceCreatePayload
) {
  return {
    shopping_list_id: payload.shoppingListId,
    shopping_list_item_id: payload.shoppingListItemId,
    product_id: payload.productId,
    ...(payload.supplierId !== undefined
      ? { supplier_id: payload.supplierId }
      : {}),
    purchase_date: payload.purchaseDate,
    price: payload.price,
    ...(payload.currencyId !== undefined
      ? { currency_id: payload.currencyId }
      : {}),
    ...(payload.offerFlagId !== undefined
      ? { offer_flag_id: payload.offerFlagId }
      : {}),
    ...(payload.expirationDate !== undefined
      ? { expiration_date: payload.expirationDate }
      : {}),
  };
}

function serializeShoppingPriceUpdatePayload(
  payload: ShoppingPriceUpdatePayload
) {
  return {
    ...(payload.supplierId !== undefined
      ? { supplier_id: payload.supplierId }
      : {}),
    ...(payload.purchaseDate !== undefined
      ? { purchase_date: payload.purchaseDate }
      : {}),
    ...(payload.price !== undefined ? { price: payload.price } : {}),
    ...(payload.currencyId !== undefined
      ? { currency_id: payload.currencyId }
      : {}),
    ...(payload.offerFlagId !== undefined
      ? { offer_flag_id: payload.offerFlagId }
      : {}),
    ...(payload.expirationDate !== undefined
      ? { expiration_date: payload.expirationDate }
      : {}),
  };
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
    [
      ...shoppingQueryKeys.all,
      'product-suggestions',
      query.trim().toLowerCase(),
    ] as const,

  productInsights: (productId: number | null) =>
    [...shoppingQueryKeys.all, 'product-insights', productId] as const,
} as const;

/* =========================
 * Read models
 * ========================= */

export async function fetchShoppingLists(
  signal?: AbortSignal
): Promise<ShoppingListSummary[]> {
  const data = await apiRequest<ShoppingListSummaryApi[]>('/lists', {
    method: 'GET',
    signal,
  });

  return (data ?? []).map(normalizeShoppingListSummary);
}

export async function fetchShoppingListItems(
  listId: number,
  signal?: AbortSignal
): Promise<ShoppingListItem[]> {
  const data = await apiRequest<ShoppingListItemApi[]>('/items', {
    method: 'GET',
    params: { shopping_list_id: listId },
    signal,
  });

  return (data ?? []).map(normalizeShoppingListItem);
}

export async function fetchShoppingSuppliers(
  signal?: AbortSignal
): Promise<ShoppingSupplierOption[]> {
  const data = await apiRequest<ShoppingSupplierOptionApi[]>('/suppliers', {
    method: 'GET',
    signal,
  });

  return (data ?? []).map(normalizeShoppingSupplierOption);
}

export async function fetchShoppingConfig(
  signal?: AbortSignal
): Promise<ShoppingConfigBundle> {
  const data = await apiRequest<ShoppingConfigBundleApi>('/config', {
    method: 'GET',
    signal,
  });

  return normalizeShoppingConfigBundle(data ?? {});
}

export async function fetchShoppingProducts(
  signal?: AbortSignal
): Promise<ShoppingProductOption[]> {
  const data = await apiRequest<ShoppingProductOptionApi[]>('/products', {
    method: 'GET',
    signal,
  });

  return (data ?? []).map(normalizeShoppingProductOption);
}

/* =========================
 * Mutations
 * ========================= */

export async function createShoppingList(
  payload: ShoppingListCreatePayload
): Promise<ShoppingListSummary> {
  const data = await apiRequest<ShoppingListSummaryApi>('/lists', {
    method: 'POST',
    body: serializeShoppingListPayload(payload),
  });

  return normalizeShoppingListSummary(data);
}

export async function updateShoppingList(
  id: number,
  payload: ShoppingListUpdatePayload
): Promise<ShoppingListSummary> {
  const data = await apiRequest<ShoppingListSummaryApi>(`/lists/${id}`, {
    method: 'PATCH',
    body: serializeShoppingListPayload(payload),
  });

  return normalizeShoppingListSummary(data);
}

export async function deleteShoppingList(id: number): Promise<void> {
  await apiRequest<void>(`/lists/${id}`, {
    method: 'DELETE',
  });
}

export async function createShoppingListItem(
  payload: ShoppingListItemCreatePayload
): Promise<ShoppingListItem> {
  const data = await apiRequest<ShoppingListItemApi>('/items', {
    method: 'POST',
    body: serializeShoppingListItemCreatePayload(payload),
  });

  return normalizeShoppingListItem(data);
}

export async function updateShoppingListItem(
  id: number,
  _listId: number,
  payload: ShoppingListItemUpdatePayload
): Promise<ShoppingListItem> {
  const data = await apiRequest<ShoppingListItemApi>(`/items/${id}`, {
    method: 'PATCH',
    body: serializeShoppingListItemUpdatePayload(payload),
  });

  return normalizeShoppingListItem(data);
}

export async function deleteShoppingListItem(
  id: number,
): Promise<void> {
  await apiRequest<void>(`/items/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleShoppingListItemPurchased(
  id: number,
  _listId: number,
  payload: ToggleShoppingListItemPurchasedPayload
): Promise<ShoppingListItem> {
  const data = await apiRequest<ShoppingListItemApi>(`/items/${id}`, {
    method: 'PATCH',
    body: { is_purchased: payload.isPurchased },
  });

  return normalizeShoppingListItem(data);
}

export async function createShoppingSupplier(
  payload: ShoppingSupplierCreatePayload
): Promise<ShoppingSupplierOption> {
  const data = await apiRequest<ShoppingSupplierOptionApi>('/suppliers', {
    method: 'POST',
    body: serializeShoppingSupplierPayload(payload),
  });

  return normalizeShoppingSupplierOption(data);
}

export async function updateShoppingSupplier(
  id: number,
  payload: ShoppingSupplierUpdatePayload
): Promise<ShoppingSupplierOption> {
  const data = await apiRequest<ShoppingSupplierOptionApi>(`/suppliers/${id}`, {
    method: 'PATCH',
    body: serializeShoppingSupplierPayload(payload),
  });

  return normalizeShoppingSupplierOption(data);
}

export async function deleteShoppingSupplier(id: number): Promise<void> {
  await apiRequest<void>(`/suppliers/${id}`, {
    method: 'DELETE',
  });
}

export async function createShoppingPrice(
  payload: ShoppingPriceCreatePayload
): Promise<void> {
  await apiRequest<void>('/prices', {
    method: 'POST',
    body: serializeShoppingPriceCreatePayload(payload),
  });
}

export async function updateShoppingPrice(
  priceId: number,
  payload: ShoppingPriceUpdatePayload
): Promise<void> {
  await apiRequest<void>(`/prices/${priceId}`, {
    method: 'PUT',
    body: serializeShoppingPriceUpdatePayload(payload),
  });
}

export async function deleteShoppingPrice(priceId: number): Promise<void> {
  await apiRequest<void>(`/prices/${priceId}`, {
    method: 'DELETE',
  });
}