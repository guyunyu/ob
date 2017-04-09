ob.pages.catalog = {
	init: function( page ) {
		ob.pages.catalog.container = $$(page.container);
		ob.pages.catalog.container.find('.brands').css({
			height: (ob.pages.catalog.container.find('.toolbar').offset().top - ob.pages.catalog.container.find('.brands').offset().top - 15) + 'px',
			overflow: 'scroll'
		});
	}
};

fw.onPageInit('catalog', function (page) {
	ob.pages.catalog.init(page);
});

fw.onPageAfterAnimation('catalog', function (page) { 
	ob.toolbar.init(page);
});
