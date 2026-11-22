from datetime import datetime, timedelta
from collections import defaultdict
from flask import Blueprint, jsonify
from database import get_db
from auth import login_required

report_bp = Blueprint("reports", __name__)

@report_bp.route("/dashboard", methods=["GET"])
@login_required
def get_dashboard_metrics():
    db = get_db()
    invoices_col = db.get_collection("invoices")
    products_col = db.get_collection("products")
    customers_col = db.get_collection("customers")

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day).isoformat()
    yesterday_date = now - timedelta(days=1)
    yesterday_start = datetime(yesterday_date.year, yesterday_date.month, yesterday_date.day).isoformat()
    month_start = datetime(now.year, now.month, 1).isoformat()

    all_invoices = invoices_col.find(sort=[("date", -1)])

    today_sales = 0.0
    today_bills = 0
    yesterday_sales = 0.0
    month_sales = 0.0
    total_sales = 0.0
    total_receivables = 0.0

    category_sales = defaultdict(float)
    product_sales_volume = defaultdict(float)
    product_sales_revenue = defaultdict(float)
    payment_modes = defaultdict(float)

    # 7-day trend bucket
    trend_7d = {}
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_key = day.strftime("%Y-%m-%d")
        trend_7d[day_key] = {"date": day.strftime("%d %b"), "sales": 0.0, "count": 0}

    for inv in all_invoices:
        inv_date = inv.get("date", "")
        grand_total = float(inv.get("grand_total", 0))
        balance_due = float(inv.get("balance_due", 0))
        total_sales += grand_total
        total_receivables += balance_due

        # Payment mode split
        mode = inv.get("payment_mode", "Cash")
        payment_modes[mode] += grand_total

        # Date bucketing
        if inv_date >= today_start:
            today_sales += grand_total
            today_bills += 1
        elif inv_date >= yesterday_start and inv_date < today_start:
            yesterday_sales += grand_total

        if inv_date >= month_start:
            month_sales += grand_total

        date_prefix = inv_date[:10]
        if date_prefix in trend_7d:
            trend_7d[date_prefix]["sales"] += grand_total
            trend_7d[date_prefix]["count"] += 1

        # Items breakdown
        for it in inv.get("items", []):
            cat = it.get("category", "Other Construction Materials")
            amount = float(it.get("amount", 0))
            qty = float(it.get("quantity", 0))
            prod_name = it.get("product_name", "Material")

            category_sales[cat] += amount
            product_sales_volume[prod_name] += qty
            product_sales_revenue[prod_name] += amount

    # Product metrics
    all_products = products_col.find({"is_active": True})
    total_products_count = len(all_products)
    low_stock_products = [p for p in all_products if p.get("stock", 0) <= p.get("min_stock_alert", 10)]

    # Format top products
    sorted_top_products = sorted(
        product_sales_revenue.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]
    top_products_list = [
        {"name": name, "revenue": rev, "quantity": product_sales_volume.get(name, 0)}
        for name, rev in sorted_top_products
    ]

    # Format category breakdown
    category_list = [
        {"category": cat, "revenue": rev, "percentage": round((rev / total_sales * 100), 1) if total_sales > 0 else 0}
        for cat, rev in sorted(category_sales.items(), key=lambda x: x[1], reverse=True)
    ]

    return jsonify({
        "success": True,
        "metrics": {
            "today_sales": round(today_sales, 2),
            "today_bills_count": today_bills,
            "yesterday_sales": round(yesterday_sales, 2),
            "month_sales": round(month_sales, 2),
            "total_sales": round(total_sales, 2),
            "total_receivables": round(total_receivables, 2),
            "total_invoices_count": len(all_invoices),
            "total_products_count": total_products_count,
            "low_stock_count": len(low_stock_products),
            "low_stock_items": [
                {"name": p["name"], "stock": p.get("stock", 0), "unit": p.get("unit"), "min": p.get("min_stock_alert")}
                for p in low_stock_products[:5]
            ]
        },
        "recent_invoices": all_invoices[:5],
        "category_sales": category_list,
        "top_products": top_products_list,
        "sales_trend_7d": list(trend_7d.values()),
        "payment_mode_split": [
            {"mode": mode, "amount": amt, "percentage": round((amt / total_sales * 100), 1) if total_sales > 0 else 0}
            for mode, amt in payment_modes.items()
        ]
    })
