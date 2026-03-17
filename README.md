<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/acafe70c-eb26-482e-9b04-caa02298effc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env`
3. Fill all `VITE_*` values in `.env`
4. Run the app:
   `npm run dev`

## Deploy To Vercel

1. Push this project to GitHub.
2. In Vercel, import the repository.
3. In Vercel Project Settings -> Environment Variables, add all variables from `.env.example`.
4. Deploy.

Notes:
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites are already configured in `vercel.json`.
