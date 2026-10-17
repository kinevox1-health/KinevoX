# KinevoX

**Evolve Your Potential.**

A free, Windows-friendly fitness and wellness prototype for beginners. This first version supports Arabic and English, suggests a simple routine from user preferences, includes a small exercise library, and tracks completed sessions in the browser.

## Run on Windows

This is a browser app, not a standalone `.exe`. To run it locally:

1. Install Node.js and pnpm.
2. Open PowerShell in the project folder and install dependencies:

   ```powershell
   pnpm install
   ```

3. Set the local development settings and start KinevoX:

   ```powershell
   $env:PORT = "5173"
   $env:BASE_PATH = "/"
   pnpm --filter @workspace/kinevox run dev
   ```

4. Open `http://localhost:5173` in Edge, Chrome, or another modern browser.

Keep the PowerShell window open while using the app. Preferences and workout history are stored in that browser on that device.

## First-version boundaries

- No accounts, application backend, AI service, payments, external APIs, or remote font dependency.
- Preferences and completed sessions stay in browser storage. The safety-check answer is used only while the page is open and is not saved.
- Exercise and routine examples are demonstrations, not medically reviewed content or medical advice.
- If a user reports a condition, injury, or medical guidance that affects exercise—or prefers not to answer—the app pauses instead of recommending a routine.

The first version is intended for local Windows testing and gradual improvement from user feedback. It is not a medical product or a packaged desktop application.
