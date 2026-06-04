/*
========================================================================
   ShareBite Enterprise Food Order Management System
   ZCUSTOMERSS Customer Controller & Lookup Cache (customers.js)
========================================================================
*/

let customerQuery = '';

// Rebuild customer ID mapping cache (O(1) lookups)
function rebuildCustomerCache() {
    state.customerMap = new Map(state.customers.map(c => [c.CUSTOMER_ID, c]));
}

// Render dynamic customer rows
function renderCustomers() {
    const tableBody = document.getElementById('customersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    rebuildCustomerCache();
    
    const userRole = sessionStorage.getItem('sharebite_role') || 'Customer';

    const filtered = state.customers.filter(c => 
        c.NAME.toLowerCase().includes(customerQuery.toLowerCase()) || 
        c.ADDRESS.toLowerCase().includes(customerQuery.toLowerCase()) ||
        c.CUSTOMER_ID.toLowerCase().includes(customerQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--fiori-text-secondary); padding: 2rem;">No matching customer records.</td></tr>`;
        return;
    }

    filtered.forEach(c => {
        const row = document.createElement('tr');
        
        // Hide delete/edit actions from non-admins
        const actionCell = userRole === 'Admin' ? `
            <td style="text-align: center;">
                <div class="table-actions" style="justify-content: center;">
                    <button class="btn-action-icon btn-edit" onclick="openEditCustomerModal('${c.CUSTOMER_ID}')" title="Edit Customer"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn-action-icon btn-delete" onclick="handleCustomerDelete('${c.CUSTOMER_ID}')" title="Delete Customer"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        ` : `<td style="text-align: center; color: var(--fiori-text-muted);">View Only</td>`;

        row.innerHTML = `
            <td><strong>${c.CUSTOMER_ID}</strong></td>
            <td>${c.NAME}</td>
            <td><i class="fa-solid fa-phone" style="font-size:0.75rem; color:var(--fiori-text-muted)"></i> ${c.PHONE_NUMBER}</td>
            <td><i class="fa-solid fa-map-marker-alt" style="font-size:0.75rem; color:var(--fiori-text-muted)"></i> ${c.ADDRESS}</td>
            ${actionCell}
        `;
        tableBody.appendChild(row);
    });
}

function handleCustomerFilter() {
    customerQuery = document.getElementById('customerSearch').value;
    renderCustomers();
}

function openAddCustomerModal() {
    document.getElementById('customerForm').reset();
    document.getElementById('customerFormId').value = '';
    document.getElementById('customerModalTitle').textContent = 'Add New Customer Record';
    document.getElementById('customerSubmitButton').textContent = 'Save Customer';
    helpers.openModal('customerModal');
}

function openEditCustomerModal(id) {
    const cust = state.customerMap.get(id); // O(1) lookup cache
    if (!cust) return;

    document.getElementById('customerFormId').value = cust.CUSTOMER_ID;
    document.getElementById('custName').value = cust.NAME;
    document.getElementById('custPhone').value = cust.PHONE_NUMBER;
    document.getElementById('custAddress').value = cust.ADDRESS;
    
    document.getElementById('customerModalTitle').textContent = `Edit Customer Record - ${id}`;
    document.getElementById('customerSubmitButton').textContent = 'Update Record';
    helpers.openModal('customerModal');
}

// Create/Update customer submission
async function handleCustomerSubmit() {
    const formId = document.getElementById('customerFormId').value;
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const addr = document.getElementById('custAddress').value.trim();

    const data = { name, phone, addr };
    const rules = {
        name: { required: true, label: 'Customer Name' },
        phone: { 
            required: true, 
            pattern: /^[0-9]{10}$/, 
            message: 'Phone number must be exactly 10 digits!', 
            label: 'Phone Number' 
        },
        addr: { required: true, label: 'Delivery Address' }
    };

    const validateResult = helpers.validateForm(data, rules);
    if (!validateResult.valid) {
        helpers.showToast(validateResult.message, 'warning');
        return;
    }

    await helpers.showSpinner(true, 400);

    if (formId) {
        // Edit Mode
        const index = state.customers.findIndex(c => c.CUSTOMER_ID === formId);
        if (index !== -1) {
            state.customers[index].NAME = name;
            state.customers[index].PHONE_NUMBER = phone;
            state.customers[index].ADDRESS = addr;
            syncDatabase('ZCUSTOMERSS');
            helpers.showToast(`Customer ${formId} details updated!`, 'success');
        }
    } else {
        // Create Mode
        const newId = helpers.generateId('C', state.customers, 'CUSTOMER_ID');
        const newCustomer = {
            "CUSTOMER_ID": newId,
            "NAME": name,
            "PHONE_NUMBER": phone,
            "ADDRESS": addr
        };
        state.customers.push(newCustomer);
        syncDatabase('ZCUSTOMERSS');
        helpers.showToast(`Customer record ${newId} created successfully.`, 'success');
    }

    await helpers.showSpinner(false);
    helpers.closeModal('customerModal');
    renderCustomers();
}

// Delete customer record
async function handleCustomerDelete(id) {
    if (confirm(`Are you sure you want to delete Customer Record ${id}? This will remove linked pending orders.`)) {
        await helpers.showSpinner(true, 300);
        state.customers = state.customers.filter(c => c.CUSTOMER_ID !== id);
        
        const orderCountBefore = state.orders.length;
        state.orders = state.orders.filter(o => o.CUTSOMER_ID !== id || o.STATUS === 'Delivered');
        const affectedOrders = orderCountBefore - state.orders.length;

        syncDatabase('ZCUSTOMERSS');
        syncDatabase('ZORDERS');
        await helpers.showSpinner(false);
        renderCustomers();
        
        let msg = `Customer ${id} deleted.`;
        if (affectedOrders > 0) msg += ` ${affectedOrders} active orders cancelled.`;
        helpers.showToast(msg, 'warning');
    }
}
