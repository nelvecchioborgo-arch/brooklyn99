// src/components/shared/shopping/ShoppingPurchaseModal.tsx
import React from 'react';
import type { ConfigOption, ShoppingSupplierOption } from '../../../types/shopping';
import type { PurchaseFormState } from './shoppingItems.utils';
import {
  shoppingButtonPrimaryClass,
  shoppingButtonSecondaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';
import { renderConfigOptions } from './shoppingItems.utils';

interface ShoppingPurchaseModalProps {
  open: boolean;
  itemName: string;
  purchaseForm: PurchaseFormState;
  setPurchaseForm: React.Dispatch<React.SetStateAction<PurchaseFormState>>;
  suppliers: ShoppingSupplierOption[];
  currencyOptions: ConfigOption[];
  offerFlagOptions: ConfigOption[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ShoppingPurchaseModal: React.FC<ShoppingPurchaseModalProps> = ({
  open,
  itemName,
  purchaseForm,
  setPurchaseForm,
  suppliers,
  currencyOptions,
  offerFlagOptions,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className={`${shoppingCardClass} w-full max-w-2xl p-5`}>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Registra acquisto</h2>

        <p className="mb-4 text-sm text-slate-500">
          Stai completando{' '}
          <span className="font-semibold text-slate-700">
            {itemName || 'articolo'}
          </span>
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              className={shoppingInputClass}
              value={purchaseForm.supplierId}
              onChange={(e) =>
                setPurchaseForm((prev) => ({
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
              value={purchaseForm.price}
              onChange={(e) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="date"
              className={shoppingInputClass}
              value={purchaseForm.purchaseDate}
              onChange={(e) =>
                setPurchaseForm((prev) => ({
                  ...prev,
                  purchaseDate: e.target.value,
                }))
              }
              required
            />

            <select
              className={shoppingInputClass}
              value={purchaseForm.currencyId}
              onChange={(e) =>
                setPurchaseForm((prev) => ({
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
            value={purchaseForm.offerFlagId}
            onChange={(e) =>
              setPurchaseForm((prev) => ({
                ...prev,
                offerFlagId: e.target.value,
              }))
            }
          >
            <option value="">Nessun flag offerta</option>
            {renderConfigOptions(offerFlagOptions)}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={shoppingButtonSecondaryClass}
            >
              Annulla
            </button>

            <button type="submit" className={shoppingButtonPrimaryClass}>
              Conferma acquisto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShoppingPurchaseModal;