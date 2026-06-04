/*
========================================================================
   ShareBite Enterprise Food Order Management System
   ZFOOD_MENU Controller (menu.js)
========================================================================
*/

let activeCategoryFilter = 'All';
let menuSortCriteria = 'default';
let activeBase64FoodImage = '';

// Main card grid renderer
function renderFoodMenu() {
    const grid = document.getElementById('foodMenuGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const userRole = sessionStorage.getItem('sharebite_role') || 'Customer';

    // 1. Filter items
    let itemsToRender = activeCategoryFilter === 'All' 
        ? [...state.menu] 
        : state.menu.filter(f => f.CATEGORY === activeCategoryFilter);

    // 2. Sort items
    if (menuSortCriteria === 'price-low') {
        itemsToRender.sort((a, b) => a.PRICE - b.PRICE);
    } else if (menuSortCriteria === 'price-high') {
        itemsToRender.sort((a, b) => b.PRICE - a.PRICE);
    } else if (menuSortCriteria === 'alpha') {
        itemsToRender.sort((a, b) => a.FOOD_NAME.localeCompare(b.FOOD_NAME));
    }

    if (itemsToRender.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--fiori-text-secondary)">No items found in category "${activeCategoryFilter}".</div>`;
        return;
    }

    itemsToRender.forEach(f => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        
        const availabilityBadge = f.AVAILABLE === 'Yes' 
            ? '<span class="badge status-yes">In Stock</span>' 
            : '<span class="badge status-no">Out of Stock</span>';
            
        const disableBtn = f.AVAILABLE === 'Yes' ? '' : 'disabled';

        // Render edit/delete controls exclusively for Admins
        const adminOverlay = userRole === 'Admin' ? `
            <div class="menu-card-action-overlay">
                <button class="btn-card-action btn-card-edit" onclick="openEditFoodModal('${f.FOOD_ID}')" title="Edit Food"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn-card-action btn-card-delete" onclick="deleteFood('${f.FOOD_ID}')" title="Delete Food"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="menu-card-img-wrapper">
                <img src="${f.IMAGE || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300'}" alt="${f.FOOD_NAME}">
                <div class="menu-card-badge">${f.FOOD_ID}</div>
                ${adminOverlay}
            </div>
            <div class="menu-card-content">
                <div class="menu-card-header">
                    <h3 class="menu-card-title">${f.FOOD_NAME}</h3>
                    <span class="menu-card-price">₹${f.PRICE}</span>
                </div>
                <div class="menu-card-category">${f.CATEGORY}</div>
                <div class="menu-card-footer">
                    ${availabilityBadge}
                    <button class="btn-add-to-cart" onclick="quickOrder('${f.FOOD_ID}')" ${disableBtn}>
                        <i class="fa-solid fa-cart-plus"></i> Order Now
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterMenu(category) {
    activeCategoryFilter = category;
    const tabs = document.querySelectorAll('#menuCategoryTabs .category-tab');
    tabs.forEach(tab => {
        if (tab.textContent.trim() === category || (category === 'All' && tab.textContent.includes('All'))) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    renderFoodMenu();
}

function handleMenuSort(criteria) {
    menuSortCriteria = criteria;
    renderFoodMenu();
}

// Custom Local File Upload preview (Item 13 Base64 integration)
function handleFoodImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2000000) { // 2MB restriction to prevent localStorage overflow
        helpers.showToast('Image file size must be less than 2MB!', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        activeBase64FoodImage = e.target.result;
        const preview = document.getElementById('foodImagePreview');
        if (preview) {
            preview.src = activeBase64FoodImage;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function openAddFoodModal() {
    document.getElementById('foodForm').reset();
    document.getElementById('foodFormId').value = '';
    document.getElementById('foodModalTitle').textContent = 'Register Food Menu Item';
    activeBase64FoodImage = '';
    
    const preview = document.getElementById('foodImagePreview');
    if (preview) {
        preview.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
    }
    helpers.openModal('foodModal');
}

function openEditFoodModal(foodId) {
    const f = state.menu.find(item => item.FOOD_ID === foodId);
    if (!f) return;

    document.getElementById('foodFormId').value = f.FOOD_ID;
    document.getElementById('foodName').value = f.FOOD_NAME;
    document.getElementById('foodCategory').value = f.CATEGORY;
    document.getElementById('foodPrice').value = f.PRICE;
    document.getElementById('foodAvailable').value = f.AVAILABLE;
    activeBase64FoodImage = f.IMAGE;
    
    const preview = document.getElementById('foodImagePreview');
    if (preview) {
        preview.src = f.IMAGE || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
    }
    
    document.getElementById('foodModalTitle').textContent = `Edit Menu Item - ${foodId}`;
    helpers.openModal('foodModal');
}

// Create/Update Food Form Submission
async function handleFoodSubmit() {
    const formId = document.getElementById('foodFormId').value;
    const name = document.getElementById('foodName').value.trim();
    const category = document.getElementById('foodCategory').value;
    const priceVal = document.getElementById('foodPrice').value;
    const available = document.getElementById('foodAvailable').value;

    const data = { name, category, priceVal };
    const rules = {
        name: { required: true, label: 'Food Name' },
        category: { required: true, label: 'Category' },
        priceVal: { required: true, type: 'number', min: 1, label: 'Price (INR)' }
    };

    const validateResult = helpers.validateForm(data, rules);
    if (!validateResult.valid) {
        helpers.showToast(validateResult.message, 'warning');
        return;
    }

    const price = parseFloat(priceVal);
    await helpers.showSpinner(true, 400);

    if (formId) {
        // Edit Mode
        const index = state.menu.findIndex(item => item.FOOD_ID === formId);
        if (index !== -1) {
            state.menu[index].FOOD_NAME = name;
            state.menu[index].CATEGORY = category;
            state.menu[index].PRICE = price;
            state.menu[index].AVAILABLE = available;
            if (activeBase64FoodImage) state.menu[index].IMAGE = activeBase64FoodImage;
            
            syncDatabase('ZFOOD_MENU');
            helpers.showToast(`Food Item ${formId} details updated!`, 'success');
        }
    } else {
        // Create Mode
        const newId = helpers.generateId('F', state.menu, 'FOOD_ID');
        
        let randomImg = activeBase64FoodImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
        const newFood = {
            "FOOD_ID": newId,
            "FOOD_NAME": name,
            "CATEGORY": category,
            "PRICE": price,
            "AVAILABLE": available,
            "IMAGE": randomImg
        };

        state.menu.push(newFood);
        syncDatabase('ZFOOD_MENU');
        helpers.showToast(`Food Item ${newId} registered successfully!`, 'success');
    }

    await helpers.showSpinner(false);
    helpers.closeModal('foodModal');
    renderFoodMenu();
}

// Delete Food Item Card
async function deleteFood(foodId) {
    if (confirm(`Are you sure you want to permanently delete Menu Item ${foodId}?`)) {
        await helpers.showSpinner(true, 300);
        state.menu = state.menu.filter(f => f.FOOD_ID !== foodId);
        syncDatabase('ZFOOD_MENU');
        await helpers.showSpinner(false);
        renderFoodMenu();
        helpers.showToast(`Menu Item ${foodId} deleted successfully.`, 'warning');
    }
}
