$(document).ready(function() {
    const apiKey = '174ff52b';
    const movieId = window.location.pathname.split('/').pop();
    let currentPage = 1;
 
    loadMovieDetails();
    loadLinks(1, 'rating');
 
    $('#sortLinks').on('change', function() {
        loadLinks(1, $(this).val());
    });
 
    function loadMovieDetails() {
        $.getJSON(`https://www.omdbapi.com/?apikey=${apiKey}&i=${movieId}`, function(data) {
            renderMovieDetails(data);
            checkFavoriteStatus(movieId);
        });
    }
 
    function checkFavoriteStatus(movieId) {
        $.get(`/favorites/check/${movieId}`)
            .done(function(response) {
                if (response.isFavorite) {
                    $('#favoriteBtn')
                        .text('Remove from Favorites')
                        .removeClass('btn-warning')
                        .addClass('btn-danger');
                }
            });
    }
 
    function renderMovieDetails(data) {
        const posterUrl = data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450';
        $('#movieDetails').html(`
            <div class="col-md-4">
                <img src="${posterUrl}" class="img-fluid" alt="${data.Title}">
            </div>
            <div class="col-md-8">
                <h2>${data.Title}</h2>
                <p><strong>Release Date:</strong> ${data.Released}</p>
                <p><strong>Genre:</strong> ${data.Genre}</p>
                <p><strong>Director:</strong> ${data.Director}</p>
                <p><strong>Actors:</strong> ${data.Actors}</p>
                <p><strong>Plot:</strong> ${data.Plot}</p>
                <p><strong>Rating:</strong> ${data.imdbRating}</p>
                <a href="https://www.imdb.com/title/${data.imdbID}" target="_blank" class="btn btn-primary">View on IMDb</a>
                <button id="favoriteBtn" class="btn btn-warning mt-2">Add to Favorites</button>
            </div>
        `);
 
        $('#favoriteBtn').on('click', handleFavoriteClick.bind(null, data));
    }
 
    function handleFavoriteClick(movieData) {
        const isRemoving = $('#favoriteBtn').hasClass('btn-danger');
        const url = isRemoving ? `/favorites/remove/${movieId}` : `/favorites/add/${movieId}`;
        
        $.post(url, { movieData })
            .done(function(response) {
                $('#favoriteBtn')
                    .text(isRemoving ? 'Add to Favorites' : 'Remove from Favorites')
                    .toggleClass('btn-warning btn-danger');
                Swal.fire({ icon: 'success', text: response.message });
            })
            .fail(() => Swal.fire({ icon: 'error', text: 'Error updating favorites' }));
    }
 
    function loadLinks(page, sort = 'rating') {
        $.get(`/api/movies/${movieId}/links?page=${page}&sort=${sort}`)
            .done(function(response) {
                renderLinks(response.links);
                renderPagination(response.totalPages, response.currentPage);
            });
    }
 
    function renderLinks(links) {
        console.log("User ID in renderLinks:", userId);

        const linksHtml = links.map(link => `
            
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h5 class="card-title">
                                ${link.name}
                                ${link.isPrivate ? 
                                    '<span class="badge badge-warning ml-2">Private</span>' : 
                                    '<span class="badge badge-success ml-2">Public</span>'}
                            </h5>
                            <p class="card-text">${link.description || ''}</p>
                            <p class="text-muted">Posted by: ${link.userId.name}</p>
                        </div>
                        <div class="text-right">
                            <p class="mb-1">Rating: ${(link.averageRating || 0).toFixed(1)} ⭐</p>
                            <p class="mb-1">Clicks: ${link.clicks || 0} 👆</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <a href="${link.url}" target="_blank" class="btn btn-primary btn-sm" 
                           onclick="handleLinkClick('${link._id}', '${link.url}')">Visit Link</a>
                        <button class="btn btn-info btn-sm" onclick="handleRating('${link._id}')">Rate</button>
                        
                        ${link.userId._id === userId ? 
                            `<button class="btn btn-danger btn-sm" onclick="handleDelete('${link._id}')">Delete</button>` : 
                            ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        $('#linksList').html(linksHtml || '<p class="text-center">No links available</p>');
    }
 
    function renderPagination(totalPages, currentPage) {
        let paginationHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `
                <button class="btn btn-sm mx-1 ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="loadLinks(${i})">${i}</button>
            `;
        }
        $('#pagination').html(paginationHtml);
    }
    window.loadLinks = loadLinks;
 
    $('#addLinkBtn').on('click', function() {
        Swal.fire({
            title: 'Add New Link',
            html: `
                <input id="linkName" class="swal2-input" placeholder="Link Name">
                <input id="linkUrl" class="swal2-input" placeholder="URL">
                <textarea id="linkDescription" class="swal2-textarea" placeholder="Description"></textarea>
                <div class="form-check mt-3">
                    <input type="checkbox" id="isPrivate" class="form-check-input">
                    <label class="form-check-label" for="isPrivate">Private Link</label>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add',
            preConfirm: () => {
                const name = $('#linkName').val();
                const url = $('#linkUrl').val();
                const description = $('#linkDescription').val();
                const isPrivate = $('#isPrivate').is(':checked');
 
                if (!name || !url) {
                    Swal.showValidationMessage('Please enter name and URL');
                    return false;
                }
                return { name, url, description, isPrivate };
            }
        }).then(result => {
            if (result.isConfirmed) {
                $.post(`/api/movies/${movieId}/links`, result.value)
                    .done(() => loadLinks(currentPage))
                    .fail(() => Swal.fire('Error', 'Failed to add link', 'error'));
            }
        });
    });
 

    window.handleLinkClick = function(linkId, url) {
        $.post(`/api/movies/${movieId}/links/${linkId}/click`)
            .done(function() {
                window.open(url, '_blank');
                loadLinks(currentPage);
            })
            .fail(() => Swal.fire('Error', 'Failed to track click', 'error'));
    };
 
    window.handleRating = function(linkId) {
        Swal.fire({
            title: 'Rate Link',
            html: `
                <div class="rating-stars mb-3">
                    <input type="number" id="rating" class="swal2-input" min="1" max="5" placeholder="Rating (1-5)">
                </div>
                <textarea id="review" class="swal2-textarea" placeholder="Write a review (optional)"></textarea>
            `,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            preConfirm: () => {
                const rating = $('#rating').val();
                const review = $('#review').val();
                
                if (!rating || rating < 1 || rating > 5) {
                    Swal.showValidationMessage('Please enter a valid rating (1-5)');
                    return false;
                }
                return { rating: Number(rating), review };
            }
        }).then(result => {
            if (result.isConfirmed) {
                $.post(`/api/movies/${movieId}/links/${linkId}/rate`, result.value)
                    .done(() => loadLinks(currentPage))
                    .fail(() => Swal.fire('Error', 'Failed to submit rating', 'error'));
            }
        });
    };
 
    window.handleDelete = function(linkId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it'
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/api/movies/${movieId}/links/${linkId}`,
                    type: 'DELETE',
                    success: () => loadLinks(currentPage),
                    error: () => Swal.fire('Error', 'Failed to delete link', 'error')
                });
            }
        });
    };
 });