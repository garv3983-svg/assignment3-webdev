# Assignment 3 - Inventory and Data Management System

## What this project implements
- Mongoose Product schema with field-level validation
- MongoDB connection using Mongoose
- Create, Read, Update, Delete APIs
- Filtering, sorting and pagination
- Safe stock increment/decrement operations
- Low-stock report
- Category-wise inventory aggregation
- Centralized error handling
- dotenv environment configuration

## Technology
Node.js, Express.js, MongoDB, Mongoose, dotenv

## Setup
1. Install Node.js and MongoDB.
2. Open this project in VS Code.
3. Run:
   npm install
4. Copy `.env.example` to `.env`.
5. Set `MONGODB_URI` if your MongoDB connection is different.
6. Start:
   npm start
7. Server runs at http://localhost:3000

## API endpoints

### Create
POST /api/products
Body:
{
  "name": "Aster King Bed",
  "sku": "AKB-001",
  "category": "Beds",
  "price": 25999,
  "quantity": 10,
  "lowStockThreshold": 3,
  "description": "King size wooden bed"
}

### Read all
GET /api/products
Examples:
- /api/products?category=Beds
- /api/products?search=bed
- /api/products?minPrice=10000&maxPrice=30000
- /api/products?minQuantity=2
- /api/products?sortBy=price&order=desc
- /api/products?page=1&limit=5
- Filters can be combined.

### Read one
GET /api/products/:id

### Update product
PUT /api/products/:id

### Stock adjustment
PATCH /api/products/:id/stock
Body for restock:
{ "operation": "restock", "quantity": 5 }

Body for sale:
{ "operation": "sale", "quantity": 2 }

A sale cannot reduce stock below zero.

### Delete
DELETE /api/products/:id

### Reports
GET /api/reports/low-stock
GET /api/reports/category-summary

## Example curl commands

Create:
curl -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d "{"name":"Aster King Bed","sku":"AKB-001","category":"Beds","price":25999,"quantity":10,"lowStockThreshold":3}"

List:
curl http://localhost:3000/api/products

Restock:
curl -X PATCH http://localhost:3000/api/products/<PRODUCT_ID>/stock -H "Content-Type: application/json" -d "{"operation":"restock","quantity":5}"

Sale:
curl -X PATCH http://localhost:3000/api/products/<PRODUCT_ID>/stock -H "Content-Type: application/json" -d "{"operation":"sale","quantity":2}"

Low stock:
curl http://localhost:3000/api/reports/low-stock

Category summary:
curl http://localhost:3000/api/reports/category-summary
