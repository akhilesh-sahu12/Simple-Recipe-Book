require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  ssl: {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined, // Handle newlines in certificates
  },
});

// Test database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err);
  } else {
    console.log('✅ DB is connected successfully');
  }
  done(); // Release the client back to the pool
});

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Fetch all recipes with ratings
app.get('/recipes', async (req, res) => {
  try {
    const query = `
      SELECT
        recipes.*,
        COALESCE(AVG(ratings.rating), 0) AS avg_rating
      FROM recipes
      LEFT JOIN ratings ON recipes.id = ratings.recipe_id
      GROUP BY recipes.id
      ORDER BY avg_rating DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Show details of a single recipe
app.get('/recipes/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [recipeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add a new recipe
app.post('/add-recipe', async (req, res) => {
  try {
    const { title, ingredients, steps, image_url } = req.body;
    const result = await pool.query(
      'INSERT INTO recipes (title, ingredients, steps, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, ingredients, steps, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a recipe's details
app.put('/update-recipe', async (req, res) => {
  try {
    const { title, ingredients, steps, image_url, id } = req.body;
    const result = await pool.query(
      'UPDATE recipes SET title = $1, ingredients = $2, steps = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [title, ingredients, steps, image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Rate a recipe
app.post('/recipes/:id/rate', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { user_id, rating } = req.body;
    const result = await pool.query(
      'INSERT INTO ratings (recipe_id, user_id, rating) VALUES ($1, $2, $3) RETURNING *',
      [recipeId, user_id, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get previous ratings for a recipe
app.get('/recipes/:id/ratings', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const ratingsQuery = await pool.query('SELECT * FROM ratings WHERE recipe_id = $1', [recipeId]);

    res.json(ratingsQuery.rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ❌ Remove `app.listen(port, ...)` for Vercel
// ✅ Export the app instead
//module.exports = app;

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
