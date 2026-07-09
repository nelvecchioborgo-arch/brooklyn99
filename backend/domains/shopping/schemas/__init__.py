"""
Shopping domain schemas modularized.
Pydantic models for collaborative shopping workflows and inventory.
"""

from .groups import (
    ShoppingGroupCreate,
    ShoppingGroupUpdate,
    ShoppingGroupResponse,
    ShoppingGroupMemberCreate,
    ShoppingGroupMemberUpdate,
    ShoppingGroupMemberInvite,
    ShoppingGroupMemberRoleUpdate,
    ShoppingGroupMemberResponse,
    VALID_SHOPPING_GROUP_ROLE_CODES,
)

from .catalog import (
    ShoppingProductCreate,
    ShoppingProductUpdate,
    ShoppingProductResponse,
    ShoppingSupplierCreate,
    ShoppingSupplierUpdate,
    ShoppingSupplierResponse,
)

from .lists import (
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListResponse,
    ShoppingListItemCreate,
    ShoppingListItemUpdate,
    ShoppingListItemResponse,
)

from .inventory import (
    InventoryBatchCreate,
    InventoryBatchUpdate,
    InventoryBatchResponse,
    SupplierPriceSummary,
    PriceHistoryPoint,
)

__all__ = [
    "VALID_SHOPPING_GROUP_ROLE_CODES",
    "ShoppingGroupCreate",
    "ShoppingGroupUpdate",
    "ShoppingGroupResponse",
    "ShoppingGroupMemberCreate",
    "ShoppingGroupMemberUpdate",
    "ShoppingGroupMemberInvite",
    "ShoppingGroupMemberRoleUpdate",
    "ShoppingGroupMemberResponse",
    "ShoppingProductCreate",
    "ShoppingProductUpdate",
    "ShoppingProductResponse",
    "ShoppingSupplierCreate",
    "ShoppingSupplierUpdate",
    "ShoppingSupplierResponse",
    "ShoppingListCreate",
    "ShoppingListUpdate",
    "ShoppingListResponse",
    "ShoppingListItemCreate",
    "ShoppingListItemUpdate",
    "ShoppingListItemResponse",
    "InventoryBatchCreate",
    "InventoryBatchUpdate",
    "InventoryBatchResponse",
    "SupplierPriceSummary",
    "PriceHistoryPoint",
]