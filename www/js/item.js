ob.pages.item = {
	init: function() {
		this.prices = {};
		this.sku = null;
		this.priceRange = '-';
	},
	prices: {},
	show: function( json ) {
		if(json.status === 'success') {
			ob.pages.item.container.find('.ob-item .loading').remove();
			var info = JSON.parse(json.data['t.info']);
			ob.pages.item.container.find('.ob-item .detail .title > .name').append($$('<span></span>').append(info['i.displayName'] ? info['i.displayName'] : info['t.itemName']));
			var images = new Array();
			if(info['i.pictureURL']) {
				images.push(info['i.pictureURL']);
			}
			for(var index=0; index<info.sku.length; index++) {
				if(info.sku[index]['k.pictureURL']) {
					images.push(info.sku[index]['k.pictureURL']);
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
			var prices = JSON.parse(json.data['t.prices']);
			var itemid = info['t.itemId'];

			var minprice = -1;
			var maxprice = -1;
			var hasprice = false;
			var discount = 0;
			var promoprice = 0;
			var haspromo = false;
			var promo = info['t.promo'];
			if(typeof promo === 'string') {
				try {
					promo = JSON.parse(promo);
					promo = promo[itemid];
					if(typeof promo === 'object' && typeof promo.id === 'string') {
						ob.pages.item.container.find('.ob-item .detail .title > .promo').html(promo.desc ? promo.desc : promo.name);
						if(promo.minqty > 1) {
							ob.pages.item.container.find('.ob-item .detail .title > .promo').append('<div class="tc"><span>' + '* applicable to order minimum ' + ob.quantity(promo.minqty) + '</span></div>');
						}
						if(promo.type === 'Discount Rate' && promo.value > 0 && promo.value < 100) {
							discount = promo.value;
							haspromo = true;
						} else if(promo.type === 'Special Price' && promo.value > 0) {
							promoprice = promo.value;
							haspromo = true;
						}
						var focs = promo.focs;
						if(focs.length > 0) {
							var ul = $('<ul></ul>');
							ob.pages.item.container.find('.ob-item .detail .price > .promo').append(ul);
							ul.append('<li><div><span>FOC:</span></div></li>');
							for(var index=0; index<focs.length; index++) {
								var li = $$('<li></li>');
								var img = $$('<img></img>');
								if(focs[index].pictureURL) {
									img.attr('src', ob.url('/images/' + focs[index].pictureURL + '-36x36.PNG'));
								} else {
									img.attr('src', 'images/image-placeholder.png');
								}
								li.append(img);
								li.append('<span>x' + focs[index].qty + '</span>');
								ul.append(li);
							}
							ul.append('<li><span>(while stocks last)</span></li>');
						}
					}
				} catch(e) {}
			}
			for(var index=0; index<info.sku.length; index++) {
				var entry = info.sku[index];
				if(entry['sku.checked']) {
					var skuId = entry['k.skuId'];
					var price = entry['k.price'];
					if(haspromo) {
						if(discount>0) {
							price = price * (100 - discount) / 100.00;
						} else if(price > promoprice) {
							price = promoprice;
						}
					}
					ob.pages.item[skuId] = price;
					if(!hasprice) {
						minprice = maxprice = price;
						hasprice = true;
					} else if(price < minprice) {
						minprice = price;
					} else if(price > maxprice) {
						maxprice = price;
					}
				}
			}
			if(hasprice) {
				if(minprice !== maxprice) {
					ob.pages.item.priceRange = ob.currency(minprice) + ' - ' + ob.currency(maxprice);
				} else {
					ob.pages.item.priceRange = ob.currency(minprice);
				}
			} else {
				ob.pages.item.priceRange = '-';
			}
			if(haspromo) {
				ob.pages.item.container.find('.ob-item .detail .price > .up > .lbl').text('Promotional Price:');
			} else {
				ob.pages.item.container.find('.ob-item .detail .price > .up > .lbl').text('Price:');
			}
			ob.pages.item.container.find('.ob-item .detail .price > .up > .val').text(ob.pages.item.priceRange);

			var specList = ob.pages.item.container.find('.ob-item .detail .spec > ul');
			if(info.sku.length === 1) {
				ob.pages.item.sku = info.sku[0]['k.skuId'];
				specList.html('');
			} else {
				specList.find('.item-title').text(info.sku[0]['c.specCode']);
				specList.find('.item-after').text('Select');
				for(var index=0; index<info.sku.length; index++) {
					var opt = $$('<option></option>');
					opt.attr('value', info.sku[index]['k.skuId']);
					opt.text(info.sku[index]['c.specValue']);
					specList.find('select').append(opt);
				}
				specList.find('select').on('change', function() {
					var skuId = $$(this).val();
					ob.pages.item.sku = skuId;
					ob.pages.item.container.find('.ob-item .detail .price > .up > .val').text(ob.pages.item.prices[skuId]);
				});
				/*
				var choose = $$('<a href="#"><span></span></a>');
				choose.find('span').text('Select ' + info.sku[0]['c.specCode']);
				ob.pages.item.container.find('.ob-item .detail .spec').append(choose);
				var options = new Array();
				for(var index=0; index<info.sku.length; index++) {
					options.push({
						text: info.sku[index]['c.specValue'],
						id: info.sku[index]['k.skuId'],
						onClick: function() {
							choose.find('span').text('Selected ' + this.text);
							ob.pages.item.sku = this.id;
							ob.pages.item.container.find('.ob-item .detail .price > .up > .val').text(ob.pages.item.prices[this.id]);
						}
					});
				}
				choose.on('click', function() {
					fw.closeModal();
					fw.actions(options);
				});
				*/
			}

			ob.pages.item.container.find('.ob-item .detail').show();
		} else {
			ob.pages.item.container.find('.ob-item .loading').html('').append('<div><span>fail to get item info</span></div>');
		}
	}
};

fw.onPageInit('item', function (page) {
	ob.pages.item.container = $$(page.container);
	if(page.query.img) {
		ob.pages.item.container.find('.ob-item .main-img > img').attr('src', page.query.img);
	}
	var itemId = page.query.id;
	ob.pages.item.container.find('.ob-item .loading').append('<p><span class="progressbar-infinite"></span></p>');
	ob.pages.item.prices = {};
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
				try {
					var json = JSON.parse(dt);
					ob.pages.item.show(json);
				} catch(e) {
					ob.error(e);
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
