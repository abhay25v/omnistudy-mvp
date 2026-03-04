# 🚀 OmniStudy Deployment Guide

**Complete deployment steps for AWS (Tested March 2026)**

---

## Prerequisites

- [ ] AWS Account with valid payment method added
- [ ] Node.js 20+ installed
- [ ] Project code downloaded/cloned

**Estimated Time:** 30-40 minutes

---

## Part 1: AWS Backend Setup (25 minutes)

### Step 1: Create S3 Bucket (3 min)

1. Go to **AWS Console** → **S3**
2. Click **Create bucket**
3. **Bucket name:** `omnistudy-audio-YOUR-NAME-2026` (must be globally unique)
4. **Region:** `us-east-1`
5. **Uncheck** "Block all public access"
6. Acknowledge the warning
7. Click **Create bucket**
8. Click your bucket → **Permissions** tab
9. Scroll to **Bucket policy** → Click **Edit**
10. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/simplified-audio/*"
        }
    ]
}
```

11. Click **Save changes**

---

### Step 2: Create IAM Role (5 min)

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type:** AWS service
3. **Use case:** Lambda → Click **Next**
4. **Add permissions** - Search and select these 6 policies:
   - `AWSLambdaBasicExecutionRole`
   - `AmazonS3FullAccess`
   - `AmazonBedrockFullAccess`
   - `AmazonPollyFullAccess`
   - `AmazonTextractFullAccess` (optional - for image upload)
   - `AmazonTranscribeFullAccess` (optional - for audio upload)
5. Click **Next**
6. **Role name:** `OmniStudy-Lambda-Role`
7. Click **Create role**

---

### Step 3: Create Lambda Function (5 min)

1. Go to **Lambda** → **Create function**
2. **Function name:** `OmniStudy`
3. **Runtime:** Node.js 20.x
4. **Architecture:** x86_64
5. **Change default execution role:**
   - Select "Use an existing role"
   - Choose `OmniStudy-Lambda-Role`
6. Click **Create function**

---

### Step 4: Configure Lambda Settings (3 min)

#### A. Set Timeout & Memory

1. Click **Configuration** tab → **General configuration** → **Edit**
2. **Memory:** 512 MB
3. **Timeout:** 5 min 0 sec
4. Click **Save**

#### B. Set Environment Variables

1. Click **Configuration** tab → **Environment variables** → **Edit**
2. Click **Add environment variable** for each:
   - Key: `S3_BUCKET` | Value: `omnistudy-audio-YOUR-NAME-2026`
   - Key: `BEDROCK_MODEL_ID` | Value: `amazon.titan-text-express-v1`
   - Key: `POLLY_VOICE_ID` | Value: `Aditi`
   - Key: `TRANSCRIBE_LANGUAGE` | Value: `hi-IN`
3. Click **Save**

---

### Step 5: Upload Lambda Code (5 min)

#### Option A: PowerShell (Windows)

```powershell
cd D:\omnistudy-mvp\lambda
npm install --production
Compress-Archive -Path handler.js,package.json,package-lock.json,node_modules -DestinationPath function.zip -Force
```

#### Option B: Mac/Linux

```bash
cd /path/to/omnistudy-mvp/lambda
npm install --production
zip -r function.zip handler.js package.json package-lock.json node_modules
```

#### Upload to Lambda:

1. Go to Lambda function → **Code** tab
2. Click **Upload from** → **.zip file**
3. Select `function.zip`
4. Click **Save**
5. ⏳ Wait for upload (~30 seconds for ~20 MB file)

#### **CRITICAL:** Set Handler

1. Still in **Code** tab → Scroll to **Runtime settings** → Click **Edit**
2. **Handler:** Change from `index.handler` to: `handler.handler`
3. Click **Save**

---

### Step 6: Test Lambda (2 min)

1. Click **Test** tab
2. **Event name:** `test-text-input`
3. Paste this JSON:

```json
{
  "body": "{\"type\":\"text\",\"text\":\"The Earth revolves around the Sun\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```

4. Click **Save**
5. Click **Test** button
6. ✅ **Success:** Response shows `statusCode: 200` with `audioUrl`
7. Copy the `audioUrl` and open in browser → Audio should play!

---

### Step 7: Create API Gateway (5 min)

1. Go to **API Gateway** → **Create API**
2. Choose **HTTP API** → Click **Build**
3. **Add integration:**
   - Integration type: **Lambda**
   - AWS Region: **us-east-1**
   - Lambda function: **OmniStudy**
   - Version: 2.0
4. **API name:** `omnistudy-api`
5. Click **Next**
6. **Configure routes:**
   - Method: **POST**
   - Resource path: `/process`
   - Integration target: OmniStudy
7. Click **Next**
8. **Stage name:** `$default` (auto-deploy)
9. Click **Next** → **Create**

#### Configure CORS:

1. Click your API name
2. Click **CORS** in left sidebar
3. Click **Configure**
4. Set these values:
   - **Access-Control-Allow-Origin:** `*`
   - **Access-Control-Allow-Headers:** `content-type`
   - **Access-Control-Allow-Methods:** `POST,OPTIONS`
5. Click **Save**

#### Copy Invoke URL:

1. Click **Stages** in left sidebar
2. Copy the **Invoke URL** (looks like `https://abc123xyz.execute-api.us-east-1.amazonaws.com`)
3. **Save this URL** - you'll need it for frontend!

---

## Part 2: Frontend Setup (10 minutes)

### Step 8: Configure Frontend (3 min)

1. Open terminal in project folder:

```powershell
cd D:\omnistudy-mvp\frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Create `.env.local` file:

```powershell
# Create file
New-Item -Path .env.local -ItemType File

# Or on Mac/Linux:
touch .env.local
```

4. Open `.env.local` and add (replace with your API Gateway URL):

```
NEXT_PUBLIC_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/process
```

**Example:**
```
NEXT_PUBLIC_API_URL=https://9lulqy6qc3.execute-api.us-east-1.amazonaws.com/process
```

⚠️ **Important:** Must include `/process` at the end!

---

### Step 9: Run Frontend Locally (2 min)

```powershell
npm run dev
```

Wait for:
```
✓ Ready in 3.5s
○ Local: http://localhost:3000
```

---

### Step 10: Test End-to-End (5 min)

1. Open browser: **http://localhost:3000**
2. You should see OmniStudy interface
3. Test with text input:
   - Keep "📝 Text" selected
   - Enter: `Photosynthesis is how plants make food`
   - Class Level: `5`
   - Language: `Hindi (Rural)`
   - Click **🚀 Generate Simplified Explanation**
4. ⏳ Wait 5-10 seconds
5. ✅ **Success indicators:**
   - Audio player appears
   - Play button works
   - Audio plays in Hindi
6. **Test caching:**
   - Submit the same text again
   - Should respond in < 1 second (cached!)

---

## Production Deployment (Optional)

### Deploy Frontend to Vercel (5 min)

1. Push code to GitHub:

```bash
git init
git add .
git commit -m "OmniStudy MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/omnistudy.git
git push -u origin main
```

2. Go to **Vercel.com** → Sign in with GitHub
3. Click **New Project**
4. Import your repository
5. **Framework preset:** Next.js
6. **Environment Variables:**
   - Add: `NEXT_PUBLIC_API_URL` = your API Gateway URL
7. Click **Deploy**
8. ⏳ Wait 2-3 minutes
9. ✅ Get production URL: `https://omnistudy.vercel.app`

---

## Troubleshooting

### Lambda Test Returns 500

**Check CloudWatch Logs:**
1. Lambda → **Monitor** tab → **View CloudWatch logs**
2. Click latest log stream
3. Look for error message

**Common issues:**
- Wrong `BEDROCK_MODEL_ID` → Use `amazon.titan-text-express-v1`
- Missing payment method → Add credit card or use Titan
- Wrong handler → Must be `handler.handler`

### Frontend Shows "Failed to fetch"

**Solutions:**
1. Check CORS configured in API Gateway
2. Verify API URL in `.env.local` includes `/process`
3. **Restart dev server** (Ctrl+C then `npm run dev`)
4. Check browser console (F12) for exact error

### Audio Not Playing

**Check:**
1. Open audio URL directly in browser
2. Verify S3 bucket policy allows public read
3. Check CloudWatch logs for Polly errors

---

## Cost Estimate

**Per 100 requests (no cache):**
- Lambda: $0.00 (free tier: 1M requests/month)
- Bedrock Titan: ~$0.01
- Polly: $0.04 (free tier: 5M chars first 12 months)
- S3: $0.00 (free tier: 5GB storage)

**Total:** ~$0.05 per 100 requests

**With caching:** ~$0.02 per 100 requests

---

## Verification Checklist

- [ ] S3 bucket created with public policy
- [ ] IAM role created with 6 policies
- [ ] Lambda function created (Node.js 20.x)
- [ ] Lambda timeout = 300 sec, memory = 512 MB
- [ ] Lambda handler = `handler.handler`
- [ ] Environment variables set (4 total)
- [ ] Lambda code uploaded successfully
- [ ] Lambda test returns 200 with audioUrl
- [ ] Audio URL plays in browser
- [ ] API Gateway created (HTTP API)
- [ ] API Gateway route: POST /process
- [ ] CORS configured with exact values
- [ ] Frontend .env.local configured
- [ ] Frontend npm install completed
- [ ] Frontend runs at http://localhost:3000
- [ ] End-to-end test successful
- [ ] Cache test successful (second request instant)

---

## Quick Reference

**AWS Services URLs:**
- S3: https://s3.console.aws.amazon.com/s3/
- IAM: https://console.aws.amazon.com/iam/
- Lambda: https://console.aws.amazon.com/lambda/
- API Gateway: https://console.aws.amazon.com/apigateway/
- Bedrock: https://console.aws.amazon.com/bedrock/
- CloudWatch: https://console.aws.amazon.com/cloudwatch/

**Local URLs:**
- Frontend: http://localhost:3000
- Lambda code: `D:\omnistudy-mvp\lambda\`
- Frontend code: `D:\omnistudy-mvp\frontend\`

**Important Files:**
- Lambda code: `lambda/handler.js`
- Frontend config: `frontend/.env.local`
- Deployment package: `lambda/function.zip`

---

## Next Steps After Deployment

1. Share your demo URL with hackathon judges
2. Add screenshots to README
3. Record demo video showing:
   - Text input
   - Hindi audio output
   - Cache performance
4. Optional: Deploy image/audio upload (requires Cloudinary setup)

---

**Deployment Status:** ✅ Complete  
**Tested On:** March 4, 2026  
**AWS Region:** us-east-1  
**Total Time:** ~35 minutes

**Need help?** Check [TESTED-CONFIG.md](TESTED-CONFIG.md) for exact working configuration!
