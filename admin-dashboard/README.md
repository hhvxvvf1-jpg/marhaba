# MARHABA Python Admin Dashboard

A separate, read-only Plotly Dash control center for the existing MARHABA V14 Next.js application.

## Architecture

- Next.js continues to own the SQLite database and existing admin authentication.
- /api/v1/dashboard/metrics is a read-only server-side endpoint protected by a shared secret.
- This Python Dash service calls that endpoint; it does not open, copy, or modify the SQLite file.
- Dash HTTP Basic Authentication protects the dashboard page.
- Metrics refresh every 30 seconds.

This avoids sharing a local SQLite file between separate hosting services.

## Local setup

1. In the Next.js deployment environment, set MARHABA_DASHBOARD_API_KEY to a long random secret.
2. Set the same secret in this service's environment.
3. Set MARHABA_DASHBOARD_API_URL to the deployed website origin.
4. Set unique DASH_USERNAME and DASH_PASSWORD credentials.

Create a virtual environment, install requirements.txt, copy .env.example to .env, fill in the values, then run:

    python app.py

Open http://127.0.0.1:8050.

## Render deployment

Create a Web Service from this repository and set its Root Directory to admin-dashboard.

- Runtime: Python
- Build command: pip install -r requirements.txt
- Start command: gunicorn app:server --bind 0.0.0.0:$PORT

Add the four required environment variables from .env.example. Do not commit a real .env file or credentials.

## Security

- The metrics endpoint accepts only GET and returns aggregate metrics plus a limited audit-log view.
- The shared API key is compared in constant time and is never sent to the browser.
- Dash uses HTTP Basic Auth. Use HTTPS and a strong unique password.
- Rotate the API key if it is ever exposed.
- This initial Python dashboard is intentionally read-only. Mutating actions remain in MARHABA's existing role-protected /admin interface until a separate, audited command API is designed.
