
import fetch from 'node-fetch';
async function debug() {
  const res = await fetch('http://localhost:3000/api/debug-env');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
debug();
