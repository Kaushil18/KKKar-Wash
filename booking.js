const API_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function loadBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load bookings');
        
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-calendar-x display-1 text-muted"></i>
                    <h4 class="mt-3">No bookings found</h4>
                    <p class="text-muted">You haven't made any bookings yet.</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newBookingModal">
                        <i class="bi bi-plus-circle"></i> Make a Booking
                    </button>
                </div>
            `;
            return;
        }
        
        renderBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load bookings. Please try again.
            </div>
        `;
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    
    const statusFilter = document.getElementById('filterStatus')?.value;
    const dateFrom = document.getElementById('filterDateFrom')?.value;
    const dateTo = document.getElementById('filterDateTo')?.value;
    
    let filtered = bookings;
    
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    if (dateFrom) {
        filtered = filtered.filter(b => b.booking_date >= dateFrom);
    }
    
    if (dateTo) {
        filtered = filtered.filter(b => b.booking_date <= dateTo);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">No bookings match your filters.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-hover">';
    html += `
        <thead>
            <tr>
                <th>Service</th>
                <th>Vehicle</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    filtered.forEach(booking => {
        const statusBadge = {
            pending: 'bg-warning text-dark',
            confirmed: 'bg-primary',
            completed: 'bg-success',
            cancelled: 'bg-danger'
        }[booking.status] || 'bg-secondary';
        
        html += `
            <tr>
                <td>${booking.service_name}</td>
                <td>${booking.license_plate}</td>
                <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                <td>${booking.booking_time}</td>
                <td><span class="badge ${statusBadge}">${booking.status}</span></td>
                <td>$${booking.service_price}</td>
                <td>
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-sm btn-success pay-btn" data-booking-id="${booking.id}">
                            <i class="bi bi-credit-card"></i> Pay
                        </button>
                        <button class="btn btn-sm btn-danger cancel-btn" data-booking-id="${booking.id}">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                    ${booking.status === 'confirmed' ? `
                        <button class="btn btn-sm btn-danger cancel-btn" data-booking-id="${booking.id}">
                            <i class="bi bi-x-circle"></i> Cancel
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => cancelBooking(btn.dataset.bookingId));
    });
    
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => processPayment(btn.dataset.bookingId));
    });
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to cancel booking');
        
        alert('Booking cancelled successfully');
        loadBookings();
    } catch (error) {
        alert(error.message || 'Failed to cancel booking');
    }
}

async function processPayment(bookingId) {
    try {
        const method = confirm('Use card payment? Click OK for card, Cancel for cash.');
        const paymentMethod = method ? 'card' : 'cash';
        
        const response = await fetch(`${API_URL}/payments/process/${bookingId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ payment_method: paymentMethod })
        });
        
        if (!response.ok) throw new Error('Payment failed');
        
        alert('Payment successful! Your booking is confirmed.');
        loadBookings();
    } catch (error) {
        alert(error.message || 'Payment failed');
    }
}

async function loadServices() {
    const select = document.getElementById('serviceSelect');
    if (!select) return;
    
    try {
        const response = await fetch(`${API_URL}/services?active=true`);
        const services = await response.json();
        
        select.innerHTML = '<option value="">Select a service...</option>';
        services.forEach(service => {
            select.innerHTML += `
                <option value="${service.id}">${service.name} - $${service.price} (${service.duration}min)</option>
            `;
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

async function loadVehicles() {
    const select = document.getElementById('vehicleSelect');
    if (!select) return;
    
    try {
        const response = await fetch(`${API_URL}/vehicles`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load vehicles');
        
        const vehicles = await response.json();
        select.innerHTML = '<option value="">Select a vehicle...</option>';
        vehicles.forEach(vehicle => {
            select.innerHTML += `
                <option value="${vehicle.id}">${vehicle.license_plate} - ${vehicle.make} ${vehicle.model}</option>
            `;
        });
    } catch (error) {
        console.error('Error loading vehicles:', error);
    }
}

async function loadAvailableSlots(date) {
    const select = document.getElementById('bookingTime');
    if (!select || !date) return;
    
    select.innerHTML = '<option value="">Loading...</option>';
    select.disabled = true;
    
    try {
        const serviceId = document.getElementById('serviceSelect').value;
        let url = `${API_URL}/bookings/available-slots?date=${date}`;
        if (serviceId) url += `&service_id=${serviceId}`;
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load slots');
        
        const slots = await response.json();
        select.innerHTML = '<option value="">Select a time...</option>';
        if (slots.length === 0) {
            select.innerHTML += '<option value="" disabled>No slots available</option>';
        } else {
            slots.forEach(slot => {
                select.innerHTML += `<option value="${slot}">${slot}</option>`;
            });
        }
        select.disabled = false;
    } catch (error) {
        console.error('Error loading slots:', error);
        select.innerHTML = '<option value="">Error loading slots</option>';
        select.disabled = false;
    }
}

async function submitBooking() {
    const serviceId = document.getElementById('serviceSelect').value;
    const vehicleId = document.getElementById('vehicleSelect').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const notes = document.getElementById('bookingNotes').value;
    const errorEl = document.getElementById('bookingError');
    const btn = document.getElementById('submitBooking');
    const btnText = document.getElementById('submitText');
    const spinner = document.getElementById('submitSpinner');
    
    if (!serviceId || !vehicleId || !date || !time) {
        errorEl.textContent = 'Please fill in all required fields';
        errorEl.classList.remove('d-none');
        return;
    }
    
    errorEl.classList.add('d-none');
    btn.disabled = true;
    btnText.textContent = 'Booking...';
    spinner.classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ service_id: serviceId, vehicle_id: vehicleId, booking_date: date, booking_time: time, notes })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Booking failed');
        }
        
        alert('Booking created successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('newBookingModal'));
        modal.hide();
        loadBookings();
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Book Now';
        spinner.classList.add('d-none');
    }
}

async function saveVehicle() {
    const licensePlate = document.getElementById('vLicensePlate').value;
    const make = document.getElementById('vMake').value;
    const model = document.getElementById('vModel').value;
    const color = document.getElementById('vColor').value;
    
    if (!licensePlate) {
        alert('License plate is required');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/vehicles`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ license_plate: licensePlate, make, model, color })
        });
        
        if (!response.ok) throw new Error('Failed to save vehicle');
        
        alert('Vehicle added successfully');
        const modal = bootstrap.Modal.getInstance(document.getElementById('vehicleModal'));
        modal.hide();
        loadVehicles();
    } catch (error) {
        alert(error.message || 'Failed to save vehicle');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('bookingsList')) {
        loadBookings();
        loadServices();
        loadVehicles();
        
        document.getElementById('applyFilter')?.addEventListener('click', loadBookings);
        document.getElementById('filterStatus')?.addEventListener('change', loadBookings);
        document.getElementById('filterDateFrom')?.addEventListener('change', loadBookings);
        document.getElementById('filterDateTo')?.addEventListener('change', loadBookings);
        
        document.getElementById('serviceSelect')?.addEventListener('change', function() {
            const date = document.getElementById('bookingDate').value;
            if (date) loadAvailableSlots(date);
        });
        
        document.getElementById('bookingDate')?.addEventListener('change', function() {
            if (this.value) loadAvailableSlots(this.value);
        });
        
        document.getElementById('submitBooking')?.addEventListener('click', submitBooking);
        document.getElementById('saveVehicle')?.addEventListener('click', saveVehicle);
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new') {
            const modal = new bootstrap.Modal(document.getElementById('newBookingModal'));
            modal.show();
        }
    }
});

async function loadDashboardStats() {
    const user = getCurrentUser();
    if (!user || user.role === 'admin') return;
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load stats');
        
        const bookings = await response.json();
        const active = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
        const completed = bookings.filter(b => b.status === 'completed');
        const totalSpent = completed.reduce((sum, b) => sum + parseFloat(b.service_price), 0);
        
        document.getElementById('activeBookings').textContent = active.length;
        document.getElementById('completedBookings').textContent = completed.length;
        document.getElementById('totalSpent').textContent = totalSpent.toFixed(2);
        
        const upcoming = active.slice(0, 5);
        const container = document.getElementById('upcomingBookings');
        if (container) {
            if (upcoming.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">No upcoming bookings. <a href="bookings.html?action=new">Book now!</a></p>';
            } else {
                let html = '<ul class="list-group">';
                upcoming.forEach(b => {
                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${b.service_name}</strong>
                                <br>
                                <small class="text-muted">${new Date(b.booking_date).toLocaleDateString()} at ${b.booking_time}</small>
                            </div>
                            <span class="badge bg-${b.status === 'pending' ? 'warning text-dark' : 'primary'}">${b.status}</span>
                        </li>
                    `;
                });
                html += '</ul>';
                container.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

if (document.getElementById('activeBookings')) {
    loadDashboardStats();
}