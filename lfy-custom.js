jQuery(document).ready(function($) {
    $('.mega-menu-div').each(function(index) {
        var link_id = $(this).attr('id');
        link_num = link_id.split('-');
        link_num = link_num[link_num.length - 1];
        $(this).appendTo('li.menu-item-' + link_num);
    });

    $('#menu-main-menu-1 li').hover(function(e) {
        $(this).children("div").stop(true, false).fadeToggle(150);
        e.preventDefault();
    });

    $('.mega-menu-div .submenu-1').addClass('active');

    $('.mega-menu-div .submenu a').hover(function(e) {
        $(this).parent().siblings().removeClass('active');
        $(this).parent().toggleClass('active');
    });

    $('.tooltip').tooltipster({
        interactive: true,
        maxWidth: 200,
        contentAsHTML: true,
        theme: ['tooltipster-shadow', 'tooltipster-shadow-customized']
    });

    $(window).load(function() {
        $('#tribe-events').find('.tribe-events-photo-event-wrap').matchHeight();
    });

});

(function($) {
    $(document.body).on('post-load', function() {
        $(document).foundation();
    });
})(jQuery);