"""
services/customer_service.py
============================
Customer record management: upsert scores, status transitions, search.

Status transition logic (per Technical Architecture §5):
  - New customer & score ≥ benchmark        → insert, status "At Risk"
  - Existing "At Risk" & score < benchmark  → update, status "Saved"
  - Existing "At Risk" & score ≥ benchmark  → stays "At Risk"
  - Healthy customers (score < benchmark)   → stored but not flagged
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from db import get_db


async def upsert_customers(
    user_id: str,
    scored_rows: List[dict],
    benchmark: int = 78,
) -> dict:
    """
    Upsert customer records after a prediction run.

    For each scored row, applies status transition logic and appends
    the new score to the customer's history array.

    Returns {"at_risk": [...], "saved": [...]} with the final state.
    """
    db = get_db()
    collection = db.customers
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    at_risk: List[dict] = []
    saved: List[dict] = []

    for row in scored_rows:
        cid = row["customer_id"]
        score = row["score"]
        name = row.get("name", cid)

        # Fetch existing record for this user + customer
        existing = await collection.find_one(
            {"customer_id": cid, "user_id": user_id}
        )

        if existing:
            old_status = existing.get("status", "Healthy")
            # Determine new status
            if score >= benchmark:
                new_status = "At Risk"
            elif old_status == "At Risk" and score < benchmark:
                new_status = "Saved"
            else:
                new_status = "Healthy"

            # Update existing record
            await collection.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "name": name,
                        "current_score": score,
                        "status": new_status,
                        "updated_at": today,
                    },
                    "$push": {
                        "history": {"date": today, "score": score}
                    },
                },
            )

            result_row = {
                "customer_id": cid,
                "name": name,
                "score": score,
                "status": new_status,
                "meta": _build_meta(existing, score, new_status),
            }
        else:
            # New customer
            new_status = "At Risk" if score >= benchmark else "Healthy"
            await collection.insert_one(
                {
                    "customer_id": cid,
                    "user_id": user_id,
                    "name": name,
                    "current_score": score,
                    "status": new_status,
                    "history": [{"date": today, "score": score}],
                    "created_at": today,
                    "updated_at": today,
                }
            )

            result_row = {
                "customer_id": cid,
                "name": name,
                "score": score,
                "status": new_status,
                "meta": "new customer",
            }

        if new_status == "At Risk":
            at_risk.append(result_row)
        elif new_status == "Saved":
            saved.append(result_row)

    return {"at_risk": at_risk, "saved": saved}


def _build_meta(existing: dict, new_score: float, new_status: str) -> str:
    """Generate a human-readable meta note for the customer row."""
    history = existing.get("history", [])
    if not history:
        return "first score"

    prev_score = history[-1].get("score", 0)
    diff = round(new_score - prev_score, 1)

    if new_status == "Saved":
        return f"down from {prev_score:.0f}"
    elif diff > 0:
        return f"up {diff:+.0f} pts"
    elif diff < 0:
        return f"down {abs(diff):.0f} pts"
    return "no change"


# ── Query helpers ───────────────────────────────────────────────────────────


async def get_at_risk(user_id: str, limit: int = 50) -> List[dict]:
    db = get_db()
    cursor = db.customers.find(
        {"user_id": user_id, "status": "At Risk"}
    ).sort("current_score", -1).limit(limit)
    return [_row(doc) async for doc in cursor]


async def get_saved(user_id: str, limit: int = 50) -> List[dict]:
    db = get_db()
    cursor = db.customers.find(
        {"user_id": user_id, "status": "Saved"}
    ).sort("current_score", -1).limit(limit)
    return [_row(doc) async for doc in cursor]


async def search_customers(
    user_id: str,
    query: str = "",
    status: Optional[str] = None,
    limit: int = 100,
) -> List[dict]:
    db = get_db()
    filter_query: dict = {"user_id": user_id}

    clean_q = query.strip()
    if clean_q:
        regex = {"$regex": clean_q, "$options": "i"}
        filter_query["$or"] = [{"name": regex}, {"customer_id": regex}]

    if status and status.lower() != "all":
        st = status.lower()
        if st in ("at-risk", "at risk", "at_risk"):
            filter_query["status"] = "At Risk"
        elif st in ("saved", "recovered"):
            filter_query["status"] = "Saved"
        elif st in ("healthy",):
            filter_query["status"] = "Healthy"

    cursor = db.customers.find(filter_query).sort("current_score", -1).limit(limit)
    return [_row(doc) async for doc in cursor]



async def get_customer_detail(user_id: str, customer_id: str) -> Optional[dict]:
    db = get_db()
    doc = await db.customers.find_one(
        {"user_id": user_id, "customer_id": customer_id}
    )
    if not doc:
        return None
    return {
        "customer_id": doc["customer_id"],
        "name": doc.get("name", doc["customer_id"]),
        "current_score": doc["current_score"],
        "status": doc["status"],
        "history": doc.get("history", []),
    }


async def get_dashboard_summary(user_id: str) -> dict:
    """Aggregate totals for the dashboard summary cards."""
    db = get_db()
    collection = db.customers

    total = await collection.count_documents({"user_id": user_id})
    at_risk = await collection.count_documents({"user_id": user_id, "status": "At Risk"})
    saved = await collection.count_documents({"user_id": user_id, "status": "Saved"})

    # Average score
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$current_score"}}},
    ]
    result = await collection.aggregate(pipeline).to_list(1)
    avg_score = round(result[0]["avg_score"], 1) if result else 0.0

    return {
        "total_customers": total,
        "at_risk_count": at_risk,
        "saved_count": saved,
        "avg_score": avg_score,
    }


async def get_dashboard_trend(user_id: str) -> List[dict]:
    """
    Build a simple trend from the most recent history entries
    across all customers for this user.
    """
    db = get_db()

    # Retrieve user's configured benchmark (default to 78)
    benchmark = 78
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user and "benchmark" in user:
            benchmark = user["benchmark"]
    except Exception:
        pass

    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$unwind": "$history"},
        {
            "$group": {
                "_id": "$history.date",
                "avg_score": {"$avg": "$history.score"},
                "at_risk_count": {
                    "$sum": {
                        "$cond": [{"$gte": ["$history.score", benchmark]}, 1, 0]
                    }
                },
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 30},
    ]
    results = await db.customers.aggregate(pipeline).to_list(30)
    return [
        {
            "date": r["_id"],
            "avg_score": round(r["avg_score"], 1),
            "at_risk_count": r["at_risk_count"],
        }
        for r in results
    ]


def _row(doc: dict) -> dict:
    """Convert a MongoDB customer document to a response-friendly dict."""
    history = doc.get("history", [])
    meta = ""
    if history:
        latest = history[-1]
        if len(history) >= 2:
            prev = history[-2]["score"]
            diff = latest["score"] - prev
            if diff > 0:
                meta = f"up {diff:+.0f} pts"
            elif diff < 0:
                meta = f"down {abs(diff):.0f} pts"
            else:
                meta = "no change"
        else:
            meta = "first score"
    return {
        "customer_id": doc["customer_id"],
        "name": doc.get("name", doc["customer_id"]),
        "score": doc["current_score"],
        "status": doc["status"],
        "meta": meta,
    }
