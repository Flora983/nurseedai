export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { module, formData } = req.body || {};

    const prompt = `
Je bent een professionele verpleegkundige in een woonzorgcentrum.

Schrijf een kort, duidelijk en professioneel verpleegkundig verslag in het Nederlands (2-4 zinnen).

Regels:
- schrijf alleen het verslag
- geen titel
- geen opsomming
- correct en natuurlijk Nederlands
- kort en bruikbaar voor in het dossier

Module:
${module || "algemeen"}

Gegevens:
${JSON.stringify(formData || {}, null, 2)}

Schrijf zoals een echte verpleegkundige noteert.
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
