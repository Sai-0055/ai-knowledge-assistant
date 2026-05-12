// Simple in-memory job status tracker
// In production you'd use Redis or a database for this
const jobs = new Map();

const addJob = (jobId, fileName) => {
  jobs.set(jobId, {
    jobId,
    fileName,
    status: 'queued',
    progress: 0,
    createdAt: new Date().toISOString(),
    completedAt: null,
    result: null,
    error: null
  });
};

const updateJob = (jobId, updates) => {
  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, { ...job, ...updates });
  }
};

const getJob = (jobId) => {
  return jobs.get(jobId) || null;
};

const getAllJobs = () => {
  return Array.from(jobs.values()).reverse();
};

module.exports = { addJob, updateJob, getJob, getAllJobs };