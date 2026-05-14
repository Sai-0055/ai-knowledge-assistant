require('dotenv').config();
const OpenAI = require('openai');
const { createBreaker } = require('./circuitBreakerService');
const { withRetry } = require('./retryService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant. Give clear, concise answers. Be honest when you don't know something.`;

const RAG_SYSTEM_PROMPT = `You are an AI assistant with access to uploaded documents. Use the provided context to answer questions accurately. If context is relevant, use it. If not, say so and answer from general knowledge.`;

const openAIBreaker = createBreaker(
  'openai-chat',
  async (messages) => {
    return await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });
  },
  {
    timeout: 15000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 3,
  }
);

openAIBreaker.fallback(() => ({
  choices: [{
    message: {
      content: 'I am temporarily unavailable. Please try again in 30 seconds.'
    }
  }]
}));

const getReply = async (userMessage) => {
  return await withRetry(async () => {
    const result = await openAIBreaker.fire([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ]);
    return result.choices[0].message.content;
  }, { maxRetries: 2, baseDelay: 1000 });
};

const getStreamingReply = async (userMessage, onChunk, onDone, onError) => {
  try {
    const stream = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 400,
        temperature: 0.7,
        stream: true,
      });
    }, { maxRetries: 2, baseDelay: 1000 });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) onChunk(text);
    }
    onDone();
  } catch (error) {
    console.error('Streaming error:', error.message);
    onError(error);
  }
};

const getRAGStreamingReply = async (userMessage, context, onChunk, onDone, onError) => {
  try {
    const contextText = context
      .map((doc, i) => `[Chunk ${i + 1} from "${doc.metadata.fileName}"]:\n${doc.text}`)
      .join('\n\n');

    const userMessageWithContext = `Context from uploaded documents:\n\n${contextText}\n\n---\n\nQuestion: ${userMessage}\n\nAnswer using the context above when relevant.`;

    const stream = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: RAG_SYSTEM_PROMPT },
          { role: 'user', content: userMessageWithContext }
        ],
        max_tokens: 600,
        temperature: 0.7,
        stream: true,
      });
    }, { maxRetries: 2, baseDelay: 1000 });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) onChunk(text);
    }
    onDone();
  } catch (error) {
    console.error('RAG streaming error:', error.message);
    onError(error);
  }
};

module.exports = { getReply, getStreamingReply, getRAGStreamingReply };