# Run BrandWtch on your PC — no Docker (Lite Mode)

This runs the whole app on your own computer using a built-in file database.
No database setup, no Docker. You only install two free tools, then
double-click two files.

## 1. Install the two tools (one-time)

1. **Python** — https://www.python.org/downloads/
   During install, **tick the box "Add python.exe to PATH"** (important!).
2. **Node.js** — https://nodejs.org/ — download the **LTS** version, install with defaults.

(After installing, it's safest to restart your computer once so both are recognised.)

## 2. Get the code

On the GitHub page, click the green **`< > Code`** button → **Download ZIP**,
then unzip it. Open the unzipped folder until you can see `run-backend.bat`,
`run-frontend.bat`, a `backend` folder and a `frontend` folder.

## 3. Start it (two windows)

1. **Double-click `run-backend.bat`** — a black window opens and sets things up.
   Wait until it says *"Backend running at http://localhost:8000"*. Leave it open.
2. **Double-click `run-frontend.bat`** — a second black window opens.
   Wait until it says *"Ready"* / shows `http://localhost:3000`. Leave it open too.

> First run downloads dependencies and can take a few minutes. Later runs are quick.

## 4. Open the app

In your browser go to **http://localhost:3000**, click **Create one**, and sign up
(email, password, organisation name). Add a brand, then click **Crawl Now**.

## Notes

- **Works with zero API keys.** Sentiment analysis runs locally, and the
  **Hacker News** crawler needs no key — so you'll see real results immediately.
- Want more sources (Google, Reddit, AI assistants, news)? Add the relevant API
  keys to a `.env` file later and use the full Docker setup (`README` / `docker-compose`).
- To stop the app: close both black windows.
- Your data is stored in `backend/brandwtch.db`. Delete that file to start fresh.
