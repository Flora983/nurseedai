export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { formData } = req.body || {};
    const prompt = formData?.prompt;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Geen prompt ontvangen.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API sleutel ontbreekt op de server.' });
    }

    // Roep Anthropic API aan
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    // Controleer of de API-aanroep gelukt is
    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(response.status).json({
        success: false,
        error: `API fout (${response.status}): ${errText.substring(0, 200)}`
      });
    }

    const data = await response.json();

    // Haal de tekst op uit de response
    let text = '';
    if (data?.content && Array.isArray(data.content)) {
      text = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');
    }

    if (!text || !text.trim()) {
      return res.status(500).json({
        success: false,
        error: 'Geen tekst ontvangen van de AI.'
      });
    }

    return res.status(200).json({
      success: true,
      output: text.trim()
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Onverwachte serverfout.'
    });
  }
}
