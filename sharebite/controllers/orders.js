/*
========================================================================
   ShareBite Enterprise Food Order Management System
   ZORDERS & ZORDER_ITEMS Orders Controller (orders.js)
========================================================================
*/

let orderSearchQuery = '';
let orderStatusFilter = 'All';
let orderSortCriteria = 'latest';
let activeTimelineOrderId = '';

// Rebuild food menu item lookups cache (O(1) lookups)
function rebuildMenuCache() {
    state.menuMap = new Map(state.menu.map(f => [f.FOOD_ID, f]));
}

// Render dynamic order rows
function renderOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    rebuildMenuCache();
    rebuildCustomerCache();
    
    const userRole = sessionStorage.getItem('sharebite_role') || 'Customer';

    // 1. Filter orders
    let filtered = state.orders.filter(o => {
        const matchesStatus = orderStatusFilter === 'All' || o.STATUS === orderStatusFilter;
        
        const customer = state.customerMap.get(o.CUTSOMER_ID); // O(1) cache lookup
        const custName = customer ? customer.NAME : 'Unknown';
        const food = state.menuMap.get(o.FOOD_ID); // O(1) cache lookup
        const foodName = food ? food.FOOD_NAME : 'Unknown';

        const matchesQuery = o.ORDER_ID.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                             o.CUTSOMER_ID.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                             custName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                             foodName.toLowerCase().includes(orderSearchQuery.toLowerCase());
                             
        return matchesStatus && matchesQuery;
    });

    // 2. Sort orders
    if (orderSortCriteria === 'latest') {
        filtered.sort((a, b) => b.ORDER_ID.localeCompare(a.ORDER_ID));
    } else if (orderSortCriteria === 'oldest') {
        filtered.sort((a, b) => a.ORDER_ID.localeCompare(b.ORDER_ID));
    } else if (orderSortCriteria === 'value-high') {
        filtered.sort((a, b) => b.TOTAL_AMOUNT - a.TOTAL_AMOUNT);
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--fiori-text-secondary); padding: 2rem;">No matching order receipts found.</td></tr>`;
        return;
    }

    filtered.forEach(o => {
        const customer = state.customerMap.get(o.CUTSOMER_ID);
        const custName = customer ? customer.NAME : 'Unknown';
        
        const food = state.menuMap.get(o.FOOD_ID);
        const foodName = food ? food.FOOD_NAME : 'Unknown';

        const badgeClass = o.STATUS === 'Delivered' ? 'status-delivered' : (o.STATUS === 'Cancelled' ? 'status-cancelled' : 'status-pending');

        // Dynamic status transition label based on standard timeline progress
        let nextStatusText = '';
        let nextStatusClass = 'btn-edit';
        let nextStatusIcon = 'fa-arrow-right';
        let cycleStatus = '';
        
        if (o.STATUS === 'Pending') {
            cycleStatus = 'Preparing';
            nextStatusText = 'Prepare';
            nextStatusIcon = 'fa-kitchen-set';
        } else if (o.STATUS === 'Preparing') {
            cycleStatus = 'Out for Delivery';
            nextStatusText = 'Ship';
            nextStatusIcon = 'fa-truck-ramp-box';
        } else if (o.STATUS === 'Out for Delivery') {
            cycleStatus = 'Delivered';
            nextStatusText = 'Deliver';
            nextStatusIcon = 'fa-house-circle-check';
            nextStatusClass = 'btn-invoice';
        }

        // Conditionally render action options based on role permissions
        const canManageTimeline = userRole === 'Admin' || userRole === 'Delivery';
        const timelineCycleButton = (canManageTimeline && o.STATUS !== 'Delivered' && o.STATUS !== 'Cancelled') ? `
            <button class="btn-action-icon ${nextStatusClass}" onclick="cycleOrderStatus('${o.ORDER_ID}', '${cycleStatus}')" title="Move to ${cycleStatus}">
                <i class="fa-solid ${nextStatusIcon}"></i>
            </button>
        ` : '';

        const cancelBtn = (userRole === 'Admin' && o.STATUS === 'Pending') ? `
            <button class="btn-action-icon btn-delete" onclick="cancelOrderReceipt('${o.ORDER_ID}')" title="Cancel Order"><i class="fa-solid fa-ban"></i></button>
        ` : '';

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => selectOrderForTimeline(o.ORDER_ID);

        row.innerHTML = `
            <td><strong>${o.ORDER_ID}</strong></td>
            <td>${o.CUTSOMER_ID} <span style="color:var(--fiori-text-secondary); font-size:0.75rem;">(${custName})</span></td>
            <td>${foodName}</td>
            <td><strong>x${o.QUANTITY}</strong></td>
            <td><strong>₹${o.TOTAL_AMOUNT}</strong></td>
            <td>${o.WAERS}</td>
            <td><span class="badge ${badgeClass}">${o.STATUS}</span></td>
            <td style="text-align: center;" onclick="event.stopPropagation()">
                <div class="table-actions" style="justify-content: center; align-items: center; gap: 0.4rem;">
                    <button class="btn-primary" onclick="generateInvoiceReceipt('${o.ORDER_ID}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 4px; display: flex; align-items: center; gap: 0.25rem;" title="Generate Invoice">
                        <i class="fa-solid fa-file-invoice"></i> Invoice
                    </button>
                    ${timelineCycleButton}
                    ${cancelBtn}
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update active timeline display if one is selected
    if (activeTimelineOrderId) {
        selectOrderForTimeline(activeTimelineOrderId);
    } else if (state.orders.length > 0) {
        selectOrderForTimeline(state.orders[0].ORDER_ID); // Default to first order
    }
}

function handleOrdersFilter() {
    orderSearchQuery = document.getElementById('orderSearch').value;
    orderStatusFilter = document.getElementById('orderStatusFilter').value;
    renderOrders();
}

function handleOrdersSort(criteria) {
    orderSortCriteria = criteria;
    renderOrders();
}

// Active Order Timeline Progress Tracker Rendering (Item 14 timeline tracker)
function selectOrderForTimeline(orderId) {
    const o = state.orders.find(ord => ord.ORDER_ID === orderId);
    if (!o) return;

    activeTimelineOrderId = orderId;
    
    // Highlight table row physically
    const rows = document.querySelectorAll('#ordersTableBody tr');
    rows.forEach(r => {
        if (r.cells[0] && r.cells[0].textContent === orderId) {
            r.style.backgroundColor = 'var(--fiori-primary-light)';
        } else {
            r.style.backgroundColor = '';
        }
    });

    // Render active info
    const label = document.getElementById('timelineActiveOrderLabel');
    if (label) label.innerHTML = `Order timeline tracker: <strong>${o.ORDER_ID}</strong> (Status: <span style="font-weight:700">${o.STATUS}</span>)`;

    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach(st => {
        st.classList.remove('active', 'completed');
    });

    const progressBar = document.getElementById('timelineProgressBar');
    let width = '0%';

    if (o.STATUS === 'Pending') {
        steps[0].classList.add('active');
        width = '0%';
    } else if (o.STATUS === 'Preparing') {
        steps[0].classList.add('completed');
        steps[1].classList.add('active');
        width = '33%';
    } else if (o.STATUS === 'Out for Delivery') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        steps[2].classList.add('active');
        width = '66%';
    } else if (o.STATUS === 'Delivered') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        steps[2].classList.add('completed');
        steps[3].classList.add('completed');
        width = '100%';
    } else if (o.STATUS === 'Cancelled') {
        // Cancelled resets
        width = '0%';
        if (label) label.innerHTML = `Order timeline tracker: <strong>${o.ORDER_ID}</strong> (<span style="color:var(--fiori-error); font-weight:700">Cancelled</span>)`;
    }

    if (progressBar) progressBar.style.width = width;
}

// Cycle status through chronological progress step timeline
async function cycleOrderStatus(orderId, nextStatus) {
    await helpers.showSpinner(true, 400);

    const idx = state.orders.findIndex(o => o.ORDER_ID === orderId);
    if (idx !== -1) {
        state.orders[idx].STATUS = nextStatus;
        syncDatabase('ZORDERS');
        
        await helpers.showSpinner(false);
        renderOrders();
        helpers.showToast(`Order ${orderId} moved to status: "${nextStatus}"!`, 'success');
    } else {
        await helpers.showSpinner(false);
    }
}

async function cancelOrderReceipt(orderId) {
    if (confirm(`Are you sure you want to cancel Order ${orderId}?`)) {
        await helpers.showSpinner(true, 300);
        
        const idx = state.orders.findIndex(o => o.ORDER_ID === orderId);
        if (idx !== -1) {
            state.orders[idx].STATUS = 'Cancelled';
            syncDatabase('ZORDERS');
            
            await helpers.showSpinner(false);
            renderOrders();
            helpers.showToast(`Order ${orderId} cancelled.`, 'warning');
        } else {
            await helpers.showSpinner(false);
        }
    }
}

function openCreateOrderModal() {
    const custSelect = document.getElementById('orderCustomerSelect');
    const foodSelect = document.getElementById('orderFoodSelect');
    
    if (!custSelect || !foodSelect) return;

    custSelect.innerHTML = '';
    foodSelect.innerHTML = '';
    
    if (state.customers.length === 0) {
        helpers.showToast('Please add a Customer record first!', 'warning');
        switchView('customers');
        return;
    }
    
    state.customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.CUSTOMER_ID;
        opt.textContent = `${c.CUSTOMER_ID} - ${c.NAME} (${c.ADDRESS})`;
        custSelect.appendChild(opt);
    });

    const availableFoods = state.menu.filter(f => f.AVAILABLE === 'Yes');
    if (availableFoods.length === 0) {
        helpers.showToast('No available food items in menu!', 'error');
        return;
    }

    availableFoods.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.FOOD_ID;
        opt.textContent = `${f.FOOD_ID} - ${f.FOOD_NAME} (₹${f.PRICE})`;
        foodSelect.appendChild(opt);
    });

    document.getElementById('orderQuantity').value = 1;
    calculateOrderAmount();
    helpers.openModal('orderModal');
}

function calculateOrderAmount() {
    const foodId = document.getElementById('orderFoodSelect').value;
    const qtyField = document.getElementById('orderQuantity');
    const qtyVal = parseInt(qtyField.value);

    // Dynamic field validation
    if (qtyVal <= 0 || isNaN(qtyVal)) {
        qtyField.value = 1;
    }

    const qty = parseInt(qtyField.value) || 1;
    const food = state.menuMap.get(foodId);
    if (!food) return;

    const price = food.PRICE;
    const grandTotal = price * qty;

    document.getElementById('orderFoodPriceLabel').textContent = `₹${price}`;
    document.getElementById('orderGrandTotalLabel').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
    document.getElementById('orderTotalAmountField').value = grandTotal;
}

// Post new order receipt
async function handleOrderSubmit() {
    const customerId = document.getElementById('orderCustomerSelect').value;
    const foodId = document.getElementById('orderFoodSelect').value;
    const quantityVal = document.getElementById('orderQuantity').value;

    const data = { quantityVal };
    const rules = {
        quantityVal: { required: true, type: 'number', min: 1, label: 'Quantity' }
    };

    const validateResult = helpers.validateForm(data, rules);
    if (!validateResult.valid) {
        helpers.showToast(validateResult.message, 'warning');
        return;
    }

    const quantity = parseInt(quantityVal);
    const totalAmount = parseFloat(document.getElementById('orderTotalAmountField').value);
    
    await helpers.showSpinner(true, 400);

    const newOrderId = helpers.generateId('O', state.orders, 'ORDER_ID');
    const dateToday = new Date().toISOString().split('T')[0];

    const newOrder = {
        "ORDER_ID": newOrderId,
        "CUTSOMER_ID": customerId,
        "FOOD_ID": foodId,
        "QUANTITY": quantity,
        "TOTAL_AMOUNT": totalAmount,
        "WAERS": "INR",
        "STATUS": "Pending",
        "DATE": dateToday
    };

    state.orders.push(newOrder);
    syncDatabase('ZORDERS');

    await helpers.showSpinner(false);
    helpers.closeModal('orderModal');
    renderOrders();
    helpers.showToast(`Order receipt ${newOrderId} posted successfully to ZORDERS table!`, 'success');
}

// Quick click order uploader matching first customer
async function quickOrder(foodId) {
    if (state.customers.length === 0) {
        helpers.showToast('Please add at least one customer first to place an order.', 'warning');
        switchView('customers');
        return;
    }
    
    await helpers.showSpinner(true, 300);

    const defaultCust = state.customers[0];
    const food = state.menu.find(f => f.FOOD_ID === foodId);
    if (!food) {
        await helpers.showSpinner(false);
        return;
    }

    const newOrderId = helpers.generateId('O', state.orders, 'ORDER_ID');
    const dateToday = new Date().toISOString().split('T')[0];

    const newOrder = {
        "ORDER_ID": newOrderId,
        "CUTSOMER_ID": defaultCust.CUSTOMER_ID,
        "FOOD_ID": foodId,
        "QUANTITY": 1,
        "TOTAL_AMOUNT": food.PRICE,
        "WAERS": "INR",
        "STATUS": "Pending",
        "DATE": dateToday
    };

    state.orders.push(newOrder);
    syncDatabase('ZORDERS');

    await helpers.showSpinner(false);
    helpers.showToast(`Quick order ${newOrderId} posted instantly for customer ${defaultCust.NAME}!`, 'success');
}

// CSV/JSON Exporters (Item 18 integration)
function triggerOrdersCSVDownload() {
    const headers = ['ORDER_ID', 'CUSTOMER_ID', 'FOOD_ID', 'QUANTITY', 'TOTAL_AMOUNT', 'CURRENCY', 'STATUS', 'DATE'];
    const rows = state.orders.map(o => [
        o.ORDER_ID, o.CUTSOMER_ID, o.FOOD_ID, o.QUANTITY, o.TOTAL_AMOUNT, o.WAERS, o.STATUS, o.DATE
    ]);
    helpers.exportToCSV(headers, rows, 'SAP_ZORDERS_export.csv');
    helpers.showToast('ZORDERS records successfully exported to CSV!', 'success');
}

function triggerCustomersCSVDownload() {
    const headers = ['CUSTOMER_ID', 'NAME', 'PHONE_NUMBER', 'ADDRESS'];
    const rows = state.customers.map(c => [
        c.CUSTOMER_ID, c.NAME, c.PHONE_NUMBER, c.ADDRESS
    ]);
    helpers.exportToCSV(headers, rows, 'SAP_ZCUSTOMERSS_export.csv');
    helpers.showToast('ZCUSTOMERSS records successfully exported to CSV!', 'success');
}

function triggerFoodMenuJsonDownload() {
    const jsonStr = JSON.stringify(state.menu, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAP_ZFOOD_MENU_export.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    helpers.showToast('ZFOOD_MENU records successfully exported as JSON!', 'success');
}
