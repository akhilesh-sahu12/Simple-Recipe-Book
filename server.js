const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'recipebook',
  password: 'root',
  port: 5432,
});

// Test database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('DB is connected successfully');
  }
  done(); // Release the client back to the pool
});

// Serve static files (HTML, CSS, JavaScript) from a 'public' directory
app.use(express.static('public'));
app.use(bodyParser.json());


app.get('/recipes', (req, res) => {
  // Join the recipes and ratings tables and calculate the average rating for each recipe
  const query = `
    SELECT
      recipes.*,
      COALESCE(AVG(ratings.rating), 0) AS avg_rating
    FROM
      recipes
    LEFT JOIN
      ratings
    ON
      recipes.id = ratings.recipe_id
    GROUP BY
      recipes.id
    ORDER BY
      avg_rating DESC;  -- Sort by average rating in descending order
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(result.rows);
    }
  });
});



// Show details of a single recipe
app.get('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  pool.query('SELECT * FROM recipes WHERE id = $1', [recipeId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recipe not found' });
    } else {
      res.status(200).json(result.rows[0]);
    }
  });
});

// Add a new recipe
app.post('/add-recipe', (req, res) => {
  const { title, ingredients, steps, image_url } = req.body;
  pool.query(
    'INSERT INTO recipes (title, ingredients, steps, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, ingredients, steps, image_url],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    }
  );
});

// Update a recipe's details
app.post('/update-recipe', (req, res) => {
  //const recipeId = req.params.id;
  const { title, ingredients, steps, image_url, id } = req.body;
  pool.query(
    'UPDATE recipes SET title = $1, ingredients = $2, steps = $3, image_url = $4 WHERE id = $5 RETURNING *',
    [title, ingredients, steps, image_url, id],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else if (result.rows.length === 0) {
        res.status(404).json({ error: 'Recipe not found' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    }
  );
});

// Rate a recipe
app.post('/recipes/:id/rate', (req, res) => {
  const recipeId = req.params.id;
  const { user_id, rating } = req.body;
  pool.query(
    'INSERT INTO ratings (recipe_id, user_id, rating) VALUES ($1, $2, $3) RETURNING *',
    [recipeId, user_id, rating],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(201).json(result.rows[0]);
      }
    }
  );
});

// Route to get previous ratings for a recipe
app.get('/recipes/:id/ratings', async (req, res) => {
  const recipeId = parseInt(req.params.id);
  try {
    // Use async/await to query ratings from the database
    const ratingsQuery = await pool.query('SELECT * FROM ratings WHERE recipe_id = $1', [recipeId]);
    const ratings = ratingsQuery.rows;

    res.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
