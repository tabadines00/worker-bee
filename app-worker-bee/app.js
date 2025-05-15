const express = require('express');
const redis = require('redis');

console.log("Redis version:", require('redis/package.json').version);
console.log("Type of redis.createClient:", typeof redis.createClient);
console.log("redis.createClient:", redis.createClient);

const app = express();

async function start() {
    try {

        const redisClient = redis.createClient({ url: 'redis://redis:6379/0' });

        redisClient.on('error', err => console.error('Redis error:', err));
        await redisClient.connect();

        const sandbox = require('./controllers/sandbox')

        app.get('/', (req, res) => {
            res.send('Hello from Node!')
        })

        app.get('/visit', async (req, res) => {
            console.log("/visit was hit!")
            const key = "cached_data";
            console.log("got request");

            const cachedData = await redisClient.get(key);

            if (cachedData) {
                // Data found in cache, return it
                res.json({ source: "cache", data: JSON.parse(cachedData) });
            } else {
                const data = { message: "Hello, Redis!" };

                // Store data in cache for next request
                await redisClient.set(key, 60, JSON.stringify(data));

                res.json({ source: "database", data });
            }
        });

        app.get('/api', async (req, res) => {
            try {
                const result = await sandbox.runUserCode(`const wait = ms => new Promise(r => setTimeout(r, ms));
        await wait(1000);
        return 'slept';`)
                console.log('Sandbox result:', result)
                res.send(result)
                res.status(200)
            } catch (err) {
                console.error('Sandbox error:', err.message)
                res.send("error 500")
                res.status(500)
            }
        })

        app.listen(3000, () => {
            console.log('Server running on port 3000')
        })
    } catch (err) {
        console.error('Startup error:', err);
    }
}

start();


// const express = require('express')
// const app = express()

// const redis = require('redis')
// console.log("Type of redis.createClient:", typeof redis.createClient);
// console.log("redis.createClient:", redis.createClient);


// const redisClient = redis.createClient({
//     url: "redis://redis:6379/0"
// //   host: 'redis',
// //   port: 6379
// })

// (async () => {
//     redisClient.on("error", (err) => console.log("Redis Client Error", err))
//     await redisClient.connect()
// })()

// const sandbox = require('./controllers/sandbox')

// app.get('/', (req, res) => {
//     res.send('Hello from Node!')
// })

// app.get('/visit', function(req, res) {
//     redisClient.get('numVisits', function(err, numVisits) {
//         numVisitsToDisplay = parseInt(numVisits) + 1;
//         if (isNaN(numVisitsToDisplay)) {
//             numVisitsToDisplay = 1;
//         }
//         res.send('Number of visits is: ' + numVisitsToDisplay);
//         numVisits++;
//         redisClient.set('numVisits', numVisits);
//     });
// });

// app.get('/api', async (req, res) => {
//     try {
//         const result = await sandbox.runUserCode(`const wait = ms => new Promise(r => setTimeout(r, ms));
// await wait(1000);
// return 'slept';`)
//         console.log('Sandbox result:', result)
//         res.send(result)
//         res.status(200)
//     } catch (err) {
//         console.error('Sandbox error:', err.message)
//         res.send("error 500")
//         res.status(500)
//     }
// })

// app.listen(3000, () => {
//     console.log('Server running on port 3000')
// })