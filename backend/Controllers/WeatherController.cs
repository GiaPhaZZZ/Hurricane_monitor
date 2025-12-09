using Microsoft.AspNetCore.Mvc;
using WeatherBackend.Services;

namespace WeatherBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly WeatherService _service;

        public WeatherController(WeatherService service)
        {
            _service = service;
        }

        // 🟢 1. Thời tiết hiện tại theo thành phố
        [HttpGet]
        public async Task<IActionResult> GetByCity([FromQuery] string city)
        {
            if (string.IsNullOrWhiteSpace(city))
                return BadRequest(new { message = "Vui lòng nhập tên thành phố (vd: Hanoi)" });

            var json = await _service.GetCurrentWeatherByCityAsync(city);
            return Content(json, "application/json");
        }

        // 🟢 2. Dự báo 5 ngày tới
        [HttpGet("forecast")]
        public async Task<IActionResult> GetForecast([FromQuery] string city)
        {
            if (string.IsNullOrWhiteSpace(city))
                return BadRequest(new { message = "Vui lòng nhập tên thành phố (vd: Hanoi)" });

            var json = await _service.GetForecastByCityAsync(city);
            return Content(json, "application/json");
        }

        // 🟢 3. Thời tiết theo tọa độ (lat/lon)
        [HttpGet("by-coord")]
        public async Task<IActionResult> GetByCoordinates([FromQuery] double lat, [FromQuery] double lon)
        {
            var json = await _service.GetWeatherByCoordinatesAsync(lat, lon);
            return Content(json, "application/json");
        }

        // 🟢 4. Tự động phát hiện quốc gia, thời gian, khí hậu (global)
        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalWeather()
        {
            var json = await _service.GetGlobalWeatherAsync();
            return Content(json, "application/json");
        }
    }
}
