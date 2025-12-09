#!/bin/bash
# Script to rebuild and redeploy Lambda with fixed model path

echo "🔨 Building Docker image (without provenance to reduce size)..."
docker build --provenance=false --platform linux/amd64 -t storm-prediction-model .

echo "🏷️  Tagging image..."
docker tag storm-prediction-model:latest 339570693867.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction:latest

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 339570693867.dkr.ecr.ap-southeast-1.amazonaws.com

echo "📤 Pushing to ECR..."
docker push 339570693867.dkr.ecr.ap-southeast-1.amazonaws.com/storm-prediction:latest

echo "✅ Done! Now update Lambda function in AWS Console:"
echo "   Lambda → storm-prediction → Image → Deploy new image"
