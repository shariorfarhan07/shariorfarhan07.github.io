
jQuery(document).ready(function() {
    "use strict";
    arlo_tm_color_switcher();
    arlo_tm_switcher_opener();
    arlo_tm_cursor_switcher();
    arlo_tm_cursor();
    arlo_tm_intro_tabs();
    arlo_tm_kenburn_slider();
    arlo_tm_modalbox_news();
    arlo_tm_popupscroll();
    arlo_tm_scrollable();
    arlo_tm_nav_bg();
    arlo_tm_popup();
    arlo_tm_mobile_menu();
    arlo_tm_down();
    arlo_tm_imgtosvg();
    arlo_tm_data_images();
    arlo_tm_jarallax();
    arlo_tm_portfolio();
    arlo_tm_projects();
    arlo_tm_isotope();
    arlo_tm_contact_form();
    arlo_tm_location();
    arlo_tm_ripple();
    arlo_tm_videoplayer();
    arlo_tm_about_animation();
    arlo_tm_animate_text();
    jQuery(window).on('resize', function() {
        arlo_tm_isotope();
        arlo_tm_modalbox_news();
    });
    window.addEventListener("load", function() {
        setTimeout(function() {
            jQuery('.arlo_tm_preloader').addClass('loaded');
        }, 1000);
        arlo_tm_isotope();
    });
});
function arlo_tm_color_switcher() {
    "use strict";
    var list = jQuery('.arlo_tm_settings .colors li a');
    list.on('click', function() {
        var element = jQuery(this);
        var elval = element.attr('class');
        element.closest('.arlo_tm_all_wrap').attr('data-color', '' + elval + '');
        return false;
    });
}
function arlo_tm_switcher_opener() {
    "use strict";
    var settings = jQuery('.arlo_tm_settings');
    var button = settings.find('.link');
    var direction = settings.find('.direction li a');
    var light = settings.find('.direction li a.light');
    var dark = settings.find('.direction li a.dark');
    button.on('click', function() {
        var element = jQuery(this);
        if (element.hasClass('opened')) {
            element.removeClass('opened');
            element.closest('.arlo_tm_settings').removeClass('opened');
        } else {
            element.addClass('opened');
            element.closest('.arlo_tm_settings').addClass('opened');
        }
        return false;
    });
    direction.on('click', function() {
        var element = jQuery(this);
        if (!element.hasClass('active')) {
            direction.removeClass('active');
            element.addClass('active');
        }
    });
    dark.on('click', function() {
        var el = jQuery(this);
        jQuery('body').addClass('dark');
        jQuery('.arlo_tm_partners').addClass('opened');
        el.closest('.arlo_tm_settings').addClass('changed');
        return false;
    });
    light.on('click', function() {
        var ele = jQuery(this);
        jQuery('body').removeClass('dark');
        jQuery('.arlo_tm_partners').removeClass('opened');
        ele.closest('.arlo_tm_settings').removeClass('changed');
        return false;
    });
}
function arlo_tm_cursor_switcher() {
    "use strict";
    var wrapper = jQuery('.arlo_tm_all_wrap');
    var button = jQuery('.arlo_tm_settings .cursor li a');
    var show = jQuery('.arlo_tm_settings .cursor li a.show');
    var hide = jQuery('.arlo_tm_settings .cursor li a.hide');
    button.on('click', function() {
        var element = jQuery(this);
        if (!element.hasClass('showme')) {
            button.removeClass('showme');
            element.addClass('showme');
        }
        return false;
    });
    show.on('click', function() {
        wrapper.attr('data-magic-cursor', '');
    });
    hide.on('click', function() {
        wrapper.attr('data-magic-cursor', 'hide');
    });
}
function arlo_tm_intro_tabs() {
    "use strict";
    var button = jQuery('.arlo_tm_intro_content .main_filter ul li a');
    var tabList = jQuery('.arlo_tm_intro_content .demo_list');
    button.on('click', function() {
        var element = jQuery(this);
        var elAttr = element.attr('data-tab');
        button.removeClass('current');
        tabList.removeClass('current');
        element.addClass('current');
        jQuery("#" + elAttr).addClass('current');
        return false;
    });
}
function arlo_tm_cursor() {
    "use strict";
    var myCursor = jQuery('.mouse-cursor');
    if (myCursor.length) {
        if ($("body")) {
            const e = document.querySelector(".cursor-inner")
              , t = document.querySelector(".cursor-outer");
            let n, i = 0, o = !1;
            window.onmousemove = function(s) {
                o || (t.style.transform = "translate(" + s.clientX + "px, " + s.clientY + "px)"),
                e.style.transform = "translate(" + s.clientX + "px, " + s.clientY + "px)",
                n = s.clientY,
                i = s.clientX
            }
            ,
            $("body").on("mouseenter", "a, .cursor-pointer", function() {
                e.classList.add("cursor-hover"),
                t.classList.add("cursor-hover")
            }),
            $("body").on("mouseleave", "a, .cursor-pointer", function() {
                $(this).is("a") && $(this).closest(".cursor-pointer").length || (e.classList.remove("cursor-hover"),
                t.classList.remove("cursor-hover"))
            }),
            e.style.visibility = "visible",
            t.style.visibility = "visible"
        }
    }
}
;function arlo_tm_kenburn_slider() {
    "use strict";
    jQuery(function() {
        jQuery('.arlo_tm_hero .overlay_slider').vegas({
            timer: false,
            animation: ['kenburnsUp', 'kenburnsLeft', 'kenburnsRight'],
            delay: 7000,
            slides: [{
                src: 'img/slider/1.jpg'
            }, {
                src: 'img/slider/2.jpg'
            }, {
                src: 'img/slider/3.jpg'
            }, ]
        });
    });
}
function arlo_tm_modalbox_news() {
    "use strict";
    var modalBox = jQuery('.arlo_tm_modalbox_news');
    var list = jQuery('.arlo_tm_news .news_list ul li');
    var closePopup = modalBox.find('.close');
    list.each(function() {
        var element = jQuery(this);
        var details = element.find('.list_inner').html();
        var buttons = element.find('.details .title a,.arlo_tm_full_link');
        var mainImage = element.find('.main');
        var imgData = mainImage.data('img-url');
        var title = element.find('.title');
        var titleHref = element.find('.title a').html();
        buttons.on('click', function() {
            jQuery('body').addClass('modal');
            modalBox.addClass('opened');
            modalBox.find('.description_wrap').html(details);
            mainImage = modalBox.find('.main');
            mainImage.css({
                backgroundImage: 'url(' + imgData + ')'
            });
            title = modalBox.find('.title');
            title.html(titleHref);
            return false;
        });
    });
    closePopup.on('click', function() {
        modalBox.removeClass('opened');
        modalBox.find('.description_wrap').html('');
        jQuery('body').removeClass('modal');
        return false;
    });
}
function arlo_tm_popupscroll() {
    "use strict";
    var WW = jQuery(window).width();
    var H = jQuery(window).height();
    var scrollable = jQuery('.arlo_tm_modalbox_news .scrollable');
    var popupBox = jQuery('.arlo_tm_modalbox_news .description_wrap');
    if (WW >= 1200) {
        popupBox.css({
            height: H - 140
        });
    } else {
        popupBox.css({
            height: H
        });
    }
    scrollable.each(function() {
        var element = jQuery(this);
        var wH = jQuery(window).height();
        element.css({
            height: wH - 140
        });
        if (WW >= 1200) {
            element.css({
                height: wH - 140
            });
        } else {
            element.css({
                height: wH
            });
        }
        element.niceScroll({
            touchbehavior: false,
            cursorwidth: 0,
            autohidemode: true,
            cursorborder: "0px solid #fff"
        });
    });
}
function arlo_tm_nav_bg() {
    "use strict";
    jQuery(window).on('scroll', function() {
        var menu = jQuery('.arlo_tm_topbar');
        var WinOffset = jQuery(window).scrollTop();
        if (WinOffset >= 100) {
            menu.addClass('animate');
        } else {
            menu.removeClass('animate');
        }
    });
}
function arlo_tm_scrollable() {
    "use strict";
    var H = jQuery(window).height();
    var scrollable = jQuery('.arlo_tm_leftpart .inner .menu.scrollable');
    var verMenu = jQuery('.arlo_tm_leftpart .inner .menu');
    var logoHeight = jQuery('.arlo_tm_leftpart .inner .logo').outerHeight();
    var socialHeight = jQuery('.arlo_tm_leftpart .inner .bottom').outerHeight() + 100;
    verMenu.css({
        height: H - logoHeight - socialHeight
    });
    scrollable.each(function() {
        var element = jQuery(this);
        element.css({
            height: H - logoHeight - socialHeight
        }).niceScroll({
            touchbehavior: false,
            cursorwidth: 0,
            autohidemode: true,
            cursorborder: "0px solid #eee"
        });
    });
}
jQuery('.arlo_tm_counter').each(function() {
    "use strict";
    var el = jQuery(this);
    el.waypoint({
        handler: function() {
            if (!el.hasClass('stop')) {
                el.addClass('stop').countTo({
                    refreshInterval: 50,
                    formatter: function(value, options) {
                        return value.toFixed(options.decimals).replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
                    },
                });
            }
        },
        offset: '95%'
    });
});
function arlo_tm_animate_text() {
    "use strict";
    var animateSpan = jQuery('.arlo_tm_animation_text_word');
    animateSpan.typed({
        strings: ["Freelancer", "Web Developer", "Photographer"],
        loop: true,
        startDelay: 1e3,
        backDelay: 2e3
    });
}
function arlo_tm_popup() {
    "use strict";
    jQuery('.gallery_zoom').each(function() {
        jQuery(this).magnificPopup({
            delegate: 'a.zoom',
            type: 'image',
            gallery: {
                enabled: true
            },
            removalDelay: 300,
            mainClass: 'mfp-fade'
        });
    });
    jQuery('.popup-youtube').each(function() {
        jQuery(this).magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });
    });
}
new WOW().init();
jQuery('.anchor_nav').onePageNav();
function arlo_tm_mobile_menu() {
    "use strict";
    var hamburger = jQuery('.hamburger');
    var mobileMenu = jQuery('.arlo_tm_mobile_menu .dropdown');
    hamburger.on('click', function() {
        var element = jQuery(this);
        if (element.hasClass('is-active')) {
            element.removeClass('is-active');
            mobileMenu.slideUp();
        } else {
            element.addClass('is-active');
            mobileMenu.slideDown();
        }
        return false;
    });
    jQuery('.arlo_tm_mobile_menu .dropdown .dropdown_inner ul li a').on('click', function() {
        hamburger.removeClass('is-active');
        mobileMenu.slideUp();
        return false;
    });
}
function arlo_tm_down() {
    "use strict";
    var topbar = jQuery('.arlo_tm_topbar').outerHeight();
    jQuery('.arlo_tm_arrow_wrap a').on('click', function() {
        if ($('.arlo_tm_topbar').length) {
            if ($.attr(this, 'href') !== '#') {
                $('html, body').animate({
                    scrollTop: $($.attr(this, 'href')).offset().top - topbar + 3
                }, 800);
            }
        } else {
            if ($.attr(this, 'href') !== '#') {
                $('html, body').animate({
                    scrollTop: $($.attr(this, 'href')).offset().top
                }, 800);
            }
        }
        return false;
    });
    jQuery('.arlo_tm_services .lets_work a').on('click', function() {
        if ($('.arlo_tm_topbar').length) {
            if ($.attr(this, 'href') !== '#') {
                $('html, body').animate({
                    scrollTop: $($.attr(this, 'href')).offset().top - topbar + 3
                }, 800);
            }
        } else {
            if ($.attr(this, 'href') !== '#') {
                $('html, body').animate({
                    scrollTop: $($.attr(this, 'href')).offset().top
                }, 800);
            }
        }
        return false;
    });
}
function arlo_tm_imgtosvg() {
    "use strict";
    jQuery('img.svg').each(function() {
        var jQueryimg = jQuery(this);
        var imgClass = jQueryimg.attr('class');
        var imgURL = jQueryimg.attr('src');
        jQuery.get(imgURL, function(data) {
            var jQuerysvg = jQuery(data).find('svg');
            if (typeof imgClass !== 'undefined') {
                jQuerysvg = jQuerysvg.attr('class', imgClass + ' replaced-svg');
            }
            jQuerysvg = jQuerysvg.removeAttr('xmlns:a');
            jQueryimg.replaceWith(jQuerysvg);
        }, 'xml');
    });
}
function arlo_tm_data_images() {
    "use strict";
    var data = jQuery('*[data-img-url]');
    data.each(function() {
        var element = jQuery(this);
        var url = element.data('img-url');
        element.css({
            backgroundImage: 'url(' + url + ')'
        });
    });
}
function arlo_tm_jarallax() {
    "use strict";
    jQuery('.jarallax').each(function() {
        var element = jQuery(this);
        var customSpeed = element.data('speed');
        if (customSpeed !== "undefined" && customSpeed !== "") {
            customSpeed = customSpeed;
        } else {
            customSpeed = 0.5;
        }
        element.jarallax({
            speed: customSpeed,
            automaticResize: true
        });
    });
}
function arlo_tm_portfolio() {
    "use strict";
    if (jQuery().isotope) {
        var list = jQuery('.arlo_tm_portfolio .portfolio_list ul');
        var filter = jQuery('.arlo_tm_portfolio .portfolio_filter ul');
        if (filter.length) {
            filter.find('a').on('click', function() {
                var selector = jQuery(this).attr('data-filter');
                list.isotope({
                    filter: selector,
                    animationOptions: {
                        duration: 750,
                        easing: 'linear',
                        queue: false
                    }
                });
                return false;
            });
            filter.find('a').on('click', function() {
                filter.find('a').removeClass('current');
                jQuery(this).addClass('current');
                return false;
            });
        }
    }
}
function arlo_tm_projects() {
    "use strict";
    jQuery('.arlo_tm_portfolio_animation_wrap').each(function() {
        jQuery(this).on('mouseenter', function() {
            if (jQuery(this).data('title')) {
                jQuery('.arlo_tm_portfolio_titles').html(jQuery(this).data('title') + '<span class="work__cat">' + jQuery(this).data('category') + '</span>');
                jQuery('.arlo_tm_portfolio_titles').addClass('visible');
            }
            jQuery(document).on('mousemove', function(e) {
                jQuery('.arlo_tm_portfolio_titles').css({
                    left: e.clientX - 10,
                    top: e.clientY + 25
                });
            });
        }).on('mouseleave', function() {
            jQuery('.arlo_tm_portfolio_titles').removeClass('visible');
        });
    });
}
function arlo_tm_isotope() {
    "use strict";
    jQuery('.masonry').isotope({
        itemSelector: '.masonry_item',
        masonry: {}
    });
}
function arlo_tm_contact_form() {
    "use strict";
    jQuery(".contact_form #send_message").on('click', function() {
        var name = jQuery(".contact_form #name").val();
        var email = jQuery(".contact_form #email").val();
        var message = jQuery(".contact_form #message").val();
        var subject = jQuery(".contact_form #subject").val();
        var success = jQuery(".contact_form .returnmessage").data('success');
        jQuery(".contact_form .returnmessage").empty();
        if (name === '' || email === '' || message === '') {
            jQuery('div.empty_notice').slideDown(500).delay(2000).slideUp(500);
        } else {
            jQuery.post("modal/contact.php", {
                ajax_name: name,
                ajax_email: email,
                ajax_message: message,
                ajax_subject: subject
            }, function(data) {
                jQuery(".contact_form .returnmessage").append(data);
                if (jQuery(".contact_form .returnmessage span.contact_error").length) {
                    jQuery(".contact_form .returnmessage").slideDown(500).delay(2000).slideUp(500);
                } else {
                    jQuery(".contact_form .returnmessage").append("<span class='contact_success'>" + success + "</span>");
                    jQuery(".contact_form .returnmessage").slideDown(500).delay(4000).slideUp(500);
                }
                if (data === "") {
                    jQuery("#contact_form")[0].reset();
                }
            });
        }
        return false;
    });
}
function arlo_tm_location() {
    var button = jQuery('.href_location');
    button.on('click', function() {
        var element = jQuery(this);
        var address = element.text();
        address = address.replace(/\ /g, '+');
        var text = 'https://maps.google.com?q=';
        window.open(text + address);
        return false;
    });
}
function arlo_tm_ripple() {
    "use strict";
    jQuery('#ripple').ripples({
        resolution: 500,
        dropRadius: 20,
        perturbance: 0.04
    });
}
$(".glitch").mgGlitch({
    destroy: false,
    glitch: true,
    scale: true,
    blend: true,
    blendModeType: "hue",
    glitch1TimeMin: 200,
    glitch1TimeMax: 400,
    glitch2TimeMin: 10,
    glitch2TimeMax: 100
});
function arlo_tm_videoplayer() {
    "use strict";
    $(".youtube-bg").mb_YTPlayer();
}
function arlo_tm_about_animation() {
    "use strict";
    if ($('.parallax').length > 0) {
        var scene = $('.parallax').get(0);
        var parallax = new Parallax(scene,{
            relativeInput: true,
            onReady: function() {
                console.log('ready!');
            }
        });
    }
}
