// ShopVista E-Commerce Business Analytics Dashboard JS
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Feather / Lucide icons if available
    if (window.lucide) {
        lucide.createIcons();
    }

    // 2. Load and render charts
    initializeCharts();

    // 3. Setup event listeners
    setupNavigation();
    setupSearch();
});

let charts = {};

function formatCurrency(val) {
    if (val >= 10000000) {
        return '₹ ' + (val / 10000000).toFixed(2) + ' Cr';
    } else if (val >= 100000) {
        return '₹ ' + (val / 100000).toFixed(2) + ' L';
    } else if (val >= 1000) {
        return '₹ ' + (val / 1000).toFixed(1) + 'k';
    }
    return '₹ ' + val;
}

function initializeCharts() {
    // Extract data from server payload if present, or use standard defaults
    const payload = window.DASHBOARD_DATA || {};

    // ---------------------------------------------------------
    // Chart 1: Revenue Trend (Line chart with gradient fill)
    // ---------------------------------------------------------
    const revCtx = document.getElementById('revenueTrendChart')?.getContext('2d');
    if (revCtx) {
        const revGradient = revCtx.createLinearGradient(0, 0, 0, 240);
        revGradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        revGradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

        const revData = payload.revenue_trend || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: [2100000, 2250000, 2800000, 3300000, 3500000, 3550000, 4050000, 4650000, 5500000, 6450000, 6850000, 6152320]
        };

        charts.revenue = new Chart(revCtx, {
            type: 'line',
            data: {
                labels: revData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revData.data,
                    borderColor: '#2563eb',
                    borderWidth: 2.5,
                    backgroundColor: revGradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 10,
                        titleFont: { size: 12 },
                        bodyFont: { size: 13, weight: 'bold' },
                        callbacks: {
                            label: (ctx) => ' Revenue: ₹ ' + ctx.raw.toLocaleString('en-IN')
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 8000000,
                        ticks: {
                            stepSize: 2000000,
                            callback: (val) => {
                                if (val === 0) return '₹ 0';
                                return `₹ ${val / 1000000}M`;
                            },
                            color: '#94a3b8',
                            font: { size: 11 }
                        },
                        grid: {
                            color: '#f1f5f9',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ---------------------------------------------------------
    // Chart 2: Orders Trend (Vertical bar chart)
    // ---------------------------------------------------------
    const ordCtx = document.getElementById('ordersTrendChart')?.getContext('2d');
    if (ordCtx) {
        const ordData = payload.orders_trend || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: [540, 580, 640, 645, 650, 790, 805, 915, 1045, 1240, 1180, 1022]
        };

        charts.orders = new Chart(ordCtx, {
            type: 'bar',
            data: {
                labels: ordData.labels,
                datasets: [{
                    label: 'Orders',
                    data: ordData.data,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.65,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 10,
                        callbacks: {
                            label: (ctx) => ' Orders: ' + ctx.raw.toLocaleString()
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 1500,
                        ticks: {
                            stepSize: 500,
                            color: '#94a3b8',
                            font: { size: 11 },
                            callback: (val) => val.toLocaleString()
                        },
                        grid: {
                            color: '#f1f5f9',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ---------------------------------------------------------
    // Chart 3: Revenue by Category (Donut chart)
    // ---------------------------------------------------------
    const catCtx = document.getElementById('categoryDonutChart')?.getContext('2d');
    if (catCtx) {
        const catBreakdown = payload.category_breakdown || [
            { category: "Electronics", percentage: 32.4, color: "#3b82f6" },
            { category: "Fashion", percentage: 24.8, color: "#f97316" },
            { category: "Home & Living", percentage: 18.7, color: "#10b981" },
            { category: "Beauty & Personal Care", percentage: 9.6, color: "#06b6d4" },
            { category: "Sports & Fitness", percentage: 7.4, color: "#8b5cf6" },
            { category: "Books & Others", percentage: 6.1, color: "#ec4899" }
        ];

        charts.category = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: catBreakdown.map(c => c.category),
                datasets: [{
                    data: catBreakdown.map(c => c.percentage),
                    backgroundColor: catBreakdown.map(c => c.color),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '74%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`
                        }
                    }
                }
            }
        });
    }

    // ---------------------------------------------------------
    // Chart 4: Orders by City (Horizontal bar chart)
    // ---------------------------------------------------------
    const cityCtx = document.getElementById('cityBarChart')?.getContext('2d');
    if (cityCtx) {
        const cityData = payload.city_breakdown || [
            { city: "Delhi", percentage: 18.5 },
            { city: "Mumbai", percentage: 14.2 },
            { city: "Bengaluru", percentage: 11.7 },
            { city: "Hyderabad", percentage: 8.9 },
            { city: "Chennai", percentage: 7.6 },
            { city: "Kolkata", percentage: 6.8 },
            { city: "Others", percentage: 32.3 }
        ];

        charts.city = new Chart(cityCtx, {
            type: 'bar',
            data: {
                labels: cityData.map(c => c.city),
                datasets: [{
                    data: cityData.map(c => c.percentage),
                    backgroundColor: '#3b82f6',
                    borderRadius: 5,
                    borderSkipped: false,
                    barThickness: 12
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` Orders Share: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 40,
                        display: false,
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            color: '#1e293b',
                            font: { size: 12, weight: '500' }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ---------------------------------------------------------
    // Chart 5: Order Status (Donut chart)
    // ---------------------------------------------------------
    const statusCtx = document.getElementById('orderStatusChart')?.getContext('2d');
    if (statusCtx) {
        const statusData = payload.order_status || [
            { status: "Delivered", percentage: 72.6, color: "#10b981" },
            { status: "Shipped", percentage: 12.8, color: "#3b82f6" },
            { status: "Processing", percentage: 8.7, color: "#f59e0b" },
            { status: "Cancelled", percentage: 4.1, color: "#ef4444" },
            { status: "Returned", percentage: 1.8, color: "#8b5cf6" }
        ];

        charts.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusData.map(s => s.status),
                datasets: [{
                    data: statusData.map(s => s.percentage),
                    backgroundColor: statusData.map(s => s.color),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '74%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`
                        }
                    }
                }
            }
        });
    }
}

// -------------------------------------------------------------
// Interactive Navigation Switcher
// -------------------------------------------------------------
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetSection = link.getAttribute('data-target');
            switchSection(targetSection);
        });
    });
}

function switchSection(sectionId) {
    const mainView = document.getElementById('view-dashboard');
    const dynamicView = document.getElementById('view-dynamic');
    
    if (sectionId === 'dashboard') {
        mainView.classList.remove('hidden');
        dynamicView.classList.add('hidden');
        return;
    }

    mainView.classList.add('hidden');
    dynamicView.classList.remove('hidden');
    dynamicView.innerHTML = `<div class="p-8 text-center text-slate-500"><i class="animate-spin inline-block mr-2" data-lucide="loader"></i> Loading ${sectionId} view...</div>`;
    if (window.lucide) lucide.createIcons();

    if (sectionId === 'sales') {
        loadSalesView();
    } else if (sectionId === 'customers') {
        loadCustomerView();
    } else if (sectionId === 'products') {
        loadProductsView();
    } else if (sectionId === 'orders') {
        loadOrdersView();
    } else if (sectionId === 'reports') {
        loadReportsView();
    } else if (sectionId === 'settings') {
        loadSettingsView();
    }
}

// -------------------------------------------------------------
// Section View Loaders
// -------------------------------------------------------------
async function loadSalesView() {
    const res = await fetch('/api/sales-analysis');
    const data = await res.json();
    const payments = data.data?.payment_methods || [];
    const monthly = data.data?.monthly_performance || [];

    const dynamicView = document.getElementById('view-dynamic');
    dynamicView.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Sales & Revenue In-Depth Analysis</h2>
                    <p class="text-sm text-slate-500">Breakdown of payment channels and month-by-month revenue velocity</p>
                </div>
                <button onclick="switchSection('dashboard')" class="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">← Back to Overview</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${payments.map(p => `
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex justify-between items-center text-sm font-medium text-slate-500 mb-1">
                            <span>${p.payment_method} Channel</span>
                            <span class="text-blue-600 font-bold">${p.count} orders</span>
                        </div>
                        <div class="text-2xl font-bold text-slate-900">₹ ${Number(p.amount).toLocaleString('en-IN')}</div>
                    </div>
                `).join('')}
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 class="text-base font-bold text-slate-800 mb-4">Monthly Performance Ledger</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left styled-table">
                        <thead>
                            <tr class="border-b border-slate-100">
                                <th>Month</th>
                                <th>Total Orders</th>
                                <th>Gross Revenue</th>
                                <th>Avg Order Value (AOV)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthly.map(m => `
                                <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td class="font-semibold text-slate-800">${m.month_name} 2024</td>
                                    <td>${m.total_orders.toLocaleString()}</td>
                                    <td class="font-medium text-blue-600">₹ ${Number(m.total_revenue).toLocaleString('en-IN')}</td>
                                    <td>₹ ${Number(m.aov).toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function loadCustomerView() {
    const res = await fetch('/api/customer-analysis');
    const data = await res.json();
    const segments = data.data?.segments || [];
    const topCusts = data.data?.top_customers || [];

    const dynamicView = document.getElementById('view-dynamic');
    dynamicView.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Customer Segmentation (RFM Analysis)</h2>
                    <p class="text-sm text-slate-500">Cohort retention, spending tiers, and VIP customer profiles</p>
                </div>
                <button onclick="switchSection('dashboard')" class="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">← Back to Overview</button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${segments.map(s => `
                    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div class="text-xs uppercase font-bold text-slate-400">${s.customer_segment}</div>
                        <div class="text-2xl font-bold text-slate-900 mt-1">${s.count} users</div>
                        <div class="text-xs text-slate-500 mt-1">Avg Spent: ₹ ${Number(s.avg_spent).toLocaleString('en-IN')}</div>
                    </div>
                `).join('')}
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 class="text-base font-bold text-slate-800 mb-4">Top 10 VIP Customers by Lifetime Revenue</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left styled-table">
                        <thead>
                            <tr class="border-b border-slate-100">
                                <th>Customer Name</th>
                                <th>Email</th>
                                <th>City</th>
                                <th>Segment</th>
                                <th>Orders</th>
                                <th>Total Spend</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topCusts.map(c => `
                                <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td class="font-bold text-slate-800">${c.customer_name}</td>
                                    <td class="text-slate-500">${c.email}</td>
                                    <td>${c.city}</td>
                                    <td><span class="px-2.5 py-1 text-xs rounded-full font-semibold bg-blue-50 text-blue-700">${c.customer_segment}</span></td>
                                    <td>${c.total_orders_count}</td>
                                    <td class="font-bold text-emerald-600">₹ ${Number(c.total_spent).toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function loadProductsView() {
    const res = await fetch('/api/product-analysis');
    const data = await res.json();
    const products = data.data?.products || [];

    const dynamicView = document.getElementById('view-dynamic');
    dynamicView.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Product Portfolio & Inventory Health</h2>
                    <p class="text-sm text-slate-500">Stock thresholds, profit margins, and return rates</p>
                </div>
                <button onclick="switchSection('dashboard')" class="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">← Back to Overview</button>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left styled-table">
                        <thead>
                            <tr class="border-b border-slate-100">
                                <th>Product</th>
                                <th>Category</th>
                                <th>Unit Price</th>
                                <th>Cost Price</th>
                                <th>Margin</th>
                                <th>Stock Status</th>
                                <th>Return Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(p => {
                                const margin = (((p.unit_price - p.cost_price) / p.unit_price) * 100).toFixed(1);
                                const isLowStock = p.stock_quantity < 30;
                                const isHighReturn = p.return_rate >= 8.0;
                                return `
                                    <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td class="font-semibold text-slate-800">${p.product_name}</td>
                                        <td>${p.category_name}</td>
                                        <td>₹ ${Number(p.unit_price).toLocaleString('en-IN')}</td>
                                        <td>₹ ${Number(p.cost_price).toLocaleString('en-IN')}</td>
                                        <td class="text-emerald-600 font-semibold">${margin}%</td>
                                        <td>
                                            <span class="px-2.5 py-1 text-xs rounded-full font-semibold ${isLowStock ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
                                                ${p.stock_quantity} units ${isLowStock ? '⚠️ Low Stock' : ''}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="px-2.5 py-1 text-xs rounded-full font-semibold ${isHighReturn ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
                                                ${p.return_rate}% ${isHighReturn ? '⚠️ High' : ''}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function loadOrdersView() {
    const dynamicView = document.getElementById('view-dynamic');
    dynamicView.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Order Management & Fulfillment</h2>
                    <p class="text-sm text-slate-500">Live order repository with instant filtering and search</p>
                </div>
                <button onclick="switchSection('dashboard')" class="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">← Back to Overview</button>
            </div>

            <div class="flex gap-4 items-center">
                <input type="text" id="orderFilterSearch" placeholder="Search by Order ID, customer, city..." class="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <select id="orderFilterStatus" class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                    <option value="All">All Statuses</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Processing">Processing</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Returned">Returned</option>
                </select>
                <button onclick="fetchFilteredOrders()" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">Filter</button>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div class="overflow-x-auto" id="ordersTableContainer">
                    <div class="text-center py-6 text-slate-400">Loading orders...</div>
                </div>
            </div>
        </div>
    `;
    fetchFilteredOrders();
}

async function fetchFilteredOrders() {
    const search = document.getElementById('orderFilterSearch')?.value || '';
    const status = document.getElementById('orderFilterStatus')?.value || 'All';
    const container = document.getElementById('ordersTableContainer');

    const res = await fetch(`/api/orders?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&limit=30`);
    const data = await res.json();
    const orders = data.orders || [];

    const badgeClass = {
        'Delivered': 'bg-emerald-50 text-emerald-700',
        'Shipped': 'bg-blue-50 text-blue-700',
        'Processing': 'bg-amber-50 text-amber-700',
        'Cancelled': 'bg-rose-50 text-rose-700',
        'Returned': 'bg-purple-50 text-purple-700'
    };

    container.innerHTML = `
        <table class="w-full text-left styled-table">
            <thead>
                <tr class="border-b border-slate-100">
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>City</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(o => `
                    <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                        <td class="font-bold text-blue-600">#${o.order_number}</td>
                        <td class="font-medium text-slate-800">${o.customer_name}</td>
                        <td class="text-slate-500">${new Date(o.order_date).toLocaleDateString()}</td>
                        <td>${o.shipping_city}</td>
                        <td><span class="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">${o.payment_method}</span></td>
                        <td class="font-bold text-slate-900">₹ ${Number(o.total_amount).toLocaleString('en-IN')}</td>
                        <td>
                            <span class="px-2.5 py-1 text-xs rounded-full font-semibold ${badgeClass[o.order_status] || 'bg-slate-100 text-slate-700'}">
                                ${o.order_status}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadReportsView() {
    const dynamicView = document.getElementById('view-dynamic');
    dynamicView.innerHTML = `
        <div class="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">ShopVista Business Analytics Audit Report</h2>
                    <p class="text-sm text-slate-500">Executive Summary for Board & Stakeholder Reviews</p>
                </div>
                <div class="space-x-3">
                    <button onclick="window.print()" class="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">🖨️ Print Report</button>
                    <a href="/api/export-report" class="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold inline-block">📥 Download CSV</a>
                </div>
            </div>

            <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div class="border-b border-slate-100 pb-4">
                    <div class="text-xs uppercase tracking-wider text-blue-600 font-bold">Annual Performance Review (2024)</div>
                    <h3 class="text-xl font-bold text-slate-900 mt-1">ShopVista E-Commerce Operations</h3>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <div class="text-xs text-slate-500">Gross Revenue</div>
                        <div class="text-xl font-bold text-slate-900 mt-1">₹ 48,752,320</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-1">↑ 12.5% YoY</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <div class="text-xs text-slate-500">Fulfilled Orders</div>
                        <div class="text-xl font-bold text-slate-900 mt-1">8,492</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-1">↑ 8.3% YoY</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <div class="text-xs text-slate-500">Customer Base</div>
                        <div class="text-xl font-bold text-slate-900 mt-1">5,276</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-1">↑ 14.7% YoY</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl">
                        <div class="text-xs text-slate-500">Average Order Value</div>
                        <div class="text-xl font-bold text-slate-900 mt-1">₹ 5,744</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-1">↑ 3.2% YoY</div>
                    </div>
                </div>

                <div>
                    <h4 class="font-bold text-slate-800 mb-2">Key Executive Insights</h4>
                    <ul class="list-disc list-inside space-y-1.5 text-sm text-slate-600">
                        <li><strong>Category Leadership:</strong> Electronics leads overall sales at 32.4%, followed by Fashion (24.8%) and Home & Living (18.7%).</li>
                        <li><strong>Return Rate Advisory:</strong> Electronics has an anomalous 8.9% return rate. Supplier quality checks and packaging enhancements are prioritized.</li>
                        <li><strong>Geographic Concentration:</strong> Delhi (18.5%), Mumbai (14.2%), and Bengaluru (11.7%) contribute 44.4% of total order fulfillment.</li>
                        <li><strong>VIP Retention:</strong> Top 5 customer accounts generate 18.6% of gross GMV; dedicated loyalty tier is strongly recommended.</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function loadSettingsView() {
    const res = await fetch('/api/health');
    const health = await res.json();
    const dynamicView = document.getElementById('view-dynamic');
    dynamicView.innerHTML = `
        <div class="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">System & Database Settings</h2>
                    <p class="text-sm text-slate-500">Connection status and environment variables</p>
                </div>
                <button onclick="switchSection('dashboard')" class="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">← Back to Overview</button>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                        <div class="font-bold text-slate-800">MySQL Database Connection</div>
                        <div class="text-xs text-slate-500">Host: ${health.host} | DB: ${health.database}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${health.mysql_connected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                        ${health.mysql_connected ? '● CONNECTED' : '○ DISCONNECTED'}
                    </span>
                </div>

                <div class="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div class="font-bold text-slate-800">Seeder & Database Utilities</div>
                    <p class="text-xs text-slate-500">Re-run database seeder script anytime via terminal:</p>
                    <code class="block bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono">python database/seed_data.py</code>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// Search Bar Interaction
// -------------------------------------------------------------
function setupSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const productRows = document.querySelectorAll('#topProductsTableBody tr');
        const orderCards = document.querySelectorAll('#recentOrdersContainer > div');

        if (productRows.length > 0) {
            productRows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        }

        if (orderCards.length > 0) {
            orderCards.forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
            });
        }
    });
}
