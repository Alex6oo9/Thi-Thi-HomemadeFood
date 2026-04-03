#!/bin/bash

# Quick pagination testing script using curl
# Prerequisites: Server running on localhost:5000

BASE_URL="http://localhost:5000"

echo "╔════════════════════════════════════════════════════════╗"
echo "║      PAGINATION QUICK VERIFICATION TESTS               ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "📦 PRODUCTS ENDPOINT"
echo "═══════════════════════════════════════════════════════════"

echo ""
echo "1. Default pagination:"
curl -s "$BASE_URL/api/products" | jq '{pagination, item_count: (.products | length)}'

echo ""
echo "2. Custom page and limit (page=2, limit=5):"
curl -s "$BASE_URL/api/products?page=2&limit=5" | jq '{pagination, item_count: (.products | length)}'

echo ""
echo "3. Sort by price ascending:"
curl -s "$BASE_URL/api/products?sortBy=price&order=asc&limit=3" | jq '{pagination, prices: [.products[].price]}'

echo ""
echo "4. Sort by name descending:"
curl -s "$BASE_URL/api/products?sortBy=name&order=desc&limit=3" | jq '{pagination, names: [.products[].name]}'

echo ""
echo "5. Filter available + pagination:"
curl -s "$BASE_URL/api/products?available=true&limit=5" | jq '{pagination, all_available: ([.products[].available] | all)}'

echo ""
echo "6. Limit enforcement (request 200, expect max 100):"
curl -s "$BASE_URL/api/products?limit=200" | jq '.pagination.limit'

echo ""
echo "7. Invalid page (page=abc, should default to 1):"
curl -s "$BASE_URL/api/products?page=abc" | jq '.pagination.page'

echo ""
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                  VERIFICATION SUMMARY                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "✓ Check that all responses have 'pagination' object"
echo "✓ Check that pagination.limit is capped at 100"
echo "✓ Check that invalid params use defaults"
echo "✓ Check that sorting works (prices/names in order)"
echo "✓ Check that filters work (all_available: true)"
echo ""
echo "For orders endpoints (require auth), use curl with cookies:"
echo "  curl -c cookies.txt -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@test.com\",\"password\":\"password\"}'"
echo "  curl -b cookies.txt $BASE_URL/api/orders"
echo ""
