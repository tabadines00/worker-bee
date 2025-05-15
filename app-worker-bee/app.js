const express = require("express")
const redis = require("redis")

// Check redis version for debug
// console.log("Redis version:", require("redis/package.json").version)
// console.log("Type of redis.createClient:", typeof redis.createClient)
// console.log("redis.createClient:", redis.createClient)

const app = express()
app.use(express.json())

async function seedTestFunctions(redisClient) {
    let data = {
        "multiply": JSON.stringify({ method: "GET",
            code:   `let x = parseInt(parameters.x)
                    let y = parseInt(parameters.y)
                    if (isNaN(x) || isNaN(y)) {
                        return "Those aren't numbers..."
                    }
                    return "The numbers " + x + " * " + y + " = " + x*y
        ` }),
        "greet": JSON.stringify({ method: "POST",
            code:   `return "Hello, " + parameters.name
        ` }),
        "sleep": JSON.stringify({ method: "GET",
            code:   `const wait = ms => new Promise(r => setTimeout(r, ms))
                    let ttl = parseInt(parameters.time)
                    await wait(ttl)
                    return "slept for " + ttl + "ms"
        ` }),
      }
      
    await redisClient.mSet(data)
    console.log("Seeded test functions successfully")
}

async function start() {
    try {
        const redisClient = redis.createClient({ url: "redis://redis:6379/0" })

        redisClient.on("error", err => console.error("Redis error:", err))
        await redisClient.connect()

        const sandbox = require("./controllers/sandbox")

        // Seed the Redis DB with test functions for now
        seedTestFunctions(redisClient)
        
        // Testing a homepage
        app.get("/", (req, res) => {
            res.send("Hello from Node!")
        })


        // Run a function with the GET method
        app.get("/run/:funcID", async (req, res) => {
            let funcID = req.params.funcID
            let queryData = req.query

            // Log GET request query parameters
            console.log("/run was hit! checking function ID:", funcID)
            console.log("got request with data:", queryData)

            const funcData = await redisClient.get(funcID)
            const data = JSON.parse(funcData)
            console.log(data)
            console.log(data.method)
            console.log(data.code)

            if (funcData) {
                // Function was found with that ID
                try {
                    if (data.method === "GET") {
                        const result = await sandbox.runUserCode(data.code, queryData)
                        console.log("Sandbox result:", result)

                        res.send(result)
                        res.status(200)

                    } else {
                        res.json({ error: "Function does not use the GET method" })
                        res.status(400)

                    }
                } catch (err) {
                    console.error("Sandbox error:", err.message)
                    res.json({ error: "Sandbox Error: "+err.message })
                    res.status(500)

                }
            } else {
                // Function was not found in DB
                res.json({ error: "No Function found" })
                res.status(404)
            }
        })

        // Run a function with the POST method
        app.post("/run/:funcID", async (req, res) => {
            let funcID = req.params.funcID
            let bodyData = req.body

            console.log("/run was hit! checking function ID:", funcID)

            console.log("got request with data:", bodyData)

            const funcData = await redisClient.get(funcID)
            const data = JSON.parse(funcData)
            console.log(data)

            if (data) {
                try {
                    if (data.method === "POST") {
                        const result = await sandbox.runUserCode(data.code, bodyData)
                        console.log("Sandbox result:", result)
                        
                        res.send(result)
                        res.status(200)
                    } else {
                        res.json({ error: "Function does not use the POST method" })
                        res.status(400)

                    }
                } catch (err) {
                    console.error("Sandbox error:", err.message)
                    res.json({ error: "Sandbox Error: "+err.message })
                    res.status(500)
                }
            } else {
                // Function was not found in DB
                res.json({error: "No Function found" })
                res.status(404)
            }
        })

        // Create or Upsert a new function
        app.put("/functions/:funcID", async (req, res) => {
            const funcID = req.params.funcID;
            const data = req.body;
      
            if (!funcID || !data.code || !data.method || typeof data !== "object") {
                res.json({ error: "Invalid request body or ID" })
                res.status(400)
                return
            }
      
            await redisClient.set(funcID, JSON.stringify(data))
            res.json({ message: "Function saved successfully", funcID })
            res.status(200)
        })

        // Get the current state of a function
        app.get("/functions/:funcID", async (req, res) => {
            const funcID = req.params.funcID;
            const raw = await redisClient.get(funcID);

            if (!raw) {
                res.json({ error: "Function not found" })
                res.status(404)
                return
            }

            res.json(JSON.parse(raw))
            res.status(200)
        })


        app.listen(3000, () => {
            console.log("Server running on port 3000")
        })
    } catch (err) {
        console.error("Startup error:", err)
    }
}

start()