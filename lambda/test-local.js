/**
 * Local testing script for Lambda handler
 * Run with: node test-local.js
 * 
 * Prerequisites:
 * 1. Set AWS credentials in ~/.aws/credentials
 * 2. Set environment variables below
 * 3. Run: npm install
 */

// Set environment variables
process.env.AWS_REGION = "us-east-1";
process.env.S3_BUCKET = "omnistudy-audio-prod-2026"; // Replace with your bucket
process.env.BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
process.env.POLLY_VOICE_ID = "Aditi";
process.env.TRANSCRIBE_LANGUAGE = "hi-IN";

const { handler } = require("./handler");

// Test with direct text input
const testEvent = {
  body: JSON.stringify({
    type: "text",
    text: "Photosynthesis is the process by which green plants use sunlight to synthesize foods with the help of chlorophyll. It converts carbon dioxide and water into glucose and oxygen.",
    classLevel: "5",
    language: "hindi_rural"
  })
};

console.log("Testing OmniStudy Lambda locally...\n");
console.log("Input:", JSON.parse(testEvent.body), "\n");

handler(testEvent)
  .then(response => {
    console.log("\n✅ Success!");
    console.log("Status Code:", response.statusCode);
    console.log("Response:", JSON.parse(response.body));
  })
  .catch(error => {
    console.error("\n❌ Error:", error);
  });
