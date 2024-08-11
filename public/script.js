// ------------------------------Function to fetch and display recipes(index.html)----------------------
async function fetchAndDisplayRecipes() {
  const recipeCardSection = document.getElementById("recipe-card");
  try {
    // Fetch data from the server's API endpoint
    const response = await fetch("/recipes");
    const recipes = await response.json();

    // Clear any existing content in the recipe card section
    if (recipeCardSection) {
      recipeCardSection.innerHTML = "";
    }

    // Loop through the recipes and create recipe cards
    recipes.forEach((recipe) => {
      let avgRating = parseFloat(recipe.avg_rating).toFixed(2);
      if (avgRating % 1 === 0) {
        avgRating = parseInt(avgRating);
      }
      const recipeCard = document.createElement("div");
      recipeCard.classList.add("recipe-card");
      recipeCard.innerHTML = `
      <div class="card-content">
      <div class="image-content">
          <img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-image">
        </div>
        <div class="text-content">
          <h2>${recipe.title}</h2>
          <p >Avg. Rating: ${avgRating}/5</p> 
        </div>
        
      </div>
      `;

      // Create a "Details" button with data-recipe-id attribute
      const detailsButton = document.createElement("button");
      detailsButton.classList.add("details-button");
      detailsButton.setAttribute("data-recipe-id", recipe.id);
      detailsButton.textContent = "Details";

      // Add a click event listener to the "Details" button
      detailsButton.addEventListener("click", () => {
        const recipeId = detailsButton.getAttribute("data-recipe-id");
        // Redirect to the Recipe Details Page with the selected recipe ID
        window.location.href = `/recipe_details.html?id=${recipeId}`;
      });

      // Append the "Details" button to the recipe card
      recipeCard.appendChild(detailsButton);

      // Create a "Edit" button with data-recipe-id attribute
      const editButton = document.createElement("button");
      editButton.classList.add("details-button");
      editButton.setAttribute("data-recipe-id", recipe.id);
      editButton.textContent = "Edit";

      // Add a click event listener to the "Edit" button
      editButton.addEventListener("click", () => {
        const recipeId = editButton.getAttribute("data-recipe-id");
        // Redirect to the Recipe Details Page with the selected recipe ID
        window.location.href = `/edit_recipe.html?id=${recipeId}`;
      });

      // Append the "Edit" button to the recipe card
      recipeCard.appendChild(editButton);

      // Append the recipe card to the section
      if (recipeCardSection) {
        recipeCardSection.appendChild(recipeCard);
      }
    });
  } catch (error) {
    console.error("Error fetching and displaying recipes:", error);
  }
}

// -----------------------------Function to handle form submission(add_recipe.html)------------------------------------
function handleFormSubmit(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  // Get the form data
  const formData = {
    title: document.getElementById("title").value,
    ingredients: document.getElementById("ingredients").value,
    steps: document.getElementById("steps").value,
    image_url: document.getElementById("image_url").value,
  };

  // Send the form data to the server
  fetch("/add-recipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((responseData) => {
      // Handle the response from the backend
      console.log("Data sent successfully:", responseData);

      // Redirect to the Home Page
      window.location.href = "/";
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

// -----------------------Function to fetch and display recipe details(recipe_details.html)---------------------------------------
async function fetchAndDisplayRecipeDetails() {
  const recipeId = getRecipeIdFromUrl();

  try {
    // Fetch recipe details from the server using the recipeId
    const response = await fetch(`/recipes/${recipeId}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const recipeData = await response.json();

    // Display recipe details on the page
    const recipeDetailsSection = document.getElementById("recipe-details");
    if (recipeDetailsSection) {
      recipeDetailsSection.innerHTML = `
        <h2>${recipeData.title}</h2>
        <p><strong>Ingredients:</strong></p>
        <p>${recipeData.ingredients.replace(/\n/g, "<br>")}</p>
        <p><strong>Steps:</strong></p>
        <p>${recipeData.steps.replace(/\n/g, "<br>")}</p>
        <p><strong>Image:</strong></p>
        <img src="${recipeData.image_url}" alt="${
        recipeData.title
      }" width="300">
      `;

      // Fetch and display previous ratings for the recipe
      fetchAndDisplayPreviousRatings();
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

// Function to submit a rating for the recipe
function submitRating(event) {
  event.preventDefault(); // Prevent the default form submission behavior
  const recipeId = getRecipeIdFromUrl();

  const rating = parseInt(document.getElementById("rating").value);
  const user_id = document.getElementById("userID").value;
  // Send the rating data to the server
  fetch(`/recipes/${recipeId}/rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id, rating }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(() => {
      console.log("Rating submitted successfully");
      fetchAndDisplayPreviousRatings();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

// Function to fetch and display previous ratings for the recipe
function fetchAndDisplayPreviousRatings() {
  const recipeId = getRecipeIdFromUrl();

  // Fetch previous ratings from the server using the recipeId
  fetch(`/recipes/${recipeId}/ratings`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((ratingsData) => {
      const ratingsList = document.getElementById("ratings-list");
      if (ratingsList) {
        document.getElementById("rating").value = "";
        document.getElementById("userID").value = "";
        ratingsList.innerHTML = "";
        ratingsData.forEach((rating) => {
          const listItem = document.createElement("li");
          listItem.textContent = `User ${rating.user_id}: ${rating.rating}`;
          ratingsList.appendChild(listItem);
        });
      }
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}
// -----------------------Function to handle edit form submission(edit_recipe.html)-----------------
function fillSubmitForm() {
  const editRecipeForm = document.getElementById("edit-recipe-form");
  const recipeId = getRecipeIdFromUrl();

  // Fetch recipe details using the recipeId and pre-fill the form
  fetch(`/recipes/${recipeId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((recipeData) => {
      // Pre-fill the form fields with existing recipe data
      document.getElementById("title").value = recipeData.title;
      document.getElementById("ingredients").value = recipeData.ingredients;
      document.getElementById("steps").value = recipeData.steps;
      document.getElementById("image_url").value = recipeData.image_url;
      document.getElementById("recipe_id").value = recipeData.id;
    })
    .catch((error) => {
      console.error("There was a problem fetching recipe details:", error);
    });

  // Handle form submission to update the recipe
  editRecipeForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get the form data
    const formData = {
      id: document.getElementById("recipe_id").value,
      title: document.getElementById("title").value,
      ingredients: document.getElementById("ingredients").value,
      steps: document.getElementById("steps").value,
      image_url: document.getElementById("image_url").value,
    };

    // Send the updated recipe data to the server for editing
    fetch("/update-recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(() => {
        // Redirect the user to the recipe details page after editing
        window.location.href = `/recipe_details.html?id=${recipeId}`;
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  });
}

// -----------Add event listeners based on the current page (handle script to be executed respective pages ------------
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname;

  if (currentPage === "/recipe_details.html") {
    // Page for displaying recipe details
    const ratingForm = document.getElementById("rating-form");
    if (ratingForm) {
      ratingForm.addEventListener("submit", submitRating);
    }
    // Fetch and display recipe details when the page loads
    fetchAndDisplayRecipeDetails();
  } else if (currentPage === "/add_recipe.html") {
    // Page for adding a new recipe
    const recipeForm = document.getElementById("recipe-form");
    if (recipeForm) {
      recipeForm.addEventListener("submit", handleFormSubmit);
    }
  } else if (currentPage === "/") {
    // Page for displaying all recipes (home page)
    fetchAndDisplayRecipes();
  } else if (currentPage === "/edit_recipe.html") {
    // Page for editing recipe
    fillSubmitForm();
  }
});

// Function to extract recipe ID from the URL
function getRecipeIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get("id");
  return recipeId;
}
