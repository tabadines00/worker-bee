"use strict"

const { parentPort, workerData } = require("worker_threads")
const vm = require("node:vm")


// Safe allowed modules
const allowedModules = {
	"node:http": require("node:http"),
}

function safeRequire(moduleName) {
	if (allowedModules[moduleName]) {
		return allowedModules[moduleName]
	}
		throw new Error(`Access to module "${moduleName}" is denied.`)
}

// Sandbox context
const sandbox = {
	require: safeRequire,
	console,
	setTimeout,
	setInterval,
	clearTimeout,
	clearInterval,
	parameters: workerData.parameters || {}
}

// Create isolated context
const context = vm.createContext(sandbox)

;(async () => {
	try {
		console.log("0:", workerData.code)
		const resultPromise = await vm.runInContext(`(async () => { ${workerData.code} })()`, context, { timeout: 500 })
		
		const result = await resultPromise

		console.log("1: ",result)
		parentPort.postMessage({ success: result })

	} catch (err) {
		parentPort.postMessage({ error: err.message })
	}
})()
