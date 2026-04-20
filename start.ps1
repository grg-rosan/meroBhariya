Write-Host "Starting meroBhariya..." -ForegroundColor Green

# Start Docker containers
docker-compose up -d db rabbitmq
Write-Host "Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Set-Location server

# Only deploy migrations - never reset data!
$env:DATABASE_URL="postgresql://user:password@localhost:5433/meroBhariya"
npx prisma migrate deploy

# Only seed if needed (won't duplicate - uses upsert)
npx prisma db seed

Write-Host "All done! Now run npm run dev" -ForegroundColor Green
Set-Location ..
