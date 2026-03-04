# 🚀 OmniStudy Quick Start Checklist

**Complete this checklist step-by-step to get OmniStudy running!**

---

## ✅ Prerequisites (5 minutes)

- [ ] AWS Account created (free tier eligible)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)

---

## ✅ AWS Setup (20-30 minutes)

### S3 Bucket
- [ ] Go to AWS Console → S3
- [ ] Create bucket: `omnistudy-audio-prod-2026` (use unique name)
- [ ] Region: `us-east-1` (IMPORTANT: Use same region everywhere)
- [ ] Disable "Block all public access"
- [ ] Add bucket policy for public read access
- [ ] ✍️ Write down bucket name: `_________________________`

### Bedrock (Auto-Enabled - No Action Required!)
- [ ] ✅ **Bedrock models auto-enable on first use** (2026 update)
- [ ] Note: First-time Anthropic users may need to provide use case details
- [ ] If you get access error, go to Bedrock playground and invoke Claude once
- [ ] ✍️ Model ID to use: `anthropic.claude-3-haiku-20240307-v1:0`

### IAM Role
- [ ] Go to IAM → Roles → Create role
- [ ] Trusted entity: AWS service → Lambda
- [ ] Attach policies:
  - [ ] `AWSLambdaBasicExecutionRole`
  - [ ] `AmazonS3FullAccess`
  - [ ] `AmazonBedrockFullAccess`
  - [ ] `AmazonPollyFullAccess`
  - [ ] `AmazonTextractFullAccess`
  - [ ] `AmazonTranscribeFullAccess`
- [ ] Role name: `OmniStudy-Lambda-ExecutionRole`
- [ ] ✍️ Role ARN: `_________________________`

### Lambda Function
- [ ] Go to Lambda → Create function
- [ ] Function name: `OmniStudy-ProcessRequest`
- [ ] Runtime: Node.js 18.x
- [ ] Execution role: Use existing → `OmniStudy-Lambda-ExecutionRole`
- [ ] Create function
- [ ] Configuration → General → Edit:
  - [ ] Memory: 512 MB
  - [ ] Timeout: 300 seconds (5 minutes)
- [ ] Configuration → Environment variables → Add:
  - [ ] `S3_BUCKET` = your bucket name
  - [ ] `BEDROCK_MODEL_ID` = `anthropic.claude-3-haiku-20240307-v1:0`
  - [ ] `POLLY_VOICE_ID` = `Aditi`
  - [ ] `TRANSCRIBE_LANGUAGE` = `hi-IN`

### API Gateway
- [ ] Go to API Gateway → Create API
- [ ] Choose: HTTP API → Build
- [ ] Add integration: Lambda → Select `OmniStudy-ProcessRequest`
- [ ] API name: `OmniStudy-API`
- [ ] Configure routes:
  - [ ] Method: POST
  - [ ] Path: `/process`
- [ ] Create
- [ ] CORS → Configure:
  - [ ] Access-Control-Allow-Origin: `*`
  - [ ] Access-Control-Allow-Methods: `POST,OPTIONS`
- [ ] Deploy
- [ ] ✍️ Copy Invoke URL: `_________________________`

---

## ✅ Deploy Lambda Code (5 minutes)

- [ ] Open terminal in project folder
- [ ] Run: `cd lambda`
- [ ] Run: `npm install`
- [ ] Run: `cd ..`

**Windows:**
- [ ] Run: `.\deploy-lambda.ps1`

**Mac/Linux:**
- [ ] Run: `chmod +x deploy-lambda.sh`
- [ ] Run: `./deploy-lambda.sh`

**OR Manual upload:**
- [ ] In `lambda/` folder: `zip -r function.zip .`
- [ ] AWS Console → Lambda → Upload from .zip file
- [ ] **IMPORTANT:** Runtime settings → Edit → Handler: `handler.handler`

---

## ✅ Test Lambda (5 minutes)

- [ ] Go to Lambda function → Test tab
- [ ] Create new test event with this JSON:

```json
{
  "body": "{\"type\":\"text\",\"text\":\"The Earth revolves around the Sun\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```

- [ ] Click Test
- [ ] Check response has:
  - [ ] `statusCode: 200`
  - [ ] `audioUrl` field
- [ ] Open `audioUrl` in browser
- [ ] ✅ Audio plays successfully

---

## ✅ Setup Frontend (10 minutes)

- [ ] Run: `cd frontend`
- [ ] Run: `npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Edit `.env.local`:
  - [ ] `NEXT_PUBLIC_API_URL` = your API Gateway URL + `/process`
  - [ ] Example: `https://abc123.execute-api.us-east-1.amazonaws.com/process`
- [ ] Run: `npm run dev`
- [ ] Open: http://localhost:3000
- [ ] ✅ Page loads successfully

---

## ✅ End-to-End Test (5 minutes)

- [ ] In browser at http://localhost:3000:
  - [ ] Select "📝 Text" input type
  - [ ] Enter: "Photosynthesis is how plants make food using sunlight"
  - [ ] Select "Class 5"
  - [ ] Select "Hindi (Rural)"
  - [ ] Click "🚀 Generate Simplified Explanation"
  - [ ] Wait 5-10 seconds
  - [ ] ✅ Audio player appears
  - [ ] ✅ Audio plays in Hindi
  - [ ] Test cache: Submit same input again
  - [ ] ✅ Second request is instant (cached)

---

## ✅ Troubleshooting

If anything fails, check:

- [ ] CloudWatch Logs: Lambda → Monitor → View logs
- [ ] Browser Console: F12 → Console tab
- [ ] IAM Permissions: All 6 policies attached?
- [ ] Bedrock Access: Status = "Access granted"?
- [ ] CORS: Enabled in API Gateway?
- [ ] Environment Variables: All 4 set in Lambda?

---

## 🎉 Success!

If all checkboxes are ✅, you have:

- ✅ Working Lambda backend
- ✅ API Gateway endpoint
- ✅ Next.js frontend
- ✅ End-to-end AI-powered learning pipeline

---

## 📚 Next Steps

- [ ] Try image upload (requires Cloudinary setup in frontend)
- [ ] Try audio upload (requires Cloudinary setup)
- [ ] Customize prompt templates
- [ ] Add more languages
- [ ] Deploy frontend to Vercel
- [ ] Add authentication
- [ ] Add user history/favorites

---

## 📝 Important URLs to Save

```
S3 Bucket:       _________________________
Lambda ARN:      _________________________
API Gateway URL: _________________________
Frontend URL:    http://localhost:3000
CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
```

---

**Questions?** See AWS-SETUP-GUIDE.md for detailed explanations!

**Errors?** Check the "Common Beginner Mistakes" section in AWS-SETUP-GUIDE.md!
