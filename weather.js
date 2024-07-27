const fetch = require("node-fetch");
const readline = require("readline");
const chalk = require("chalk");
const NodeCache = require("node-cache");

const apiKey = "8df612d1cd450c3595ec170dcf2ce070"; // Replace with your actual OpenWeatherMap API key
const weatherCache = new NodeCache({ stdTTL: 300 });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showMenu() {
  console.log("\nChoose an option:");
  console.log("1. Get current weather");
  console.log("2. Get 3-day forecast");
  console.log("3. Clear cache and update all");
  console.log("4. Exit");

  rl.question("Enter your choice: ", (choice) => {
    switch (choice) {
      case "1":
        askForAnotherCity(true);
        break;
      case "2":
        askForAnotherCity(false);
        break;
      case "3":
        clearCacheAndFetchAll();
        break;
      case "4":
        rl.close();
        break;
      default:
        console.error("Invalid choice.");
        showMenu();
    }
  });
}

function askForAnotherCity(today = true) {
  rl.question('\nEnter city name (or "menu" to go back): ', (answer) => {
    if (answer.toLowerCase() === "menu") {
      showMenu();
    } else {
      getWeatherForCity(answer, today);
    }
  });
}

function getWeatherForCity(city, today = true) {
  if (weatherCache.has(city)) {
    console.log("Loading weather from cache...");
    const cachedData = weatherCache.get(city);
    displayWeather(cachedData, today);
    askForAnotherCity(today);
  } else {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === "200") {
          weatherCache.set(city, data);
          displayWeather(data, today);
        } else {
          console.error(`City not found or API error for ${city}.`);
        }
      })
      .catch((error) => {
        console.error(`Error fetching weather data for ${city}:`, error);
      })
      .finally(() => {
        askForAnotherCity(today);
      });
  }
}

function displayWeather(data, today) {
  const forecasts = data.list.slice(0, (today ? 1 : 3) * 8);

  for (let i = 0; i < forecasts.length; i += 8) {
    const date = new Date(forecasts[i].dt * 1000).toLocaleDateString();
    const temp = forecasts[i].main.temp;
    const description = forecasts[i].weather[0].description;
    const humidity = forecasts[i].main.humidity;
    const windSpeed = forecasts[i].wind.speed;

    const color = chalk.keyword(getColorForDescription(description));

    console.log(color(`\n--- ${date} ---`));
    console.log(color(`Temperature: ${temp}°C`));
    console.log(color(`Description: ${description}`));
    console.log(color(`Humidity: ${humidity}%`));
    console.log(color(`Wind Speed: ${windSpeed} m/s`));
  }
}

function clearCacheAndFetchAll() {
  const cachedKeys = weatherCache.keys();
  if (cachedKeys.length > 0) {
    console.log("Clearing cache and updating weather data...");
    weatherCache.del(cachedKeys);
  } else {
    console.log("Cache is already empty.");
  }

  showMenu();
}

function getColorForDescription(description) {
  switch (description) {
    case "clear sky":
      return "yellow";
    case "few clouds":
    case "scattered clouds":
    case "broken clouds":
      return "cyan";
    case "overcast clouds":
      return "gray";
    case "shower rain":
    case "rain":
    case "thunderstorm":
      return "blue";
    case "snow":
      return "white";
    default:
      return "white";
  }
}

showMenu();
