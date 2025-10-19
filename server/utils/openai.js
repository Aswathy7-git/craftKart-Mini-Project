const OpenAI = require('openai');

// Centralized OpenAI client
// Requires OPENAI_API_KEY in environment (.env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = openai;
