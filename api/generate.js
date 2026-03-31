export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { module, formData } = req.body || {};
let moduleInstruction = "";

if (module === "korte") {
  moduleInstruction = "Schrijf zeer kort (1-2 zinnen), simpel en direct.";
} else if (module === "overdracht") {
  moduleInstruction = "Schrijf gestructureerd en duidelijk voor overdracht tussen shifts.";
} else if (module === "incident") {
  moduleInstruction = "Schrijf strikt objectief, feitelijk en zonder interpretatie.";
} else if (module === "wondzorg") {
  moduleInstruction = "Gebruik medische terminologie en beschrijf observaties van de wond correct.";
} else {
  moduleInstruction = "Algemeen verpleegkundig verslag.";
}
    const prompt = `
Je bent een ervaren verpleegkundige in een Belgisch woonzorgcentrum.

Schrijf een kort, professioneel en correct verpleegkundig verslag in het Nederlands.

BELANGRIJKE REGELS:
- Gebruik duidelijke en professionele zorgtaal
- Schrijf objectief
- Vermijd tegenstrijdigheden
- Geen opsomming
- Geen titel
- Alleen het verslag
- 2 tot 4 korte zinnen
Module instructie:
${moduleInstruction}
STRUCTUUR:
- Start met de toestand van de bewoner
- Vermeld daarna de relevante observaties
- Vermeld daarna de uitgevoerde actie of opvolging indien van toepassing

Module:
${module || "algemeen"}

Gegevens:
${JSON.stringify(formData || {}, null, 2)}

Schrijf zoals in een echt zorgdossier in een woonzorgcentrum.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: prompt
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Fout bij OpenAI API"
      });
    }

    let text = "";

    if (typeof data.output_text === "string" && data.output_text.trim()) {
      text = data.output_text.trim();
    }

    if (!text && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (
              contentItem.type === "output_text" &&
              typeof contentItem.text === "string"
            ) {
              text += contentItem.text;
            }
          }
        }
      }

      text = text.trim();
    }

    if (!text) {
      console.error("Geen tekst gevonden in OpenAI response:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Geen output gegenereerd." });
    }

    return res.status(200).json({ output: text });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
