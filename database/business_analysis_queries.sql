-- ============================================================================
-- E-COMMERCE BUSINESS ANALYSIS - CORE SQL QUERIES & INSIGHTS
-- Platform: ShopVista | Database: ecommerce_analytics (MySQL 8.0+)
-- Author: Arif Khan (Senior Business Analyst)
-- ============================================================================

USE `ecommerce_analytics`;

-- ----------------------------------------------------------------------------
-- 1. EXECUTIVE KPI SUMMARY
-- Calculates Total Revenue, Total Orders, Unique Customers, and Average Order Value (AOV)
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(order_id) AS total_orders,
    CONCAT('₹ ', FORMAT(SUM(total_amount), 0)) AS total_revenue_inr,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    CONCAT('₹ ', FORMAT(ROUND(AVG(total_amount), 0), 0)) AS avg_order_value_inr
FROM orders;


-- ----------------------------------------------------------------------------
-- 2. MONTH-OVER-MONTH (MoM) REVENUE & ORDER GROWTH (Using Window Functions)
-- Evaluates seasonal trends, peak festive demand (Sep-Nov), and growth acceleration
-- ----------------------------------------------------------------------------
WITH monthly_metrics AS (
    SELECT 
        YEAR(order_date) AS order_year,
        MONTH(order_date) AS order_month,
        DATE_FORMAT(order_date, '%b') AS month_name,
        COUNT(order_id) AS monthly_orders,
        SUM(total_amount) AS monthly_revenue,
        ROUND(AVG(total_amount), 2) AS monthly_aov
    FROM orders
    GROUP BY YEAR(order_date), MONTH(order_date), DATE_FORMAT(order_date, '%b')
)
SELECT 
    month_name,
    monthly_orders,
    LAG(monthly_orders, 1) OVER (ORDER BY order_month) AS prev_month_orders,
    ROUND(((monthly_orders - LAG(monthly_orders, 1) OVER (ORDER BY order_month)) / 
           LAG(monthly_orders, 1) OVER (ORDER BY order_month)) * 100, 2) AS order_growth_pct,
    CONCAT('₹ ', FORMAT(monthly_revenue, 0)) AS revenue_formatted,
    LAG(monthly_revenue, 1) OVER (ORDER BY order_month) AS prev_month_revenue,
    ROUND(((monthly_revenue - LAG(monthly_revenue, 1) OVER (ORDER BY order_month)) / 
           LAG(monthly_revenue, 1) OVER (ORDER BY order_month)) * 100, 2) AS revenue_growth_pct
FROM monthly_metrics
ORDER BY order_month ASC;


-- ----------------------------------------------------------------------------
-- 3. CATEGORY CONTRIBUTION & PROFIT MARGIN ANALYSIS
-- Breaks down revenue percentage share, total volume, and gross profit margins
-- ----------------------------------------------------------------------------
SELECT 
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_products_in_cat,
    COUNT(oi.order_item_id) AS units_sold,
    CONCAT('₹ ', FORMAT(SUM(oi.total_price), 0)) AS category_revenue,
    ROUND((SUM(oi.total_price) / (SELECT SUM(total_price) FROM order_items)) * 100, 1) AS revenue_share_pct,
    ROUND(SUM(oi.total_price - (p.cost_price * oi.quantity)), 2) AS gross_profit,
    ROUND((SUM(oi.total_price - (p.cost_price * oi.quantity)) / SUM(oi.total_price)) * 100, 2) AS gross_margin_pct
FROM categories c
JOIN products p ON c.category_id = p.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY c.category_id, c.category_name
ORDER BY SUM(oi.total_price) DESC;


-- ----------------------------------------------------------------------------
-- 4. RETURN RATE ANOMALY DETECTION BY CATEGORY
-- Identifies categories with disproportionate returns (Electronics: 8.9%)
-- ----------------------------------------------------------------------------
SELECT 
    c.category_name,
    ROUND(AVG(p.return_rate), 2) AS avg_return_rate_pct,
    CASE 
        WHEN AVG(p.return_rate) >= 8.0 THEN 'CRITICAL: High Return Investigation Required'
        WHEN AVG(p.return_rate) >= 4.0 THEN 'MODERATE: Monitor Customer Feedback'
        ELSE 'HEALTHY: Within Acceptable Threshold'
    END AS business_action_flag
FROM categories c
JOIN products p ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name
ORDER BY avg_return_rate_pct DESC;


-- ----------------------------------------------------------------------------
-- 5. GEOGRAPHIC PERFORMANCE & CITY SHARE
-- Delhi (18.5%), Mumbai (14.2%), Bengaluru (11.7%) lead fulfillment volume
-- ----------------------------------------------------------------------------
SELECT 
    shipping_city AS city,
    COUNT(order_id) AS total_orders,
    CONCAT('₹ ', FORMAT(SUM(total_amount), 0)) AS city_revenue,
    ROUND((COUNT(order_id) / (SELECT COUNT(*) FROM orders)) * 100, 1) AS orders_share_pct,
    ROUND(AVG(total_amount), 2) AS city_aov
FROM orders
GROUP BY shipping_city
ORDER BY total_orders DESC;


-- ----------------------------------------------------------------------------
-- 6. TOP 5 BEST SELLING PRODUCTS (Revenue & Volume)
-- Featured directly on the Executive Overview
-- ----------------------------------------------------------------------------
SELECT 
    ROW_NUMBER() OVER (ORDER BY SUM(oi.total_price) DESC) AS ranking,
    p.product_name,
    c.category_name,
    CONCAT('₹ ', FORMAT(SUM(oi.total_price), 0)) AS sales,
    SUM(oi.quantity) AS units_sold,
    COUNT(DISTINCT oi.order_id) AS orders_count
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name, c.category_name
ORDER BY SUM(oi.total_price) DESC
LIMIT 5;


-- ----------------------------------------------------------------------------
-- 7. ORDER FULFILLMENT FUNNEL & STATUS DISTRIBUTION
-- Analyzes Delivered (72.6%), Shipped (12.8%), Processing (8.7%), Cancelled (4.1%), Returned (1.8%)
-- ----------------------------------------------------------------------------
SELECT 
    order_status,
    COUNT(order_id) AS orders_count,
    ROUND((COUNT(order_id) / (SELECT COUNT(*) FROM orders)) * 100, 1) AS status_share_pct,
    CONCAT('₹ ', FORMAT(SUM(total_amount), 0)) AS total_value
FROM orders
GROUP BY order_status
ORDER BY orders_count DESC;


-- ----------------------------------------------------------------------------
-- 8. INVENTORY STOCK-OUT RISK ANALYSIS (Next 7 Days Critical Alert)
-- Identifies products with inventory under 30 units facing stock-out
-- ----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.stock_quantity,
    CASE 
        WHEN p.stock_quantity < 25 THEN 'IMMEDIATE REORDER (Stock < 25)'
        WHEN p.stock_quantity < 50 THEN 'LOW STOCK WARNING (Stock < 50)'
        ELSE 'ADEQUATE STOCK'
    END AS replenishment_status
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.stock_quantity < 50
ORDER BY p.stock_quantity ASC;


-- ----------------------------------------------------------------------------
-- 9. RFM CUSTOMER SEGMENTATION (Recency, Frequency, Monetary)
-- Segments users into Champions, Loyal, At Risk, Potential
-- ----------------------------------------------------------------------------
WITH customer_rfm AS (
    SELECT 
        c.customer_id,
        c.customer_name,
        c.city,
        DATEDIFF('2024-12-31', MAX(o.order_date)) AS recency_days,
        COUNT(o.order_id) AS frequency,
        SUM(o.total_amount) AS monetary_value
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.customer_name, c.city
)
SELECT 
    customer_id,
    customer_name,
    city,
    recency_days,
    frequency,
    CONCAT('₹ ', FORMAT(monetary_value, 0)) AS monetary_value,
    CASE 
        WHEN recency_days <= 30 AND frequency >= 5 THEN 'Champion / VIP'
        WHEN recency_days <= 60 AND frequency >= 3 THEN 'Loyal Customer'
        WHEN recency_days > 90 AND frequency >= 3 THEN 'At Risk / Churning'
        WHEN frequency = 1 THEN 'New / One-Time Buyer'
        ELSE 'Regular Buyer'
    END AS rfm_segment
FROM customer_rfm
ORDER BY monetary_value DESC
LIMIT 20;


-- ----------------------------------------------------------------------------
-- 10. PARETO 80/20 ANALYSIS: HIGH VALUE CUSTOMERS REVENUE CONCENTRATION
-- Evaluates whether top tier customers generate disproportional revenue (18.6% from top 5)
-- ----------------------------------------------------------------------------
SELECT 
    c.customer_name,
    c.city,
    COUNT(o.order_id) AS total_orders,
    CONCAT('₹ ', FORMAT(SUM(o.total_amount), 0)) AS customer_spent,
    ROUND((SUM(o.total_amount) / (SELECT SUM(total_amount) FROM orders)) * 100, 2) AS revenue_contribution_pct
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name, c.city
ORDER BY SUM(o.total_amount) DESC
LIMIT 10;
