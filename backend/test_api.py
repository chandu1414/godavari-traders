import json
import sys
from app import create_app

def run_tests():
    print("=" * 60)
    print("RUNNING GODAVARI TRADERS BACKEND API TEST SUITE")
    print("=" * 60)

    app = create_app()
    client = app.test_client()

    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
        else:
            print(f" [FAIL] {name}: {details}")

    # 1. Health check
    res = client.get("/api/health")
    assert_test("Health check responds 200", res.status_code == 200)
    data = res.get_json()
    assert_test("Service name is Godavari Traders API", data.get("service") == "Godavari Traders API")

    # 2. Shop settings
    res = client.get("/api/settings")
    assert_test("Get settings responds 200", res.status_code == 200)
    settings = res.get_json().get("settings", {})
    assert_test("Shop name is GODAVARI TRADERS", settings.get("shop_name") == "GODAVARI TRADERS")

    # 3. Products catalogue
    res = client.get("/api/products")
    assert_test("Get products responds 200", res.status_code == 200)
    products_data = res.get_json()
    assert_test("Products count >= 10", products_data.get("count", 0) >= 10)

    # Categories and Units
    res = client.get("/api/products/categories")
    assert_test("Get categories responds 200", res.status_code == 200 and len(res.get_json().get("categories", [])) > 0)

    res = client.get("/api/products/units")
    assert_test("Get units responds 200", res.status_code == 200 and "Bag" in res.get_json().get("units", []))

    # 4. Auth: Login with seeded admin
    res = client.post("/api/auth/login", json={"username": "admin", "password": "Godavari@2026"})
    assert_test("Admin login succeeds", res.status_code == 200)
    auth_data = res.get_json()
    token = auth_data.get("token")
    assert_test("JWT token returned", bool(token))
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /me endpoint
    res = client.get("/api/auth/me", headers=headers)
    assert_test("Verify /me profile", res.status_code == 200 and res.get_json().get("user", {}).get("username") == "admin")

    # 5. Billing calculation
    first_product = products_data.get("products", [])[0]
    calc_payload = {
        "items": [
            {
                "product_id": first_product["_id"],
                "product_name": first_product["name"],
                "unit": first_product["unit"],
                "rate": first_product["selling_price"],
                "quantity": 10,
                "gst_rate": first_product.get("gst_rate", 18.0)
            }
        ],
        "discount_type": "fixed",
        "discount_value": 100.0,
        "is_gst_invoice": True,
        "delivery_charge": 500.0
    }
    res = client.post("/api/billing/calculate", json=calc_payload)
    assert_test("Billing calculation responds 200", res.status_code == 200)
    calc_res = res.get_json().get("calculation", {})
    expected_subtotal = round(10 * first_product["selling_price"], 2)
    assert_test("Subtotal calculated correctly", calc_res.get("subtotal") == expected_subtotal)
    assert_test("Grand total is greater than 0", calc_res.get("grand_total") > 0)

    # 6. Billing: Create real invoice
    bill_payload = {
        "customer": {
            "name": "B. Rama Krishna (Builder)",
            "phone": "+91 98888 77665",
            "whatsapp": "919888877665",
            "address": "Site #12, Siddapu Road, Sadashivpet"
        },
        "items": [
            {
                "product_id": first_product["_id"],
                "product_name": first_product["name"],
                "unit": first_product["unit"],
                "rate": first_product["selling_price"],
                "quantity": 5,
                "gst_rate": first_product.get("gst_rate", 18.0),
                "hsn_code": first_product.get("hsn_code", "2523")
            }
        ],
        "discount_type": "percent",
        "discount_value": 5.0,
        "is_gst_invoice": True,
        "delivery_charge": 350.0,
        "delivery_instructions": "Deliver before 12 Noon",
        "payment_mode": "UPI",
        "payment_status": "PAID"
    }
    res = client.post("/api/billing/create-invoice", json=bill_payload, headers=headers)
    assert_test("Create invoice responds 201", res.status_code == 201)
    new_inv = res.get_json().get("invoice", {})
    inv_num = new_inv.get("invoice_number")
    public_token = new_inv.get("public_token")
    assert_test("Invoice number generated with GT- prefix", inv_num.startswith("GT-"))
    assert_test("Secure public token generated", bool(public_token))

    # 7. Invoice history and lookup
    res = client.get(f"/api/invoices/{inv_num}", headers=headers)
    assert_test("Get invoice by invoice_number responds 200", res.status_code == 200)

    # Public invoice lookup (without auth header)
    res = client.get(f"/api/invoices/public/{public_token}")
    assert_test("Public invoice view accessible without auth", res.status_code == 200)
    assert_test("Public invoice customer name matches", res.get_json().get("invoice", {}).get("customer", {}).get("name") == "B. Rama Krishna (Builder)")

    # 8. WhatsApp Sharing link generation
    wa_payload = {"invoice_id": inv_num, "base_url": "https://godavari-traders.app"}
    res = client.post("/api/sharing/whatsapp-link", json=wa_payload, headers=headers)
    assert_test("WhatsApp link generation responds 200", res.status_code == 200)
    wa_data = res.get_json()
    assert_test("WhatsApp link contains wa.me", "wa.me" in wa_data.get("whatsapp_url", ""))
    assert_test("Message contains GODAVARI TRADERS", "GODAVARI TRADERS" in wa_data.get("message", ""))

    # 9. SMS payload generation
    sms_payload = {"invoice_id": inv_num, "base_url": "https://godavari-traders.app"}
    res = client.post("/api/sharing/sms-dispatch", json=sms_payload, headers=headers)
    assert_test("SMS dispatch responds 200", res.status_code == 200)
    sms_data = res.get_json()
    assert_test("SMS text contains invoice number and viewing link", inv_num in sms_data.get("sms_text", "") and public_token in sms_data.get("sms_text", ""))

    # 10. Customer directory
    res = client.get("/api/customers", headers=headers)
    assert_test("Get customers responds 200", res.status_code == 200)
    customers = res.get_json().get("customers", [])
    assert_test("Customer B. Rama Krishna exists in directory", any("Rama Krishna" in c.get("name", "") for c in customers))

    # 11. Partial Payment / Split Billing & Khata Due Test (User Scenario: Bill ₹60,000 -> Pay ₹40,000 Cash, ₹20,000 Khata)
    import time
    test_phone = f"+91 99988 {int(time.time() * 1000) % 100000:05d}"
    partial_bill_payload = {
        "customer": {
            "name": "Chandu (Contractor)",
            "phone": test_phone,
            "whatsapp": "919998877766",
            "address": "Sadashivpet Main Road"
        },
        "items": [
            {
                "product_id": first_product["_id"],
                "product_name": first_product["name"],
                "unit": first_product["unit"],
                "rate": 1000.0,
                "quantity": 60,
                "gst_rate": 0.0
            }
        ],
        "discount_type": "fixed",
        "discount_value": 0.0,
        "is_gst_invoice": False,
        "delivery_charge": 0.0,
        "payment_mode": "Cash",
        "payment_status": "PARTIAL",
        "amount_paid": 40000.0,
        "notes": "Customer paid 40000 cash, 20000 to Khata"
    }
    res = client.post("/api/billing/create-invoice", json=partial_bill_payload, headers=headers)
    assert_test("Create partial split invoice responds 201", res.status_code == 201)
    split_inv = res.get_json().get("invoice", {})
    assert_test("Split invoice grand total is 60,000", split_inv.get("grand_total") == 60000.0)
    assert_test("Split invoice amount_paid is 40,000", split_inv.get("amount_paid") == 40000.0)
    assert_test("Split invoice balance_due is 20,000", split_inv.get("balance_due") == 20000.0)
    assert_test("Split invoice status is PARTIAL", split_inv.get("payment_status") == "PARTIAL")

    # Verify customer Khata record
    res = client.get(f"/api/customers/{test_phone}", headers=headers)
    assert_test("Get partial bill customer ledger responds 200", res.status_code == 200)
    cust_data = res.get_json().get("customer", {})
    assert_test("Customer Khata outstanding_due is 20,000", cust_data.get("outstanding_due") == 20000.0)

    # Verify statement ledger balances
    res = client.get(f"/api/customers/{test_phone}/statement", headers=headers)
    assert_test("Get customer statement responds 200", res.status_code == 200)
    stmt = res.get_json()
    assert_test("Statement net_due equals 20,000", stmt.get("net_due") == 20000.0)
    assert_test("Statement total_billed equals 60,000", stmt.get("total_billed") == 60000.0)
    assert_test("Statement total_paid equals 40,000", stmt.get("total_paid") == 40000.0)

    # Verify WhatsApp message reflects both paid now and remaining Khata
    wa_res = client.post("/api/sharing/whatsapp-link", json={"invoice_id": split_inv["invoice_number"]}, headers=headers)
    assert_test("WhatsApp link for partial bill responds 200", wa_res.status_code == 200)
    wa_msg = wa_res.get_json().get("message", "")
    assert_test("WhatsApp message contains 40,000 paid now", "40,000" in wa_msg)
    assert_test("WhatsApp message contains 20,000 remaining to Khata", "20,000" in wa_msg)

    # 12. Reports & Analytics
    res = client.get("/api/reports/dashboard", headers=headers)
    assert_test("Dashboard reports responds 200", res.status_code == 200)
    metrics = res.get_json().get("metrics", {})
    assert_test("Dashboard metrics today_sales > 0", metrics.get("today_sales", 0) > 0)
    assert_test("Dashboard metrics total_products_count > 0", metrics.get("total_products_count", 0) > 0)
    assert_test("Category sales array present", len(res.get_json().get("category_sales", [])) > 0)
    assert_test("Sales trend 7d array present", len(res.get_json().get("sales_trend_7d", [])) == 7)

    print("=" * 60)
    print(f"RESULTS: {passed}/{total} TESTS PASSED ({round(passed/total*100, 1)}%)")
    print("=" * 60)
    if passed == total:
        print("ALL BACKEND SUITE TESTS PASSED!")
        return 0
    else:
        print("SOME TESTS FAILED.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
