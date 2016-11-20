ob.pages.item = {
};

fw.onPageInit('item', function (page) {
	ob.pages.item.container = $$(page.container);
	if(page.query.img) {
		ob.pages.item.container.find('.ob-item .main-img').attr('src', unescape(page.query.img));
	}
	var itemId = page.query.id;
	ob.pages.item.container.find('.ob-item .loading').append('<p><span class="progressbar-infinite"></span></p>');
	try {
		$$.ajax({
			url: ob.url('/a/catalog/ItemForApps'),
			method: 'GET',
			timeout: 20000,
			data: {
				't.itemId': itemId
			},
			success: function(dt) {
				console.log(dt);
				ob.pages.item.container.find('.ob-item .loading').remove();
				var json = JSON.parse(dt);
				if(json.status === 'success') {
					var info = JSON.parse(json.data['t.info']);
					var prices = JSON.parse(json.data['t.prices']);
					ob.pages.item.container.find('.ob-item .detail .title').append($$('<span></span>').append(info['i.displayName'] ? info['i.displayName'] : info['t.itemName']));
					var images = new Array();
					if(info['i.pictureURL']) {
						images.push(info['i.pictureURL']);
					}
					if(info.sku) {
						for(var index=0; index<info.sku.length; index++) {
							if(info.sku[index]['k.pictureURL']) {
								images.push(info.sku[index]['k.pictureURL']);
							}
						}
					}
					if(images.length === 1) {
						ob.pages.item.container.find('.ob-item .main-img').find('img').attr('src', ob.url('/images/' + images[0] + '.PNG'));
					} else if(images.length > 1) {
						var swiper = '<div class="swiper-container"><div class="swiper-wrapper">';
						for(var index=0; index<images.length; index++) {
							swiper += ( '<div class="swiper-slide"><img src="' + ob.url('/images/' + images[index] + '.PNG') + '"></img></div>' );
						}
						swiper += '</div></div>';
						ob.pages.item.container.find('.ob-item .main-img').html('').append(swiper);
						fw.swiper('.ob-item .main-img .swiper-container');
					}
					ob.pages.item.container.find('.ob-item .detail').show();
				} else {
					ob.pages.item.container.find('.ob-item .loading').append('<div><span>fail to get item info</span></div>');
				}
			},
			error: function(xhr, e) {
				ob.error(e);
			}
		});
	} catch(err) {
		ob.error(err);
	}
});
