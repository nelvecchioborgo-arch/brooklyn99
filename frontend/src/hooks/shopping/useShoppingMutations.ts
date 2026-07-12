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
  ShoppingListItem,
  ShoppingListItemCreatePayload,
  ShoppingListItemUpdatePayload,
  ShoppingSupplierCreatePayload,
  ShoppingSupplierUpdatePayload,
  ShoppingPriceCreatePayload,
  UpdateShoppingListArgs,
  UpdateShoppingListItemArgs,
  DeleteShoppingListItemArgs,
  ToggleShoppingListItemPurchasedArgs,
  UpdateShoppingSupplierArgs,
  UpdateShoppingPriceArgs,
  UseShoppingMutationsResult,
} from '@/types/shopping';

export const useShoppingMutations = (): UseShoppingMutationsResult => {
  const queryClient = useQueryClient();

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.lists() });

  const invalidateItems = (listId: number) =>
    queryClient.invalidateQueries({
      queryKey: shoppingQueryKeys.items(listId),
    });

  const invalidateAllItems = () =>
    queryClient.invalidateQueries({
      queryKey: [...shoppingQueryKeys.all, 'items'],
    });

  const invalidateSuppliers = () =>
    queryClient.invalidateQueries({
      queryKey: shoppingQueryKeys.suppliers(),
    });

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
    mutationFn: (payload: ShoppingListCreatePayload) =>
      createShoppingList(payload),
    onSuccess: async () => {
      await invalidateLists();
    },
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: UpdateShoppingListArgs) =>
      updateShoppingList(id, data),
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
    mutationFn: (payload: ShoppingListItemCreatePayload) =>
      createShoppingListItem(payload),
    onSuccess: async (createdItem, vars: ShoppingListItemCreatePayload) => {
      appendItemToCache(vars.shoppingListId, createdItem);

      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.shoppingListId),
      ]);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, listId, data }: UpdateShoppingListItemArgs) =>
      updateShoppingListItem(id, listId, data),
    onSuccess: async (updatedItem, vars: UpdateShoppingListItemArgs) => {
      replaceItemInCache(vars.listId, updatedItem);

      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.listId),
      ]);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ id }: DeleteShoppingListItemArgs) =>
      deleteShoppingListItem(id),
    onSuccess: async (_data, vars: DeleteShoppingListItemArgs) => {
      removeItemFromCache(vars.listId, vars.id);

      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.listId),
      ]);
    },
  });

  const togglePurchasedMutation = useMutation({
    mutationFn: ({ id, listId, data }: ToggleShoppingListItemPurchasedArgs) =>
      toggleShoppingListItemPurchased(id, listId, data),
    onSuccess: async (
      updatedItem,
      vars: ToggleShoppingListItemPurchasedArgs
    ) => {
      replaceItemInCache(vars.listId, updatedItem);

      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.listId),
      ]);
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (payload: ShoppingSupplierCreatePayload) =>
      createShoppingSupplier(payload),
    onSuccess: async () => {
      await invalidateSuppliers();
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: UpdateShoppingSupplierArgs) =>
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
    mutationFn: (payload: ShoppingPriceCreatePayload) =>
      createShoppingPrice(payload),
    onSuccess: async (_data, vars: ShoppingPriceCreatePayload) => {
      await Promise.all([
        invalidateLists(),
        invalidateItems(vars.shoppingListId),
      ]);
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ priceId, data }: UpdateShoppingPriceArgs) =>
      updateShoppingPrice(priceId, data),
    onSuccess: async (_data, vars: UpdateShoppingPriceArgs) => {
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

    updateList: (args: UpdateShoppingListArgs) =>
      updateListMutation.mutateAsync(args),

    deleteList: (id: number) => deleteListMutation.mutateAsync(id),

    createItem: (payload: ShoppingListItemCreatePayload) =>
      createItemMutation.mutateAsync(payload),

    updateItem: (args: UpdateShoppingListItemArgs) =>
      updateItemMutation.mutateAsync(args),

    deleteItem: (args: DeleteShoppingListItemArgs) =>
      deleteItemMutation.mutateAsync(args),

    togglePurchased: (args: ToggleShoppingListItemPurchasedArgs) =>
      togglePurchasedMutation.mutateAsync(args),

    createSupplier: (payload: ShoppingSupplierCreatePayload) =>
      createSupplierMutation.mutateAsync(payload),

    updateSupplier: (args: UpdateShoppingSupplierArgs) =>
      updateSupplierMutation.mutateAsync(args),

    deleteSupplier: (id: number) => deleteSupplierMutation.mutateAsync(id),

    addPrice: (payload: ShoppingPriceCreatePayload) =>
      addPriceMutation.mutateAsync(payload),

    updatePrice: (args: UpdateShoppingPriceArgs) =>
      updatePriceMutation.mutateAsync(args),

    deletePrice: (priceId: number) =>
      deletePriceMutation.mutateAsync(priceId),
  };
};