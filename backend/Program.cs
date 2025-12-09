using WeatherBackend.Services;
using Polly;
using Polly.Extensions.Http;

var builder = WebApplication.CreateBuilder(args);

// ✅ Add services
builder.Services.AddControllers();
builder.Services.AddAWSLambdaHosting(LambdaEventSource.RestApi);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

// ✅ Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// ✅ Add HttpClient with retry policy
builder.Services.AddHttpClient("openweather", c =>
{
    c.BaseAddress = new Uri("https://api.openweathermap.org/data/2.5/");
})
.AddPolicyHandler(GetRetryPolicy());

// ✅ Register WeatherService
builder.Services.AddScoped<WeatherService>();

var app = builder.Build();

// ✅ Swagger setup
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// 🔄 Redirect root URL to Swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();

// 🔁 Retry policy for HTTP calls
static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
}
