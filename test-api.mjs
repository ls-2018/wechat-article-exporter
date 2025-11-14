import axios from 'axios';

async function testInfoAPI() {
  try {
    // 测试 POST 请求
    const postData = {
      fakeid: "test123",
      completed: true,
      count: 5,
      articles: [1,2,3,4,5],
      nickname: "测试公众号",
      round_head_img: "https://example.com/avatar.jpg",
      total_count: 10
    };
    
    console.log('发送 POST 请求，数据:', JSON.stringify(postData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/db/info', postData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('POST 响应:', response.data);
    
    // 测试 GET 请求
    const getResponse = await axios.get('http://localhost:3000/api/db/info/all');
    console.log('GET 响应:', getResponse.data);
    
  } catch (error) {
    console.error('API 测试失败:', error.response?.data || error.message);
  }
}

testInfoAPI();