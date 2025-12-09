# Test Lambda locally with Docker

Write-Host "🚀 Starting Lambda container..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "docker" -ArgumentList "run", "-p", "9000:8080", "storm-prediction-model"

Write-Host "⏳ Waiting for container to start (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📤 Sending test request..." -ForegroundColor Green

$body = Get-Content -Path "test_local.json" -Raw

try {
    $response = Invoke-RestMethod -Uri "http://localhost:9000/2015-03-31/functions/function/invocations" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n🛑 Stop the Docker container manually with: docker ps | docker stop <container-id>" -ForegroundColor Yellow
