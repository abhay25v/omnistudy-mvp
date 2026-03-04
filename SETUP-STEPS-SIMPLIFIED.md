# 🚀 OmniStudy Setup - Simplified Guide (2026)

**Updated for new AWS Bedrock auto-access** | Total time: ~25 minutes

---

## ✅ Step 1: Create S3 Bucket (5 min)

1. **Go to AWS S3:** https://console.aws.amazon.com/s3/
2. Click **"Create bucket"**
3. **Settings:**
   - Bucket name: `omnistudy-audio-prod-2026` (must be globally unique - add your name/number)
   - Region: **us-east-1** (keep consistent!)
   - Object Ownership: ACLs disabled ✓
   - **Block Public Access:** UNCHECK "Block all public access" ⚠️
   - Acknowledge the warning ✓
   - Versioning: Disabled (or enable if you want)
   - Encryption: Server-side (default) ✓
4. Click **"Create bucket"**

5. **Add Bucket Policy for public read:**
   - Click on your bucket name
   - Go to **Permissions** tab
   - Scroll to **Bucket policy** → Click **Edit**
   - Paste this JSON (replace `omnistudy-audio-prod-2026` with YOUR bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::omnistudy-audio-prod-2026/*"
    }
  ]
}
```

   - Click **Save changes**

✍️ **Write down your bucket name:** `_______________________________`

---

## ✅ Step 2: Create IAM Role for Lambda (5 min)

1. **Go to IAM:** https://console.aws.amazon.com/iam/
2. Click **Roles** → **Create role**
3. **Select trusted entity:**
   - Trusted entity type: **AWS service**
   - Use case: **Lambda**
   - Click **Next**

4. **Add permissions policies** (search and check these 6 boxes):
   - ✅ `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
   - ✅ `AmazonS3FullAccess` (S3 read/write)
   - ✅ `AmazonBedrockFullAccess` (Bedrock AI models)
   - ✅ `AmazonPollyFullAccess` (Text-to-speech)
   - ✅ `AmazonTextractFullAccess` (Image text extraction)
   - ✅ `AmazonTranscribeFullAccess` (Speech-to-text)
   
5. Click **Next**
6. **Role name:** `OmniStudy-Lambda-ExecutionRole`
7. Click **"Create role"**

---

## ✅ Step 3: Create Lambda Function (5 min)

1. **Go to Lambda:** https://console.aws.amazon.com/lambda/
2. Click **"Create function"**
3. **Settings:**
   - Option: **Author from scratch**
   - Function name: `OmniStudy-ProcessRequest`
   - Runtime: **Node.js 18.x**
   - Architecture: **x86_64**
   - Permissions: **Use an existing role** → Select `OmniStudy-Lambda-ExecutionRole`
4. Click **"Create function"**

5. **Configure timeout and memory:**
   - Click **Configuration** tab
   - Click **General configuration** → **Edit**
   - Memory: **512 MB**
   - Timeout: **5 min 0 sec** (type 300 in seconds field)
   - Click **Save**

6. **Add environment variables:**
   - Still in **Configuration** tab
   - Click **Environment variables** → **Edit**
   - Click **Add environment variable** for each:
   
| Key | Value |
|-----|-------|
| `S3_BUCKET` | `omnistudy-audio-prod-2026` (YOUR bucket name) |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-20240307-v1:0` |
| `POLLY_VOICE_ID` | `Aditi` |
| `TRANSCRIBE_LANGUAGE` | `hi-IN` |

   - Click **Save**

---

## ✅ Step 4: Upload Lambda Code (5 min)

**In PowerShell at `D:\omnistudy-mvp`:**

```powershell
cd lambda
npm install --production
Compress-Archive -Path * -DestinationPath function.zip -Force
```

**Then in AWS Console:**

1. Go to Lambda → **OmniStudy-ProcessRequest** → **Code** tab
2. Click **"Upload from"** → **".zip file"**
3. Click **"Upload"** → Select: `D:\omnistudy-mvp\lambda\function.zip`
4. Click **"Save"**
5. Wait for "Last modified: a few seconds ago" (upload complete)

6. **Configure the handler:**
   - Scroll down to **Runtime settings** → Click **Edit**
   - Handler: Change to `handler.handler` (not index.handler)
   - Click **Save**

---

## ✅ Step 5: Create API Gateway (5 min)

1. **Go to API Gateway:** https://console.aws.amazon.com/apigateway/
2. Click **"Create API"**
3. Find **HTTP API** → Click **"Build"**
4. **Add integration:**
   - Click **"Add integration"**
   - Integration type: **Lambda**
   - AWS Region: **us-east-1**
   - Lambda function: `OmniStudy-ProcessRequest`
   - Version: **2.0**
   - Integration name: (auto-filled)
5. **API name:** `OmniStudy-API`
6. Click **Next**

7. **Configure routes:**
   - Method: **POST**
   - Resource path: `/process`
   - Integration target: `OmniStudy-ProcessRequest`
   - Click **Next**

8. **Configure stages:**
   - Stage name: `$default` (auto)
   - Click **Next**

9. **Review and create:**
   - Click **"Create"**

10. **Enable CORS:**
    - In your API, click **CORS** in left sidebar
    - Click **"Configure"**
    - Access-Control-Allow-Origin: `*`
    - Access-Control-Allow-Headers: `content-type,x-amz-date,authorization,x-api-key`
    - Access-Control-Allow-Methods: Check **POST** and **OPTIONS**
    - Click **"Save"**

11. **Copy your API URL:**
    - Go to **Stages** → `$default`
    - Copy **Invoke URL** (looks like: `https://abc12345.execute-api.us-east-1.amazonaws.com`)

✍️ **Write down your API Gateway URL:** `_______________________________`

---

## ✅ Step 6: Test Lambda Function (3 min)

1. Go to Lambda → **OmniStudy-ProcessRequest** → **Test** tab
2. Click **"Create new event"**
3. **Event name:** `test-text-input`
4. **Template:** hello-world (default is fine)
5. **Replace the JSON** with:

```json
{
  "body": "{\"type\":\"text\",\"text\":\"The Earth revolves around the Sun in an elliptical orbit\",\"classLevel\":\"5\",\"language\":\"hindi_rural\"}"
}
```

6. Click **"Save"**
7. Click **"Test"**
8. **Check results:**
   - Should see green box: "Execution result: succeeded"
   - Response should have: `"statusCode": 200`
   - Should contain: `"audioUrl": "https://omnistudy-audio...mp3"`
   
9. **Test the audio:**
   - Copy the audioUrl from response
   - Paste into browser
   - Should download/play MP3 audio in Hindi

✅ **If audio plays, Lambda is working!**

---

## ✅ Step 7: Setup Frontend (5 min)

**In PowerShell at `D:\omnistudy-mvp`:**

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
code .env.local
```

**Edit `.env.local` file:**

```env
# Replace with YOUR API Gateway URL + /process endpoint
NEXT_PUBLIC_API_URL=https://abc12345.execute-api.us-east-1.amazonaws.com/process
```

⚠️ **Important:** Add `/process` at the end!

**Save the file (Ctrl+S)**

---

## ✅ Step 8: Run Frontend (2 min)

```powershell
# Still in D:\omnistudy-mvp\frontend
npm run dev
```

**Open browser:** http://localhost:3000

You should see the OmniStudy interface!

---

## ✅ Step 9: End-to-End Test (2 min)

1. **In the web browser at localhost:3000:**
   - Select: **📝 Text**
   - Enter: `Photosynthesis is the process by which plants make food using sunlight`
   - Class Level: **Class 5**
   - Language: **Hindi (Rural)**
   - Click: **🚀 Generate Simplified Explanation**

2. **Wait 5-10 seconds** (first request takes longer)

3. **Audio player should appear**
   - Click play ▶️
   - Should hear Hindi explanation!

4. **Test caching:**
   - Submit the SAME input again
   - Should be instant (< 1 second)
   - Will show "Loaded from cache" badge

---

## 🎉 Success Checklist

- ✅ S3 bucket created with public read policy
- ✅ IAM role created with 6 policies
- ✅ Lambda function created and configured
- ✅ Lambda code uploaded (function.zip)
- ✅ Environment variables set in Lambda
- ✅ API Gateway created with CORS enabled
- ✅ Lambda test returns 200 with audioUrl
- ✅ Audio URL plays in browser
- ✅ Frontend .env.local configured
- ✅ Frontend runs at localhost:3000
- ✅ End-to-end test generates audio
- ✅ Cache works on second request

---

## 🐛 Troubleshooting

### Lambda test fails with "Cannot find module 'index'"

**Error:** `Runtime.ImportModuleError: Error: Cannot find module 'index'`

**Fix:**
- Go to Lambda → Code tab → Runtime settings → Edit
- Change Handler to: `handler.handler`
- Click Save and test again

### Lambda test fails with "AccessDeniedException"

**Check:**
- IAM role has all 6 policies attached
- Environment variable `BEDROCK_MODEL_ID` is correct
- **First-time Anthropic users:** May need to submit use case details when first invoking Claude
  - Go to Bedrock console and try invoking Claude in the playground first
  - Fill out any required forms

### Audio URL returns 403 Forbidden

**Fix:**
- Check S3 bucket policy is applied correctly
- Verify bucket name in policy matches your actual bucket
- Ensure "Block all public access" is OFF

### Frontend shows "API URL not configured"

**Fix:**
- Check `.env.local` file exists in `frontend/` folder
- Check variable name is `NEXT_PUBLIC_API_URL` (exact spelling)
- Check URL ends with `/process`
- Restart Next.js dev server (`Ctrl+C` then `npm run dev`)

### CORS error in browser

**Fix:**
- Go to API Gateway → Your API → CORS
- Ensure `*` is in Access-Control-Allow-Origin
- Ensure POST and OPTIONS are checked

### Lambda timeout after 3 seconds

**Fix:**
- Go to Lambda → Configuration → General configuration
- Ensure Timeout is 300 seconds (5 minutes), not 3 seconds

---

## 📝 Important URLs

**Save these for later:**

```
S3 Bucket Name: _______________________________

Lambda Function ARN: _______________________________

API Gateway URL: _______________________________

CloudWatch Logs:
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252FOmniStudy-ProcessRequest
```

---

## 💰 AWS Costs

**Free Tier (12 months):**
- Lambda: 1M requests/month FREE
- S3: 5GB storage FREE
- Polly: 5M characters/month FREE
- Bedrock: Token-based pricing (Claude Haiku is cheapest)

**Estimated per request:** $0.01-0.02 (with caching: $0.005)

**For hackathon demo (100 tests):** < $2 total!

---

## 🔐 Security Note

⚠️ **For Production:**
- Don't make S3 bucket fully public (use CloudFront + presigned URLs)
- Add API authentication (API Gateway + Lambda authorizer)
- Restrict IAM policies to specific resources
- Enable CloudTrail logging
- Add rate limiting

**For hackathon/learning:** Current setup is fine!

---

## 🎓 What's Next?

Once everything works:
- Try uploading an image (requires image with text)
- Try uploading audio (requires MP3/WAV file)
- Customize prompt templates in `lambda/handler.js`
- Add more languages
- Deploy frontend to Vercel (free hosting)
- Add user authentication with AWS Cognito

---

**Questions?** Check CloudWatch Logs in AWS Console - 90% of issues show up there!

**Project working?** You now have a full-stack AI app using 7 AWS services! 🎉
