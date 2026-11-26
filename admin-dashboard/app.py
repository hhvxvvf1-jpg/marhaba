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
