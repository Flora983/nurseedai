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
Je bent een ervaren verpleegkundige in een Belgisch woonzorgcentrum.

Schrijf een kort, duidelijk en professioneel verpleegkundig verslag van een doktersbezoek of telefonisch overleg.

BELANGRIJKE REGELS:
- Schrijf objectief en praktisch
- Gebruik eenvoudige, professionele zorgtaal
- Schrijf 2 tot 4 zinnen
- Vermeld alleen wat effectief gebeurd is of beslist werd
- Schrijf NOOIT dat iets "niet ingevuld", "niet genoteerd" of "ontbreekt"
- Vermijd aannames
- Geen uitleg, geen titel, alleen het verslag

ALS ER WEINIG INFO IS:
- schrijf toch een bruikbaar, neutraal kort verslag
- focus op reden van contact en eventuele opvolging

Gegevens:
${JSON.stringify(formData || {}, null, 2)}

Schrijf zoals in een echt zorgdossier.
`;
}

    // 📋 ANDERE MODULES
    
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

    
let data;
try {
  data = await response.json();
} catch (e) {
  const text = await response.text();
  throw new Error("Server fout: " + text);
}
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
