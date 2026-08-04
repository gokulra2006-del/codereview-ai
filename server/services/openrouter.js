// server/services/openrouter.js

const FREE_MODELS = [
  "qwen/qwen3-coder:free",
  "moonshotai/kimi-k2:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-3-27b-it:free",
];

export const reviewCode = async (code, language, preferredModel = null) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  console.log("API Key in openrouter.js:", OPENROUTER_API_KEY ? "Found ✅" : "Still missing ❌");

  let lastError = null;

  const modelsToTry = [...FREE_MODELS];
  if (preferredModel && preferredModel !== "auto") {
    const index = modelsToTry.indexOf(preferredModel);
    if (index > -1) {
      modelsToTry.splice(index, 1);
    }
    modelsToTry.unshift(preferredModel);
  }

  for (const model of modelsToTry) {
    try {
      console.log(`Trying model: ${model}`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Code Review AI",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: `You are an expert code reviewer. Provide a highly concise, accurate, and professional review of the given ${language} code. Respond in markdown with these sections:

## 📋 Code Summary
Briefly explain what the code does in 1-2 sentences.

## 🐛 Bugs & Issues
List critical bugs, edge cases, or security issues concisely.

## ⚡ Performance Improvements
List brief, actionable optimization suggestions.

## ✅ Best Practices
Note any quick style or structural improvements.

## 🚀 Improved Version
Provide the refactored code without overly verbose comments.`,
            },
            {
              role: "user",
              content: `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.warn(`[Model ${model} failed]:`, data.error.message);
        lastError = data.error.message;
        continue;
      }

      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`✅ Review generated using: ${model}`);
        return content;
      }
    } catch (err) {
      console.warn(`[Model ${model} threw]:`, err.message);
      lastError = err.message;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
};