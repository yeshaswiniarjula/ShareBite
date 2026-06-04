/*
========================================================================
   ShareBite Enterprise Food Order Management System
   Printable Invoice Receipt Controller (invoice.js)
========================================================================
*/

let activeInvoiceData = null;

// Dynamically generate printable invoice sheet with GST, QR Code, and Signature blocks
function generateInvoiceReceipt(orderId) {
    const o = state.orders.find(ord => ord.ORDER_ID === orderId);
    if (!o) return;

    rebuildCustomerCache();
    rebuildMenuCache();

    const customer = state.customerMap.get(o.CUTSOMER_ID);
    const custName = customer ? customer.NAME : 'N/A';
    const custPhone = customer ? customer.PHONE_NUMBER : 'N/A';
    const custAddress = customer ? customer.ADDRESS : 'N/A';
    
    const food = state.menuMap.get(o.FOOD_ID);
    const foodName = food ? food.FOOD_NAME : 'N/A';
    const foodPrice = food ? food.PRICE : 0;

    const subtotal = o.TOTAL_AMOUNT;
    const cgst = Math.round(subtotal * 0.09); // 9% CGST
    const sgst = Math.round(subtotal * 0.09); // 9% SGST
    const grandTotal = subtotal + cgst + sgst;

    activeInvoiceData = {
        "INVOICE_ID": `INV-${o.ORDER_ID.replace('O', '')}`,
        "ORDER_ID": o.ORDER_ID,
        "GSTIN": "36AABCS1209F1Z2", // Simulated Enterprise GST Registration
        "CUSTOMER_DETAILS": {
            "ID": o.CUTSOMER_ID,
            "NAME": custName,
            "PHONE": custPhone,
            "ADDRESS": custAddress
        },
        "LINE_ITEMS": [
            {
                "ITEM_ID": o.FOOD_ID,
                "ITEM_NAME": foodName,
                "QUANTITY": o.QUANTITY,
                "PRICE": foodPrice,
                "TOTAL": subtotal
            }
        ],
        "CURRENCY": o.WAERS,
        "SUBTOTAL": subtotal,
        "CGST_TAX": cgst,
        "SGST_TAX": sgst,
        "GRAND_TOTAL": grandTotal,
        "STATUS": o.STATUS,
        "DATE": o.DATE
    };

    // Render HTML details
    const target = document.getElementById('invoiceContentArea');
    if (!target) return;

    // Generate dynamic QR verification endpoint URL (pointing to a mock OData CDS View verification service)
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://sharebite.sap.portal/verify/invoice/${activeInvoiceData.INVOICE_ID}?amount=${grandTotal}`;

    target.innerHTML = `
        <div class="invoice-brand-row">
            <div class="invoice-logo-block">
                <h1>SHAREBITE</h1>
                <p>Corporate Food Order Logistics Portal</p>
                <div style="font-size:0.75rem; background:#e6f0fa; color:#0a6ed1; padding:0.25rem 0.5rem; border-radius:4px; font-weight:600; display:inline-block; margin-top:0.4rem;">
                    SAP Fiori RAP Client System
                </div>
                <div style="font-size:0.7rem; color:#5c6b77; margin-top:0.35rem; font-weight:500;">
                    GSTIN ID: <strong>${activeInvoiceData.GSTIN}</strong>
                </div>
            </div>
            <div class="invoice-meta-block">
                <h2>FOOD ORDER INVOICE</h2>
                <div class="invoice-meta-item">Invoice ID: <strong>${activeInvoiceData.INVOICE_ID}</strong></div>
                <div class="invoice-meta-item">Date Issued: <strong>${activeInvoiceData.DATE}</strong></div>
                <div class="invoice-meta-item">OData Order ID: <strong>${activeInvoiceData.ORDER_ID}</strong></div>
                <div class="invoice-meta-item">Status: <span class="badge ${activeInvoiceData.STATUS === 'Delivered' ? 'status-delivered' : (activeInvoiceData.STATUS === 'Cancelled' ? 'status-cancelled' : 'status-pending')}" style="padding: 0.15rem 0.5rem; font-size:0.7rem;">${activeInvoiceData.STATUS}</span></div>
            </div>
        </div>

        <div class="invoice-details-grid">
            <div class="invoice-party-card">
                <h4>Provider Information</h4>
                <h3>ShareBite Corporate Catering Ltd</h3>
                <p>IT Tech Park, Building 3B<br>Gachibowli, Hyderabad - 500032<br>Tel: +91 40 4390 1209</p>
            </div>
            
            <div class="invoice-party-card">
                <h4>Bill To Customer</h4>
                <h3>${activeInvoiceData.CUSTOMER_DETAILS.NAME}</h3>
                <p>Customer ID: ${activeInvoiceData.CUSTOMER_DETAILS.ID}<br>
                Phone: ${activeInvoiceData.CUSTOMER_DETAILS.PHONE}<br>
                Delivery Address: ${activeInvoiceData.CUSTOMER_DETAILS.ADDRESS}</p>
            </div>
        </div>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Item ID</th>
                    <th>Description</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Total Amount</th>
                </tr>
            </thead>
            <tbody>
                ${activeInvoiceData.LINE_ITEMS.map(li => `
                    <tr>
                        <td><strong>${li.ITEM_ID}</strong></td>
                        <td>${li.ITEM_NAME}</td>
                        <td style="text-align: right;">₹${li.PRICE}</td>
                        <td style="text-align: center;">x${li.QUANTITY}</td>
                        <td style="text-align: right;"><strong>₹${li.TOTAL}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="invoice-summary-block">
            <div class="flex gap-2 align-center">
                <!-- Interactive verification QR Code block -->
                <div style="text-align: center; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 6px; background: #ffffff;">
                    <img src="${qrDataUrl}" alt="Invoice Verification QR Code" style="width: 80px; height: 80px; display: block; margin: 0 auto;">
                    <span style="font-size: 0.6rem; color: #5c6b77; font-weight:600; display: block; margin-top: 0.25rem;">SCAN TO VERIFY</span>
                </div>

                <!-- Digital Cursive Signature Authority block -->
                <div class="invoice-signature-block">
                    <div class="sig-placeholder">Yeshu Reddy</div>
                    <p>Authorized Signature</p>
                </div>
            </div>

            <table class="invoice-totals-table">
                <tr>
                    <td>Subtotal (Net value):</td>
                    <td style="text-align: right; font-weight:600;">₹${activeInvoiceData.SUBTOTAL}</td>
                </tr>
                <tr>
                    <td>CGST Tax (9%):</td>
                    <td style="text-align: right;">₹${activeInvoiceData.CGST_TAX}</td>
                </tr>
                <tr>
                    <td>SGST Tax (9%):</td>
                    <td style="text-align: right;">₹${activeInvoiceData.SGST_TAX}</td>
                </tr>
                <tr class="grand-total">
                    <td>Grand Total:</td>
                    <td style="text-align: right;">₹${activeInvoiceData.GRAND_TOTAL} ${activeInvoiceData.CURRENCY}</td>
                </tr>
            </table>
        </div>

        <div class="invoice-footer-note">
            <p>This invoice is electronically generated and conceptually synchronized with a SAP ABAP CDS View interface.<br>Thank you for choosing ShareBite!</p>
        </div>
    `;

    // Navigate to Page
    switchView('invoice');
}

// Download dynamic JSON invoice payload mimicking SAP OData structure
function triggerJsonDownload() {
    if (!activeInvoiceData) return;
    
    const jsonStr = JSON.stringify(activeInvoiceData, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAP_ODATA_${activeInvoiceData.INVOICE_ID}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    helpers.showToast(`OData JSON payload successfully exported for invoice ${activeInvoiceData.INVOICE_ID}!`, 'success');
}
