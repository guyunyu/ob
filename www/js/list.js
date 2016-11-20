ob.pages.list = {
	reload: function() {
		ob.pages.list.container.find('.ob-list').html('');
		fw.detachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
		var q = ob.pages.list.container.find('.searchbar').find('input[type="search"]').val();
		if(q) {
			ob.pages.list.container.find('.ob-list').append('<p><span class="progressbar-infinite"></span></p>');
			ob.pages.list.find(q, true);
			ob.pages.list.container.find('.infinite-scroll').on('infinite', function () {
				ob.pages.list.find(q, false);
			});
		} else {
			var popover = '<div class="popover">'
                + '<div class="popover-angle"></div>'
                + '<div class="popover-inner">'
                + '<div class="content-block">'
                + '<p>Please fill in some keyword to find items ...</p>'
                + '</div>'
                + '</div>'
                + '</div>';
			fw.popover(popover, '.searchbar');
		}
	},
	loading: false,
	pageOffset: 0,
	pageSize: 20,
	find: function( q, i ) {
		if(i) {
			ob.pages.list.loading = false;
			ob.pages.list.pageOffset = 0;
			ob.pages.list.pageSize = 20;
		}
		if(ob.pages.list.loading) {
			return;
		}
		ob.pages.list.loading = true;
		try {
			$$.ajax({
				url: ob.url('/a/catalog/Item.List'),
				method: 'GET',
				timeout: 20000,
				data: {
					q: q,
					pageSize: ob.pages.list.pageSize,
					pageOffset: ob.pages.list.pageOffset
				},
				success: function(dt) {
					ob.pages.list.pageOffset += 20;
					var itemlist = JSON.parse(dt);
					if(typeof itemlist.data === 'object') {
						if(i) {
							ob.pages.list.container.find('.ob-list').html('');
							if(itemlist.data.length > 0) {
								ob.pages.list.container.find('.ob-list').append('<ul></ul>');
							} else {
								ob.pages.list.container.find('.ob-list').append('<div><span>There is no item matching the keyword!</span></div>');
							}
						}
						for(var index = 0; index < itemlist.data.length; index++) {
							var e = $$('<li><div class="ob-item"><a href="item.html" class="item-link item-content"><div class="item-media"><img src="images/image-placeholder.png" width="80" height="80"></img></div><div class="item-inner"><div class="item-title-row"><div class="item-title"></div><div class="item-after price"></div></div><div class="item-subtitle"><div class="category"></div><div class="brand"></div></div></div></a></div></li>');
							e.find('.item-title').text(itemlist.data[index].name);
							e.find('.price').text(itemlist.data[index].price);
							if(itemlist.data[index].thumbnail) {
								var img = ob.url('/images/' + itemlist.data[index].thumbnail + '-80x80.PNG');
								e.find('img').attr('src', img);
								e.find('a').attr('href', 'pages/item.html?id=' + itemlist.data[index].id + '&img=' + escape(img));
							} else {
								e.find('a').attr('href', 'pages/item.html?id=' + itemlist.data[index].id);
							}
							ob.pages.list.container.find('.ob-list ul').append(e);
						}
						if(itemlist.data.length < ob.pages.list.pageSize) {
							fw.detachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
						}
					} else {
						fw.detachInfiniteScroll(ob.pages.list.container.find('.infinite-scroll'));
					}
					ob.pages.list.loading = false;
				},
				error: function(xhr, e) {
					ob.error(e);
				}
			});
		} catch(err) {
			ob.error(err);
		}
	}
};

fw.onPageInit('list', function (page) {
	ob.pages.list.container = $$(page.container);
	var q = page.query.q;
	if(!q) {
		q = '';
	}
	ob.pages.list.container.find('.searchbar').find('input[type="search"]').val(q);
	ob.pages.list.reload();
});
