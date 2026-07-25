# AtCoder Competitive Programmer — Backend API

A Node.js/Express backend that serves AtCoder competitive programming data (problems, contests, and tags) through a REST API, backed by a local SQLite database.

## Features

- REST API for browsing AtCoder **problems**, **contests**, and **tags**
- Local **SQLite** database (via `better-sqlite3`) seeded from an initialization script
- **Rate limiting** to prevent API abuse
- **In-memory caching** for frequently requested data
- **Pagination** support for large result sets
- Centralized **error handling** and request validation
- Security headers via **Helmet**, and **CORS** support
- Request logging via **Morgan**
- Health check endpoint for monitoring

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (>=18) |
| Framework | Express 5 |
| Database | SQLite (`better-sqlite3`) |
| DB seeding | Python 3 |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Dev tooling | Nodemon |

## Getting Started

### Prerequisites
- Node.js >= 18
- Python 3
- npm

### Installation

\`\`\`bash
git clone https://github.com/AbhinayShankhdhar/At_Coder_Competitive_Programmer.git
cd At_Coder_Competitive_Programmer
npm install
\`\`\`

### Environment Setup

\`\`\`bash
cp .env.example .env
\`\`\`

### Initialize the Database

\`\`\`bash
npm run init:db
\`\`\`

### Run the Server

\`\`\`bash
npm run dev
\`\`\`

## Data Source

Problem and contest data is pulled from the Kenkoooo AtCoder Problems API via `kenkoooo.service.js`, then stored locally in SQLite for fast querying.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run the server |
| `npm run dev` | Run the server with nodemon (auto-restart on changes) |
| `npm run init:db` | Initialize the database |
| `npm run init:db:local` | Initialize the database in local mode |

## License

ISC
