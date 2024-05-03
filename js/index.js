
$(document).ready(function() {
	try {
		$('main').ripples({
			resolution: 500,
			dropRadius: 20, //px
			perturbance: 0.05,
			interactive: true,
            waterbody:0.04

		});
	}
	catch (e) {
		$('.error').show().text(e);
		$('body').ripples("destroy");
	}
    console.log("Don't play with my code :)");
});

// $('.owl-carousel').owlCarousel({
//     animateOut: 'slideOutDown',
//     animateIn: 'flipInX',
//     items:1,
//     margin:30,
//     stagePadding:30,
//     smartSpeed:450
// });

$(document).ready(function(){
	$(".owl-carousel").owlCarousel({
	items:1,
    margin:0,
    autoHeight:true,
	autoplay: true,
	autoPlaySpeed: 1,
	autoPlayTimeout: 50,
		autoplayHoverPause: false,
		nav: true,
		loop: true,
	

	});
  });
  function notpermitted(){
	setTimeout(alert("Sir you are not permitted to click this!"),500)
	
  }

  function opasity(){
	var w = window.innerWidth;
	console.log(window.screenY);
	console.log(w);
	if(window.screenY<=w){
		document.getElementById("navbar").style.background = "rgba(0, 0, 0, 0.212);";
		
	}else{
		document.getElementById("navbar").style.background = "rgba(0, 0, 0, 1);";
	}
  }

  setInterval(() => {
	console.log('farhan');
  }, 500);
 