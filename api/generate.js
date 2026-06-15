export default async function handler(req, res) {
  // Tijdens testen/demo: open. Na de pilot eventueel terug naar 'https://nurseedai-app.vercel.app' voor extra beveiliging.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const { formData } = req.body || {};
    const prompt = formData?.prompt;
    if (!prompt) return res.status(400).json({ success: false, error: 'Geen prompt ontvangen.' });
    if (prompt.length > 8000) return res.status(400).json({ success: false, error: 'Notitie te lang.' });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, error: 'API sleutel ontbreekt op de server.' });
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: prompt,
        max_output_tokens: 512,
        store: false
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', response.status, errText);
      return res.status(response.status).json({
        success: false,
        error: `API fout (${response.status}): ${errText.substring(0, 200)}`
      });
    }
    const data = await response.json();
    // OpenAI Responses API: output is in data.output array
    let text = '';
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === 'message' && Array.isArray(item.content)) {
          for (const block of item.content) {
            if (block.type === 'output_text') text += block.text;
          }
        }
      }
    }
    if (!text.trim()) {
      return res.status(500).json({ success: false, error: 'Geen tekst ontvangen van de AI.' });
    }
    return res.status(200).json({ success: true, output: text.trim() });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Onverwachte serverfout.' });
  }
}
