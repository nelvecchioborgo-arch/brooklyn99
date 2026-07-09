"""Repository del dominio Shopping — solo accesso ai dati."""

from datetime import date, datetime, timezone
from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload, with_loader_criteria

from backend.domains.catalogs.models import ConfigCode
from backend.domains.shopping.models import (
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    InventoryBatch,
    ShoppingProduct,
    ShoppingSupplier,
)
from backend.domains.users.models import User


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return date.today()


def _normalize_name(value: str) -> str:
    return value.strip().lower()


def _soft_delete_criteria():
    return (
        with_loader_criteria(ShoppingGroup, ShoppingGroup.deleted_at.is_(None), include_aliases=True),
        with_loader_criteria(ShoppingGroupMember, ShoppingGroupMember.removed_at.is_(None), include_aliases=True),
        with_loader_criteria(ShoppingList, ShoppingList.deleted_at.is_(None), include_aliases=True),
        with_loader_criteria(ShoppingListItem, ShoppingListItem.deleted_at.is_(None), include_aliases=True),
        with_loader_criteria(ShoppingProduct, ShoppingProduct.deleted_at.is_(None), include_aliases=True),
        with_loader_criteria(ShoppingSupplier, ShoppingSupplier.deleted_at.is_(None), include_aliases=True),
        with_loader_criteria(InventoryBatch, InventoryBatch.deleted_at.is_(None), include_aliases=True),
    )


def _batch_loaders():
    return (
        selectinload(InventoryBatch.product),
        selectinload(InventoryBatch.supplier),
        selectinload(InventoryBatch.list_item),
        selectinload(InventoryBatch.purchased_by_user),
        selectinload(InventoryBatch.created_by_user),
        selectinload(InventoryBatch.updated_by_user),
    )


def _list_loaders():
    return (
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.product),
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.unit),
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.created_by_user),
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.updated_by_user),
        selectinload(ShoppingList.items)
        .selectinload(ShoppingListItem.inventory_batches)
        .selectinload(InventoryBatch.product),
        selectinload(ShoppingList.items)
        .selectinload(ShoppingListItem.inventory_batches)
        .selectinload(InventoryBatch.supplier),
        selectinload(ShoppingList.items)
        .selectinload(ShoppingListItem.inventory_batches)
        .selectinload(InventoryBatch.created_by_user),
        selectinload(ShoppingList.items)
        .selectinload(ShoppingListItem.inventory_batches)
        .selectinload(InventoryBatch.updated_by_user),
        selectinload(ShoppingList.items)
        .selectinload(ShoppingListItem.inventory_batches)
        .selectinload(InventoryBatch.purchased_by_user),
    )


def _item_loaders():
    return (
        selectinload(ShoppingListItem.shopping_list),
        selectinload(ShoppingListItem.product),
        selectinload(ShoppingListItem.unit),
        selectinload(ShoppingListItem.created_by_user),
        selectinload(ShoppingListItem.updated_by_user),
        selectinload(ShoppingListItem.inventory_batches).selectinload(InventoryBatch.product),
        selectinload(ShoppingListItem.inventory_batches).selectinload(InventoryBatch.supplier),
        selectinload(ShoppingListItem.inventory_batches).selectinload(InventoryBatch.created_by_user),
        selectinload(ShoppingListItem.inventory_batches).selectinload(InventoryBatch.updated_by_user),
        selectinload(ShoppingListItem.inventory_batches).selectinload(InventoryBatch.purchased_by_user),
    )


# ------------------------------------------------------------------ Groups
def list_groups(db: Session, user_id: int) -> List[ShoppingGroup]:
    owned = (
        db.query(ShoppingGroup)
        .options(*_soft_delete_criteria())
        .filter(
            ShoppingGroup.owner_id == user_id,
            ShoppingGroup.deleted_at.is_(None),
        )
        .order_by(ShoppingGroup.created_at.asc())
        .all()
    )

    member_of = (
        db.query(ShoppingGroup)
        .options(*_soft_delete_criteria())
        .join(ShoppingGroupMember, ShoppingGroupMember.group_id == ShoppingGroup.id)
        .filter(
            ShoppingGroup.deleted_at.is_(None),
            ShoppingGroupMember.user_id == user_id,
            ShoppingGroupMember.removed_at.is_(None),
            ShoppingGroup.owner_id != user_id,
        )
        .order_by(ShoppingGroup.created_at.asc())
        .all()
    )

    return owned + member_of


def get_group_owned(db: Session, group_id: int, user_id: int) -> Optional[ShoppingGroup]:
    return (
        db.query(ShoppingGroup)
        .options(*_soft_delete_criteria())
        .filter(
            ShoppingGroup.id == group_id,
            ShoppingGroup.owner_id == user_id,
            ShoppingGroup.deleted_at.is_(None),
        )
        .first()
    )


def get_group_accessible(db: Session, group_id: int, user_id: int) -> Optional[ShoppingGroup]:
    group = (
        db.query(ShoppingGroup)
        .options(*_soft_delete_criteria())
        .filter(
            ShoppingGroup.id == group_id,
            ShoppingGroup.deleted_at.is_(None),
        )
        .first()
    )
    if not group:
        return None

    if group.owner_id == user_id:
        return group

    membership = (
        db.query(ShoppingGroupMember)
        .filter(
            ShoppingGroupMember.group_id == group_id,
            ShoppingGroupMember.user_id == user_id,
            ShoppingGroupMember.removed_at.is_(None),
        )
        .first()
    )
    return group if membership else None


def create_group(db: Session, group: ShoppingGroup) -> ShoppingGroup:
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


def update_group(db: Session, group: ShoppingGroup) -> ShoppingGroup:
    db.commit()
    db.refresh(group)
    return group


def delete_group(db: Session, group: ShoppingGroup) -> None:
    now = _now()
    group.deleted_at = now

    for member in group.members:
        if member.removed_at is None:
            member.removed_at = now

    for shopping_list in group.shopping_lists:
        if shopping_list.deleted_at is None:
            shopping_list.group_id = None

    db.commit()


# ------------------------------------------------------------------ Group Members
def list_members(db: Session, group_id: int) -> List[ShoppingGroupMember]:
    return (
        db.query(ShoppingGroupMember)
        .filter(
            ShoppingGroupMember.group_id == group_id,
            ShoppingGroupMember.removed_at.is_(None),
        )
        .order_by(ShoppingGroupMember.created_at.asc())
        .all()
    )


def get_member(db: Session, group_id: int, user_id: int) -> Optional[ShoppingGroupMember]:
    return (
        db.query(ShoppingGroupMember)
        .filter(
            ShoppingGroupMember.group_id == group_id,
            ShoppingGroupMember.user_id == user_id,
            ShoppingGroupMember.removed_at.is_(None),
        )
        .first()
    )


def add_member(db: Session, member: ShoppingGroupMember) -> ShoppingGroupMember:
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_member(db: Session, member: ShoppingGroupMember) -> ShoppingGroupMember:
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, member: ShoppingGroupMember) -> None:
    member.removed_at = _now()
    db.commit()


def find_user_by_username_or_email(
    db: Session,
    username: Optional[str] = None,
    email: Optional[str] = None,
) -> Optional[User]:
    query = db.query(User)
    if username:
        return query.filter(User.username == username).first()
    if email:
        return query.filter(User.email == email.lower()).first()
    return None


def resolve_role_id(db: Session, role_code: str) -> Optional[int]:
    return (
        db.query(ConfigCode.id)
        .filter(
            ConfigCode.code_type == "shopping_group_role",
            ConfigCode.code_value == role_code,
        )
        .scalar()
    )


def active_group_status_id(db: Session) -> Optional[int]:
    return (
        db.query(ConfigCode.id)
        .filter(
            ConfigCode.code_type == "group_status",
            ConfigCode.code_value == "active",
        )
        .scalar()
    )


# ------------------------------------------------------------------ Lists
def list_lists(db: Session, owner_id: int) -> List[ShoppingList]:
    return (
        db.query(ShoppingList)
        .options(*_list_loaders(), *_soft_delete_criteria())
        .filter(
            ShoppingList.owner_id == owner_id,
            ShoppingList.deleted_at.is_(None),
        )
        .order_by(ShoppingList.created_at.asc())
        .all()
    )


def get_list_owned(db: Session, list_id: int, owner_id: int) -> Optional[ShoppingList]:
    return (
        db.query(ShoppingList)
        .options(*_list_loaders(), *_soft_delete_criteria())
        .filter(
            ShoppingList.id == list_id,
            ShoppingList.owner_id == owner_id,
            ShoppingList.deleted_at.is_(None),
        )
        .first()
    )


# ------------------------------------------------------------------ Products
def list_products(db: Session, search: Optional[str] = None, limit: int = 50) -> List[ShoppingProduct]:
    query = db.query(ShoppingProduct).filter(ShoppingProduct.deleted_at.is_(None))

    if search:
        normalized = _normalize_name(search)
        query = query.filter(ShoppingProduct.name_normalized.ilike(f"{normalized}%"))

    return query.order_by(ShoppingProduct.name_normalized.asc()).limit(limit).all()


def get_product(db: Session, product_id: int) -> Optional[ShoppingProduct]:
    return (
        db.query(ShoppingProduct)
        .filter(
            ShoppingProduct.id == product_id,
            ShoppingProduct.deleted_at.is_(None),
        )
        .first()
    )


def get_product_by_name_normalized(db: Session, name_normalized: str) -> Optional[ShoppingProduct]:
    return (
        db.query(ShoppingProduct)
        .filter(
            ShoppingProduct.name_normalized == name_normalized,
            ShoppingProduct.deleted_at.is_(None),
        )
        .first()
    )


# ------------------------------------------------------------------ Items
def list_items(
    db: Session,
    owner_id: int,
    shopping_list_id: Optional[int] = None,
    is_purchased: Optional[bool] = None,
) -> List[ShoppingListItem]:
    query = (
        db.query(ShoppingListItem)
        .join(ShoppingList, ShoppingList.id == ShoppingListItem.shopping_list_id)
        .options(*_item_loaders(), *_soft_delete_criteria())
        .filter(
            ShoppingList.owner_id == owner_id,
            ShoppingList.deleted_at.is_(None),
            ShoppingListItem.deleted_at.is_(None),
        )
    )

    if shopping_list_id is not None:
        query = query.filter(ShoppingListItem.shopping_list_id == shopping_list_id)

    if is_purchased is not None:
        query = query.filter(ShoppingListItem.is_purchased == is_purchased)

    return query.order_by(ShoppingListItem.created_at.asc()).all()


def get_item(db: Session, item_id: int) -> Optional[ShoppingListItem]:
    return (
        db.query(ShoppingListItem)
        .options(*_item_loaders(), *_soft_delete_criteria())
        .filter(
            ShoppingListItem.id == item_id,
            ShoppingListItem.deleted_at.is_(None),
        )
        .first()
    )


def get_item_owned(db: Session, item_id: int, owner_id: int) -> Optional[ShoppingListItem]:
    return (
        db.query(ShoppingListItem)
        .join(ShoppingList, ShoppingList.id == ShoppingListItem.shopping_list_id)
        .options(*_item_loaders(), *_soft_delete_criteria())
        .filter(
            ShoppingListItem.id == item_id,
            ShoppingList.owner_id == owner_id,
            ShoppingList.deleted_at.is_(None),
            ShoppingListItem.deleted_at.is_(None),
        )
        .first()
    )


def item_has_active_batches(db: Session, list_item_id: int) -> bool:
    return (
        db.query(InventoryBatch.id)
        .filter(
            InventoryBatch.list_item_id == list_item_id,
            InventoryBatch.deleted_at.is_(None),
        )
        .first()
        is not None
    )


# ------------------------------------------------------------------ Suppliers
def list_suppliers(db: Session) -> List[ShoppingSupplier]:
    return (
        db.query(ShoppingSupplier)
        .filter(ShoppingSupplier.deleted_at.is_(None))
        .order_by(ShoppingSupplier.name.asc())
        .all()
    )


def get_supplier(db: Session, supplier_id: int) -> Optional[ShoppingSupplier]:
    return (
        db.query(ShoppingSupplier)
        .filter(
            ShoppingSupplier.id == supplier_id,
            ShoppingSupplier.deleted_at.is_(None),
        )
        .first()
    )


def find_supplier_by_name(db: Session, name: str) -> Optional[ShoppingSupplier]:
    normalized = _normalize_name(name)
    return (
        db.query(ShoppingSupplier)
        .filter(
            ShoppingSupplier.name_normalized == normalized,
            ShoppingSupplier.deleted_at.is_(None),
        )
        .first()
    )


def search_suppliers(db: Session, search: str, limit: int = 50) -> List[ShoppingSupplier]:
    normalized = _normalize_name(search)
    raw = search.strip()
    return (
        db.query(ShoppingSupplier)
        .filter(
            ShoppingSupplier.deleted_at.is_(None),
            or_(
                ShoppingSupplier.name_normalized.ilike(f"{normalized}%"),
                ShoppingSupplier.name.ilike(f"{raw}%"),
            ),
        )
        .order_by(ShoppingSupplier.name.asc())
        .limit(limit)
        .all()
    )


def supplier_has_batches(db: Session, supplier_id: int) -> bool:
    return (
        db.query(InventoryBatch.id)
        .filter(
            InventoryBatch.supplier_id == supplier_id,
            InventoryBatch.deleted_at.is_(None),
        )
        .first()
        is not None
    )


def active_supplier_status_id(db: Session) -> Optional[int]:
    return (
        db.query(ConfigCode.id)
        .filter(
            ConfigCode.code_type == "supplier_status",
            ConfigCode.code_value == "active",
        )
        .scalar()
    )


# ------------------------------------------------------------------ Inventory Batches
def list_batches_for_product(
    db: Session,
    product_id: int,
    limit: Optional[int] = None,
) -> List[InventoryBatch]:
    query = (
        db.query(InventoryBatch)
        .options(*_batch_loaders(), *_soft_delete_criteria())
        .filter(
            InventoryBatch.product_id == product_id,
            InventoryBatch.deleted_at.is_(None),
        )
        .order_by(InventoryBatch.purchase_date.desc(), InventoryBatch.created_at.desc())
    )

    if limit is not None:
        query = query.limit(limit)

    return query.all()


def get_batch(db: Session, batch_id: int) -> Optional[InventoryBatch]:
    return (
        db.query(InventoryBatch)
        .options(*_batch_loaders(), *_soft_delete_criteria())
        .filter(
            InventoryBatch.id == batch_id,
            InventoryBatch.deleted_at.is_(None),
        )
        .first()
    )


# ------------------------------------------------------------------ Generic helpers
def add(db: Session, obj) -> None:
    db.add(obj)


def commit(db: Session) -> None:
    db.commit()


def refresh(db: Session, obj) -> None:
    db.refresh(obj)


def delete(db: Session, obj) -> None:
    if hasattr(obj, "deleted_at"):
        if isinstance(obj, InventoryBatch):
            obj.deleted_at = _today()
            if hasattr(obj, "updated_at"):
                obj.updated_at = _today()

        elif isinstance(obj, ShoppingList):
            now = _now()
            today = _today()
            obj.deleted_at = now

            for item in obj.items:
                if item.deleted_at is None:
                    item.deleted_at = now
                    if hasattr(item, "updated_at"):
                        item.updated_at = now

                    for batch in item.inventory_batches:
                        if batch.deleted_at is None:
                            batch.deleted_at = today
                            batch.updated_at = today

        elif isinstance(obj, ShoppingListItem):
            now = _now()
            today = _today()
            obj.deleted_at = now
            if hasattr(obj, "updated_at"):
                obj.updated_at = now

            for batch in obj.inventory_batches:
                if batch.deleted_at is None:
                    batch.deleted_at = today
                    batch.updated_at = today

        else:
            obj.deleted_at = _now()
            if hasattr(obj, "updated_at"):
                obj.updated_at = _now()
    else:
        db.delete(obj)

    db.commit()