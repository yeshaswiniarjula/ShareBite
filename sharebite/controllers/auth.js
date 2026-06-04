/*
========================================================================
   ShareBite Enterprise Food Order Management System
   Authentication & Role-Based Access Controller (auth.js)
========================================================================
*/

const INITIAL_CREDENTIALS = [
    { "username": "admin", "password": "c2FwMTIz", "name": "A. Yeshaswini", "role": "Admin" } // "c2FwMTIz" = btoa("sap123")
];

// Initialize dynamic user credentials
function initAuthStore() {
    if (!localStorage.getItem('ZUSERS_CREDENTIALS')) {
        localStorage.setItem('ZUSERS_CREDENTIALS', JSON.stringify(INITIAL_CREDENTIALS));
    }
    state.credentials = JSON.parse(localStorage.getItem('ZUSERS_CREDENTIALS'));
}

// Check current user session status
function checkAuth() {
    const session = sessionStorage.getItem('sharebite_session');
    const role = sessionStorage.getItem('sharebite_role') || 'Customer';

    if (session) {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Enforce role-based layout overlays
        enforceRolePermissions(role);
        
        initAppView();
    } else {
        document.getElementById('loginView').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }
}

// Enforce conditional views and layout rendering based on role permissions
function enforceRolePermissions(role) {
    const navMenu = document.getElementById('nav-menu');
    const navCustomers = document.getElementById('nav-customers');
    const navOrders = document.getElementById('nav-orders');
    
    const addFoodBtn = document.querySelector('[onclick="openAddFoodModal()"]');
    const addCustBtn = document.querySelector('[onclick="openAddCustomerModal()"]');
    const addOrderBtn = document.querySelector('[onclick="openCreateOrderModal()"]');

    // Reset default views
    navMenu.style.display = 'flex';
    navCustomers.style.display = 'flex';
    navOrders.style.display = 'flex';
    if (addFoodBtn) addFoodBtn.style.display = 'block';
    if (addCustBtn) addCustBtn.style.display = 'block';
    if (addOrderBtn) addOrderBtn.style.display = 'block';

    if (role === 'Customer') {
        // Customers don't manage customer rosters or add menu items
        navCustomers.style.display = 'none';
        if (addFoodBtn) addFoodBtn.style.display = 'none';
        if (addCustBtn) addCustBtn.style.display = 'none';
    } else if (role === 'Delivery') {
        // Delivery agents only look at active orders to fulfill
        navMenu.style.display = 'none';
        navCustomers.style.display = 'none';
        if (addOrderBtn) addOrderBtn.style.display = 'none';
    }
    
    // Toggle role badge indicator in footer
    const roleBadge = document.querySelector('.sidebar-footer-info p');
    if (roleBadge) {
        let icon = role === 'Admin' ? 'fa-user-shield' : (role === 'Delivery' ? 'fa-motorcycle' : 'fa-user');
        roleBadge.innerHTML = `<i class="fa-solid ${icon}"></i> Role: ${role}`;
    }
}

// Perform login submission check using Base64 encryption comparison
async function handleLogin() {
    await helpers.showSpinner(true, 500);
    
    const userVal = document.getElementById('username').value.trim().toLowerCase();
    const passVal = document.getElementById('password').value;
    const encodedPass = helpers.btoaEncrypt(passVal);

    const matched = state.credentials.find(c => c.username.toLowerCase() === userVal && c.password === encodedPass);

    await helpers.showSpinner(false);

    if (matched) {
        sessionStorage.setItem('sharebite_session', matched.name);
        sessionStorage.setItem('sharebite_role', matched.role);
        
        helpers.showToast(`Login successful! Welcome, ${matched.name} (${matched.role}).`, 'success');
        checkAuth();
        
        // Reset inputs
        document.getElementById('password').value = '';
    } else {
        helpers.showToast('Authentication failed! Invalid credentials.', 'error');
    }
}

// Perform registration and store credentials
async function handleRegister() {
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const role = document.getElementById('regRole').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (username === 'admin') {
        helpers.showToast('Username "admin" is reserved by the system!', 'error');
        return;
    }

    const exists = state.credentials.some(c => c.username.toLowerCase() === username);
    if (exists) {
        helpers.showToast('Username already registered!', 'error');
        return;
    }

    if (password.length < 3) {
        helpers.showToast('Password must be at least 3 characters!', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        helpers.showToast('Passwords do not match!', 'error');
        return;
    }

    await helpers.showSpinner(true, 600);

    const encodedPassword = helpers.btoaEncrypt(password);
    const newCred = {
        "username": username,
        "password": encodedPassword,
        "name": fullName,
        "role": role
    };

    state.credentials.push(newCred);
    localStorage.setItem('ZUSERS_CREDENTIALS', JSON.stringify(state.credentials));

    // Automatically create a corresponding Customer profile in ZCUSTOMERSS
    const lastId = state.customers.reduce((max, c) => {
        const num = parseInt(c.CUSTOMER_ID.replace('C', ''));
        return num > max ? num : max;
    }, 100);
    const newCustId = `C${lastId + 1}`;

    const newCustomer = {
        "CUSTOMER_ID": newCustId,
        "NAME": fullName,
        "PHONE_NUMBER": "9876543210",
        "ADDRESS": "Hyderabad, TS"
    };
    state.customers.push(newCustomer);
    localStorage.setItem('ZCUSTOMERSS', JSON.stringify(state.customers));

    await helpers.showSpinner(false);

    helpers.showToast(`Account registered successfully as ${role}!`, 'success');
    
    document.getElementById('registerForm').reset();
    toggleLoginRegister(false);
}

// Switch forms inside login card
function toggleLoginRegister(showRegister) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const headerText = document.querySelector('.login-header p');

    if (showRegister) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        headerText.textContent = 'Create a New Account';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        headerText.textContent = 'Food Order Management System';
    }
}

// Log out user
function handleLogout() {
    sessionStorage.clear();
    helpers.showToast('Signed out of system successfully.', 'info');
    checkAuth();
}

// Initialize Auth logic on script evaluation
window.addEventListener('DOMContentLoaded', () => {
    initAuthStore();
    checkAuth();
});
