import os
from datetime import datetime, timezone

import dash
import dash_auth
import pandas as pd
import plotly.express as px
import requests
from dash import Dash, Input, Output, dcc, html, dash_table

API_URL = os.environ.get("MARHABA_DASHBOARD_API_URL", "").rstrip("/")
API_KEY = os.environ.get("MARHABA_DASHBOARD_API_KEY", "")
DASH_USERNAME = os.environ.get("DASH_USERNAME", "")
DASH_PASSWORD = os.environ.get("DASH_PASSWORD", "")

if not all([API_URL, API_KEY, DASH_USERNAME, DASH_PASSWORD]):
    raise RuntimeError("Set MARHABA_DASHBOARD_API_URL, MARHABA_DASHBOARD_API_KEY, DASH_USERNAME and DASH_PASSWORD.")

app = Dash(__name__, title="MARHABA Control Center", update_title="Refreshing…")
app.index_string = """<!DOCTYPE html>
<html>
<head>
{%metas%}
<title>{%title%}</title>
{%favicon%}
{%css%}
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0b1020;color:#f4f6fb;font-family:Inter,ui-sans-serif,system-ui,Arial,sans-serif}
.app-shell{min-height:100vh}.topbar{height:76px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #25304a;background:#10182b;position:sticky;top:0;z-index:5}
.brand{font-weight:900;letter-spacing:.22em;color:#dfbf7a;font-size:19px}.brand-sub{font-size:10px;letter-spacing:.24em;color:#9aa7bd;margin-top:4px}.last-updated{font-size:12px;color:#9aa7bd}
.main{max-width:1440px;margin:auto;padding:32px 5vw}.connection-state{padding:12px 16px;border:1px solid #374151;border-radius:12px;margin-bottom:22px;font-size:13px}.online{color:#86efac;background:#052e20;border-color:#166534}.offline{color:#fca5a5;background:#450a0a;border-color:#991b1b}
.metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:20px}.metric-card,.panel{background:#151d32;border:1px solid #283550;border-radius:16px;padding:20px;box-shadow:0 8px 30px #0002}.metric-label{font-size:10px;letter-spacing:.16em;color:#9aa7bd;font-weight:700}.metric-value{display:inline-block;font-size:26px;font-weight:800;margin-top:10px}.metric-suffix{font-size:11px;color:#dfbf7a;margin-left:5px}.content-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel h2{font-size:15px;letter-spacing:.04em;margin:0 0 12px}.footer,.empty-state{color:#9aa7bd;font-size:12px;padding:20px 2px}.footer{text-align:center;margin-top:24px}
@media(max-width:760px){.content-grid{grid-template-columns:1fr}.main{padding:22px 16px}.topbar{padding:0 16px}.metric-value{font-size:22px}}
</style>
</head>
<body>
{%app_entry%}
<footer>{%config%}{%scripts%}{%renderer%}</footer>
</body>
</html>"""
server = app.server
dash_auth.BasicAuth(app, {DASH_USERNAME: DASH_PASSWORD})

COLORS = {"panel": "#151d32", "text": "#f4f6fb"}

def card(label, value, suffix=""):
    return html.Div([
        html.Div(label, className="metric-label"),
        html.Div([html.Span(value, className="metric-value"), html.Span(suffix, className="metric-suffix")]),
    ], className="metric-card")

def fetch_metrics():
    response = requests.get(
        f"{API_URL}/api/v1/dashboard/metrics",
        headers={"x-marhaba-dashboard-key": API_KEY},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()

app.layout = html.Div([
    html.Header([
        html.Div([html.Div("MARHABA", className="brand"), html.Div("CONTROL CENTER", className="brand-sub")]),
        html.Div(id="last-updated", className="last-updated"),
    ], className="topbar"),
    html.Main([
        html.Div(id="connection-state", className="connection-state"),
        html.Section(id="metrics-grid", className="metrics-grid"),
        html.Section([
            html.Div([html.H2("Booking status"), dcc.Graph(id="booking-chart", config={"displayModeBar": False})], className="panel"),
            html.Div([html.H2("Platform activity"), html.Div(id="activity-table")], className="panel"),
        ], className="content-grid"),
        html.Div("Read-only operational dashboard · Data refreshed every 30 seconds", className="footer"),
    ], className="main"),
    dcc.Interval(id="refresh", interval=30_000, n_intervals=0),
], className="app-shell")

@app.callback(
    Output("connection-state", "children"),
    Output("connection-state", "className"),
    Output("metrics-grid", "children"),
    Output("booking-chart", "figure"),
    Output("activity-table", "children"),
    Output("last-updated", "children"),
    Input("refresh", "n_intervals"),
)
def refresh_dashboard(_):
    try:
        data = fetch_metrics()
        m = data["metrics"]
        finance = data.get("finance") or {}
        cards = [
            card("USERS", f'{m.get("users", 0):,}'),
            card("PARTNERS", f'{m.get("partners", 0):,}'),
            card("LISTINGS", f'{m.get("properties", 0):,}'),
            card("ACTIVE LISTINGS", f'{m.get("activeProperties", 0):,}'),
            card("BOOKINGS", f'{m.get("bookings", 0):,}'),
            card("PENDING BOOKINGS", f'{m.get("pendingBookings", 0):,}'),
            card("GMV", f'{float(finance.get("gmvMad") or 0):,.2f}', " MAD"),
            card("COMMISSION", f'{float(finance.get("commissionMad") or 0):,.2f}', " MAD"),
            card("OPEN SUPPORT", f'{m.get("openSupportTickets", 0):,}'),
            card("NEWSLETTER", f'{m.get("newsletterSubscribers", 0):,}'),
        ]
        frame = pd.DataFrame(data.get("bookingsByStatus", []))
        if frame.empty:
            figure = px.bar(title="No booking records yet")
        else:
            figure = px.bar(frame, x="status", y="total", color="status", title="Bookings by status")
        figure.update_layout(
            paper_bgcolor=COLORS["panel"], plot_bgcolor=COLORS["panel"],
            font_color=COLORS["text"], margin=dict(l=20, r=20, t=55, b=25),
            showlegend=False,
        )
        audit = data.get("recentAudit", [])
        if audit:
            table = dash_table.DataTable(
                data=audit,
                columns=[
                    {"name": "Action", "id": "action"},
                    {"name": "Entity", "id": "entityType"},
                    {"name": "ID", "id": "entityId"},
                    {"name": "Admin", "id": "actorEmail"},
                    {"name": "Date", "id": "createdAt"},
                ],
                page_size=8,
                style_table={"overflowX": "auto"},
                style_header={"backgroundColor": "#202b45", "color": "#f4f6fb", "border": "0", "fontWeight": "600"},
                style_cell={"backgroundColor": COLORS["panel"], "color": COLORS["text"], "border": "0", "padding": "10px", "textAlign": "left", "fontSize": "12px"},
            )
        else:
            table = html.Div("No audit activity recorded yet.", className="empty-state")
        updated = datetime.now(timezone.utc).strftime("Updated %Y-%m-%d %H:%M UTC")
        return "● CONNECTED · Live database metrics", "connection-state online", cards, figure, table, updated
    except requests.RequestException:
        return "● CONNECTION ERROR · Check API URL, service key and website availability", "connection-state offline", [], px.bar(title="Dashboard data unavailable"), html.Div("The metrics API could not be reached.", className="empty-state"), "Not updated"
    except (KeyError, ValueError, TypeError):
        return "● DATA ERROR · Metrics response could not be parsed", "connection-state offline", [], px.bar(title="Dashboard data unavailable"), html.Div("Unexpected metrics response.", className="empty-state"), "Not updated"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8050")), debug=False)
