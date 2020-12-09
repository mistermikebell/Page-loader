
(function ($, window, document, undefined) {
// Share toggle
    $(document).on('click', '.icon-share, .icon-close_large', function (e) {
        e.preventDefault();
        $('.share-services').toggleClass('expanded');
    });
}(jQuery, window, document, undefined));