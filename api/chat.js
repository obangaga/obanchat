export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_KEY   = process.env.GROQ_KEY;
  const TAVILY_KEY = process.env.TAVILY_KEY;

  if (!GROQ_KEY) return res.status(500).json({ error: 'GROQ_KEY not configured in Vercel ENV' });

  const { messages, query, action } = req.body;

  // ── ACTION: web search ──
  if (action === 'search') {
    if (!TAVILY_KEY) return res.status(200).json({ results: [] });
    try {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 5 })
      });
      const d = await r.json();
      return res.status(200).json({ results: d.results || [] });
    } catch (e) {
      return res.status(200).json({ results: [] });
    }
  }

  // ── ACTION: chat ──
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });
    const d = await r.json();
    return res.status(200).json(d);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

