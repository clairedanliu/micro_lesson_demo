export default async function handler(req, res) {

    const { image } = req.body
  
    const apiKey = process.env.GEMINI_API_KEY
  
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Analyze this math problem and return structured JSON." },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: image
                  }
                }
              ]
            }
          ]
        })
      }
    )
  
    const data = await response.json()
  
    res.status(200).json(data)
  }