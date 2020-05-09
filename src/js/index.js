import 'nodelist-foreach-polyfill';
import Swiper from 'swiper/js/swiper.js'; // Called from JS folder due to error in IE11
import 'swiper/css/swiper.css';

import 'bootstrap';
import $ from 'jquery';
import '../style/custom.scss';

function init() {
  $(window).scroll(function(event) {
    var scroll = $(window).scrollTop();
    if (scroll > 1) {
      $('#header').addClass('stickey');
    } else {
      $('#header').removeClass('stickey');
    }
  });
  $('.nav-trigger').click(function() {
    $('#header')
      .stop()
      .toggleClass('menu-open');
  });
  var hasSomeParentTheClass = function(element, classname) {
    if (element.classList && element.classList.contains(classname)) return true;
    return (
      element.parentNode && hasSomeParentTheClass(element.parentNode, classname)
    );
  };
  var hideAllCollapse = function(e) {
    if (!hasSomeParentTheClass(e.target, 'utils')) {
      $('#searchBox, #socialIcons').collapse('hide');
      document.removeEventListener('click', hideAllCollapse);
    }
  };
  $('#searchBox, #socialIcons').on('shown.bs.collapse', function() {
    document.addEventListener('click', hideAllCollapse);
  });
  var slider1 = new Swiper('.swiper-container-text', {
    speed: 600,
    freeMode: true,
    watchSlidesVisibility: true,
    watchSlidesProgress: true,
    allowTouchMove: false
  });
  var slider2 = new Swiper('.swiper-container-img', {
    speed: 1200,
    allowTouchMove: false,
    pagination: {
      el: '.swiper-pagination',
      clickable: true
    },
    thumbs: {
      swiper: slider1
    },
    on: {
      slideChangeTransitionStart: function() {
        document
          .querySelector('#control')
          .setAttribute('data-position-active', this.activeIndex);
      }
    }
  });
}

init();
