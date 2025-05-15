# worker-bee
A self-hosted FaaS platform for local or remote deployment. Inspired by AWS Lambda or Cloudflare Workers, and built with Node.js, Redis, and Docker.

## Features

* Create and deploy JavaScript functions
* Execute functions via `GET` or `POST` HTTP requests
* Function sandboxing using Node's native `vm` module
* Function metadata and code stored in Redis
* Basic UI for function creation and testing
* Dockerized for easy local or remote deployment

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/tabadines00/worker-bee.git
cd worker-bee
```

### 2. Create Docker Network

Before launching, make the Docker network:

```bash
./makeNetwork.sh
```

### 3. Start the Services

Use Docker Compose to spin up the app and optional nginx server:

```bash
cd app-worker-bee
docker-compose up --build
cd ..
cd nginx
docker-compose up
```

---

## Web Interface

* **Homepage (Function Creator UI)**
  `GET /`
  A basic UI to create and save new worker functions.

* **Playground (API Tester)**
  `GET /playground`
  A Postman-style testing interface for running your saved functions via `GET` or `POST`.

---

## API Endpoints

### Create/Update a Function

`PUT /functions/:funcID`

**Request Body:**

```json
{
  "method": "GET" \| "POST",
  "code": "return parameters.your_input"
}
```

Saves or updates a JavaScript function under the provided `funcID`. Parameters are accessed with the `parameters` object, and `return` returns your data to the function caller.

---

### Invoking Functions

#### `GET /run/:funcID`

Run a `GET`-based function with query parameters.

#### `POST /run/:funcID`

Run a `POST`-based function with JSON body data.

> The correct HTTP method must match the one defined in the function’s metadata.

---

### Get Function Code

`GET /functions/:funcID`

Returns the full JSON definition (method + code) of a saved function.

---

## Example

Save a function:

```bash
curl -X PUT http://localhost/functions/helloWorld \
  -H "Content-Type: application/json" \
  -d '{"method": "POST", "code": "return `Hello ${parameters.name}`; }"}'
```

Run it:

```bash
curl -X POST http://localhost/run/helloWorld \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice"}'
```

Response:

```json
{ "response": "Hello Alice" }
```

I hope you find this project useful!
Thanks, Thomas
