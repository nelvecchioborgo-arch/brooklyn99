// src/hooks/shopping/useShoppingMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  createShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  toggleShoppingListItemPurchased,
  createShoppingSupplier,
  updateShoppingSupplier,
  deleteShoppingSupplier,
  createShoppingPrice,
  updateShoppingPrice,
  deleteShoppingPrice,
  shoppingQueryKeys,
} from '@/api/shoppingApi';

import type {
  ShoppingListCreatePayload,
  ShoppingListUpdatePayload,
  ShoppingListItemCreatePayload,
  ShoppingListItemUpdatePayload,
  ToggleShoppingListItemPurchasedPayload,
  ShoppingSupplierCreatePayload,
  ShoppingSupplierUpdatePayload,
  ShoppingPriceUpdatePayload,
} from '@/api/shoppingApi';

import type { ShoppingPriceCreatePayload } from '@/types/shopping';

interface UpdateListArgs {
  id: number;
  data: ShoppingListUpdatePayload;
}

interface UpdateItemArgs {
  id: number;
  data: ShoppingListItemUpdatePayload;
}

interface DeleteItemArgs {
  id: number;
  listId?: number;
}

interface TogglePurchasedArgs {
  id: number;
  listId: number;
  data: ToggleShoppingListItemPurchasedPayload;
}

interface UpdateSupplierArgs {
  id: number;
  data: ShoppingSupplierUpdatePayload;
}

interface UpdatePriceArgs {
  priceId: number;
  data: ShoppingPriceUpdatePayload;
}

export const useShoppingMutations = () => {
  const queryClient = useQueryClient();

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.lists() });

  const invalidateItems = (listId: number) =>
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.items(listId) });

  const invalidateAllItems = () =>
    queryClient.invalidateQueries({
      queryKey: [...shoppingQueryKeys.all, 'items'],
    });

  const invalidateSuppliers = () =>
    queryClient.invalidateQueries({
      queryKey: shoppingQueryKeys.suppliers(),
    });

  const createListMutation = useMutation({
    mutationFn: createShoppingList,
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: UpdateListArgs) => updateShoppingList(id, data),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: number) => deleteShoppingList(id),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const createItemMutation = useMutation({
    mutationFn: createShoppingListItem,
    onSuccess: async (_data, vars) => {
      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.shoppingListId),
      ]);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: UpdateItemArgs) =>
      updateShoppingListItem(id, data),
    onSuccess: async () => {
      await Promise.all([invalidateLists(), invalidateAllItems()]);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ id }: DeleteItemArgs) => deleteShoppingListItem(id),
    onSuccess: async (_data, vars) => {
      if (typeof vars.listId === 'number') {
        await Promise.all([
          invalidateLists(),
          invalidateItems(vars.listId),
        ]);
        return;
      }

      await Promise.all([invalidateLists(), invalidateAllItems()]);
    },
  });

  const togglePurchasedMutation = useMutation({
    mutationFn: ({ id, data }: TogglePurchasedArgs) =>
      toggleShoppingListItemPurchased(id, data),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.listId),
      ]);
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: createShoppingSupplier,
    onSuccess: async () => {
      await invalidateSuppliers();
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: UpdateSupplierArgs) =>
      updateShoppingSupplier(id, data),
    onSuccess: async () => {
      await invalidateSuppliers();
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => deleteShoppingSupplier(id),
    onSuccess: async () => {
      await invalidateSuppliers();
    },
  });

  const addPriceMutation = useMutation({
    mutationFn: createShoppingPrice,
    onSuccess: async (_data, vars: ShoppingPriceCreatePayload) => {
      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.shoppingListId),
      ]);
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ priceId, data }: UpdatePriceArgs) =>
      updateShoppingPrice(priceId, data),
    onSuccess: async () => {
      await Promise.all([invalidateLists(), invalidateAllItems()]);
    },
  });

  const deletePriceMutation = useMutation({
    mutationFn: (priceId: number) => deleteShoppingPrice(priceId),
    onSuccess: async () => {
      await Promise.all([invalidateLists(), invalidateAllItems()]);
    },
  });

  return {
    createList: (payload: ShoppingListCreatePayload) =>
      createListMutation.mutateAsync(payload),

    updateList: (args: UpdateListArgs) =>
      updateListMutation.mutateAsync(args),

    deleteList: (id: number) =>
      deleteListMutation.mutateAsync(id),

    createItem: (payload: ShoppingListItemCreatePayload) =>
      createItemMutation.mutateAsync(payload),

    updateItem: (args: UpdateItemArgs) =>
      updateItemMutation.mutateAsync(args),

    deleteItem: (args: DeleteItemArgs) =>
      deleteItemMutation.mutateAsync(args),

    togglePurchased: (args: TogglePurchasedArgs) =>
      togglePurchasedMutation.mutateAsync(args),

    createSupplier: (payload: ShoppingSupplierCreatePayload) =>
      createSupplierMutation.mutateAsync(payload),

    updateSupplier: (args: UpdateSupplierArgs) =>
      updateSupplierMutation.mutateAsync(args),

    deleteSupplier: (id: number) =>
      deleteSupplierMutation.mutateAsync(id),

    addPrice: (payload: ShoppingPriceCreatePayload) =>
      addPriceMutation.mutateAsync(payload),

    updatePrice: (args: UpdatePriceArgs) =>
      updatePriceMutation.mutateAsync(args),

    deletePrice: (priceId: number) =>
      deletePriceMutation.mutateAsync(priceId),
  };
};