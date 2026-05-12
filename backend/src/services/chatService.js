require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI Knowledge Assistant.
You are smart, friendly, and give clear concise answers.
When you don't know something, say so honestly.
Keep responses focused and easy to read.`;

const RAG_SYSTEM_PROMPT = `You are a helpful AI Knowledge Assistant with access to uploaded documents.
When answering questions, use the provided document context to give accurate answers.
If the context contains relevant information, use it in your answer.
If the context doesn't contain relevant information, say so and answer from your general knowledge.
Always be clear about whether your answer comes from the uploaded documents or general knowledge.`;

// Regular streaming response — no documents
const getStreamingReply = async (userMessage, onChunk, onDone, onError) => {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) onChunk(text);
    }
    onDone();
  } catch (error) {
    onError(error);
  }
};

// RAG streaming response — uses document context
const getRAGStreamingReply = async (userMessage, context, onChunk, onDone, onError) => {
  try {
    // Build context string from retrieved document chunks
    const contextText = context
      .map((doc, i) => `[Document chunk ${i + 1} from "${doc.metadata.fileName}"]:\n${doc.text}`)
      .join('\n\n');

    const userMessageWithContext = `Here is relevant context from uploaded documents:

${contextText}

---

User question: ${userMessage}

Please answer the question using the document context above when relevant.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: RAG_SYSTEM_PROMPT },
        { role: 'user', content: userMessageWithContext }
      ],
      max_tokens: 800,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) onChunk(text);
    }
    onDone();
  } catch (error) {
    onError(error);
  }
};

// Regular non-streaming reply
const getReply = async (userMessage) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
};

module.exports = { getReply, getStreamingReply, getRAGStreamingReply };