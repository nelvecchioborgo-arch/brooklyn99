// src/components/shared/shopping/ShoppingBulkPurchasePanel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useShoppingMutations } from '../../../hooks/shopping/useShoppingMutations';
import type {
  ConfigOption,
  ShoppingListItem,
  ShoppingListSummary,
  ShoppingSupplierOption,
} from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';
import {
  emptyPurchaseForm,
  getEurCurrencyId,
} from './shoppingItems.utils';
import type { PurchaseFormState } from './shoppingItems.utils';

interface BulkPurchaseRowState {
  item: ShoppingListItem;
  form: PurchaseFormState;
  saving: boolean;
}

interface ShoppingBulkPurchasePanelProps {
  activeList: ShoppingListSummary;
  items: ShoppingListItem[];
  suppliers: ShoppingSupplierOption[];
  currencyOptions: ConfigOption[];
  offerFlagOptions: ConfigOption[];
}

const renderConfigOptions = (options: ConfigOption[]) =>
  options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.codeName}
    </option>
  ));

const ShoppingBulkPurchasePanel: React.FC<ShoppingBulkPurchasePanelProps> = ({
  activeList,
  items,
  suppliers,
  currencyOptions,
  offerFlagOptions,
}) => {
  const mutations = useShoppingMutations();

  const eurCurrencyId = useMemo(
    () => getEurCurrencyId(currencyOptions),
    [currencyOptions]
  );

  const openItems = useMemo(
    () => items.filter((item) => !item.isPurchased),
    [items]
  );

  const [rows, setRows] = useState<BulkPurchaseRowState[]>([]);

  useEffect(() => {
    setRows(
      openItems.map((item) => ({
        item,
        form: {
          ...emptyPurchaseForm(eurCurrencyId),
          purchaseDate: new Date().toISOString().slice(0, 10),
        },
        saving: false,
      }))
    );
  }, [openItems, eurCurrencyId]);

  const updateRowForm = (
    itemId: number,
    updater: (prev: PurchaseFormState) => PurchaseFormState
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.item.id === itemId
          ? { ...row, form: updater(row.form) }
          : row
      )
    );
  };

  const handleSaveRow = async (itemId: number) => {
    const row = rows.find((r) => r.item.id === itemId);
    if (!row) return;

    const { item, form } = row;
    if (!form.price || !form.purchaseDate || !form.currencyId) {
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.item.id === itemId ? { ...r, saving: true } : r
      )
    );

    try {
      await mutations.addPrice({
        shoppingListId: activeList.id,
        shoppingListItemId: item.id,
        productId: item.productId,
        supplierId: form.supplierId ? Number(form.supplierId) : undefined,
        purchaseDate: form.purchaseDate,
        price: Number(form.price),
        currencyId: form.currencyId ? Number(form.currencyId) : undefined,
        offerFlagId: form.offerFlagId ? Number(form.offerFlagId) : undefined,
      });

      setRows((prev) => prev.filter((r) => r.item.id !== itemId));
    } finally {
      setRows((prev) =>
        prev.map((r) =>
          r.item.id === itemId ? { ...r, saving: false } : r
        )
      );
    }
  };

  if (openItems.length === 0) {
    return (
      <div className={`${shoppingCardClass} p-4 text-sm text-slate-500`}>
        Nessun articolo aperto da acquistare.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Acquisto multiplo
          </h2>
          <p className="text-xs text-slate-400">
            {openItems.length} articoli aperti nella lista {activeList.name}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(({ item, form, saving }) => (
          <div
            key={item.id}
            className={`${shoppingCardClass} flex flex-col gap-3 p-4`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {item.nameOriginal}
              </p>
              {item.notes ? (
                <p className="truncate text-xs text-slate-400">{item.notes}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                className={shoppingInputClass}
                value={form.supplierId}
                onChange={(e) =>
                  updateRowForm(item.id, (prev) => ({
                    ...prev,
                    supplierId: e.target.value,
                  }))
                }
              >
                <option value="">Nessun fornitore</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                min="0"
                className={shoppingInputClass}
                placeholder="Prezzo"
                value={form.price}
                onChange={(e) =>
                  updateRowForm(item.id, (prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="date"
                className={shoppingInputClass}
                value={form.purchaseDate}
                onChange={(e) =>
                  updateRowForm(item.id, (prev) => ({
                    ...prev,
                    purchaseDate: e.target.value,
                  }))
                }
                required
              />

              <select
                className={shoppingInputClass}
                value={form.currencyId}
                onChange={(e) =>
                  updateRowForm(item.id, (prev) => ({
                    ...prev,
                    currencyId: e.target.value,
                  }))
                }
              >
                <option value="">Valuta</option>
                {renderConfigOptions(currencyOptions)}
              </select>
            </div>

            <select
              className={shoppingInputClass}
              value={form.offerFlagId}
              onChange={(e) =>
                updateRowForm(item.id, (prev) => ({
                  ...prev,
                  offerFlagId: e.target.value,
                }))
              }
            >
              <option value="">Nessun flag offerta</option>
              {renderConfigOptions(offerFlagOptions)}
            </select>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleSaveRow(item.id)}
                disabled={saving}
                className={`${shoppingButtonPrimaryClass} disabled:opacity-50`}
              >
                {saving ? 'Salvataggio...' : 'Registra acquisto'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShoppingBulkPurchasePanel;