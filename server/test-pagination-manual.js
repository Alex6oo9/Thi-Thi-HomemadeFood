/**
 * Manual test script for pagination endpoints
 * Run this with: node test-pagination-manual.js
 *
 * Prerequisites:
 * 1. MongoDB must be running locally
 * 2. Server must be running (npm run dev)
 * 3. Have some test data (products and orders)
 */

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(endpoint, description, expectedKeys) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   URL: ${BASE_URL}${endpoint}`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);

      // Check if response has expected structure
      const hasExpectedStructure = expectedKeys.every(key => key in data);

      if (hasExpectedStructure) {
        console.log(`   ✅ Response structure: Valid`);

        if (data.pagination) {
          console.log(`   📊 Pagination:`, {
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            pages: data.pagination.pages
          });
        }

        const dataKey = Object.keys(data).find(k => Array.isArray(data[k]));
        if (dataKey) {
          console.log(`   📝 Items returned: ${data[dataKey].length}`);
        }
      } else {
        console.log(`   ❌ Missing expected keys. Expected: ${expectedKeys.join(', ')}`);
        console.log(`   Got keys: ${Object.keys(data).join(', ')}`);
      }
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
      console.log(`   Message: ${data.error || data.message || JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      PAGINATION & SORTING MANUAL TEST SUITE           ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Products Tests
  console.log('\n📦 PRODUCTS ENDPOINT TESTS');
  console.log('═'.repeat(60));

  await testEndpoint(
    '/api/products',
    'Default pagination (should be page=1, limit=10)',
    ['products', 'pagination']
  );

  await testEndpoint(
    '/api/products?page=2&limit=5',
    'Custom pagination (page=2, limit=5)',
    ['products', 'pagination']
  );

  await testEndpoint(
    '/api/products?sortBy=name&order=asc',
    'Sort by name ascending',
    ['products', 'pagination']
  );

  await testEndpoint(
    '/api/products?sortBy=price&order=desc',
    'Sort by price descending',
    ['products', 'pagination']
  );

  await testEndpoint(
    '/api/products?available=true&limit=20',
    'Filter available + pagination',
    ['products', 'pagination']
  );

  await testEndpoint(
    '/api/products?page=999',
    'Page beyond total (should return empty)',
    ['products', 'pagination']
  );

  await testEndpoint(
    '/api/products?limit=200',
    'Limit exceeds max (should cap at 100)',
    ['products', 'pagination']
  );

  // Orders Tests (requires authentication)
  console.log('\n\n📋 ORDERS ENDPOINT TESTS (Admin/Seller)');
  console.log('═'.repeat(60));
  console.log('⚠️  Note: These require authentication. Login first, then test.');

  await testEndpoint(
    '/api/orders',
    'Default pagination for orders',
    ['orders', 'pagination']
  );

  await testEndpoint(
    '/api/orders?status=RECEIVED&page=1&limit=10',
    'Filter by status + pagination',
    ['orders', 'pagination']
  );

  await testEndpoint(
    '/api/orders?sortBy=total&order=desc',
    'Sort by total descending',
    ['orders', 'pagination']
  );

  // Customer Orders Tests
  console.log('\n\n👤 MY ORDERS ENDPOINT TESTS (Customer)');
  console.log('═'.repeat(60));
  console.log('⚠️  Note: Requires customer authentication.');

  await testEndpoint(
    '/api/orders/my',
    'Customer orders with pagination',
    ['orders', 'pagination']
  );

  await testEndpoint(
    '/api/orders/my?sortBy=createdAt&order=desc',
    'Sort customer orders by date',
    ['orders', 'pagination']
  );

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST COMPLETE                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n📝 Manual verification checklist:');
  console.log('   ✓ All responses have { products/orders, pagination } structure');
  console.log('   ✓ Pagination metadata includes page, limit, total, pages');
  console.log('   ✓ Sorting works in both asc and desc order');
  console.log('   ✓ Filters work with pagination');
  console.log('   ✓ Edge cases handled (invalid params, page beyond total)');
  console.log('\n💡 For authenticated endpoints, use Postman or curl with session cookies.');
}

// Run tests
runTests().catch(console.error);
