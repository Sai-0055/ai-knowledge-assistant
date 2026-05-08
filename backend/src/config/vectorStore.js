const path = require('path');
const fs = require('fs');

// In-memory vector store for development
// On Day 9 we'll add FAISS for production
class VectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = [];
    this.storePath = path.join(__dirname, '../../data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    // Load existing data if any
    this.load();
  }

  // Add a document with its embedding
  add(text, embedding, metadata = {}) {
    this.documents.push({ text, metadata, id: Date.now() });
    this.embeddings.push(embedding);
    this.save();
    return this.documents.length - 1;
  }

  // Find top-k most similar documents to a query embedding
  search(queryEmbedding, topK = 3) {
    if (this.embeddings.length === 0) return [];

    // Calculate cosine similarity between query and all stored embeddings
    const similarities = this.embeddings.map((emb, idx) => ({
      idx,
      score: this.cosineSimilarity(queryEmbedding, emb)
    }));

    // Sort by similarity score descending
    similarities.sort((a, b) => b.score - a.score);

    // Return top-k results
    return similarities
      .slice(0, topK)
      .filter(s => s.score > 0.3) // minimum similarity threshold
      .map(s => ({
        text: this.documents[s.idx].text,
        metadata: this.documents[s.idx].metadata,
        score: s.score
      }));
  }

  // Cosine similarity — measures angle between two vectors
  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Get total document count
  count() {
    return this.documents.length;
  }

  // Clear all documents
  clear() {
    this.documents = [];
    this.embeddings = [];
    this.save();
  }

  // Save to disk so data persists
  save() {
    try {
      fs.writeFileSync(
        path.join(this.storePath, 'vectorstore.json'),
        JSON.stringify({ documents: this.documents, embeddings: this.embeddings })
      );
    } catch (err) {
      console.error('VectorStore save error:', err.message);
    }
  }

  // Load from disk
  load() {
    try {
      const filePath = path.join(this.storePath, 'vectorstore.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.documents = data.documents || [];
        this.embeddings = data.embeddings || [];
        console.log(`VectorStore loaded: ${this.documents.length} documents`);
      }
    } catch (err) {
      console.error('VectorStore load error:', err.message);
    }
  }
}

// Singleton — one instance shared across the app
const vectorStore = new VectorStore();
module.exports = vectorStore;