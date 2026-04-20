Write-Host "Starting meroBhariya..." -ForegroundColor Green

# Start Docker containers
docker-compose up -d db rabbitmq
Write-Host "Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Run migrations and seed
Set-Location server
$env:DATABASE_URL="postgresql://user:password@localhost:5433/meroBhariya"
npx prisma migrate deploy
npx prisma db seed

Write-Host "All done! Now run npm run dev" -ForegroundColor Green
Set-Location ..
