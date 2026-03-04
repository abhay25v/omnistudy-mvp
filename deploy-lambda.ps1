# OmniStudy Lambda Deployment Script (PowerShell)
# This script packages and deploys the Lambda function to AWS

Write-Host "OmniStudy Lambda Deployment" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Configuration
$FUNCTION_NAME = "OmniStudy-ProcessRequest"
$REGION = "us-east-1"
$LAMBDA_DIR = ".\lambda"

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if Lambda directory exists
if (-not (Test-Path $LAMBDA_DIR)) {
    Write-Host "Lambda directory not found: $LAMBDA_DIR" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
Set-Location $LAMBDA_DIR
npm install --production

Write-Host ""
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "function.zip") {
    Remove-Item "function.zip"
}

# Create ZIP (requires PowerShell 5.0+)
Compress-Archive -Path * -DestinationPath function.zip -Force -CompressionLevel Optimal

Write-Host ""
Write-Host "Step 3: Uploading to AWS Lambda..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $FUNCTION_NAME `
    --zip-file fileb://function.zip `
    --region $REGION

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test your function in AWS Console"
Write-Host "2. Check CloudWatch Logs for any errors"
Write-Host "3. Update API Gateway endpoint in frontend/.env.local"
Write-Host ""

Set-Location ..
