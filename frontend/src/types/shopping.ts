// frontend/src/types/shopping.ts

export type ShoppingViewMode = 'items' | 'bulk-purchase';
export type ShoppingFilterStatus = 'tutti' | 'aperti' | 'completati';

export interface ConfigOption {
  id: number;
  codeType: string;
  codeValue: string;
  codeName: string;
  sortOrder?: number | null;
  active: boolean;
}

export interface ShoppingGroupSummary {
  id: number;
  name: string;
  description?: string | null;
  statusId: number;
  statusCode?: string | null;
}

export interface ShoppingListSummary {
  id: number;
  userId: number;
  groupId?: number | null;
  visibilityId: number;
  visibilityCode?: string | null;
  statusId: number;
  statusCode?: string | null;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;

  group?: ShoppingGroupSummary | null;

  totalItemsCount: number;
  openItemsCount: number;
  purchasedItemsCount: number;

  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
}

export interface ShoppingSupplierOption {
  id: number;
  name: string;
  nameNormalized: string;
  statusId: number;
  statusCode?: string | null;
}

export interface ShoppingProductOption {
  id: number;
  nameNormalized: string;
  displayName?: string | null;
}

export interface ShoppingListItem {
  id: number;
  shoppingListId: number;
  productId: number;

  nameOriginal: string;
  nameNormalized: string;

  quantity?: number | null;
  unitId?: number | null;
  unitLabel?: string | null;

  notes?: string | null;

  statusId: number;
  statusCode?: string | null;

  isPurchased: boolean;
  purchasedAt?: string | null;
  purchasedByUserId?: number | null;
  purchasedByUsername?: string | null;

  createdByUserId: number;
  createdByUsername?: string | null;
  updatedByUserId?: number | null;

  createdAt: string;
  updatedAt?: string | null;

  canEdit: boolean;
  canTogglePurchased: boolean;
  canDelete: boolean;
}

export interface ShoppingListDetail {
  list: ShoppingListSummary;
  items: ShoppingListItem[];
}

export interface ShoppingPriceCreatePayload {
  shoppingListId: number;
  shoppingListItemId: number;
  productId: number;
  supplierId?: number | null;
  purchaseDate: string;
  price: number;
  currencyId?: number | null;
  offerFlagId?: number | null;
  expirationDate?: string | null;
}

export interface InventoryBatchRow {
  id: number;
  productId: number;
  listItemId?: number | null;
  purchaseDate: string;
  quantityPurchased: number;
  purchasePrice: number;
  supplierId?: number | null;
  supplierName?: string | null;
  isOnSale: boolean;
  expirationDate?: string | null;
  purchasedByUserId?: number | null;
  purchasedByUsername?: string | null;
}

export interface ShoppingConfigBundle {
  visibilityOptions: ConfigOption[];
  listStatusOptions: ConfigOption[];
  itemStatusOptions: ConfigOption[];
  unitOptions: ConfigOption[];
  currencyOptions: ConfigOption[];
  offerFlagOptions: ConfigOption[];
  groupRoleOptions: ConfigOption[];
}

export interface UseShoppingDataResult {
  lists: ShoppingListSummary[];
  activeListId: number | null;
  activeList: ShoppingListSummary | null;
  items: ShoppingListItem[];

  suppliers: ShoppingSupplierOption[];
  products: ShoppingProductOption[];
  config: ShoppingConfigBundle | null;

  listsLoading: boolean;
  itemsLoading: boolean;

  setActiveListId: (listId: number | null) => void;
  refreshLists: () => Promise<void>;
  refreshItems: (listId: number) => Promise<void>;
}