ob.pages.catalog = {
	init: function( page ) {
		ob.pages.catalog.container = $$(page.container);
		var h = (ob.pages.catalog.container.find('.toolbar').offset().top - ob.pages.catalog.container.find('.brands').offset().top - 15);
		ob.pages.catalog.container.find('.brands').css({
			height: ( h < 435 ? 435 : h ) + 'px',
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
