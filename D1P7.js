const API_KEY = "baf49e52f3d78cb684a4fa7ffd311cde"; // Reemplaza con tu clave real
const weatherCard = document.getElementById("weatherCard");
const spinner = document.getElementById("spinner");
const errorMsg = document.getElementById("errorMsg");
const resultsContainer = document.getElementById("results");

const elements = {
  location: document.getElementById("location"),
  temperature: document.getElementById("temperature"),
  description: document.getElementById("description"),
  feelsLike: document.getElementById("feelsLike"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  icon: document.getElementById("weatherIcon")
};

// Buscar ciudad y mostrar opciones
document.getElementById("searchBtn").addEventListener("click", async () => {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  resultsContainer.innerHTML = "";
  spinner.classList.remove("hidden");

  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${API_KEY}`);
    const cities = await res.json();

    if (cities.length === 0) {
      resultsContainer.innerHTML = "<p>No se encontraron resultados</p>";
      return;
    }

    // Crear lista de botones con resultados
    cities.forEach(c => {
      const btn = document.createElement("button");
      btn.textContent = `${c.name}, ${c.country}`;
      btn.className = "city-option";
      btn.onclick = () => getWeather(c.lat, c.lon);
      resultsContainer.appendChild(btn);
    });
  } catch (err) {
    errorMsg.textContent = "Error al buscar ciudades";
  } finally {
    spinner.classList.add("hidden");
  }
});

// Obtener clima por coordenadas
async function getWeather(lat, lon) {
  spinner.classList.remove("hidden");
  weatherCard.classList.add("hidden");
  errorMsg.textContent = "";
  resultsContainer.innerHTML = "";

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo obtener el clima");
    const data = await res.json();

    renderWeather(data);
  } catch (err) {
    errorMsg.textContent = err.message;
  } finally {
    spinner.classList.add("hidden");
  }
}

// Renderizar clima
function renderWeather(data) {
  elements.location.textContent = `${data.name}, ${data.sys.country}`;
  elements.temperature.textContent = `${Math.round(data.main.temp)}°C`;
  elements.description.textContent = data.weather[0].description;
  elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.wind.textContent = `${data.wind.speed} m/s`;

  setWeatherIcon(data.weather[0].main);
  setBackground(data.weather[0].main);

  weatherCard.classList.remove("hidden");
}

// Cambiar iconos según clima
function setWeatherIcon(main) {
  const iconMap = {
    Clear: "fa-sun",
    Clouds: "fa-cloud",
    Rain: "fa-cloud-showers-heavy",
    Drizzle: "fa-cloud-rain",
    Thunderstorm: "fa-bolt",
    Snow: "fa-snowflake",
    Mist: "fa-smog"
  };

  elements.icon.className = `fas ${iconMap[main] || "fa-question"}`;
}

// Cambiar fondo dinámico
function setBackground(main) {
  document.body.className = ""; // reset
  if (main === "Clear") document.body.classList.add("sunny");
  else if (main === "Rain" || main === "Drizzle" || main === "Thunderstorm") document.body.classList.add("rainy");
  else if (main === "Clouds" || main === "Mist") document.body.classList.add("cloudy");
  else if (main === "Snow") document.body.classList.add("snowy");
}

// Geolocalización inicial
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      getWeather(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      errorMsg.textContent = "No se pudo obtener la ubicación. Busca por ciudad.";
    }
  );
} else {
  errorMsg.textContent = "Geolocalización no soportada en este navegador.";
}
