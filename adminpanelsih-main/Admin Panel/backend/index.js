const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get recent activity from all bills
app.get('/api/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const query = `
      SELECT 'bill_1' as bill, comments_id as id, commenter_name, comment_data, sentiment, stakeholder_type, created_at 
      FROM bill_1_comments
      UNION ALL
      SELECT 'bill_2' as bill, comments_id, commenter_name, comment_data, sentiment, stakeholder_type, created_at 
      FROM bill_2_comments
      UNION ALL
      SELECT 'bill_3' as bill, comments_id, commenter_name, comment_data, sentiment, stakeholder_type, created_at 
      FROM bill_3_comments
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get comments for specific bill
app.get('/api/comments/:bill', async (req, res) => {
  try {
    const { bill } = req.params;
    const limit = parseInt(req.query.limit) || 1000; // Increased default limit to fetch all comments

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    const result = await pool.query(
      `SELECT * FROM ${bill}_comments ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Add new comment
app.post('/api/comments/:bill', async (req, res) => {
  try {
    const { bill } = req.params;
    const { commenter_name, comment_data, sentiment, stakeholder_type } = req.body;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    if (!commenter_name || !comment_data) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO ${bill}_comments (commenter_name, comment_data, sentiment, stakeholder_type) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [commenter_name, comment_data, sentiment || 'Neutral', stakeholder_type || 'Individual']
    );

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get sentiment summary for a bill
app.get('/api/sentiment/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    const result = await pool.query(
      `SELECT sentiment, COUNT(*) as count FROM ${bill}_comments GROUP BY sentiment ORDER BY count DESC`
    );

    res.json({ ok: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching sentiment:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get sentiment summaries from documents table for a specific bill
app.get('/api/summaries/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    // Map bill_1 -> document_id 1, bill_2 -> 2, bill_3 -> 3
    const documentId = parseInt(bill.split('_')[1]);

    // Query the documents table using document_id
    const result = await pool.query(
      `SELECT summary, positive_summary, negative_summary 
       FROM documents 
       WHERE document_id = $1 
       LIMIT 1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        data: {
          overall_summary: null,
          positive_summary: null,
          negative_summary: null
        }
      });
    }

    const row = result.rows[0];
    
    res.json({ 
      ok: true, 
      data: {
        overall_summary: row.summary || null,
        positive_summary: row.positive_summary || null,
        negative_summary: row.negative_summary || null
      }
    });
  } catch (err) {
    console.error('Error fetching summaries:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get section-wise summaries from documents table for a specific bill
app.get('/api/sections/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    // Map bill_1 -> document_id 1, bill_2 -> 2, bill_3 -> 3
    const documentId = parseInt(bill.split('_')[1]);

    // Query the documents table for section summaries
    const result = await pool.query(
      `SELECT section_1_summary, section_2_summary, section_3_summary 
       FROM documents 
       WHERE document_id = $1 
       LIMIT 1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        data: {
          section_1: null,
          section_2: null,
          section_3: null
        }
      });
    }

    const row = result.rows[0];
    
    res.json({ 
      ok: true, 
      data: {
        section_1: row.section_1_summary || null,
        section_2: row.section_2_summary || null,
        section_3: row.section_3_summary || null
      }
    });
  } catch (err) {
    console.error('Error fetching section summaries:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get section-wise sentiment summaries (positive/negative) from documents table for a specific bill
app.get('/api/section-sentiments/:bill', async (req, res) => {
  try {
    const { bill } = req.params;

    if (!['bill_1', 'bill_2', 'bill_3'].includes(bill)) {
      return res.status(400).json({ ok: false, error: 'Invalid bill name' });
    }

    // Map bill_1 -> document_id 1, bill_2 -> 2, bill_3 -> 3
    const documentId = parseInt(bill.split('_')[1]);

    // Query the documents table for positive and negative summaries
    const result = await pool.query(
      `SELECT positive_summary, negative_summary 
       FROM documents 
       WHERE document_id = $1 
       LIMIT 1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        ok: true, 
        data: {
          positive_summary: null,
          negative_summary: null
        }
      });
    }

    const row = result.rows[0];
    
    res.json({ 
      ok: true, 
      data: {
        positive_summary: row.positive_summary || null,
        negative_summary: row.negative_summary || null
      }
    });
  } catch (err) {
    console.error('Error fetching section sentiment summaries:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get consultations metadata (titles, description, dates, status) + submissions count
app.get('/api/consultations', async (req, res) => {
  try {
    const bills = [
      {
        id: 1,
        bill_key: 'bill_1',
        title: 'Establishment of Indian Multi-Disciplinary Partnership (MDP) firms by the Govt. of India',
        status: 'In Progress',
        endDate: '2025-10-10',
        description: 'New guidelines for CSR implementation and reporting',
        publishDate: '2025-09-01'
      },
      {
        id: 2,
        bill_key: 'bill_2',
        title: 'Digital Competition Bill, 2025',
        status: 'Completed',
        endDate: '2025-08-31',
        description: 'Proposed amendments to strengthen corporate governance and transparency',
        publishDate: '2025-07-15'
      },
      {
        id: 3,
        bill_key: 'bill_3',
        title: 'Companies Amendment Bill, 2025',
        status: 'Completed',
        endDate: '2025-07-15',
        description: 'Amendments to improve the insolvency resolution process',
        publishDate: '2025-06-01'
      }
    ];

    // For each bill, query count of comments
    const results = [];
    for (const b of bills) {
      const countQuery = `SELECT COUNT(*)::int AS count FROM ${b.bill_key}_comments`;
      let count = 0;
      try {
        const r = await pool.query(countQuery);
        count = r.rows[0]?.count || 0;
      } catch (e) {
        // If table doesn't exist or error, treat as zero and continue
        console.warn(`Could not get count for ${b.bill_key}:`, e.message || e);
        count = 0;
      }

      results.push({
        id: b.id,
        bill: b.bill_key,
        title: b.title,
        status: b.status,
        submissions: count,
        endDate: b.endDate,
        description: b.description,
        publishDate: b.publishDate
      });
    }

    res.json({ ok: true, data: results });
  } catch (err) {
    console.error('Error fetching consultations:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}\n`);
  console.log('Available endpoints:');
  
  console.log('  GET  /api/comments/:bill');
  console.log('  POST /api/comments/:bill');
  console.log('  GET  /api/sentiment/:bill');
  console.log('  GET  /api/summaries/:bill');
  console.log('  GET  /api/sections/:bill');
  console.log('  GET  /api/section-sentiments/:bill\n');
});
