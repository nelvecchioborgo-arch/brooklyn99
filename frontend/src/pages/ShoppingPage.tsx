import React, { useMemo, useRef, useState } from 'react';
import ShoppingHeaderBar from '../components/shared/shopping/ShoppingHeaderBar';
import ShoppingListsColumn from '../components/shared/shopping/ShoppingListsColumn';
import ShoppingItemsColumn, {
  type ShoppingItemsColumnHandle,
} from '../components/shared/shopping/ShoppingItemsColumn';
import ShoppingBulkPurchasePanel from '../components/shared/shopping/ShoppingBulkPurchasePanel';

import { useShoppingData } from '../hooks/shopping/useShoppingData';
import type { ShoppingListItem, ShoppingViewMode } from '../types/shopping';

const ShoppingPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ShoppingViewMode>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const itemsColumnRef = useRef<ShoppingItemsColumnHandle | null>(null);

  const {
    lists,
    groups,
    items,
    suppliers,
    config,
    activeListId,
    activeList,
    setActiveListId,
    groupsLoading,
    listsLoading,
    itemsLoading,
    isInitialLoading,
  } = useShoppingData();

  const unitOptions = config?.unitOptions ?? [];
  const currencyOptions = config?.currencyOptions ?? [];
  const offerFlagOptions = config?.offerFlagOptions ?? [];
  const listVisibilityOptions = config?.visibilityOptions ?? [];
  const listStatusOptions = config?.listStatusOptions ?? [];
  // FIX: il backend non fornisce itemStatusOptions, ma questi sì.
  const groupRoleOptions = config?.groupRoleOptions ?? [];
  const supplierStatusOptions = config?.supplierStatusOptions ?? [];

  const filteredItems = useMemo<ShoppingListItem[]>(() => {
    // Anti-Corruption Layer (ACL): Normalizziamo i dati dal backend (snake_case)
    // al formato atteso dal frontend (camelCase) in un unico punto.
    // Questo garantisce coerenza a tutti i componenti figli.
    const mappedItems = items.map((item: any) => {
      const normalizedItem: ShoppingListItem = {
        ...item,
        shoppingListId: item.shopping_list_id,
        productName: item.product_name,
        isPurchased: item.is_purchased,
        unitId: item.unit_id,
        unitCodeName: item.unit_code_name,
        statusId: item.status_id,
        productId: item.product_id,
      };

      // Calcoliamo i dati dell'ultimo acquisto dagli inventory_batches
      if (item.inventory_batches && item.inventory_batches.length > 0) {
        const sortedBatches = [...item.inventory_batches].sort(
          (a, b) =>
            new Date(b.purchase_date).getTime() -
            new Date(a.purchase_date).getTime()
        );
        const lastBatch = sortedBatches[0];
        normalizedItem.lastPurchaseDate = lastBatch.purchase_date;
        normalizedItem.lastPrice = lastBatch.purchase_price;
        normalizedItem.lastSupplierName = lastBatch.supplier_name;
      }
      return normalizedItem;
    });

    if (!searchQuery) {
      return mappedItems;
    }

    const q = searchQuery.trim().toLowerCase();
    return mappedItems.filter((item) => {
      const name = (item.productName ?? '').trim().toLowerCase();
      return name.includes(q);
    });
  }, [items, searchQuery]);

  const openItems = useMemo(
    () => filteredItems.filter((item) => !item.isPurchased),
    [filteredItems]
  );

  const purchasedItems = useMemo(
    () => filteredItems.filter((item) => item.isPurchased),
    [filteredItems]
  );

  const totalItemsCount = filteredItems.length;
  const openItemsCount = openItems.length;
  const purchasedItemsCount = purchasedItems.length;

  const listModeLabel = useMemo(() => {
    if (!activeList) return null;
    return activeList.groupId ? 'Gruppo' : 'Privata';
  }, [activeList]);

  const hasLists = lists.length > 0;
  const hasActiveList = activeListId != null && activeList != null;

  const handleSelectList = (listId: number | null) => {
    setActiveListId(listId);
    setSearchQuery('');
    setViewMode('items');
  };

  const handleAddItem = () => {
    if (!hasActiveList) return;
    setViewMode('items');
    itemsColumnRef.current?.openCreateModal();
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-slate-100">
      <ShoppingHeaderBar
        activeListId={activeListId}
        activeListName={activeList?.name ?? null}
        listModeLabel={listModeLabel}
        openItemsCount={openItemsCount}
        purchasedItemsCount={purchasedItemsCount}
        totalItemsCount={totalItemsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddItem={handleAddItem}
        onOpenActions={() => {
          // TODO: collegare drawer azioni lista quando disponibile
        }}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden h-full w-[320px] shrink-0 border-r border-slate-200 bg-white xl:block">
          <div className="flex h-full min-h-0 flex-col">
            <ShoppingListsColumn
              lists={lists}
              loadingLists={listsLoading}
              activeListId={activeListId}
              setActiveListId={handleSelectList}
              groups={groups}
              listVisibilityOptions={listVisibilityOptions}
              listStatusOptions={listStatusOptions}
              groupRoleOptions={groupRoleOptions}
              supplierStatusOptions={supplierStatusOptions}
            />
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            {isInitialLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                <div className="max-w-md">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Caricamento shopping
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Sto caricando liste e articoli della lista attiva.
                  </p>
                </div>
              </div>
            ) : !hasLists ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="max-w-md">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Nessuna lista disponibile
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Crea una nuova lista per iniziare ad aggiungere articoli e
                    registrare gli acquisti.
                  </p>
                </div>
              </div>
            ) : !hasActiveList ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="max-w-md">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Nessuna lista selezionata
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Seleziona una lista dalla colonna laterale per visualizzare
                    gli articoli e registrare gli acquisti.
                  </p>
                </div>
              </div>
            ) : viewMode === 'bulk-purchase' ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <ShoppingBulkPurchasePanel
                  activeList={activeList}
                  items={openItems}
                  suppliers={suppliers}
                  currencyOptions={currencyOptions}
                  offerFlagOptions={offerFlagOptions}
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <ShoppingItemsColumn
                  ref={itemsColumnRef}
                  activeList={activeList}
                  activeListId={activeListId}
                  items={filteredItems}
                  suppliers={suppliers}
                  unitOptions={unitOptions}
                  currencyOptions={currencyOptions}
                  offerFlagOptions={offerFlagOptions}
                  searchQuery={searchQuery}
                  loading={itemsLoading}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShoppingPage;