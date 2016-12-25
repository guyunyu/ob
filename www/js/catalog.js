ob.pages.catalog = {
	init: function( page ) {
		ob.pages.catalog.container = $$(page.container);
	}
};

fw.onPageInit('catalog', function (page) {
	ob.pages.catalog.init(page);
});

fw.onPageAfterAnimation('catalog', function (page) { 
	ob.toolbar.init();
});
