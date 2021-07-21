
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
    console.log(1212);
});


