// ==================================
// 0. NAVBAR AUTH & LOGOUT STATE MANAGEMENT
// ==================================

document.addEventListener("DOMContentLoaded", function() {
    let authLink = document.getElementById("authLink");
    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (authLink) {
        if (isLoggedIn) {
            authLink.textContent = "Log Out";
            authLink.href = "#";
            authLink.classList.add("text-warning");

            authLink.addEventListener("click", function(event) {
                event.preventDefault();
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("currentUser");
                
                alert("You have been logged out successfully.");
                window.location.href = "account.html";
            });
        } else {
            authLink.textContent = "Sign In";
            authLink.href = "account.html";
            authLink.classList.remove("text-warning");
        }
    }
});


// ==================================
// 1. GET AND SAVE MOVIES
// ==================================

function getSavedMovies() {
    try {
        return JSON.parse(localStorage.getItem("myMovies")) || [];
    } catch (error) {
        return [];
    }
}

function saveMovies(movies) {
    localStorage.setItem("myMovies", JSON.stringify(movies));
}


// ==================================
// 2. SEARCH, FILTER AND PAGINATION
// ==================================

let searchInput = document.getElementById("searchInput");
let genreFilter = document.getElementById("genreFilter");

let movieContainer = document.getElementById("movieContainer");

let currentPage = 1;
let moviesPerPage = 4;

let movieCards = movieContainer
    ? Array.from(movieContainer.querySelectorAll(":scope > .col-md-3"))
    : [];

let pageButtons = document.querySelectorAll(".page-btn");


function filterMovies() {

    let searchValue = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    let selectedGenre = genreFilter
        ? genreFilter.value
        : "all";

    // Find matching movies
    let filteredMovies = movieCards.filter(function(column) {

        let card = column.querySelector(".movie-card");

        let title = card.querySelector("h5")
            .textContent.toLowerCase();

        let genre = card.dataset.genre;

        let matchesSearch = title.includes(searchValue);

        let matchesGenre =
            selectedGenre === "all" || genre === selectedGenre;

        return matchesSearch && matchesGenre;

    });


    // Calculate number of pages
    let totalPages = Math.ceil(
        filteredMovies.length / moviesPerPage
    );

    // Reset page if necessary
    if (currentPage > totalPages) {
        currentPage = Math.max(1, totalPages);
    }


    // Hide all movies
    movieCards.forEach(function(column) {
        column.style.display = "none";
    });


    // Display four movies on selected page
    let start = (currentPage - 1) * moviesPerPage;

    let end = start + moviesPerPage;

    filteredMovies.slice(start, end).forEach(function(column) {
        column.style.display = "";
    });


    // Update pagination buttons
    pageButtons.forEach(function(button) {

        let page = Number(button.dataset.page);

        button.style.display =
            page <= totalPages ? "inline-block" : "none";

        button.classList.toggle(
            "active",
            page === currentPage
        );

    });


    // Hide pagination if only one page
    let pagination = document.querySelector(
        ".pagination-container"
    );

    if (pagination) {

        pagination.style.display =
            totalPages > 1 ? "flex" : "none";

    }

}


// Search movies
if (searchInput) {

    searchInput.addEventListener("input", function() {

        currentPage = 1;
        resetPlayingTrailers(null);
        filterMovies();

    });

}


// Filter by genre
if (genreFilter) {

    genreFilter.addEventListener("change", function() {

        currentPage = 1;
        resetPlayingTrailers(null);
        filterMovies();

    });

}


// Pagination buttons
pageButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        currentPage = Number(this.dataset.page);

        resetPlayingTrailers(null);
        filterMovies();

        window.scrollTo({
            top: movieContainer.offsetTop,
            behavior: "smooth"
        });

    });

});


// Initial display
if (movieContainer) {
    filterMovies();
}


// ==================================
// 2B. PLAY TRAILER ON POSTER CLICK
// ==================================

function resetPlayingTrailers(exceptWrapper) {
    document.querySelectorAll(".poster-wrapper.playing").forEach(function(wrapper) {
        if (wrapper === exceptWrapper) {
            return;
        }
        let posterSrc = wrapper.dataset.poster;
        let posterAlt = wrapper.dataset.alt || "Movie Poster";
        wrapper.classList.remove("playing");
        wrapper.innerHTML =
            '<img src="' + posterSrc + '" alt="' + posterAlt + '">' +
            '<span class="play-badge">&#9658;</span>';
    });
}

document.addEventListener("click", function(event) {

    let wrapper = event.target.closest(".poster-wrapper");

    if (!wrapper || wrapper.classList.contains("playing")) {
        return;
    }

    let trailerSrc = wrapper.dataset.trailer;
    if (!trailerSrc) {
        return;
    }

    let img = wrapper.querySelector("img");
    if (img) {
        wrapper.dataset.poster = img.getAttribute("src");
        wrapper.dataset.alt = img.getAttribute("alt") || "";
    }

    resetPlayingTrailers(wrapper);

    wrapper.classList.add("playing");
    wrapper.innerHTML = "";

    let video = document.createElement("video");
    video.src = trailerSrc;
    video.controls = true;
    video.autoplay = true;

    wrapper.appendChild(video);

});


// ==================================
// 3. ADD MOVIES TO MY LIST
// ==================================

document.addEventListener("click", function(event) {

    if (!event.target.classList.contains("add-btn") || event.target.classList.contains("remove-btn")) {
        return;
    }

    let button = event.target;

    let movieCard = button.closest(".movie-card");

    if (!movieCard) {
        return;
    }

    let title = movieCard.querySelector("h5")
        .textContent.trim();

    let genre = movieCard.dataset.genre || "";

    let wrapper = movieCard.querySelector(".poster-wrapper");

    if (!wrapper) {
        alert("Movie media was not found.");
        return;
    }

    let videoSource = wrapper.dataset.trailer;

    if (!videoSource) {
        alert("Video source was not found.");
        return;
    }

    let img = wrapper.querySelector("img");
    let posterSource = wrapper.dataset.poster || (img ? img.getAttribute("src") : "");

    let movie = {
        title: title,
        genre: genre,
        video: videoSource,
        poster: posterSource
    };

    let savedMovies = getSavedMovies();

    let alreadySaved = savedMovies.some(function(item) {

        return item.title.toLowerCase() === title.toLowerCase();

    });

    if (alreadySaved) {

        alert("This movie is already in your list!");
        return;

    }

    savedMovies.push(movie);

    saveMovies(savedMovies);

    button.textContent = "Added to My List";

    button.disabled = true;

    alert("Movie added to My List!");

});


// ==================================
// 4. DISPLAY SAVED MOVIES
// ==================================

let savedMoviesContainer =
    document.getElementById("savedMovies");

let emptyMessage =
    document.getElementById("emptyMessage");

const fallbackPosters = {
    "inumber number": "inumber number.webp",
    "five fingers for marseilles": "five fingers.webp",
    "mortal combat": "mortal combat.webp",
    "beekeper 2": "beekeeper 2.webp",
    "bel-air": "bel-air.webp",
    "fast x": "fast x.webp",
    "drag me to hell": "drag me to hell.webp",
    "bee vs human": "bee vs human.webp",
    "john-wick": "john wick.webp",
    "spider man": "spider man.webp",
    "spider-man": "spider man.webp",
    "hackers": "hackers.webp",
    "ballerina": "ballerina.webp"
};

function displaySavedMovies() {

    if (!savedMoviesContainer) {
        return;
    }

    let savedMovies = getSavedMovies();

    savedMoviesContainer.innerHTML = "";

    if (emptyMessage) {

        emptyMessage.style.display =
            savedMovies.length === 0 ? "block" : "none";

    }

    savedMovies.forEach(function(movie, index) {

        let column = document.createElement("div");

        column.className = "col-md-3 mb-4";

        let card = document.createElement("div");

        card.className = "movie-card";

        let wrapper = document.createElement("div");
        wrapper.className = "poster-wrapper";
        wrapper.dataset.trailer = movie.video;

        let posterSrc = movie.poster || fallbackPosters[movie.title.toLowerCase()] || "";

        if (posterSrc) {
            wrapper.dataset.poster = posterSrc;
            wrapper.dataset.alt = movie.title;

            let img = document.createElement("img");
            img.src = posterSrc;
            img.alt = movie.title;

            let badge = document.createElement("span");
            badge.className = "play-badge";
            badge.innerHTML = "&#9658;";

            wrapper.appendChild(img);
            wrapper.appendChild(badge);
        } else {
            let video = document.createElement("video");
            video.src = movie.video;
            video.controls = true;
            wrapper.appendChild(video);
        }

        let title = document.createElement("h5");

        title.textContent = movie.title;

        let genre = document.createElement("p");

        genre.textContent = movie.genre;

        let removeButton = document.createElement("button");

        removeButton.className = "btn btn-danger add-btn remove-btn";

        removeButton.textContent = "Remove";


        // REMOVE MOVIE
        removeButton.addEventListener("click", function() {

            let movies = getSavedMovies();

            movies.splice(index, 1);

            saveMovies(movies);

            displaySavedMovies();

        });


        card.appendChild(wrapper);

        card.appendChild(title);

        card.appendChild(genre);

        card.appendChild(removeButton);

        column.appendChild(card);

        savedMoviesContainer.appendChild(column);

    });

}

displaySavedMovies();


// ==================================
// 5. ACCOUNT FORM VALIDATION & STATE
// ==================================

let loginForm = document.getElementById("loginForm");

let registerForm = document.getElementById("registerForm");

let accountMessage =
    document.getElementById("accountMessage");


function showAccountMessage(message) {

    if (accountMessage) {
        accountMessage.textContent = message;
    }

}


// ==================================
// LOGIN VALIDATION
// ==================================

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        let email =
            document.getElementById("loginEmail").value.trim();

        let password =
            document.getElementById("loginPassword").value;

        showAccountMessage("");

        if (email === "" || password === "") {

            showAccountMessage("Please fill in all fields.");

            return;

        }

        let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            showAccountMessage("Please enter a valid email address.");

            return;

        }

        if (password.length < 8) {

            showAccountMessage(
                "Password must have at least 8 characters."
            );

            return;

        }

        showAccountMessage(
            "Login successfully!"
        );

        // Set login session flag
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", email);

        // Redirect to browse page on success
        setTimeout(function() {
            window.location.href = "browse.html";
        }, 1000);

    });

}


// ==================================
// REGISTER VALIDATION
// ==================================

if (registerForm) {

    registerForm.addEventListener("submit", function(event) {

        event.preventDefault();

        let fullName =
            document.getElementById("fullName").value.trim();

        let email =
            document.getElementById("registerEmail").value.trim();

        let password =
            document.getElementById("registerPassword").value;

        showAccountMessage("");

        if (!fullName || !email || !password) {

            showAccountMessage("Please fill in all fields.");

            return;

        }

        if (!/^[A-Za-z ]{3,50}$/.test(fullName)) {

            showAccountMessage(
                "Enter a valid name without numbers."
            );

            return;

        }

        let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            showAccountMessage("Enter a valid email address.");

            return;

        }

        if (password.length < 8) {

            showAccountMessage(
                "Password must contain at least 8 characters."
            );

            return;

        }

        showAccountMessage(
            "Registration successfully!"
        );

        // Set login session flag
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", email);

        // Redirect to browse page on success
        setTimeout(function() {
            window.location.href = "browse.html";
        }, 1000);

    });

}