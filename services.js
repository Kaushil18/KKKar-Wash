const API_URL = 'http://localhost:5000/api';

async function loadServices() {
    const container = document.getElementById('services-container');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/services?active=true`);
        const services = await response.json();
        
        if (services.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No services available.</p>';
            return;
        }
        
        let html = '';
        services.forEach(service => {
            html += `
                <div class="col-md-4 service-card">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${service.name}</h5>
                            <p class="card-text">${service.description || 'Professional car wash service'}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="h5 mb-0">$${service.price}</span>
                                <span class="badge bg-info">${service.duration} min</span>
                            </div>
                            <a href="${isAuthenticated() ? 'bookings.html?action=new' : 'login.html'}" class="btn btn-primary mt-3 w-100">
                                <i class="bi bi-calendar-plus"></i> Book Now
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading services:', error);
        container.innerHTML = '<p class="text-center text-danger">Failed to load services.</p>';
    }
}

async function loadServicesForSelect() {
    const select = document.getElementById('serviceSelect');
    if (!select) return;
    
    try {
        const response = await fetch(`${API_URL}/services?active=true`);
        const services = await response.json();
        
        select.innerHTML = '<option value="">Select a service...</option>';
        services.forEach(service => {
            select.innerHTML += `
                <option value="${service.id}">${service.name} - $${service.price}</option>
            `;
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('services-container')) {
        loadServices();
    }
});