// src/api/shoppingApi.ts
// API layer per Shopping - usa useApi() come useAgendaHome (non fetch raw)

import { useApi } from '../hooks/useApi';
import type {
  CatalogOption,
  ShoppingGroup,
  ShoppingGroupMember,
  ShoppingList,
  ShoppingListItem,
  ShoppingPrice,
  ShoppingSupplier,
  ListFormState,
  ItemFormState,
  SupplierFormState,
  PurchaseFormState,
  InviteFormState,
  ShoppingRole,
} from '../types/shopping';
import { SHOPPING_CODE_TYPES } from '../types/shopping';

function toNumberOrUndefined(value?: string | null) {
  return value != null && value !== '' ? Number(value) : undefined;
}

function toNumberOrNull(value?: string | null) {
  return value != null && value !== '' ? Number(value) : null;
}

// Helper: converte form state → payload API (string → number dove necessario)
function listFormToPayload(form: Partial<ListFormState>) {
  return {
    group_id: toNumberOrNull(form.group_id),
    visibility_id: toNumberOrUndefined(form.visibility_id),
    status_id: toNumberOrUndefined(form.status_id),
    name: form.name,
    description: form.description || null,
  };
}

function itemFormToPayload(form: Partial<ItemFormState>) {
  return {
    shopping_list_id: toNumberOrUndefined(form.shopping_list_id),
    name_original: form.name_original,
    quantity: toNumberOrNull(form.quantity),
    unit_id: toNumberOrNull(form.unit_id),
    notes: form.notes || null,
    status_id: toNumberOrUndefined(form.status_id),
  };
}

function supplierFormToPayload(form: Partial<SupplierFormState>) {
  return {
    name: form.name,
    status_id: toNumberOrUndefined(form.status_id),
  };
}

function purchaseFormToPayload(form: Partial<PurchaseFormState>) {
  return {
    supplier_id: toNumberOrNull(form.supplier_id),
    purchase_date: form.purchase_date || undefined,
    price: toNumberOrUndefined(form.price),
    currency_id: toNumberOrNull(form.currency_id),
    offer_flag_id: toNumberOrNull(form.offer_flag_id),
    product_name_original: form.product_name_original || null,
    product_name_normalized: form.product_name_normalized || null,
  };
}

function inviteFormToPayload(form: InviteFormState) {
  return {
    username: form.username || null,
    email: form.email || null,
    role_code: form.role_code,
  };
}

// ── Hook factory ──
export const useShoppingApi = () => {
  const api = useApi();

  // Catalogs
  const fetchCatalogOptions = (codeType: string) =>
    api.get<CatalogOption[]>(`/catalogs/codes/options/${codeType}`);

  const fetchGroupRoleOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.groupRole);

  const fetchListVisibilityOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.listVisibility);

  const fetchListStatusOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.listStatus);

  const fetchItemStatusOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.itemStatus);

  const fetchUnitOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.unit);

  const fetchCurrencyOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.currency);

  const fetchOfferFlagOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.offerFlag);

  const fetchSupplierStatusOptions = () =>
    fetchCatalogOptions(SHOPPING_CODE_TYPES.supplierStatus);

  // Groups
  const fetchGroups = () => api.get<ShoppingGroup[]>('/shopping/groups');

  const createGroup = (name: string, description?: string) =>
    api.post<ShoppingGroup>('/shopping/groups', {
      name,
      description: description || null,
    });

  const updateGroup = (
    groupId: number,
    data: Partial<{ name: string; description: string | null; status_id: number }>
  ) => api.patch<ShoppingGroup>(`/shopping/groups/${groupId}`, data);

  const deleteGroup = (groupId: number) =>
    api.del(`/shopping/groups/${groupId}`);

  // Group Members
  const fetchMembers = (groupId: number) =>
    api.get<ShoppingGroupMember[]>(`/shopping/groups/${groupId}/members`);

  const addMember = (groupId: number, userId: number, roleId: number) =>
    api.post<ShoppingGroupMember>(`/shopping/groups/${groupId}/members`, {
      user_id: userId,
      role_id: roleId,
    });

  const inviteMember = (groupId: number, form: InviteFormState) =>
    api.post<ShoppingGroupMember>(
      `/shopping/groups/${groupId}/invite`,
      inviteFormToPayload(form)
    );

  const updateMemberRole = (
    groupId: number,
    userId: number,
    roleCode: ShoppingRole
  ) =>
    api.patch<ShoppingGroupMember>(
      `/shopping/groups/${groupId}/members/${userId}`,
      { role_code: roleCode }
    );

  const removeMember = (groupId: number, userId: number) =>
    api.del(`/shopping/groups/${groupId}/members/${userId}`);

  // Lists
  const fetchLists = () => api.get<ShoppingList[]>('/shopping/lists');

  const createList = (form: ListFormState) =>
    api.post<ShoppingList>('/shopping/lists', listFormToPayload(form));

  const updateList = (listId: number, form: Partial<ListFormState>) =>
    api.patch<ShoppingList>(`/shopping/lists/${listId}`, listFormToPayload(form));

  const deleteList = (listId: number) =>
    api.del(`/shopping/lists/${listId}`);

  // Items
  const fetchItems = (params?: { shopping_list_id?: number; is_purchased?: boolean }) => {
    const qs = new URLSearchParams();

    if (params?.shopping_list_id != null) {
      qs.set('shopping_list_id', String(params.shopping_list_id));
    }

    if (params?.is_purchased != null) {
      qs.set('is_purchased', String(params.is_purchased));
    }

    const query = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<ShoppingListItem[]>(`/shopping/items${query}`);
  };

  const createItem = (form: ItemFormState) =>
    api.post<ShoppingListItem>('/shopping/items', itemFormToPayload(form));

  const updateItem = (itemId: number, form: Partial<ItemFormState>) =>
    api.patch<ShoppingListItem>(`/shopping/items/${itemId}`, itemFormToPayload(form));

  const deleteItem = (itemId: number) =>
    api.del(`/shopping/items/${itemId}`);

  // Suppliers
  const fetchSuppliers = () => api.get<ShoppingSupplier[]>('/shopping/suppliers');

  const createSupplier = (form: SupplierFormState) =>
    api.post<ShoppingSupplier>('/shopping/suppliers', supplierFormToPayload(form));

  const updateSupplier = (supplierId: number, form: Partial<SupplierFormState>) =>
    api.patch<ShoppingSupplier>(
      `/shopping/suppliers/${supplierId}`,
      supplierFormToPayload(form)
    );

  const deleteSupplier = (supplierId: number) =>
    api.del(`/shopping/suppliers/${supplierId}`);

  // Prices
  const addPrice = (itemId: number, form: PurchaseFormState) =>
    api.post<ShoppingPrice>(
      `/shopping/items/${itemId}/prices`,
      purchaseFormToPayload(form)
    );

  const updatePrice = (priceId: number, form: Partial<PurchaseFormState>) =>
    api.patch<ShoppingPrice>(
      `/shopping/prices/${priceId}`,
      purchaseFormToPayload(form)
    );

  const deletePrice = (priceId: number) =>
    api.del(`/shopping/prices/${priceId}`);

  return {
    // Catalogs
    fetchCatalogOptions,
    fetchGroupRoleOptions,
    fetchListVisibilityOptions,
    fetchListStatusOptions,
    fetchItemStatusOptions,
    fetchUnitOptions,
    fetchCurrencyOptions,
    fetchOfferFlagOptions,
    fetchSupplierStatusOptions,

    // Groups
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,

    // Members
    fetchMembers,
    addMember,
    inviteMember,
    updateMemberRole,
    removeMember,

    // Lists
    fetchLists,
    createList,
    updateList,
    deleteList,

    // Items
    fetchItems,
    createItem,
    updateItem,
    deleteItem,

    // Suppliers
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,

    // Prices
    addPrice,
    updatePrice,
    deletePrice,
  };
};