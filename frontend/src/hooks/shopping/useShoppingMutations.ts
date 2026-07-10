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

import type {
  ShoppingListItem,
  ShoppingPriceCreatePayload,
  UseShoppingMutationsResult,
} from '@/types/shopping';

interface UpdateListArgs {
  id: number;
  data: ShoppingListUpdatePayload;
}

interface UpdateItemArgs {
  id: number;
  listId: number;
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
  listId?: number;
}

export const useShoppingMutations = (): UseShoppingMutationsResult => {
  const queryClient = useQueryClient();

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.lists() });

  const invalidateItems = (listId: number) =>
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.items(listId) });

  const invalidateAllItems = () =>
    queryClient.invalidateQueries({ queryKey: ['shopping', 'items'] });

  const invalidateSuppliers = () =>
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.suppliers() });

  const replaceItemInCache = (listId: number, nextItem: ShoppingListItem) => {
    queryClient.setQueryData<ShoppingListItem[]>(
      shoppingQueryKeys.items(listId),
      (current = []) =>
        current.map((item) => (item.id === nextItem.id ? nextItem : item))
    );
  };

  const removeItemFromCache = (listId: number, itemId: number) => {
    queryClient.setQueryData<ShoppingListItem[]>(
      shoppingQueryKeys.items(listId),
      (current = []) => current.filter((item) => item.id !== itemId)
    );
  };

  const appendItemToCache = (listId: number, nextItem: ShoppingListItem) => {
    queryClient.setQueryData<ShoppingListItem[]>(
      shoppingQueryKeys.items(listId),
      (current = []) => {
        const exists = current.some((item) => item.id === nextItem.id);
        return exists ? current : [...current, nextItem];
      }
    );
  };

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
    onSuccess: async (createdItem, vars) => {
      appendItemToCache(vars.shoppingListId, createdItem);

      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.shoppingListId),
      ]);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: UpdateItemArgs) =>
      updateShoppingListItem(id, data),
    onSuccess: async (updatedItem, vars) => {
      replaceItemInCache(vars.listId, updatedItem);

      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.listId),
      ]);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ id }: DeleteItemArgs) => deleteShoppingListItem(id),
    onSuccess: async (_data, vars) => {
      if (typeof vars.listId === 'number') {
        removeItemFromCache(vars.listId, vars.id);

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
    onSuccess: async (updatedItem, vars) => {
      replaceItemInCache(vars.listId, updatedItem);

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
    onSuccess: async (_data, vars) => {
      await invalidateLists();

      if (typeof vars.listId === 'number') {
        await invalidateItems(vars.listId);
        return;
      }

      await invalidateAllItems();
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