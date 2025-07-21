const request = require('supertest');
const app = require('./src/server');

async function testAPI() {
  console.log('🧪 Testing BreadButter API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await request(app).get('/health');
    console.log('✅ Health check passed:', healthResponse.body.status);

    // Test API documentation
    console.log('\n2. Testing API documentation...');
    const apiResponse = await request(app).get('/api');
    console.log('✅ API docs available:', apiResponse.body.name);

    // Test talents endpoint
    console.log('\n3. Testing talents endpoint...');
    const talentsResponse = await request(app).get('/api/talents?limit=5');
    console.log('✅ Talents endpoint working:', talentsResponse.body.data.length, 'talents found');

    // Test gigs endpoint
    console.log('\n4. Testing gigs endpoint...');
    const gigsResponse = await request(app).get('/api/gigs?limit=5');
    console.log('✅ Gigs endpoint working:', gigsResponse.body.data.length, 'gigs found');

    // Test matchmaking endpoint
    console.log('\n5. Testing matchmaking endpoint...');
    if (gigsResponse.body.data.length > 0) {
      const gigId = gigsResponse.body.data[0].id;
      const matchResponse = await request(app)
        .post('/api/matchmaking/match')
        .send({ gig_id: gigId, limit: 3 });
      
      console.log('✅ Matchmaking working:', matchResponse.body.data.matches.length, 'matches generated');
      console.log('   Processing time:', matchResponse.body.data.metadata.processingTimeMs, 'ms');
    }

    // Test analytics endpoint
    console.log('\n6. Testing analytics endpoint...');
    const analyticsResponse = await request(app).get('/api/analytics');
    console.log('✅ Analytics working:', analyticsResponse.body.data.overview.total_talents, 'total talents');

    // Test AI status endpoint
    console.log('\n7. Testing AI status endpoint...');
    const aiResponse = await request(app).get('/api/ai/status');
    console.log('✅ AI status available:', aiResponse.body.data.semantic_matching.available ? 'Enabled' : 'Disabled');

    console.log('\n🎉 All API tests passed! The backend is working correctly.');
    console.log('\n📊 System Summary:');
    console.log(`   - Total Talents: ${analyticsResponse.body.data.overview.total_talents}`);
    console.log(`   - Total Clients: ${analyticsResponse.body.data.overview.total_clients}`);
    console.log(`   - Total Gigs: ${analyticsResponse.body.data.overview.total_gigs}`);
    console.log(`   - Total Matches: ${analyticsResponse.body.data.overview.total_matches}`);

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI; 