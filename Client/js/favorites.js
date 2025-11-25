$(document).ready(function() {
    let favoriteMovies = [];

    $('#backButton').on('click', function() {
        window.location.href = '/movies/search';
    });

    function loadFavorites() {
        $('#favorites').empty();
        
        $.get('/favorites/list')
            .done(function(data) {
                favoriteMovies = data;
                const sortBy = $('#sortOptions').val();
                sortFavorites(sortBy);
                displayFavorites();
            })
            .fail(function(error) {
                Swal.fire({
                    icon: 'error',
                    text: 'Error loading favorites'
                });
            });
    }

    function displayFavorites() {
        $('#favorites').empty();
        if (favoriteMovies.length === 0) {
            $('#favorites').html('<p class="col-12 text-center">No favorites added yet.</p>');
            return;
        }

        favoriteMovies.forEach(movie => {
            const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450';
            $('#favorites').append(`
                <div class="col-md-4">
                    <div class="card mb-4">
                        <img src="${posterUrl}" class="card-img-top" alt="${movie.Title}">
                        <div class="card-body">
                            <h5 class="card-title">${movie.Title}</h5>
                            <p class="card-text">Release Date: ${movie.Released}</p>
                            <p class="card-text">Rating: ${movie.imdbRating}</p>
                            <div class="btn-group">
                                <a href="/movies/details/${movie.imdbID}" class="btn btn-primary">Details</a>
                                <button class="btn btn-danger remove-favorite" data-id="${movie.imdbID}">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        });
    }

    function sortFavorites(sortBy) {
        favoriteMovies.sort((a, b) => {
            if (sortBy === 'title') {
                return a.Title.localeCompare(b.Title);
            } else if (sortBy === 'releaseDate') {
                return new Date(a.Released) - new Date(b.Released);
            } else if (sortBy === 'rating') {
                return parseFloat(b.imdbRating) - parseFloat(a.imdbRating);
            }
            return 0;
        });
    }

    $(document).on('click', '.remove-favorite', function() {
        const movieId = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                $.post(`/favorites/remove/${movieId}`)
                    .done(function() {
                        loadFavorites();
                        Swal.fire('Removed!', 'The movie has been removed from your favorites.', 'success');
                    })
                    .fail(function() {
                        Swal.fire({
                            icon: 'error',
                            text: 'Error removing favorite'
                        });
                    });
            }
        });
    });

    $('#sortOptions').on('change', function() {
        const sortBy = $(this).val();
        sortFavorites(sortBy);
        displayFavorites();
    });

    loadFavorites();
});