# Webhook Test Server

A simple test server to verify Schematic webhook signatures.

## Usage

```bash
# Set your webhook secret
export SCHEMATIC_WEBHOOK_SECRET="your-webhook-secret"

# Optionally set port (default: 8080)
export PORT=9000

# Run the server
npm start
```

Use a tool like ngrok to expose the server to the internet:

```bash
ngrok http 8080
```

Then configure the webhook in Schematic with your ngrok URL.