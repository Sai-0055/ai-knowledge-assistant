const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate embedding for a piece of text using OpenAI
const generateEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.trim(),
  });
  return response.data[0].embedding;
};

// Split a large document into smaller overlapping chunks
// This is important because embeddings work best on small pieces
const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const words = text.split(' ');
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
};

module.exports = { generateEmbedding, chunkText };