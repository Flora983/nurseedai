export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { module, formData } = req.body;

    const prompt = `
Je bent een professionele verpleegkundige in een woonzorgcentrum.

Schrijf een kort, duidelijk en professioneel verpleegkundig verslag in het Nederlands (2-4 zinnen).

Gegevens:
${JSON.stringify(formData, null, 2)}

Schrijf zoals een echte verpleegkundige noteert.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: prompt,
      }),
    });

    const data = await response.json();

    // 🔥 FIX: betere output parsing
    let text = "";

    if (data.output && data.output[0] && data.output[0].content) {
      const content = data.output[0].content;
      for (let item of content) {
        if (item.type === "output_text") {
          text += item.text;
        }
      }
    }

    if (!text) {
      text = "Geen output gegenereerd.";
    }

    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
