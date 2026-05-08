const documentService = require('../services/documentService');

// Upload and process a document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { path: filePath, originalname, mimetype } = req.file;

    // Only allow PDF and text files
    if (!['application/pdf', 'text/plain'].includes(mimetype)) {
      return res.status(400).json({
        error: 'Only PDF and text files are supported'
      });
    }

    console.log(`Received file: ${originalname} (${mimetype})`);

    const result = await documentService.processDocument(
      filePath,
      originalname,
      mimetype
    );

    res.json({
      message: `Document processed successfully!`,
      ...result
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get document stats
const getStats = (req, res) => {
  const stats = documentService.getDocumentStats();
  res.json(stats);
};

// Clear all documents
const clearDocuments = (req, res) => {
  const result = documentService.clearDocuments();
  res.json(result);
};

// Search documents
const searchDocuments = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await documentService.searchDocuments(query);

    res.json({
      query,
      results,
      totalFound: results.length
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadDocument, getStats, clearDocuments, searchDocuments };