
const { Worker } = require("worker_threads");
const path = require("path");
const { randomUUID } = require("crypto");

// Store all jobs in memory
const jobs = new Map();

// Schedule lock
let scheduleLocked = false;
let activeJobId = null;

// Submit a new scheduling job
const submitJob = () => {

    // Prevent two jobs from running together
    if (scheduleLocked) {
        throw new Error("Generation in progress");
    }

    const jobId = randomUUID();

    const job = {
        jobId,
        status: "Queued",
        startedAt: null,
        completedAt: null,
        result: null,
        error: null
    };

    jobs.set(jobId, job);

    scheduleLocked = true;
    activeJobId = jobId;

    let worker;

    try {
        worker = new Worker(
            path.resolve(__dirname, "../workers/scheduleWorker.js")
        );

        job.worker = worker;

    } catch (error) {
        job.status = "Failed";
        job.error = error.message;
        job.completedAt = new Date();

        scheduleLocked = false;
        activeJobId = null;

        return { ...job };
    }

    job.status = "Running";
    job.startedAt = new Date();

    let finished = false;

    // Finish job and release schedule lock
    const finishJob = (status, details = {}) => {

        if (finished) return;

        finished = true;

        clearTimeout(timeout);

        job.status = status;
        job.completedAt = new Date();

        if (details.result) {
            job.result = details.result;
        }

        if (details.error) {
            job.error = details.error;
        }

        if (activeJobId === jobId) {
            scheduleLocked = false;
            activeJobId = null;
        }
    };

    // Stop job after 30 seconds
    const timeout = setTimeout(() => {

        if (finished || job.status === "Cancelled") return;

        finishJob("Timed out", {
            error: "Schedule generation exceeded 30 seconds"
        });

        worker.terminate();

    }, 30000);

    // Receive result from worker
    worker.on("message", (message) => {

        if (finished || job.status === "Cancelled") return;

        if (message.success) {

            finishJob("Done", {
                result: message.result
            });

        } else {

            finishJob("Failed", {
                error: message.error
            });

        }
    });

    // Handle worker errors
    worker.on("error", (error) => {

        if (finished || job.status === "Cancelled") return;

        finishJob("Failed", {
            error: error.message
        });
    });

    // Handle unexpected worker exit
    worker.on("exit", (code) => {

        if (!finished && job.status !== "Cancelled") {

            finishJob("Failed", {
                error: `Worker stopped with exit code ${code}`
            });

        }
    });

    return { ...job };
};

// Get job status
const getStatus = (jobId) => {

    const job = jobs.get(jobId);

    if (!job) return null;

    return { ...job };
};

// Cancel a running job
const cancelJob = async (jobId) => {

    const job = jobs.get(jobId);

    if (!job) return null;

    if (job.status !== "Running") {
        return { ...job };
    }

    const worker = job.worker;

    if (worker) {

        // Mark job as cancelled before terminating worker
        job.status = "Cancelled";
        job.completedAt = new Date();
        job.error = "Job cancelled by user";

        if (activeJobId === jobId) {
            scheduleLocked = false;
            activeJobId = null;
        }

        await worker.terminate();
    }

    return { ...job };
};

module.exports = {
    submitJob,
    getStatus,
    cancelJob
};
