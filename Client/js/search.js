
$(document).ready(function() {
    const apiKey = '174ff52b';


    const userInfo = {
        name: $('#userName').text(),
        email: $('#userEmail').text()
    };
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

    $('#logoutBtn').on('click', function() {
        sessionStorage.removeItem('userInfo');
        window.location.href = '/logout';
    });

    $('#searchButton').on('click', function() {
        const query = $('#searchInput').val();
        if (query.length > 2) {
            searchMovies(query);
        }
    });

    $('#searchInput').on('keypress', function(e) {
        if (e.which === 13) {
            const query = $(this).val();
            if (query.length > 2) {
                searchMovies(query);
            }
        }
    });

    $('#favoritesButton').on('click', function() {
        window.location.href = '/favorites';
    });
    $('#bestLinksButton').on('click', function() {
        window.location.href = '/movies/best-links';
    });
    if ($('#adminButton').length) {
        $('#adminButton').on('click', function() {
            window.location.href = '/movies/admin';
        });
    }

    function searchMovies(query) {
        $('#loading').show();
        $('#movies').empty();

        $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&s=${query}`)
            .done(function(data) {
                if (data.Search) {
                    let moviesHtml = '';
                    data.Search.forEach(movie => {
                        const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450';
                        moviesHtml += `
                            <div class="col-md-4">
                                <div class="card">
                                    <img src="${posterUrl}" class="card-img-top" alt="${movie.Title}">
                                    <div class="card-body">
                                        <h5 class="card-title">${movie.Title}</h5>
                                        <p class="card-text">Release Date: ${movie.Year}</p>
                                        <a href="/movies/details/${movie.imdbID}" class="btn btn-primary">Details</a>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    $('#movies').html(moviesHtml);
                } else {
                    Swal.fire('No movies found');
                }
            })
            .fail(function() {
                Swal.fire('Error fetching data');
            })
            .always(function() {
                $('#loading').hide();
            });
    }
});