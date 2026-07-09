"""
Shopping domain - Collaborative shopping and inventory tracking.
"""
from backend.domains.shopping.models import (
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    ShoppingProduct,        # AGGIUNTO: mancava nell'import originale
    InventoryBatch,
    ShoppingSupplier,
)
from backend.domains.shopping.schemas import (
    PriceHistoryPoint,
    ShoppingGroupCreate,
    ShoppingGroupMemberCreate,
    ShoppingGroupMemberInvite,
    ShoppingGroupMemberResponse,
    ShoppingGroupMemberRoleUpdate,
    ShoppingGroupMemberUpdate,
    ShoppingGroupResponse,
    ShoppingGroupUpdate,
    ShoppingListCreate,
    ShoppingListItemCreate,
    ShoppingListItemResponse,
    ShoppingListItemUpdate,
    ShoppingListResponse,
    ShoppingListUpdate,
    # NOTA: qui ci sono ancora gli schemi di ShoppingPrice perché 
    # non abbiamo ancora aggiornato schemas.py, ma non appena lo 
    # faremo andranno cambiati in InventoryBatchCreate ecc.
    # Per ora li lasciamo per far partire l'app, o fallirà schemas.py
    InventoryBatchCreate,
    InventoryBatchUpdate,
    InventoryBatchResponse,
    ShoppingSupplierCreate,
    ShoppingSupplierResponse,
    ShoppingSupplierUpdate,
    SupplierPriceSummary,
    VALID_SHOPPING_GROUP_ROLE_CODES,
)

__all__ = [
    "VALID_SHOPPING_GROUP_ROLE_CODES",
    "ShoppingGroup",
    "ShoppingGroupMember",
    "ShoppingList",
    "ShoppingListItem",
    "ShoppingProduct",      # AGGIUNTO
    "InventoryBatch",       # MODIFICATO: rimpiazza ShoppingPrice
    "ShoppingSupplier",
    "ShoppingGroupCreate",
    "ShoppingGroupMemberCreate",
    "ShoppingGroupMemberInvite",
    "ShoppingGroupMemberResponse",
    "ShoppingGroupMemberRoleUpdate",
    "ShoppingGroupMemberUpdate",
    "ShoppingGroupResponse",
    "ShoppingGroupUpdate",
    "ShoppingListCreate",
    "ShoppingListItemCreate",
    "ShoppingListItemResponse",
    "ShoppingListItemUpdate",
    "ShoppingListResponse",
    "ShoppingListUpdate",
    "InventoryBatchCreate",
    "InventoryBatchUpdate",
    "InventoryBatchResponse",
    "ShoppingSupplierCreate",
    "ShoppingSupplierResponse",
    "ShoppingSupplierUpdate",
    "SupplierPriceSummary",
    "PriceHistoryPoint",
]