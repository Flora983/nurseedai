export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { module, formData } = req.body || {};

    let prompt = "";

    // ⚡ SNELLE MODULE: KORTE COMMUNICATIE
    if (module === "kort") {
      prompt = `
Schrijf 1 tot 2 korte, professionele verpleegkundige zinnen in het Nederlands.

Regels:
- Zeer kort
- Geen uitleg
- Geen herhaling
- Direct bruikbaar in dossier

Gegevens:
${JSON.stringify(formData || {}, null, 2)}
`;
    }

    // 🩺 DOKTERSBEZOEK (BELANGRIJK!)
    else if (module === "dokter") {
      prompt = `
Je bent een verpleegkundige in een woonzorgcentrum.

Schrijf een duidelijk en professioneel verslag van een doktersbezoek.

Regels:
- Objectief
- Logisch opgebouwd
- 3 tot 5 zinnen
- Vermeld reden, observaties, advies arts en opvolging

Gegevens:
${JSON.stringify(formData || {}, null, 2)}
`;
    }

    // 📋 ANDERE MODULES
    else {
      prompt = `
Je bent een ervaren verpleegkundige in een Belgisch woonzorgcentrum.

Schrijf een kort, professioneel verslag.

Regels:
- 2 tot 4 zinnen
- Objectief
- Geen tegenstrijdigheden
- Geen uitleg

Gegevens:
${JSON.stringify(formData || {}, null, 2)}
`;
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: prompt,
      }),
    });

    const data = await response.json();

    let text = "";

    if (typeof data.output_text === "string") {
      text = data.output_text;
    }

    if (!text && Array.isArray(data.output)) {
      for (const item of data.output) {
        for (const content of item.content || []) {
          if (content.type === "output_text") {
            text += content.text;
          }
        }
      }
    }

    if (!text) {
      return res.status(500).json({ error: "Geen output gegenereerd." });
    }

    return res.status(200).json({ output: text });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}
