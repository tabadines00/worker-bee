"use strict"

const { Worker } = require("node:worker_threads")
const path = require("path")

async function runUserCode(code, parameters) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve(__dirname, "worker.js"), {
            workerData: { code, parameters },
            resourceLimits: {
                maxOldGenerationSizeMb: 50,
            },
        })

        // Listen for a message (structured response)
        worker.once("message", (message) => {
            if (message.error) {
                reject(new Error(message.error))
            } else {
                resolve(message.success)
            }
        })

        worker.once("error", (err) => {
            reject(new Error("Worker thread error: " + err.message))
        })

        worker.once("exit", (code) => {
            if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`))
            }
        })

        // Global timeout
        setTimeout(() => {
            worker.terminate()
            reject(new Error("Worker execution timed out."))
        }, 1500) // 1.5 second timeout
    })
}

module.exports = {
    runUserCode: runUserCode
}