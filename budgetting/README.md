# MonthMap Budgeting

This project now includes an AI spending analysis endpoint powered by the OpenAI Responses API.

## Run locally

1. Copy `.env.example` values into your shell environment.
2. Set `OPENAI_API_KEY`.
3. Start the app:

```powershell
$env:OPENAI_API_KEY="your_key_here"
npm start
```

4. Open `http://localhost:3000`

## AI analysis flow

- The frontend sends a budget snapshot to `POST /api/analyze-budget`
- The server calls the OpenAI Responses API
- The AI returns:
  - `summary`
  - `risks`
  - `actions`

## Notes

- Keep the API key on the server only.
- If you open `index.html` directly instead of using the local server, the AI analysis button will not work.
