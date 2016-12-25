ob.pages.list = {
	go: function() {
		var i = $$('.searchbar input.search-on-list');
		var q = i.val();
		this.realod(q, '', '');
		i.blur();
	},
	reload: function( q, c, r ) {
		ob.pages.list.container.find('.ob-list').html('');
		fw.detachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
		this.q = q;
		this.c = c;
		this.r = r;
		var i = $$('.searchbar input.search-on-list');
		if(q || c || r) {
			ob.pages.list.container.find('.ob-list').append('<p><span class="progressbar-infinite"></span></p>');
			ob.pages.list.find(true);
			ob.pages.list.container.find('.infinite-scroll').on('infinite', function () {
				ob.pages.list.find(false);
			});
		} else {
			i.trigger('click');
		}
	},
	loading: false,
	pageOffset: 0,
	pageSize: 20,
	q: '',
	c: '',
	r: '',
	find: function( initial ) {
		if(initial) {
			ob.pages.list.loading = false;
			ob.pages.list.pageOffset = 0;
			ob.pages.list.pageSize = 20;
			fw.attachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
		}
		if(ob.pages.list.loading) {
			return;
		}
		ob.pages.list.loading = true;
		ob.ajax({
			url: ob.url('/a/catalog/Item.List'),
			method: 'GET',
			data: {
				q: this.q,
				c: this.c,
				r: this.r,
				pageSize: ob.pages.list.pageSize,
				pageOffset: ob.pages.list.pageOffset
			},
			success: function(dt) {
				ob.pages.list.pageOffset += ob.pages.list.pageSize;
				var itemlist = JSON.parse(dt);
				if(typeof itemlist.data === 'object') {
					if(initial) {
						ob.pages.list.container.find('.ob-list').html('');
						if(itemlist.data.length > 0) {
							ob.pages.list.container.find('.ob-list').append('<ul></ul>');
						} else {
							ob.pages.list.container.find('.ob-list').append('<div><span>There is no item matching the keyword!</span></div>');
						}
					}
					for(var index = 0; index < itemlist.data.length; index++) {
						var e = $$(
							'<li>' +
								'<div class="ob-item">' +
									'<a href="#" class="item-link item-content">' +
										'<div class="item-media"><img src="images/image-placeholder.png" class="lazy lazy-fadein" width="80" height="80"></img></div>' +
										'<div class="item-inner">' +
											'<div class="item-title-row">' +
												'<div class="item-title"></div>' +
												'<div class="item-after price"></div>' +
											'</div>' +
											'<div class="item-subtitle">' +
												'<div class="promo"><span class="icon"></span><span class="desc"></span></div>' +
												'<div class="category"></div>' +
												'<div class="brand"></div>' +
											'</div>' +
										'</div>' +
									'</a>' +
								'</div>' +
							'</li>'
						);
						e.find('.item-title').text(itemlist.data[index].name);
						e.find('.price').text(!itemlist.data[index].promo_price ? itemlist.data[index].price : itemlist.data[index].promo_price);
						if(itemlist.data[index].promo_name) {
							e.find('.promo > .desc').text(itemlist.data[index].promo_name);
						} else {
							e.find('.promo').remove();
						}
						if(itemlist.data[index].thumbnail) {
							var img = ob.url('/images/' + itemlist.data[index].thumbnail + '-80x80.PNG');
							e.find('img').attr('data-src', img);
							e.find('a').data('id', itemlist.data[index].id).data('img', img);
						} else {
							e.find('a').data('id', itemlist.data[index].id);
						}
						e.find('a').on('click', function() {
							var img = $$(this).data('img');
							var url = 'pages/item.html?id=' + $$(this).data('id'); 
							if(img) {
								url += ( '&img=' + escape(img) );
							}
							ob.mainView.router.load({
								url: url
							});
							return false;
						});
						ob.pages.list.container.find('.ob-list ul').append(e);
					}
					if(itemlist.data.length < ob.pages.list.pageSize) {
						fw.detachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
					}
				} else {
					fw.detachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
				}
				fw.initImagesLazyLoad(ob.pages.list.container);
				ob.pages.list.loading = false;
			},
			error: function(xhr, code) {
				if(code === 403) {
					fw.loginScreen();
				} else {
					ob.error(code);
				}
			}
		});
	}
};

fw.onPageInit('list', function( page ) {
	ob.pages.list.container = $$(page.container);
});
fw.onPageAfterAnimation('list', function( page ) { 
	ob.toolbar.init();
	if(!ob.pages.list.q) {
		var i = $$('.searchbar input.search-on-list');
		i.trigger('click');
	}
});
