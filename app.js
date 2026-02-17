// Weather App - Login, Register & Current Weather
const API_KEY = 'ae728243c02b3d032060311670dc3283';
const API_BASE = 'https://api.weatherstack.com/current';

// DOM Elements
const authSection = document.getElementById('auth-section');
const weatherSection = document.getElementById('weather-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const authError = document.getElementById('auth-error');
const registerError = document.getElementById('register-error');
const logoutBtn = document.getElementById('logout-btn');
const citySearch = document.getElementById('city-search');
const searchBtn = document.getElementById('search-btn');
const weatherLoading = document.getElementById('weather-loading');
const weatherDisplay = document.getElementById('weather-display');
const weatherError = document.getElementById('weather-error');

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            authError.textContent = '';
            registerError.textContent = '';
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            authError.textContent = '';
            registerError.textContent = '';
        }
    });
});

// Register
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    registerError.textContent = '';

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;

    if (password.length < 6) {
        registerError.textContent = 'Password must be at least 6 characters.';
        return;
    }

    const users = JSON.parse(localStorage.getItem('weatherUsers') || '[]');
    if (users.some(u => u.email === email)) {
        registerError.textContent = 'Email already registered. Please login.';
        return;
    }

    users.push({ name, email, password });
    localStorage.setItem('weatherUsers', JSON.stringify(users));
    localStorage.setItem('weatherCurrentUser', JSON.stringify({ name, email }));

    showWeather();
    fetchWeather('New York');
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    authError.textContent = '';

    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const users = JSON.parse(localStorage.getItem('weatherUsers') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        authError.textContent = 'Invalid email or password.';
        return;
    }

    localStorage.setItem('weatherCurrentUser', JSON.stringify({ name: user.name, email: user.email }));
    showWeather();
    fetchWeather('New York');
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('weatherCurrentUser');
    authSection.classList.remove('hidden');
    weatherSection.classList.add('hidden');
    loginForm.reset();
    registerForm.reset();
});

// Search
searchBtn.addEventListener('click', () => {
    const city = citySearch.value.trim();
    if (city) fetchWeather(city);
});

citySearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = citySearch.value.trim();
        if (city) fetchWeather(city);
    }
});

// Show/Hide sections
function showWeather() {
    authSection.classList.add('hidden');
    weatherSection.classList.remove('hidden');
}

// Fetch weather from API (using JSONP to bypass CORS)
function fetchWeather(query) {
    weatherLoading.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    weatherError.classList.add('hidden');

    const callbackName = 'weatherCallback_' + Date.now();
    window[callbackName] = function (data) {
        delete window[callbackName];
        document.getElementById('weatherJsonpScript')?.remove();

        if (data.error) {
            weatherLoading.classList.add('hidden');
            weatherDisplay.classList.add('hidden');
            weatherError.classList.remove('hidden');
            weatherError.querySelector('p').textContent = data.error.info || 'API Error';
            return;
        }
        displayWeather(data);
        weatherLoading.classList.add('hidden');
        weatherError.classList.add('hidden');
        weatherDisplay.classList.remove('hidden');
    };

    const url = `${API_BASE}?access_key=${API_KEY}&query=${encodeURIComponent(query)}&units=m&callback=${callbackName}`;
    const script = document.createElement('script');
    script.id = 'weatherJsonpScript';
    script.src = url;
    script.onerror = () => {
        delete window[callbackName];
        weatherLoading.classList.add('hidden');
        weatherDisplay.classList.add('hidden');
        weatherError.classList.remove('hidden');
        weatherError.querySelector('p').textContent = 'Unable to fetch weather. Check your connection or try another city.';
    };
    document.head.appendChild(script);
}

// Display weather data
function displayWeather(data) {
    const { location, current } = data;

    document.getElementById('location-name').textContent = `${location.name}, ${location.country}`;
    document.getElementById('location-time').textContent = location.localtime || '—';

    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.src = current.weather_icons?.[0] || '';
    weatherIcon.style.display = current.weather_icons?.[0] ? 'block' : 'none';

    document.getElementById('temperature').textContent = current.temperature ?? '—';
    document.getElementById('weather-desc').textContent = current.weather_descriptions?.[0] || '—';

    document.getElementById('feels-like').textContent = `${current.feelslike ?? '—'}°C`;
    document.getElementById('humidity').textContent = `${current.humidity ?? '—'}%`;
    document.getElementById('wind-speed').textContent = `${current.wind_speed ?? '—'} km/h`;
    document.getElementById('pressure').textContent = `${current.pressure ?? '—'} mb`;
    document.getElementById('uv-index').textContent = current.uv_index ?? '—';
    document.getElementById('visibility').textContent = `${current.visibility ?? '—'} km`;

    weatherLoading.classList.add('hidden');
    weatherError.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');
}

// Check if user is logged in on load
function init() {
    const currentUser = localStorage.getItem('weatherCurrentUser');
    if (currentUser) {
        showWeather();
        fetchWeather('New York');
    }
}

init();
