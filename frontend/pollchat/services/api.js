
const API_URL = 'http://localhost:5000';

export async function getHelloMessage() {
  const response = await fetch(`${API_URL}/api/hello`);
  const data = await response.json();
  return data.message;
}
