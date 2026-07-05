const API_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Load admin dashboard
async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load dashboard');

        const data = await response.json();

        document.getElementById('todayBookings').textContent = data.today.bookings;
        document.getElementById('todayRevenue').textContent = data.today.revenue.toFixed(2);
        document.getElementById('totalBookings').textContent = data.total.bookings;
        document.getElementById('totalCustomers').textContent = data.total.customers;

        // Load recent bookings
        loadRecentBookings();
        
        // Load weekly revenue
        loadWeeklyRevenue(data.weeklyRevenue);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load recent bookings
async function loadRecentBookings() {
    const container = document.getElementById('recentBookings');
    
    try {
        const response = await fetch(`${API_URL}/admin/bookings?limit=10`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load bookings');

        const bookings = await response.json();

        if (bookings.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No bookings found.</p>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover">';
        html += `
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
        `;

        bookings.slice(0, 10).forEach(booking => {
            const statusBadge = {
                pending: 'bg-warning text-dark',
                confirmed: 'bg-primary',
                completed: 'bg-success',
                cancelled: 'bg-danger'
            }[booking.status] || 'bg-secondary';

            html += `
                <tr>
                    <td>${booking.customer_name}</td>
                    <td>${booking.service_name}</td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td><span class="badge ${statusBadge}">${booking.status}</span></td>
                    <td>$${booking.service_price}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Failed to load bookings</div>';
    }
}

// Load weekly revenue
function loadWeeklyRevenue(data) {
    const container = document.getElementById('weeklyRevenueChart');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No revenue data available.</p>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-sm">';
    html += `
        <thead>
            <tr>
                <th>Date</th>
                <th>Bookings</th>
                <th>Revenue</th>
            </tr>
        </thead>
        <tbody>
    `;

    data.forEach(day => {
        html += `
            <tr>
                <td>${new Date(day.date).toLocaleDateString()}</td>
                <td>${day.bookings}</td>
                <td>$${day.revenue.toFixed(2)}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Load services for admin
async function loadServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/services`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load services');

        const services = await response.json();

        if (services.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No services available.</p>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover">';
        html += `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
        `;

        services.forEach(service => {
            html += `
                <tr>
                    <td>${service.name}</td>
                    <td>${service.description || '-'}</td>
                    <td>$${service.price}</td>
                    <td>${service.duration} min</td>
                    <td><span class="badge ${service.is_active ? 'bg-success' : 'bg-danger'}">${service.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-service" data-id="${service.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-service" data-id="${service.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        // Add event listeners
        document.querySelectorAll('.edit-service').forEach(btn => {
            btn.addEventListener('click', () => editService(btn.dataset.id));
        });

        document.querySelectorAll('.delete-service').forEach(btn => {
            btn.addEventListener('click', () => deleteService(btn.dataset.id));
        });
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Failed to load services</div>';
    }
}

// Edit service
async function editService(id) {
    try {
        const response = await fetch(`${API_URL}/services/${id}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load service');

        const service = await response.json();

        document.getElementById('serviceId').value = service.id;
        document.getElementById('sName').value = service.name;
        document.getElementById('sDescription').value = service.description || '';
        document.getElementById('sPrice').value = service.price;
        document.getElementById('sDuration').value = service.duration;
        document.getElementById('sActive').checked = service.is_active;
        document.getElementById('serviceModalTitle').textContent = 'Edit Service';

        const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
        modal.show();
    } catch (error) {
        alert('Failed to load service');
    }
}

// Delete service
async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
        const response = await fetch(`${API_URL}/services/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete service');

        alert('Service deleted successfully');
        loadServices();
    } catch (error) {
        alert('Failed to delete service');
    }
}

// Save service (create or update)
async function saveService() {
    const id = document.getElementById('serviceId').value;
    const name = document.getElementById('sName').value;
    const description = document.getElementById('sDescription').value;
    const price = document.getElementById('sPrice').value;
    const duration = document.getElementById('sDuration').value;
    const is_active = document.getElementById('sActive').checked;
    
    const errorEl = document.getElementById('serviceError');
    const btn = document.getElementById('saveService');
    const btnText = document.getElementById('saveServiceText');
    const spinner = document.getElementById('saveServiceSpinner');

    if (!name || !price || !duration) {
        errorEl.textContent = 'Please fill in all required fields';
        errorEl.classList.remove('d-none');
        return;
    }

    errorEl.classList.add('d-none');
    btn.disabled = true;
    btnText.textContent = 'Saving...';
    spinner.classList.remove('d-none');

    try {
        const url = id ? `${API_URL}/services/${id}` : `${API_URL}/services`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, description, price, duration, is_active })
        });

        if (!response.ok) throw new Error('Failed to save service');

        alert(id ? 'Service updated successfully' : 'Service created successfully');
        const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
        modal.hide();
        loadServices();
        resetServiceForm();
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Save Service';
        spinner.classList.add('d-none');
    }
}

// Reset service form
function resetServiceForm() {
    document.getElementById('serviceId').value = '';
    document.getElementById('sName').value = '';
    document.getElementById('sDescription').value = '';
    document.getElementById('sPrice').value = '';
    document.getElementById('sDuration').value = '';
    document.getElementById('sActive').checked = true;
    document.getElementById('serviceModalTitle').textContent = 'Add New Service';
    document.getElementById('serviceError').classList.add('d-none');
}

// Generate report
async function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const container = document.getElementById('reportTable');

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/revenue?startDate=${startDate}&endDate=${endDate}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to generate report');

        const data = await response.json();

        document.getElementById('reportTotalRevenue').textContent = data.totalRevenue.toFixed(2);
        document.getElementById('reportTotalBookings').textContent = data.totalBookings;

        if (data.dailyData.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No data available for this period.</p>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover" id="reportDataTable">';
        html += `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
        `;

        data.dailyData.forEach(day => {
            html += `
                <tr>
                    <td>${new Date(day.date).toLocaleDateString()}</td>
                    <td>${day.bookings}</td>
                    <td>$${day.revenue.toFixed(2)}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

        // Store data for CSV export
        window.reportData = data.dailyData;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Failed to generate report</div>';
    }
}

// Export CSV
function exportCSV() {
    if (!window.reportData || window.reportData.length === 0) {
        alert('No data to export. Generate a report first.');
        return;
    }

    let csv = 'Date,Bookings,Revenue\n';
    window.reportData.forEach(day => {
        csv += `${new Date(day.date).toLocaleDateString()},${day.bookings},${day.revenue.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Initialize admin pages
document.addEventListener('DOMContentLoaded', function() {
    // Admin Dashboard
    if (document.getElementById('todayBookings')) {
        loadAdminDashboard();
    }

    // Manage Services
    if (document.getElementById('servicesList')) {
        loadServices();
        
        document.getElementById('saveService')?.addEventListener('click', saveService);
        
        document.getElementById('serviceModal')?.addEventListener('hidden.bs.modal', resetServiceForm);
    }

    // Reports
    if (document.getElementById('generateReport')) {
        document.getElementById('generateReport').addEventListener('click', generateReport);
        document.getElementById('exportCSV')?.addEventListener('click', exportCSV);
        
        // Set default date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    }
});