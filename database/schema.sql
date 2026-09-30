-- ======================================================
-- E-Commerce Business Analysis Database Schema (ShopVista)
-- Database Engine: MySQL 8.0+
-- ======================================================

CREATE DATABASE IF NOT EXISTS `ecommerce_analytics` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `ecommerce_analytics`;

-- 1. Categories Table
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `kpi_metrics`;

CREATE TABLE `categories` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(100) NOT NULL UNIQUE,
    `color_hex` VARCHAR(20) DEFAULT '#3b82f6',
    `icon_name` VARCHAR(50) DEFAULT 'package',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Products Table
CREATE TABLE `products` (
    `product_id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_name` VARCHAR(200) NOT NULL,
    `category_id` INT NOT NULL,
    `sku` VARCHAR(50) UNIQUE,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `cost_price` DECIMAL(10, 2) NOT NULL,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `return_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `rating` DECIMAL(3, 2) DEFAULT 4.5,
    `image_icon` VARCHAR(50) DEFAULT 'headphones',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Customers Table
CREATE TABLE `customers` (
    `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) UNIQUE,
    `phone` VARCHAR(30),
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100),
    `customer_segment` ENUM('Champions', 'Loyal', 'Potential', 'At Risk', 'New') DEFAULT 'Loyal',
    `total_spent` DECIMAL(12, 2) DEFAULT 0.00,
    `total_orders_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Orders Table
CREATE TABLE `orders` (
    `order_id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `customer_id` INT NOT NULL,
    `order_date` DATE NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(10, 2) DEFAULT 0.00,
    `shipping_fee` DECIMAL(10, 2) DEFAULT 0.00,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `order_status` ENUM('Delivered', 'Shipped', 'Processing', 'Cancelled', 'Returned') NOT NULL DEFAULT 'Delivered',
    `payment_method` VARCHAR(50) DEFAULT 'UPI',
    `shipping_city` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE CASCADE,
    INDEX `idx_order_date` (`order_date`),
    INDEX `idx_order_status` (`order_status`),
    INDEX `idx_shipping_city` (`shipping_city`)
) ENGINE=InnoDB;

-- 5. Order Items Table
CREATE TABLE `order_items` (
    `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT,
    INDEX `idx_item_product` (`product_id`)
) ENGINE=InnoDB;

-- 6. KPI Summary Table (Pre-aggregated snapshot cache for fast executive dashboard load)
CREATE TABLE `kpi_metrics` (
    `metric_key` VARCHAR(50) PRIMARY KEY,
    `metric_title` VARCHAR(100) NOT NULL,
    `metric_value` DECIMAL(15, 2) NOT NULL,
    `formatted_value` VARCHAR(50) NOT NULL,
    `growth_percentage` DECIMAL(5, 2) NOT NULL,
    `comparison_text` VARCHAR(100) DEFAULT 'vs last period',
    `icon_type` VARCHAR(50),
    `color_theme` VARCHAR(50),
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Analytics Views
CREATE OR REPLACE VIEW `vw_monthly_sales` AS
SELECT 
    DATE_FORMAT(order_date, '%b') AS month_name,
    DATE_FORMAT(order_date, '%m') AS month_num,
    YEAR(order_date) AS order_year,
    COUNT(order_id) AS total_orders,
    SUM(total_amount) AS total_revenue,
    ROUND(AVG(total_amount), 2) AS avg_order_value
FROM orders
WHERE order_status NOT IN ('Cancelled')
GROUP BY YEAR(order_date), DATE_FORMAT(order_date, '%m'), DATE_FORMAT(order_date, '%b')
ORDER BY order_year ASC, month_num ASC;

CREATE OR REPLACE VIEW `vw_category_sales` AS
SELECT 
    c.category_name,
    c.color_hex,
    COUNT(DISTINCT o.order_id) AS orders_count,
    SUM(oi.total_price) AS category_revenue,
    ROUND((SUM(oi.total_price) / (SELECT SUM(total_price) FROM order_items)) * 100, 1) AS revenue_share_pct
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status NOT IN ('Cancelled')
GROUP BY c.category_id, c.category_name, c.color_hex
ORDER BY category_revenue DESC;

CREATE OR REPLACE VIEW `vw_city_performance` AS
SELECT 
    shipping_city AS city,
    COUNT(order_id) AS orders_count,
    SUM(total_amount) AS city_revenue,
    ROUND((COUNT(order_id) / (SELECT COUNT(*) FROM orders)) * 100, 1) AS orders_share_pct
FROM orders
GROUP BY shipping_city
ORDER BY orders_count DESC;
