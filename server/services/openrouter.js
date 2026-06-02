import axios from "axios";

export async function reviewCode(
  code,
  language
) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model:
          "openai/gpt-3.5-turbo",

        messages: [
          {
            role: "system",
            content:
              "You are an expert code reviewer.",
          },

          {
            role: "user",
            content: `
Review this ${language} code.

Provide:
1. Summary
2. Bugs
3. Optimizations
4. Best practices
5. Improved code

Code:
${code}
`,
          },
        ],
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "OpenRouter Error:",
      error.response?.data || error.message
    );

    throw error;
  }
}