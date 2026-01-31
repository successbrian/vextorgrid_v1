import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getCoordinatesFromZip(zipCode: string): Promise<string> {
  const geoUrl = `https://api.zippopotam.us/us/${zipCode}`;
  const response = await fetch(geoUrl);

  if (!response.ok) {
    throw new Error("Invalid zip code");
  }

  const data = await response.json();
  const lat = data.places[0].latitude;
  const lon = data.places[0].longitude;

  return `${lat},${lon}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { zipCode } = await req.json();

    if (!zipCode) {
      return new Response(
        JSON.stringify({ error: "Zip code is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const geoResponse = await fetch(
      `https://api.weather.gov/points/${await getCoordinatesFromZip(zipCode)}`
    );

    if (!geoResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch location data" }),
        {
          status: geoResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const geoData = await geoResponse.json();
    const forecastUrl = geoData.properties.forecast;

    const weatherResponse = await fetch(forecastUrl);

    if (!weatherResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch weather data" }),
        {
          status: weatherResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const weatherData = await weatherResponse.json();
    const currentPeriod = weatherData.properties.periods[0];

    const mapWeatherCondition = (forecast: string): string => {
      const lower = forecast.toLowerCase();
      if (lower.includes("rain") || lower.includes("shower")) return "rain";
      if (lower.includes("snow") || lower.includes("flurr")) return "snow";
      if (lower.includes("cloud")) return "cloudy";
      if (lower.includes("wind")) return "wind";
      if (lower.includes("sunny") || lower.includes("clear")) return "clear";
      return "clear";
    };

    const result = {
      temp: currentPeriod.temperature,
      condition: mapWeatherCondition(currentPeriod.shortForecast),
      location: geoData.properties.relativeLocation.properties.city,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
