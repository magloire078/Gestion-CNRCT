
async function test() {
  try {
    const res = await fetch('http://localhost:9002/api/employees/directory');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data length:', data.length);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}
test();
