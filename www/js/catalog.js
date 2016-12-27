ob.pages.catalog = {
	init: function( page ) {
		ob.pages.catalog.container = $$(page.container);
		ob.pages.catalog.container.find('.ob-catalog .ob-category a').on('click', function() {
			var cid = $$(this).data('cid');
			if(cid) {
				ob.mainView.router.load({
					url: 'pages/list.html?c=' + cid
				});
				return false;
			}
		});
	}
};

fw.onPageInit('catalog', function (page) {
	ob.pages.catalog.init(page);
});

fw.onPageAfterAnimation('catalog', function (page) { 
	ob.toolbar.init(page);
});
