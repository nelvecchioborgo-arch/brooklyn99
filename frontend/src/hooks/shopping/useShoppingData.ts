// frontend/src/hooks/shopping/useShoppingData.ts
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  ShoppingListItem,
  ShoppingListSummary,
  UseShoppingDataResult,
} from '@/types/shopping';
import {
  fetchShoppingListItems,
  fetchShoppingLists,
} from '@/api/shoppingApi';

const shoppingQueryKeys = {
  all: ['shopping'] as const,
  lists: () => [...shoppingQueryKeys.all, 'lists'] as const,
  items: (listId: number | null) =>
    [...shoppingQueryKeys.all, 'items', listId] as const,
};

export function useShoppingData(): UseShoppingDataResult {
  const queryClient = useQueryClient();

  const [activeListId, setActiveListId] = useState<number | null>(null);

  const {
    data: lists = [],
    isLoading: listsLoading,
  } = useQuery<ShoppingListSummary[]>({
    queryKey: shoppingQueryKeys.lists(),
    queryFn: fetchShoppingLists,
    staleTime: 60_000,
  });

  const {
    data: items = [],
    isLoading: itemsLoading,
  } = useQuery<ShoppingListItem[]>({
    queryKey: shoppingQueryKeys.items(activeListId),
    queryFn: () => fetchShoppingListItems(activeListId as number),
    enabled: activeListId !== null,
    staleTime: 30_000,
  });

  useEffect(() => {
    setActiveListId((current) => {
      if (current && lists.some((list) => list.id === current)) {
        return current;
      }

      return lists.length > 0 ? lists[0].id : null;
    });
  }, [lists]);

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? null,
    [lists, activeListId]
  );

  const refreshLists = async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: shoppingQueryKeys.lists(),
    });
  };

  const refreshItems = async (listId: number): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: shoppingQueryKeys.items(listId),
    });
  };

  const refreshBootstrap = async (): Promise<void> => {
    return Promise.resolve();
  };

  return {
    lists,
    activeListId,
    activeList,
    items,
    suppliers: [],
    products: [],
    config: null,
    listsLoading,
    itemsLoading: activeListId === null ? false : itemsLoading,
    bootstrapLoading: false,
    setActiveListId,
    refreshLists,
    refreshItems,
    refreshBootstrap,
  };
}