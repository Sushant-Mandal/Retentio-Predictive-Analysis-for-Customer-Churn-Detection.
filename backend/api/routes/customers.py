"""
api/routes/customers.py
=======================
Customer retrieval, search, and detail endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from services.auth_service import get_current_user
from services.customer_service import (
    get_at_risk,
    get_customer_detail,
    get_saved,
    search_customers,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/at-risk")
async def at_risk(current_user: dict = Depends(get_current_user)):
    """List all current at-risk customers for this user."""
    user_id = current_user["_id"]
    rows = await get_at_risk(user_id)
    return {"customers": rows}


@router.get("/saved")
async def saved(current_user: dict = Depends(get_current_user)):
    """List all saved (recovered) customers for this user."""
    user_id = current_user["_id"]
    rows = await get_saved(user_id)
    return {"customers": rows}


@router.get("/search")
async def search(
    q: str = Query("", min_length=0),
    status: str | None = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Search customers by name or ID, optionally filtered by status."""
    user_id = current_user["_id"]
    if not q.strip() and not status:
        # Default: return all at-risk when no query and no status specified
        rows = await get_at_risk(user_id)
    else:
        rows = await search_customers(user_id, q, status=status)
    return {"customers": rows}



@router.get("/{customer_id}")
async def detail(
    customer_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get individual customer detail including score history."""
    user_id = current_user["_id"]
    record = await get_customer_detail(user_id, customer_id)
    if not record:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return record
