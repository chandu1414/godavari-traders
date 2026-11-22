import os
import urllib.parse
from flask import Blueprint, request, jsonify
from database import get_db
from auth import login_required

sharing_bp = Blueprint("sharing", __name__)

def generate_whatsapp_message(invoice, public_base_url="http://localhost:5173"):
    inv_num = invoice.get("invoice_number", "BILL")
    cust_name = invoice.get("customer", {}).get("name", "Valued Customer")
    date_str = invoice.get("date", "")[:10]
    grand_total = invoice.get("grand_total", 0)
    payment_status = invoice.get("payment_status", "PAID")
    token = invoice.get("public_token", "")
    
    view_url = f"{public_base_url}/invoice/view/{token}"

    # Fetch live shop settings for contact info
    settings_col = get_db().get_collection("settings")
    settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}
    shop_name = settings.get("shop_name", "GODAVARI TRADERS")
    contact_phone = settings.get("phone") or settings.get("whatsapp_number") or "+91 98480 22334"
    tagline = settings.get("tagline", "Wholesale & Retail Building Materials")
    shop_city = settings.get("city", "Sadashivpet")
    address = [settings.get("address_line1"), settings.get("city")].filter(None) if hasattr([settings.get("address_line1")], 'filter') else ", ".join(filter(None, [settings.get("address_line1"), settings.get("city")]))

    items_text = []
    for it in invoice.get("items", [])[:5]:
        items_text.append(f"• {it.get('product_name')}: {it.get('quantity')} {it.get('unit')} @ ₹{it.get('rate'):,.2f}")
    if len(invoice.get("items", [])) > 5:
        items_text.append(f"• ... and {len(invoice.get('items')) - 5} more items")

    items_block = "\n".join(items_text)

    has_tax = invoice.get("is_gst_invoice") and invoice.get("tax_breakup", {}).get("total_tax", 0) > 0
    bill_title = "TAX INVOICE" if has_tax else "RETAIL INVOICE"

    msg = (
        f"🏛️ *{shop_name}*\n"
        f"{tagline}\n"
        f"{address}\n"
        f"----------------------------------------\n"
        f"📄 *{bill_title}: {inv_num}*\n"
        f"📅 Date: {date_str}\n"
        f"👤 Customer: {cust_name}\n"
        f"----------------------------------------\n"
        f"*Materials Billed:*\n"
        f"{items_block}\n"
        f"----------------------------------------\n"
        f"💰 *Grand Total: ₹{grand_total:,.2f}*\n"
        f"💳 Status: *{payment_status}*\n"
    )

    if invoice.get("balance_due", 0) > 0:
        msg += f"⚠️ Balance Due: *₹{invoice.get('balance_due'):,.2f}*\n"

    msg += (
        f"----------------------------------------\n"
        f"🔗 *View & Download Official PDF Bill:*\n"
        f"{view_url}\n\n"
        f"Thank you for choosing {shop_name}!\n"
        f"📞 Contact / Support: {contact_phone}"
    )

    return msg, view_url

@sharing_bp.route("/whatsapp-link", methods=["POST"])
@login_required
def create_whatsapp_link():
    data = request.get_json() or {}
    invoice_id = data.get("invoice_id")
    target_phone = data.get("phone")
    base_url = data.get("base_url") or request.host_url.rstrip("/")

    invoices_col = get_db().get_collection("invoices")
    inv = invoices_col.find_one({"$or": [{"_id": invoice_id}, {"invoice_number": invoice_id}]})
    if not inv:
        return jsonify({"success": False, "message": "Invoice not found."}), 404

    phone = target_phone or inv.get("customer", {}).get("whatsapp") or inv.get("customer", {}).get("phone", "")
    clean_phone = "".join(ch for ch in phone if ch.isdigit())
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone

    message, view_url = generate_whatsapp_message(inv, base_url)
    encoded_message = urllib.parse.quote(message)

    wa_direct_url = f"https://wa.me/{clean_phone}?text={encoded_message}" if clean_phone else f"https://wa.me/?text={encoded_message}"

    return jsonify({
        "success": True,
        "whatsapp_url": wa_direct_url,
        "message": message,
        "public_url": view_url,
        "target_phone": clean_phone
    })

@sharing_bp.route("/sms-dispatch", methods=["POST"])
@login_required
def send_sms():
    data = request.get_json() or {}
    invoice_id = data.get("invoice_id")
    target_phone = data.get("phone")
    base_url = data.get("base_url") or request.host_url.rstrip("/")

    invoices_col = get_db().get_collection("invoices")
    inv = invoices_col.find_one({"$or": [{"_id": invoice_id}, {"invoice_number": invoice_id}]})
    if not inv:
        return jsonify({"success": False, "message": "Invoice not found."}), 404

    settings_col = get_db().get_collection("settings")
    settings = settings_col.find_one({"_id": "shop_settings_default"}) or {}
    shop_name = settings.get("shop_name", "Godavari Traders")

    phone = target_phone or inv.get("customer", {}).get("phone", "")
    token = inv.get("public_token", "")
    view_url = f"{base_url}/invoice/view/{token}"

    sms_text = (
        f"{shop_name}: Bill {inv.get('invoice_number')} of Rs.{inv.get('grand_total'):,.2f} is generated. "
        f"View/Download PDF invoice: {view_url} . Thank you!"
    )

    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_PHONE_NUMBER")

    sent_via_api = False
    api_response = None

    if twilio_sid and twilio_auth and twilio_from and phone:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)
            to_phone = phone if phone.startswith("+") else f"+91{phone.lstrip('0')}"
            message = client.messages.create(
                body=sms_text,
                from_=twilio_from,
                to=to_phone
            )
            sent_via_api = True
            api_response = f"SMS queued via Twilio SID: {message.sid}"
        except Exception as e:
            api_response = f"Twilio gateway error: {str(e)}"
    else:
        api_response = "SMS gateway credentials not configured. Manual share/copy link prepared."

    return jsonify({
        "success": True,
        "sent_via_api": sent_via_api,
        "status_message": api_response,
        "sms_text": sms_text,
        "public_url": view_url,
        "phone": phone
    })
