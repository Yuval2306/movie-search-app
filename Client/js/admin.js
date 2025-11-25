$(document).ready(function() {
    const apiKey = '174ff52b';
    let table;

    function initializeTable() {
        table = $('#linksTable').DataTable({
            ajax: {
                url: '/movies/api/admin/links',
                dataSrc: 'links'
            },
            columns: [
                { data: 'userId.name' },
                { data: 'movieTitle', defaultContent: 'N/A' },
                { data: '_id' },
                { data: 'name' },
                { data: 'clicks', defaultContent: '0' },
                { 
                    data: 'isPrivate',
                    render: data => data ? 
                        '<span class="badge badge-warning">Private</span>' : 
                        '<span class="badge badge-success">Public</span>'
                },
                {
                    data: null,
                    render: function(data) {
                        if (!data.isPrivate) {
                            return `<button class="btn btn-danger btn-sm" onclick="deleteLink('${data._id}')">Delete</button>`;
                        }
                        return '';
                    }
                }
            ],
            order: [[4, 'desc']]
        });
    }

    window.deleteLink = function(linkId) {
        Swal.fire({
            title: 'Delete Link?',
            text: "This action cannot be undone",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/movies/api/admin/links/${linkId}`,
                    type: 'DELETE',
                    success: function() {
                        table.ajax.reload();
                        Swal.fire('Deleted!', 'Link has been deleted.', 'success');
                    },
                    error: function() {
                        Swal.fire('Error', 'Failed to delete link', 'error');
                    }
                });
            }
        });
    };

    initializeTable();
});