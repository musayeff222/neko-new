
import fetch from 'node-fetch';
async function testData() {
  const res = await fetch('http://localhost:3000/api/data/products');
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2));
}
testData();
