const documentService = require('../services/documentService');
const { documentQueue } = require('../config/queue');
const jobTracker = require('../config/jobTracker');
const path = require('path');

// Upload document — returns immediately, processes in background
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { path: filePath, originalname, mimetype } = req.file;

    if (!['application/pdf', 'text/plain'].includes(mimetype)) {
      return res.status(400).json({
        error: 'Only PDF and text files are supported'
      });
    }

    // Add job to queue — this is instant
    const job = await documentQueue.add({
      filePath,
      fileName: originalname,
      fileType: mimetype,
    });

    // Track the job
    jobTracker.addJob(job.id, originalname);

    // Update job status as it progresses
    job.progress().then(() => {
      jobTracker.updateJob(job.id, { status: 'processing' });
    }).catch(() => {});

    // Listen for completion
    documentQueue.on('completed', (completedJob, result) => {
      if (completedJob.id === job.id) {
        jobTracker.updateJob(job.id, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
          result
        });
      }
    });

    documentQueue.on('failed', (failedJob, err) => {
      if (failedJob.id === job.id) {
        jobTracker.updateJob(job.id, {
          status: 'failed',
          error: err.message
        });
      }
    });

    // Return immediately with job ID
    res.json({
      message: 'Document queued for processing!',
      jobId: job.id,
      fileName: originalname,
      status: 'queued'
    });

  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get job status
const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const trackedJob = jobTracker.getJob(jobId);

    if (!trackedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Also check Bull queue for progress
    const bullJob = await documentQueue.getJob(jobId);
    if (bullJob) {
      const progress = await bullJob.progress();
      jobTracker.updateJob(jobId, { progress });
    }

    res.json(jobTracker.getJob(jobId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all jobs
const getAllJobs = (req, res) => {
  res.json({ jobs: jobTracker.getAllJobs() });
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

// Search documents with ranking
const searchDocuments = async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await documentService.searchDocuments(query, topK);

    const rankedResults = results.map((result, index) => ({
      rank: index + 1,
      text: result.text,
      fileName: result.metadata.fileName,
      chunkIndex: result.metadata.chunkIndex,
      totalChunks: result.metadata.totalChunks,
      score: Math.round(result.score * 100),
      preview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : '')
    }));

    res.json({
      query,
      totalFound: rankedResults.length,
      results: rankedResults
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// List all unique documents
const listDocuments = (req, res) => {
  try {
    const docs = documentService.listDocuments();
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getStats,
  clearDocuments,
  searchDocuments,
  listDocuments,
  getJobStatus,
  getAllJobs
};