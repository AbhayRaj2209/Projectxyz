# Saaransh Backend

Simple Node.js + Express backend for Saaransh admin panel connected to Neon PostgreSQL database.

## Setup

```bash
npm install
npm start
```

## Endpoints

- `GET /health` - Health check
- `GET /api/recent-activity` - Get recent comments from all bills
- `GET /api/comments/:bill` - Get comments for specific bill (bill_1, bill_2, bill_3)
- `POST /api/comments/:bill` - Add new comment to a bill

## Database

Connected to Neon PostgreSQL via DATABASE_URL in .env
Tables: bill_1_comments, bill_2_comments, bill_3_comments, documents
