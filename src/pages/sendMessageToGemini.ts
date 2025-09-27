export async function sendMessageToGemini(message: string) {
    const response = await fetch("http://localhost:3001/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
  
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error ${response.status}: ${text}`);
    }
  
    const data = await response.json();
    return data.reply;
  }