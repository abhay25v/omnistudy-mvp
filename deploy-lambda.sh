#!/bin/bash

# OmniStudy Lambda Deployment Script
# This script packages and deploys the Lambda function to AWS

set -e

echo "🚀 OmniStudy Lambda Deployment"
echo "=============================="

# Configuration
FUNCTION_NAME="OmniStudy-ProcessRequest"
REGION="us-east-1"
LAMBDA_DIR="./lambda"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Lambda directory exists
if [ ! -d "$LAMBDA_DIR" ]; then
    echo "❌ Lambda directory not found: $LAMBDA_DIR"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
cd $LAMBDA_DIR
npm install --production

echo ""
echo "📦 Step 2: Creating deployment package..."
if [ -f "function.zip" ]; then
    rm function.zip
fi

zip -r function.zip . -x "*.git*" "test-local.js" "README.md"

echo ""
echo "📤 Step 3: Uploading to AWS Lambda..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test your function in AWS Console"
echo "2. Check CloudWatch Logs for any errors"
echo "3. Update API Gateway endpoint in frontend/.env.local"
echo ""
