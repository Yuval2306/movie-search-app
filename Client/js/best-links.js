$(document).ready(function() {
    const apiKey = '174ff52b';

    function loadTopLinks() {
        $.get('/movies/api/best-links')
            .done(function(response) {
                console.log(response); 
                const promises = response.links.map(link => {
                    return $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&i=${link.topLink.movieId}`)
                        .then(movie => ({
                            movie: movie,
                            link: link.topLink
                        }));
                });

                Promise.all(promises).then(results => {
                    const html = results.map(result => `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100">
                                <img src="${result.movie.Poster}" class="card-img-top" alt="${result.movie.Title}" 
                                     onerror="this.src='https://via.placeholder.com/300x450'">
                                <div class="card-body">
                                    <h5 class="card-title">${result.movie.Title}</h5>
                                    <p class="card-text">
                                        <strong>Top Link:</strong> ${result.link.name}
                                        ${result.link.isPrivate ? 
                                            '<span class="badge badge-warning">Private</span>' : 
                                            '<span class="badge badge-success">Public</span>'}
                                        <br>
                                        <strong>Clicks:</strong> ${result.link.clicks}<br>
                                        <strong>Rating:</strong> ${result.link.averageRating.toFixed(1)}
                                    </p>
                                    <a href="/movies/details/${result.link.movieId}" class="btn btn-primary">View Details</a>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    
                    $('#topLinks').html(html || '<p class="col-12 text-center">No links available</p>');
                });
            })
            .fail(function(xhr, status, error) {
                console.log('Ajax error:', error); 
            });
    }

    loadTopLinks();
});

