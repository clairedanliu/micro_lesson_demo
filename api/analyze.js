export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    try {
      const { image, mimeType } = req.body || {};
  
      if (!image) {
        return res.status(400).json({ error: "Missing image" });
      }
  
      const apiKey = process.env.GEMINI_API_KEY;
  
      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      }
  
      const promptText = `
  You are an expert Math Tutor.
  
  Analyze the math problem in the provided image.
  
  You must do these things:
  1. Extract the full problem text from the image.
  2. Solve it step by step.
  3. If there are multiple-choice options, preserve them.
  4. Generate a 3-level interactive micro-lesson.
  
  Very important rules:
  - Return ONLY valid JSON.
  - Do not add markdown fences.
  - interaction_type must always be "multiple_choice".
  - Keep the content concise and mobile-friendly.
  - Make sure the math is correct.
  
  Return this exact JSON structure:
  {
    "problemContext": {
      "title": "Topic",
      "question_text": "Full extracted question text",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "Correct answer",
      "explanation_steps": [
        { "title": "Step 1", "content": "..." },
        { "title": "Step 2", "content": "..." }
      ]
    },
    "teachingModeLesson": {
      "lesson_id": "lvl1",
      "mode": "TEACHING",
      "scaffolding_level": 1,
      "problem_context": "Short summary",
      "steps": [
        {
          "step_id": 1,
          "goal": "Understand concept",
          "interaction_type": "multiple_choice",
          "question_display": { "text": "Question text" },
          "interaction_data": {
            "options": ["Option 1", "Option 2"],
            "correct_index": 0
          },
          "feedback_card": {
            "correct_message": "Correct!",
            "explanation": "Why correct",
            "wrong_explanation": "Try again"
          }
        }
      ],
      "outcome_card": {
        "visual_badge": { "title": "Skill Unlocked", "icon_concept": "puzzle-piece" },
        "memory_hook": { "core_formula": "Formula", "one_liner": "Takeaway" },
        "actions": {
          "primary_button": { "label": "Back to Solution" },
          "secondary_button": { "label": "Practice One More" }
        }
      }
    },
    "practiceModeLesson": {
      "lesson_id": "lvl2",
      "mode": "PRACTICE",
      "scaffolding_level": 2,
      "problem_context": "A new variant problem",
      "steps": [
        {
          "step_id": 1,
          "goal": "Practice setup",
          "interaction_type": "multiple_choice",
          "question_display": { "text": "Question text" },
          "interaction_data": {
            "options": ["Option 1", "Option 2"],
            "correct_index": 0
          },
          "feedback_card": {
            "correct_message": "Correct!",
            "explanation": "Why correct",
            "wrong_explanation": "Try again"
          }
        }
      ],
      "outcome_card": {
        "visual_badge": { "title": "Level 2 Complete", "icon_concept": "star" },
        "memory_hook": { "core_formula": "Formula", "one_liner": "Takeaway" },
        "actions": {
          "primary_button": { "label": "Finish" },
          "secondary_button": { "label": "Mastery Challenge" }
        }
      }
    },
    "masteryModeLesson": {
      "lesson_id": "lvl3",
      "mode": "MASTERY",
      "scaffolding_level": 3,
      "problem_context": "Another new variant problem",
      "steps": [
        {
          "step_id": 1,
          "goal": "Mastery check",
          "interaction_type": "multiple_choice",
          "question_display": { "text": "Question text" },
          "interaction_data": {
            "options": ["Option 1", "Option 2"],
            "correct_index": 0
          },
          "feedback_card": {
            "correct_message": "Correct!",
            "explanation": "Why correct",
            "wrong_explanation": "Try again"
          }
        }
      ],
      "outcome_card": {
        "visual_badge": { "title": "Mastery Unlocked", "icon_concept": "trophy" },
        "memory_hook": { "core_formula": "Formula", "one_liner": "Takeaway" },
        "actions": {
          "primary_button": { "label": "Done" },
          "secondary_button": { "label": "Practice Again" }
        }
      }
    }
  }
  `;
  
      const geminiResponse = await fetch(
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
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType: mimeType || "image/jpeg",
                      data: image
                    }
                  }
                ]
              }
            ]
          })
        }
      );
  
      const geminiData = await geminiResponse.json();
  
      if (!geminiResponse.ok) {
        return res.status(geminiResponse.status).json({
          error: geminiData?.error?.message || "Gemini request failed"
        });
      }
  
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  
      if (!text) {
        return res.status(500).json({ error: "Gemini returned empty content" });
      }
  
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
          return res.status(500).json({
            error: "Model did not return valid JSON",
            raw: text
          });
        }
        parsed = JSON.parse(match[0]);
      }
  
      return res.status(200).json(parsed);
    } catch (err) {
      return res.status(500).json({
        error: err.message || "Unknown server error"
      });
    }
  }