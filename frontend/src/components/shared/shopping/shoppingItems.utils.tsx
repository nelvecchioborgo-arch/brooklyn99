// src/components/shared/shopping/shoppingItems.utils.tsx
import React from 'react';
import type { ConfigOption } from '../../../types/shopping';

export interface ItemFormState {
  shoppingListId: string;
  nameOriginal: string;
  quantity: string;
  unitId: string;
  notes: string;
  statusId: string;
}

export interface PurchaseFormState {
  supplierId: string;
  price: string;
  purchaseDate: string;
  currencyId: string;
  offerFlagId: string;
}

export const emptyItemForm = (shoppingListId = ''): ItemFormState => ({
  shoppingListId,
  nameOriginal: '',
  quantity: '',
  unitId: '',
  notes: '',
  statusId: '',
});

export const emptyPurchaseForm = (defaultCurrencyId = ''): PurchaseFormState => ({
  supplierId: '',
  price: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  currencyId: defaultCurrencyId,
  offerFlagId: '',
});

export const renderConfigOptions = (options: ConfigOption[]) =>
  options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.codeName}
    </option>
  ));

export const getEurCurrencyId = (currencyOptions: ConfigOption[]): string =>
  currencyOptions.find(
    (option) =>
      option.codeValue?.toUpperCase() === 'EUR' ||
      option.codeName?.toUpperCase() === 'EUR'
  )?.id?.toString() ?? '';