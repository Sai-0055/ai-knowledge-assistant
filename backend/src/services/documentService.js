const fs = require('fs');
const path = require('path');
const { generateEmbedding, chunkText } = require('./embeddingService');
const vectorStore = require('../config/vectorStore');

// Extract text from file
const extractText = async (filePath, fileType) => {
  if (fileType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf8');
  }

  if (fileType === 'application/pdf') {
    try {
      // Try pdf-parse
      const pdfParse = require('pdf-parse');
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } catch (err) {
      console.error('PDF parse error:', err.message);
      throw new Error('Could not parse PDF. Please try uploading a .txt file instead.');
    }
  }

  throw new Error('Unsupported file type');
};

// Process an uploaded file
const processDocument = async (filePath, fileName, fileType) => {
  try {
    console.log(`Processing document: ${fileName}`);

    // Extract text
    const text = await extractText(filePath, fileType);

    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from document');
    }

    console.log(`Extracted ${text.length} characters from ${fileName}`);

    // Split into chunks
    const chunks = chunkText(text, 500, 50);
    console.log(`Split into ${chunks.length} chunks`);

    // Generate embeddings and store
    let storedCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      vectorStore.add(chunk, embedding, {
        fileName,
        chunkIndex: i,
        totalChunks: chunks.length
      });
      storedCount++;
      console.log(`Stored chunk ${i + 1}/${chunks.length}`);
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true,
      fileName,
      chunksProcessed: storedCount,
      totalDocuments: vectorStore.count()
    };
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Search for relevant document chunks
const searchDocuments = async (query, topK = 3) => {
  const queryEmbedding = await generateEmbedding(query);
  return vectorStore.search(queryEmbedding, topK);
};

// Get stats about stored documents
const getDocumentStats = () => {
  return {
    totalChunks: vectorStore.count(),
    message: vectorStore.count() === 0
      ? 'No documents uploaded yet'
      : `${vectorStore.count()} chunks indexed and ready for search`
  };
};

// Clear all documents
const clearDocuments = () => {
  vectorStore.clear();
  return { success: true, message: 'All documents cleared' };
};

module.exports = {
  processDocument,
  searchDocuments,
  getDocumentStats,
  clearDocuments
};