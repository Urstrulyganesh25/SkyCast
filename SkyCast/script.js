const apiKey = "7b7f4b4124821d246ec75b35f770f0bf";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const loader = document.getElementById("loader");
const loadingText = document.getElementById("loadingText");
const emptyState = document.getElementById("emptyState");
const weatherCard = document.getElementById("weatherCard");
const forecastToggleBtn = document.getElementById("forecastToggleBtn");
const forecastContainer = document.getElementById("forecastContainer");
let isLoading = false;
let forecastVisible = false;

// Initialize Skycons for main weather
const skycons = new Skycons({ "color": "white" });

// Load last city from storage on startup
// Disabled - users must manually search or use location
// window.addEventListener("load", () => {
//     const lastCity = localStorage.getItem("lastCity");
//     if (lastCity) {
//         getWeather(lastCity);
//     }
// });

// Forecast toggle button
forecastToggleBtn.addEventListener("click", () => {
    forecastVisible = !forecastVisible;
    if (forecastVisible) {
        forecastContainer.style.display = "flex";
        forecastToggleBtn.textContent = "📅 Hide 5-Day Forecast";
    } else {
        forecastContainer.style.display = "none";
        forecastToggleBtn.textContent = "📅 Show 5-Day Forecast";
    }
});

// --- Search button ---
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city === "") {
        alert("Enter a city name");
        return;
    }
    getWeather(city);
});

// --- Enter key search ---
cityInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        const city = cityInput.value.trim();
        if (city === "") {
            alert("Enter a city name");
            return;
        }
        getWeather(city);
    }
});

// --- GPS location button ---
locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByLocation(lat, lon);
        }, () => {
            alert("Unable to retrieve your location");
        });
    } else {
        alert("Geolocation is not supported by your browser");
    }
});

// --- Fetch weather by city ---
async function getWeather(city) {
    if (isLoading) return;
    isLoading = true;
    emptyState.style.display = "none";
    weatherCard.style.display = "none";
    forecastContainer.style.display = "none";
    forecastToggleBtn.style.display = "none";
    forecastVisible = false;
    loader.style.display = "block";

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("City not found");

        const data = await response.json();
        localStorage.setItem("lastCity", city);
        updateWeatherUI(data);
        getWeeklyForecast(data.coord.lat, data.coord.lon);
        forecastToggleBtn.style.display = "block";
        forecastToggleBtn.textContent = "📅 Show 5-Day Forecast";

    } catch (error) {
        alert("❌ " + error.message);
        emptyState.style.display = "block";
    }

    loader.style.display = "none";
    isLoading = false;
}

// --- Fetch weather by GPS ---
async function getWeatherByLocation(lat, lon) {
    if (isLoading) return;
    isLoading = true;
    emptyState.style.display = "none";
    weatherCard.style.display = "none";
    forecastContainer.style.display = "none";
    forecastToggleBtn.style.display = "none";
    forecastVisible = false;
    loader.style.display = "block";

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather data not found");

        const data = await response.json();
        localStorage.setItem("lastCity", data.name);
        updateWeatherUI(data);
        getWeeklyForecast(lat, lon);
        forecastToggleBtn.style.display = "block";
        forecastToggleBtn.textContent = "📅 Show 5-Day Forecast";

    } catch (error) {
        alert("❌ Unable to fetch weather for your location");
    }

    loader.style.display = "none";
    isLoading = false;
}

// --- Update DOM with main weather ---
function updateWeatherUI(data) {
    document.getElementById("city").innerText = data.name + ", " + data.sys.country;
    document.getElementById("temp").innerText = Math.round(data.main.temp) + "°C";
    document.getElementById("condition").innerText = data.weather[0].main;
    document.getElementById("feels").innerText = Math.round(data.main.feels_like) + "°C";
    document.getElementById("humidity").innerText = data.main.humidity + "%";
    document.getElementById("wind").innerText = data.wind.speed + " km/h";

    // Wind direction
    const windDeg = data.wind.deg || 0;
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const dirIndex = Math.round(windDeg / 22.5) % 16;
    document.getElementById("windDir").innerText = directions[dirIndex] + " (" + windDeg + "°)";

    // Additional info
    document.getElementById("pressure").innerText = data.main.pressure + " mb";
    document.getElementById("visibility").innerText = (data.visibility / 1000).toFixed(1) + " km";

    // Sunrise & Sunset
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    document.getElementById("sunrise").innerText = sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    document.getElementById("sunset").innerText = sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    cityInput.value = "";
    weatherCard.style.display = "block";

    // Animate main weather icon
    let weatherMain = data.weather[0].main.toLowerCase();
    skycons.set("icon",
        weatherMain.includes("cloud") ? "CLOUDY" :
            weatherMain.includes("rain") ? "RAIN" :
                weatherMain.includes("snow") ? "SNOW" :
                    weatherMain.includes("clear") ? "CLEAR_DAY" :
                        "PARTLY_CLOUDY_DAY"
    );
    skycons.play();

    changeBackground(data.weather[0].main);
}

// --- Change background based on weather ---
function changeBackground(weather) {
    const body = document.body;
    const weatherCard = document.getElementById("weatherCard");
    const emptyState = document.getElementById("emptyState");

    if (weather === "Clear") {
        body.style.background = "linear-gradient(135deg,#E36A6A,#FF8B5A)";
        weatherCard.style.color = "white";
        emptyState.style.color = "rgba(255, 255, 255, 0.8)";
    } else if (weather === "Clouds") {
        body.style.background = "linear-gradient(135deg,#bdc3c7,#2c3e50)";
        weatherCard.style.color = "white";
        emptyState.style.color = "rgba(255, 255, 255, 0.8)";
    } else if (weather === "Rain") {
        body.style.background = "linear-gradient(135deg,#4b6cb7,#182848)";
        weatherCard.style.color = "white";
        emptyState.style.color = "rgba(255, 255, 255, 0.8)";
    } else if (weather === "Snow") {
        body.style.background = "linear-gradient(135deg,#e6dada,#274046)";
        weatherCard.style.color = "#333";
        emptyState.style.color = "rgba(51, 51, 51, 0.8)";
    } else {
        body.style.background = "linear-gradient(135deg,#74ebd5,#ACB6E5)";
        weatherCard.style.color = "white";
        emptyState.style.color = "rgba(255, 255, 255, 0.8)";
    }
}

// --- 5-day forecast (using free API) ---
async function getWeeklyForecast(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Forecast not found");

        const forecast = await response.json();
        const dailyData = {};

        // Group forecasts by day
        forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString();

            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    dt: item.dt,
                    temp_max: item.main.temp_max,
                    temp_min: item.main.temp_min,
                    weather: item.weather[0].main,
                    temps: [item.main.temp]
                };
            } else {
                dailyData[dayKey].temp_max = Math.max(dailyData[dayKey].temp_max, item.main.temp_max);
                dailyData[dayKey].temp_min = Math.min(dailyData[dayKey].temp_min, item.main.temp_min);
                dailyData[dayKey].temps.push(item.main.temp);
            }
        });

        forecastContainer.innerHTML = '';

        // Show first 5 days
        Object.keys(dailyData).slice(0, 5).forEach(dayKey => {
            const day = dailyData[dayKey];
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
            const uniqueId = `icon-${day.dt}`;

            const div = document.createElement("div");
            div.classList.add("forecast-day");
            div.innerHTML = `
                <p>${dayName}</p>
                <canvas id="${uniqueId}" width="50" height="50"></canvas>
                <p>${Math.round(day.temp_max)}° / ${Math.round(day.temp_min)}°C</p>
            `;
            forecastContainer.appendChild(div);

            // Skycons for forecast
            let weather = day.weather.toLowerCase();
            const sc = new Skycons({ "color": "white" });
            sc.set(uniqueId,
                weather.includes("cloud") ? "CLOUDY" :
                    weather.includes("rain") ? "RAIN" :
                        weather.includes("snow") ? "SNOW" :
                            weather.includes("clear") ? "CLEAR_DAY" :
                                "PARTLY_CLOUDY_DAY"
            );
            sc.play();
        });

    } catch (err) {
        console.error(err);
        forecastContainer.innerHTML = "<p style='color:white;'>Forecast not available</p>";
    }
}