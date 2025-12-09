using Microsoft.Extensions.Caching.Memory;
using Amazon; 
using Amazon.SecretsManager; 
using Amazon.SecretsManager.Model; 
using System.Text.Json; 

namespace WeatherBackend.Services
{
    public class WeatherService
    {
        private readonly IHttpClientFactory _http;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;

        public WeatherService(IHttpClientFactory http, IConfiguration config, IMemoryCache cache)
        {
            _http = http;
            _config = config;
            _cache = cache;
        }

        // 🔐 HÀM MỚI: Lấy API Key từ AWS Secrets Manager (Có lưu Cache)
        private async Task<string> GetApiKeyAsync()
        {
            // 1. Kiểm tra xem Key đã có trong Cache chưa (để đỡ tốn tiền gọi AWS nhiều lần)
            if (_cache.TryGetValue("Cached_OpenWeatherApiKey", out string cachedKey))
            {
                return cachedKey;
            }

            // 2. Cấu hình Client gọi Secrets Manager
            var secretName = "WeatherApp/Production"; // Tên Secret bạn đã tạo trên AWS
            var region = RegionEndpoint.APSoutheast1; // Region us-east-1

            var client = new AmazonSecretsManagerClient(region);

            try
            {
                var request = new GetSecretValueRequest { SecretId = secretName };
                var response = await client.GetSecretValueAsync(request);

                // 3. Parse JSON để lấy đúng field "OpenWeatherApiKey"
                using var doc = JsonDocument.Parse(response.SecretString);
                string apiKey = doc.RootElement.GetProperty("OpenWeatherApiKey").GetString();

                // 4. Lưu vào Cache trong 1 giờ
                _cache.Set("Cached_OpenWeatherApiKey", apiKey, TimeSpan.FromHours(1));

                return apiKey;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CRITICAL] Không lấy được API Key từ AWS: {ex.Message}");
                // Fallback: Nếu lỗi AWS thì thử lấy từ biến môi trường (phòng hờ chạy local)
                return _config["OpenWeather:ApiKey"];
            }
        }

        // 🟢 1. Lấy thời tiết hiện tại theo thành phố
        public async Task<string> GetCurrentWeatherByCityAsync(string city)
        {
            if (string.IsNullOrWhiteSpace(city))
                throw new ArgumentException(nameof(city));

            string cacheKey = $"weather_current_{city.ToLower()}";
            if (_cache.TryGetValue(cacheKey, out string cached))
                return cached;

            try
            {
                var client = _http.CreateClient("openweather");

                // 🔴 THAY ĐỔI: Gọi hàm lấy key bảo mật
                string apiKey = await GetApiKeyAsync(); 

                if (string.IsNullOrEmpty(apiKey))
                    throw new InvalidOperationException("API Key chưa được cấu hình (Check AWS Secrets Manager).");

                city = city.Replace("_", " ").Replace("-", " ").Trim();
                var url = $"weather?q={Uri.EscapeDataString(city)}&appid={apiKey}&units=metric&lang=vi";

                var resp = await client.GetAsync(url);
                var json = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                {
                    return $"{{\"error\":\"API trả về lỗi {resp.StatusCode}\",\"detail\":{json}}}";
                }

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                double timezoneOffset = 0;
                if (root.TryGetProperty("timezone", out var tzProp))
                {
                    timezoneOffset = tzProp.GetDouble() / 3600.0;
                }

                var localTime = DateTime.UtcNow.AddHours(timezoneOffset).ToString("yyyy-MM-dd HH:mm:ss");

                var enriched = new
                {
                    localDate = localTime,
                    city = root.GetProperty("name").GetString(),
                    coord = root.GetProperty("coord"),
                    weather = root.GetProperty("weather"),
                    main = root.GetProperty("main"),
                    wind = root.GetProperty("wind"),
                    sys = root.GetProperty("sys")
                };

                var enrichedJson = JsonSerializer.Serialize(enriched);
                _cache.Set(cacheKey, enrichedJson, TimeSpan.FromMinutes(5));

                return enrichedJson;
            }
            catch (Exception ex)
            {
                return $"{{\"error\":\"Lỗi khi gọi API: {ex.Message}\"}}";
            }
        }


        // 🟢 2. Dự báo 5 ngày tới theo thành phố
        public async Task<string> GetForecastByCityAsync(string city)
        {
            if (string.IsNullOrWhiteSpace(city))
                return "{\"error\":\"Vui lòng nhập tên thành phố.\"}";

            try
            {
                var client = _http.CreateClient("openweather");
                
                // 🔴 THAY ĐỔI: Gọi hàm lấy key bảo mật
                string apiKey = await GetApiKeyAsync();

                if (string.IsNullOrEmpty(apiKey))
                    throw new InvalidOperationException("⚠️ OpenWeather API key chưa được cấu hình.");

                if (city.ToLower().Contains("hochiminh") || city.ToLower().Contains("ho chi minh"))
                    city = "Ho Chi Minh, VN";
                else if (city.ToLower().Contains("hanoi"))
                    city = "Hanoi, VN";

                var url = $"forecast?q={Uri.EscapeDataString(city)}&appid={apiKey}&units=metric&lang=vi";
                
                var resp = await client.GetAsync(url);
                var json = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                {
                    return $"{{\"error\":\"Không tìm thấy thông tin dự báo cho '{city}'\",\"detail\":{json}}}";
                }

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("city", out var cityObj))
                    return $"{{\"error\":\"Không thể đọc thông tin thành phố trong phản hồi từ API.\"}}";

                var cityName = cityObj.GetProperty("name").GetString();
                var country = cityObj.GetProperty("country").GetString();
                var timezoneOffset = cityObj.GetProperty("timezone").GetDouble() / 3600.0;

                var forecasts = new List<object>();
                foreach (var item in root.GetProperty("list").EnumerateArray())
                {
                    var utcTime = DateTime.Parse(item.GetProperty("dt_txt").GetString());
                    var localTime = utcTime.AddHours(timezoneOffset).ToString("yyyy-MM-dd HH:mm:ss");

                    var temp = item.GetProperty("main").GetProperty("temp").GetDouble();
                    var desc = item.GetProperty("weather")[0].GetProperty("description").GetString();
                    var humidity = item.GetProperty("main").GetProperty("humidity").GetDouble();
                    var wind = item.GetProperty("wind").GetProperty("speed").GetDouble();

                    forecasts.Add(new
                    {
                        localDate = localTime,
                        temp,
                        desc,
                        humidity,
                        wind,
                        windDeg = item.GetProperty("wind").GetProperty("deg").GetDouble()
                    });
                }

                var result = new
                {
                    city = cityName,
                    country,
                    timezone = timezoneOffset,
                    forecastCount = forecasts.Count,
                    forecasts
                };

                return JsonSerializer.Serialize(result);
            }
            catch (Exception ex)
            {
                return $"{{\"error\":\"Lỗi hệ thống: {ex.Message}\"}}";
            }
        }


        // 🟢 3. Lấy thời tiết theo tọa độ
        public async Task<string> GetWeatherByCoordinatesAsync(double lat, double lon)
        {
            try
            {
                var client = _http.CreateClient("openweather");
                
                // 🔴 THAY ĐỔI: Gọi hàm lấy key bảo mật
                string apiKey = await GetApiKeyAsync();

                var url = $"weather?lat={lat}&lon={lon}&appid={apiKey}&units=metric&lang=vi";

                var resp = await client.GetAsync(url);
                var json = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                    return $"{{\"error\":\"Không thể lấy dữ liệu tọa độ ({lat},{lon})\",\"detail\":{json}}}";

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var name = root.GetProperty("name").GetString();
                var weather = root.GetProperty("weather")[0].GetProperty("description").GetString();
                var temp = root.GetProperty("main").GetProperty("temp").GetDouble();
                var humidity = root.GetProperty("main").GetProperty("humidity").GetDouble();
                var wind = root.GetProperty("wind").GetProperty("speed").GetDouble();
                var windDeg = root.GetProperty("wind").GetProperty("deg").GetDouble();

                var timezone = root.TryGetProperty("timezone", out var tz) ? tz.GetDouble() / 3600.0 : 0;
                var localTime = DateTime.UtcNow.AddHours(timezone).ToString("yyyy-MM-dd HH:mm:ss");

                var result = new { localTime, name, lat, lon, temp, humidity, wind, windDeg, weather };
                return JsonSerializer.Serialize(result);
            }
            catch (Exception ex)
            {
                return $"{{\"error\":\"Lỗi khi lấy thời tiết theo tọa độ: {ex.Message}\"}}";
            }
        }

        // 🟢 4. Tự động phát hiện vị trí toàn cầu (qua IP)
        public async Task<string> GetGlobalWeatherAsync()
        {
            try
            {
                var ipClient = _http.CreateClient();
                var ipResp = await ipClient.GetAsync("http://ip-api.com/json");
                var ipJson = await ipResp.Content.ReadAsStringAsync();
                using var ipDoc = JsonDocument.Parse(ipJson);
                var ipRoot = ipDoc.RootElement;

                var city = ipRoot.GetProperty("city").GetString();
                var country = ipRoot.GetProperty("countryCode").GetString();
                var lat = ipRoot.GetProperty("lat").GetDouble();
                var lon = ipRoot.GetProperty("lon").GetDouble();

                var client = _http.CreateClient("openweather");
                
                // 🔴 THAY ĐỔI: Gọi hàm lấy key bảo mật
                string apiKey = await GetApiKeyAsync();

                var url = $"weather?lat={lat}&lon={lon}&appid={apiKey}&units=metric&lang=vi";

                var resp = await client.GetAsync(url);
                var json = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                    return $"{{\"error\":\"Không lấy được thời tiết cho {city},{country}\",\"detail\":{json}}}";

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var temp = root.GetProperty("main").GetProperty("temp").GetDouble();
                var desc = root.GetProperty("weather")[0].GetProperty("description").GetString();
                var humidity = root.GetProperty("main").GetProperty("humidity").GetDouble();
                var wind = root.GetProperty("wind").GetProperty("speed").GetDouble();
                var windDeg = root.GetProperty("wind").GetProperty("deg").GetDouble();
                var timezone = root.GetProperty("timezone").GetDouble() / 3600.0;
                var localTime = DateTime.UtcNow.AddHours(timezone).ToString("yyyy-MM-dd HH:mm:ss");

                var result = new { localTime, city, country, temp, desc, humidity, wind, windDeg, coord = new { lat, lon } };
                return JsonSerializer.Serialize(result);
            }
            catch (Exception ex)
            {
                return $"{{\"error\":\"Không thể tự động phát hiện thời tiết: {ex.Message}\"}}";
            }
        }
    }
}