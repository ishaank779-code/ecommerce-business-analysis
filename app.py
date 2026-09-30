import os
import io
import csv
from flask import Flask, render_template, jsonify, request, Response, send_file
from config import Config
from database.db import (
    get_executive_overview,
    get_sales_analysis_data,
    get_customer_analysis_data,
    get_product_analysis_data,
    get_orders_list,
    get_db_connection
)

app = Flask(__name__)
app.config.from_object(Config)

@app.route('/')
def dashboard():
    """Render the main ShopVista Executive Dashboard."""
    overview_data = get_executive_overview()
    return render_template('index.html', data=overview_data)

# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------
@app.route('/api/overview')
def api_overview():
    """Get full executive overview payload."""
    data = get_executive_overview()
    return jsonify({"status": "success", "data": data})

@app.route('/api/sales-analysis')
def api_sales():
    """Get sales performance and payment breakdown."""
    data = get_sales_analysis_data()
    return jsonify({"status": "success", "data": data})

@app.route('/api/customer-analysis')
def api_customers():
    """Get customer segmentation and VIP list."""
    data = get_customer_analysis_data()
    return jsonify({"status": "success", "data": data})

@app.route('/api/product-analysis')
def api_products():
    """Get inventory status and return rates."""
    data = get_product_analysis_data()
    return jsonify({"status": "success", "data": data})

@app.route('/api/orders')
def api_orders():
    """Get paginated and filterable orders."""
    search = request.args.get('search', '').strip()
    status = request.args.get('status', 'All').strip()
    limit = int(request.args.get('limit', 50))
    orders = get_orders_list(search=search if search else None, status=status, limit=limit)
    return jsonify({"status": "success", "count": len(orders), "orders": orders})

@app.route('/api/export-report')
def export_report():
    """Export executive business report as CSV."""
    overview = get_executive_overview()
    kpis = overview.get('kpis', {})

    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ShopVista E-Commerce Business Analysis - Executive Summary"])
    writer.writerow(["Generated on", "Jan 2024 - Dec 2024 Audit Period"])
    writer.writerow([])
    writer.writerow(["Core Business Metrics", "Value", "Growth vs Last Period"])
    writer.writerow(["Total Revenue", kpis.get("revenue", {}).get("display", ""), f"+{kpis.get('revenue', {}).get('growth')}%"])
    writer.writerow(["Total Orders", kpis.get("orders", {}).get("display", ""), f"+{kpis.get('orders', {}).get('growth')}%"])
    writer.writerow(["Total Customers", kpis.get("customers", {}).get("display", ""), f"+{kpis.get('customers', {}).get('growth')}%"])
    writer.writerow(["Average Order Value (AOV)", kpis.get("aov", {}).get("display", ""), f"+{kpis.get('aov', {}).get('growth')}%"])
    writer.writerow([])
    
    writer.writerow(["Category Revenue Share"])
    writer.writerow(["Category", "Revenue (INR)", "Share Percentage"])
    for cat in overview.get('category_breakdown', []):
        writer.writerow([cat['category'], f"INR {cat['revenue']:,}", f"{cat['percentage']}%"])
    writer.writerow([])

    writer.writerow(["City Performance Distribution"])
    writer.writerow(["City", "Share Percentage", "Total Orders"])
    for city in overview.get('city_breakdown', []):
        writer.writerow([city['city'], f"{city['percentage']}%", city['orders']])
    writer.writerow([])

    writer.writerow(["Strategic Business Recommendations"])
    for rec in overview.get('business_recommendations', []):
        writer.writerow([f"Priority {rec['num']}", f"{rec['title']} {rec.get('subtitle', '')}"])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=ShopVista_Executive_Report_2024.csv"}
    )

@app.route('/api/health')
def health():
    """System health check and database connection status."""
    conn = get_db_connection()
    db_connected = conn is not None
    if conn:
        conn.close()
    return jsonify({
        "status": "healthy",
        "mysql_connected": db_connected,
        "database": Config.DB_NAME,
        "host": Config.DB_HOST
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting ShopVista Analytics Dashboard on http://localhost:{port}...")
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
