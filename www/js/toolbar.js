ob.toolbar = {
	init: function() {
		ob.cart.init();
		$$('.toolbar .me').on('click', function() {
			ob.mainView.router.load({
				url: 'pages/m/my.html'
			});
			return false;
		});
	}
};