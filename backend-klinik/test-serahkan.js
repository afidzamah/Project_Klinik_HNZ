const http = require('http');

function testSerahkan() {
  console.log("=== SENDING HTTP PATCH TO PROCESS HANDOVER ===");
  const resepId = 'd81e5e65-8472-44ac-a5dc-a20a3b6a16dc';
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/resep/${resepId}/serahkan`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    console.log(`Status Code: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:');
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

testSerahkan();
