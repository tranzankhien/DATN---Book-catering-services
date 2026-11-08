# Google Gemini AI Setup Guide

## 1. Prerequisites
- Google AI Studio API Key.
- Network access to `https://generativelanguage.googleapis.com/v1beta/`.

## 2. Configuration Parameters
Add the following settings to your environment or `backend/.env`:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
GEMINI_ENABLED=true
GEMINI_TIMEOUT_SECONDS=15
GEMINI_MAX_REQUESTS_PER_HOUR=60
```

## 3. Verify via cURL
Test your Gemini API Key directly:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent" \
  -H 'Content-Type: application/json' \
  -H "X-goog-api-key: $GEMINI_API_KEY" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Hello Gemini, reply in 5 words."
          }
        ]
      }
    ]
  }'
```

## 4. Fallback Architecture
If the Gemini API key is unset, disabled, times out, or receives HTTP 503 during peak traffic spikes, BanquetHub automatically engages the `RecommendationFallbackService` which delivers 3 structured, nutritionally balanced menus based on PostgreSQL dish categories with real-time stock and budget checks.
