
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const mongoose = require("mongoose");
const { parentPort } = require("worker_threads");

const { generateSchedule } = require("../services/autoScheduleService");

(async () => {
    try {
        // Connect worker to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

// Temporary delay for testing the OS concurrency lock
const testDelay = Number(process.env.OS_TEST_DELAY_MS || 0);

if (testDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, testDelay));
}

const result = await generateSchedule();

        // Send success result to main backend
        parentPort.postMessage({
            success: true,
            result: result
        });

    } catch (error) {
        // Send error to main backend
        parentPort.postMessage({
            success: false,
            error: error.message
        });

    } finally {
        // Close worker's database connection
        await mongoose.disconnect().catch(() => {});
    }
})();
