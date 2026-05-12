const { documentQueue } = require('../config/queue');
const documentService = require('../services/documentService');
const fs = require('fs');

// This function runs in the background for every job in the queue
documentQueue.process(async (job) => {
  const { filePath, fileName, fileType, jobId } = job.data;

  console.log(`Processing document in background: ${fileName}`);

  // Update job progress
  await job.progress(10);

  // Check file still exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  await job.progress(30);

  // Process the document
  const result = await documentService.processDocument(
    filePath,
    fileName,
    fileType
  );

  await job.progress(100);

  return {
    success: true,
    fileName,
    chunksProcessed: result.chunksProcessed,
    totalDocuments: result.totalDocuments
  };
});

console.log('📋 Document worker started — waiting for jobs...');

module.exports = documentQueue;