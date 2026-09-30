import pymysql
import sys
import os
import random
import re

# Add parent directory to path to import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config

def execute_sql_file(cursor, filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    statements = content.split(';')
    for stmt in statements:
        lines = [line for line in stmt.splitlines() if not line.strip().startswith('--')]
        clean_stmt = "\n".join(lines).strip()
        if clean_stmt:
            try:
                cursor.execute(clean_stmt)
            except Exception as e:
                if "doesn't exist" not in str(e).lower():
                    pass

def seed_database():
    print(f"Connecting to MySQL server at {Config.DB_HOST}:{Config.DB_PORT} as {Config.DB_USER}...")
    try:
        server_conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            autocommit=True
        )
        with server_conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        server_conn.close()

        conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            autocommit=True,
            charset='utf8mb4'
        )
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        return False

    with conn.cursor() as cursor:
        print("Re-creating schema...")
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        execute_sql_file(cursor, schema_path)

        print("Seeding Categories...")
        categories = [
            ("Electronics", "#3b82f6", "headphones"),
            ("Fashion", "#f97316", "shirt"),
            ("Home & Living", "#10b981", "home"),
            ("Beauty & Personal Care", "#06b6d4", "sparkles"),
            ("Sports & Fitness", "#8b5cf6", "activity"),
            ("Books & Others", "#ec4899", "book-open")
        ]
        cursor.executemany(
            "INSERT INTO categories (category_name, color_hex, icon_name) VALUES (%s, %s, %s)",
            categories
        )

        print("Seeding Key Products...")
        products = [
            ("Wireless Earbuds", 1, "SKU-ELEC-001", 540.71, 320.00, 48, 8.90, 4.7, "headphones"),
            ("Casual Sneakers", 2, "SKU-FASH-002", 514.06, 280.00, 115, 3.40, 4.6, "footprints"),
            ("Smart Watch", 1, "SKU-ELEC-003", 505.54, 290.00, 24, 9.20, 4.4, "watch"),
            ("T-Shirt (Men)", 2, "SKU-FASH-004", 480.62, 190.00, 240, 2.10, 4.5, "shirt"),
            ("Air Fryer", 3, "SKU-HOME-005", 480.31, 310.00, 18, 2.80, 4.8, "flame"),
            ("Gaming Mechanical Keyboard", 1, "SKU-ELEC-006", 1899.00, 1100.00, 85, 4.10, 4.7, "keyboard"),
            ("Bluetooth Noise-Cancelling Headphones", 1, "SKU-ELEC-007", 3499.00, 2100.00, 32, 6.50, 4.8, "headphones"),
            ("Denim Slim Fit Jacket", 2, "SKU-FASH-008", 1499.00, 800.00, 75, 4.20, 4.3, "shirt"),
            ("Organic Cotton Bed Linen Set", 3, "SKU-HOME-009", 1299.00, 700.00, 40, 1.90, 4.6, "home"),
            ("Vitamin C Radiant Face Serum", 4, "SKU-BEAU-010", 699.00, 250.00, 95, 1.20, 4.9, "sparkles"),
            ("Yoga Mat Non-Slip Pro", 5, "SKU-SPRT-011", 899.00, 400.00, 110, 2.00, 4.7, "activity"),
            ("Bestselling Business Strategy Guide", 6, "SKU-BOOK-012", 499.00, 220.00, 150, 0.80, 4.6, "book-open")
        ]
        cursor.executemany(
            """INSERT INTO products 
               (product_name, category_id, sku, unit_price, cost_price, stock_quantity, return_rate, rating, image_icon) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            products
        )

        print("Seeding Customers (5,276 total customer base)...")
        # Explicit primary customers from UI
        key_customers = [
            ("Rahul Sharma", "rahul.sharma@example.com", "+91 98765 43210", "Delhi", "Delhi", "Champions", 18450.00, 4),
            ("Priya Singh", "priya.singh@example.com", "+91 98234 56789", "Mumbai", "Maharashtra", "Loyal", 14200.00, 5),
            ("Amit Verma", "amit.verma@example.com", "+91 97123 45678", "Bengaluru", "Karnataka", "Champions", 22890.00, 6),
            ("Neha Gupta", "neha.gupta@example.com", "+91 96543 21098", "Hyderabad", "Telangana", "Potential", 8900.00, 3),
            ("Sandeep Yadav", "sandeep.yadav@example.com", "+91 95432 10987", "Chennai", "Tamil Nadu", "At Risk", 6700.00, 2),
            ("Ananya Desai", "ananya.desai@example.com", "+91 94321 09876", "Mumbai", "Maharashtra", "Champions", 31200.00, 8),
            ("Vikram Malhotra", "vikram.m@example.com", "+91 93210 98765", "Delhi", "Delhi", "Loyal", 16400.00, 4),
            ("Pooja Nair", "pooja.nair@example.com", "+91 92109 87654", "Kolkata", "West Bengal", "Potential", 9400.00, 3),
            ("Rohan Joshi", "rohan.joshi@example.com", "+91 91098 76543", "Bengaluru", "Karnataka", "Champions", 27600.00, 7),
            ("Sneha Kulkarni", "sneha.k@example.com", "+91 90987 65432", "Pune", "Maharashtra", "Loyal", 12800.00, 4)
        ]
        cursor.executemany(
            """INSERT INTO customers 
               (customer_name, email, phone, city, state, customer_segment, total_spent, total_orders_count) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            key_customers
        )

        # Batch insert additional customer records up to 5,276 customers
        cities = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur"]
        segments = ["Champions", "Loyal", "Potential", "At Risk", "New"]
        bulk_customers = []
        for i in range(11, 5277):
            bulk_customers.append((
                f"Customer {i}",
                f"user{i}@example.com",
                f"+91 98000 {i:05d}",
                random.choice(cities),
                "India",
                random.choice(segments),
                round(random.uniform(1500, 45000), 2),
                random.randint(1, 12)
            ))
        print("Inserting 5,266 customer profiles...")
        for i in range(0, len(bulk_customers), 2000):
            cursor.executemany(
                """INSERT INTO customers 
                   (customer_name, email, phone, city, state, customer_segment, total_spent, total_orders_count) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                bulk_customers[i:i + 2000]
            )

        print("Seeding Exact UI Recent Orders (#SV1001 to #SV1005)...")
        # 5 Recent orders from the UI table
        ui_recent_orders = [
            ("SV1001", 1, "2024-12-28", 4299.00, 0.00, 0.00, 4299.00, "Delivered", "UPI", "Delhi"),
            ("SV1002", 2, "2024-12-27", 2749.00, 0.00, 0.00, 2749.00, "Shipped", "Credit Card", "Mumbai"),
            ("SV1003", 3, "2024-12-27", 6199.00, 0.00, 0.00, 6199.00, "Delivered", "Net Banking", "Bengaluru"),
            ("SV1004", 4, "2024-12-26", 1899.00, 0.00, 0.00, 1899.00, "Processing", "UPI", "Hyderabad"),
            ("SV1005", 5, "2024-12-25", 3499.00, 0.00, 0.00, 3499.00, "Cancelled", "COD", "Chennai")
        ]
        cursor.executemany(
            """INSERT INTO orders 
               (order_number, customer_id, order_date, subtotal, discount, shipping_fee, total_amount, order_status, payment_method, shipping_city) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            ui_recent_orders
        )

        recent_sum = 4299.00 + 2749.00 + 6199.00 + 1899.00 + 3499.00 # 18,645.00
        target_total_orders = 8492
        target_total_rev = 48752320.00

        remaining_orders = target_total_orders - 5 # 8,487
        remaining_rev = target_total_rev - recent_sum # 48,733,675.00

        # Exact monthly breakdown to match Orders Trend & Revenue Trend
        # Months: Jan to Dec
        monthly_specs = [
            ("2024-01-15", 520, 2100000.00),
            ("2024-02-15", 550, 2250000.00),
            ("2024-03-15", 610, 2800000.00),
            ("2024-04-15", 620, 3300000.00),
            ("2024-05-15", 630, 3500000.00),
            ("2024-06-15", 710, 3550000.00),
            ("2024-07-15", 730, 4050000.00),
            ("2024-08-15", 810, 4650000.00),
            ("2024-09-15", 890, 5500000.00),
            ("2024-10-15", 980, 6450000.00),
            ("2024-11-15", 850, 6850000.00),
            ("2024-12-15", 587, 3690747.96) # 587 + 5 recent = 592 orders in Dec, exact sum
        ]

        # City distribution
        city_pool = ["Delhi"] * 1570 + ["Mumbai"] * 1205 + ["Bengaluru"] * 993 + \
                    ["Hyderabad"] * 755 + ["Chennai"] * 644 + ["Kolkata"] * 577 + ["Others"] * 2743
        random.shuffle(city_pool)

        # Status distribution
        # Delivered: 6163 + 2 = 6165 (72.6%)
        # Shipped: 1086 + 1 = 1087 (12.8%)
        # Processing: 738 + 1 = 739 (8.7%)
        # Cancelled: 347 + 1 = 348 (4.1%)
        # Returned: 153 (1.8%)
        status_pool = ["Delivered"] * 6163 + ["Shipped"] * 1086 + ["Processing"] * 738 + \
                      ["Cancelled"] * 347 + ["Returned"] * 153
        random.shuffle(status_pool)

        print(f"Generating {remaining_orders} historical orders to match exactly 8,492 orders and INR 48,752,320 revenue...")
        all_orders = []
        pool_idx = 0
        order_num = 1006

        for date_str, ord_count, tot_rev in monthly_specs:
            avg_amount = tot_rev / ord_count
            for i in range(ord_count):
                city = city_pool[pool_idx] if pool_idx < len(city_pool) else "Delhi"
                status = status_pool[pool_idx] if pool_idx < len(status_pool) else "Delivered"
                pool_idx += 1

                # Last record in December absorbs rounding to hit exact total
                if pool_idx == remaining_orders:
                    current_sum = sum(o[3] for o in all_orders) + recent_sum
                    amount = round(target_total_rev - current_sum, 2)
                else:
                    amount = round(random.gauss(avg_amount, avg_amount * 0.10), 2)
                    if amount <= 500:
                        amount = round(avg_amount, 2)

                all_orders.append((
                    f"SV{order_num}",
                    random.randint(1, 5276),
                    date_str,
                    amount,
                    0.00,
                    0.00,
                    amount,
                    status,
                    random.choice(["UPI", "Credit Card", "Net Banking", "Debit Card"]),
                    city
                ))
                order_num += 1

        print("Inserting historical orders in batches...")
        for i in range(0, len(all_orders), 1500):
            cursor.executemany(
                """INSERT INTO orders 
                   (order_number, customer_id, order_date, subtotal, discount, shipping_fee, total_amount, order_status, payment_method, shipping_city) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                all_orders[i:i + 1500]
            )

        print("Seeding Order Items for Top 5 Products...")
        top_items = [
            (1, 1, 892, 540.71, 482320.00),
            (2, 2, 761, 514.06, 391200.00),
            (3, 3, 642, 505.54, 324560.00),
            (4, 4, 598, 480.62, 287410.00),
            (5, 5, 512, 480.31, 245920.00),
            # Other products for category revenue alignment
            (6, 6, 250, 1899.00, 474750.00),
            (7, 7, 300, 3499.00, 1049700.00),
            (8, 8, 400, 1499.00, 599600.00),
            (9, 9, 350, 1299.00, 454650.00),
            (10, 10, 600, 699.00, 419400.00),
            (11, 11, 450, 899.00, 404550.00),
            (12, 12, 500, 499.00, 249500.00)
        ]
        cursor.executemany(
            """INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
               VALUES (%s, %s, %s, %s, %s)""",
            top_items
        )

        print("Seeding KPI Metrics Summary Table...")
        kpi_rows = [
            ("total_revenue", "Total Revenue", 48752320.00, "₹ 48,752,320", 12.5, "vs last period", "rupee", "blue"),
            ("total_orders", "Total Orders", 8492.00, "8,492", 8.3, "vs last period", "cart", "green"),
            ("total_customers", "Total Customers", 5276.00, "5,276", 14.7, "vs last period", "users", "purple"),
            ("avg_order_value", "Average Order Value", 5744.00, "₹ 5,744", 3.2, "vs last period", "coin", "orange")
        ]
        cursor.executemany(
            """INSERT INTO kpi_metrics 
               (metric_key, metric_title, metric_value, formatted_value, growth_percentage, comparison_text, icon_type, color_theme)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE 
               metric_value=VALUES(metric_value), formatted_value=VALUES(formatted_value), growth_percentage=VALUES(growth_percentage)""",
            kpi_rows
        )

        print("SUCCESS: MySQL database seeded with exact 8,492 orders, 5,276 customers, and INR 48,752,320 revenue!")

    conn.close()
    return True

if __name__ == '__main__':
    seed_database()
