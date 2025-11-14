// 简单的API端点测试
const http = require('http');
const url = require('url');

function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: method,
      headers: {}
    };

    if (data && method !== 'GET') {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('测试API端点...');
  
  const endpoints = [
    '/api/db/stats',
    '/api/db/info',
    '/api/db/metadata',
    '/api/db/comment-reply',
    '/api/db/resource-map',
    '/api/db/resource',
    '/api/db/html'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n测试 ${endpoint}...`);
      const result = await testAPI(endpoint);
      console.log(`状态码: ${result.statusCode}`);
      if (result.data) {
        console.log(`响应: ${JSON.stringify(result.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`错误: ${error.message}`);
    }
  }
}

runTests();