(function ($) {
    $(document).on('ready', function () {
        try {
            smartquotes();
        } catch(error){
            console.warn('Unable to fix quotes');
        }
    });
}(jQuery));