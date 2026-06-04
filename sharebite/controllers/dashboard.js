/*
========================================================================
   ShareBite Enterprise Food Order Management System
   Dashboard & Live KPI Analytics Controller (dashboard.js)
========================================================================
*/

// Update all Dashboard KPIs (delivering extra detailed tiles)
function updateKPIs() {
    // 1. Total Orders
    const totalOrders = state.orders.length;
    document.getElementById('kpi-total-orders').textContent = totalOrders;

    // 2. Total Customers
    const totalCusts = state.customers.length;
    document.getElementById('kpi-total-customers').textContent = totalCusts;

    // 3. Available Food Items
    const availableFoods = state.menu.filter(f => f.AVAILABLE === 'Yes').length;
    document.getElementById('kpi-total-foods').textContent = availableFoods;

    // 4. Total Revenue (sum of active orders)
    const revenue = state.orders
        .filter(o => o.STATUS !== 'Cancelled')
        .reduce((sum, o) => sum + parseFloat(o.TOTAL_AMOUNT), 0);
    document.getElementById('kpi-total-revenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;

    // 5. Delivered Orders Count
    const deliveredCount = state.orders.filter(o => o.STATUS === 'Delivered').length;
    const delWidget = document.getElementById('kpi-delivered-orders');
    if (delWidget) delWidget.textContent = deliveredCount;

    // 6. Pending Orders Count
    const pendingCount = state.orders.filter(o => o.STATUS === 'Pending').length;
    const penWidget = document.getElementById('kpi-pending-orders');
    if (penWidget) penWidget.textContent = pendingCount;

    // 7. Cancelled Orders Count
    const cancelledCount = state.orders.filter(o => o.STATUS === 'Cancelled').length;
    const canWidget = document.getElementById('kpi-cancelled-orders');
    if (canWidget) canWidget.textContent = cancelledCount;

    // 8. Today's Revenue Calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRevenue = state.orders
        .filter(o => o.DATE === todayStr && o.STATUS !== 'Cancelled')
        .reduce((sum, o) => sum + parseFloat(o.TOTAL_AMOUNT), 0);
    const todayRevWidget = document.getElementById('kpi-today-revenue');
    if (todayRevWidget) todayRevWidget.textContent = `₹${todayRevenue.toLocaleString('en-IN')}`;
}

// Generate last 7 days starting dynamically from today's system date
function generateLast7Days() {
    const dates = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dates.push(iso);
        labels.push(label);
    }
    return { dates, labels };
}

// Render dynamic recent orders table
function renderDashboard() {
    const tableBody = document.getElementById('dashboardRecentOrdersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Sort orders by ID descending (newest first)
    const sortedOrders = [...state.orders].sort((a, b) => b.ORDER_ID.localeCompare(a.ORDER_ID)).slice(0, 5);

    if (sortedOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--fiori-text-secondary); padding: 2rem;">No recent transactions.</td></tr>`;
        return;
    }

    sortedOrders.forEach(o => {
        const item = state.menu.find(f => f.FOOD_ID === o.FOOD_ID);
        const itemName = item ? item.FOOD_NAME : 'Unknown Item';
        const badgeClass = o.STATUS === 'Delivered' ? 'status-delivered' : (o.STATUS === 'Pending' ? 'status-pending' : 'status-cancelled');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${o.ORDER_ID}</strong></td>
            <td>${o.CUTSOMER_ID}</td>
            <td>${itemName}</td>
            <td><strong>₹${o.TOTAL_AMOUNT}</strong></td>
            <td>${o.WAERS}</td>
            <td><span class="badge ${badgeClass}">${o.STATUS}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// Instantiate visual charts
function initCharts() {
    const ctxTrend = document.getElementById('ordersChart');
    if (!ctxTrend) return;

    const trendObj = generateLast7Days();
    const trendLabels = trendObj.labels;

    // Line & Bar dynamic Chart
    state.charts.trend = new Chart(ctxTrend.getContext('2d'), {
        type: 'bar',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Revenue (INR)',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(10, 110, 209, 0.75)',
                borderColor: '#0a6ed1',
                borderWidth: 1.5,
                borderRadius: 4,
                yAxisID: 'y'
            }, {
                label: 'Trend',
                data: [0, 0, 0, 0, 0, 0, 0],
                type: 'line',
                borderColor: '#1866b4',
                borderWidth: 2,
                fill: false,
                tension: 0.35,
                yAxisID: 'y'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'var(--fiori-border-color)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Doughnut chart of categories
    const ctxCat = document.getElementById('categoriesChart');
    if (!ctxCat) return;

    state.charts.category = new Chart(ctxCat.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Fast Food', 'Snacks', 'Main Course'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#0a6ed1',
                    '#ffc107',
                    '#107e3e'
                ],
                borderWidth: 2,
                borderColor: 'var(--fiori-card-bg)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 },
                        color: 'var(--fiori-text-secondary)'
                    }
                }
            },
            cutout: '65%'
        }
    });

    updateCharts();
}

// Perform live database mapping into the analytical charts
function updateCharts() {
    if (!state.charts.trend || !state.charts.category) return;

    const categoriesCount = {
        'Fast Food': 0,
        'Snacks': 0,
        'Main Course': 0
    };

    const trendObj = generateLast7Days();
    const dateLookup = {};
    trendObj.dates.forEach(d => dateLookup[d] = 0);

    state.orders.forEach(o => {
        if (o.STATUS !== 'Cancelled') {
            const food = state.menu.find(f => f.FOOD_ID === o.FOOD_ID);
            if (food && categoriesCount.hasOwnProperty(food.CATEGORY)) {
                categoriesCount[food.CATEGORY] += o.QUANTITY;
            }

            if (dateLookup.hasOwnProperty(o.DATE)) {
                dateLookup[o.DATE] += o.TOTAL_AMOUNT;
            }
        }
    });

    // Update datasets
    state.charts.trend.data.datasets[0].data = Object.values(dateLookup);
    state.charts.trend.data.datasets[1].data = Object.values(dateLookup);
    state.charts.trend.update();

    state.charts.category.data.datasets[0].data = Object.values(categoriesCount);
    state.charts.category.update();
}
