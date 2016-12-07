ob.cart = {
	skus: [],
	init: function() {
		var cache = window.localStorage.getItem('cart');
		if(cache) {
			this.skus = JSON.parse(cache);
		}
		this.flush();
		$$('.toolbar .cart').on('click', function() {
			ob.mainView.router.load({
				url: 'pages/cart.html'
			});
			return false;
		});
		$$('.toolbar .add').on('click', function() {
			if(ob.pages.item) {
				if(ob.pages.item.sku) {
					ob.cart.add(ob.pages.item.sku, 1);
				} else {
					var code = ob.pages.item.container.find('.ob-item .detail .spec > ul').find('.item-title').text();
					if(code) {
						fw.alert('Please select ' + code + ' for this item.');
					} else {
						fw.alert('Please select item specification!');
					}
				}
			}
			return false;
		});
	},
	add: function( skuId, qty ) {
		if(qty > 0) {
			var existing = false;
			for(var index=this.skus.length - 1; index>=0; index--) {
				var item = this.skus[index];
				if(item.skuId === skuId) {
					item.qty += qty;
					existing = true;
					break;
				}
			}
			if(!existing) {
				this.skus.push({
					skuId: skuId,
					qty: qty
				});
			}
			this.flush();
		}
	},
	update: function( skuId, qty ) {
		if(qty > 0) {
			var existing = false;
			for(var index=this.skus.length - 1; index>=0; index--) {
				var item = this.skus[index];
				if(item.skuId === skuId) {
					item.qty = qty;
					existing = true;
					break;
				}
			}
			if(!existing) {
				this.skus.push({
					skuId: skuId,
					qty: qty
				});
			}
			this.flush();
		}
	},
	flush: function() {
		window.localStorage.setItem('cart', JSON.stringify(this.skus));
		$$('.toolbar .cart .badge').text(this.skus.length);
	}
};

ob.pages.cart = {
	init: function( page ) {
		ob.pages.cart.container = $$(page.container);
		if(ob.cart.skus.length > 0) {
			ob.pages.cart.container.find('.ob-item .loading').append('<p><span class="progressbar-infinite"></span></p>');
			var skus = '';
			for(var index=ob.cart.skus.length - 1; index>=0; index--) {
				var item = ob.cart.skus[index];
				skus = skus + ',' + item.skuId;
			}
			ob.ajax({
				url: ob.url('/a/shopping/CartForApps.List'),
				method: 'GET',
				data: {
					skus: skus
				},
				success: function(dt) {
					console.log(dt);
					try {
						var json = JSON.parse(dt);
						ob.pages.cart.show(json);
					} catch(e) {
						ob.error(e);
					}
				},
				error: function(xhr, e) {
					ob.error(e);
				}
			});
		} else {
			this.show({
				count: 0,
				data: {}
			});
		}
		$$('.toolbar .checkout').on('click', function() {
			return false;
		});
		$$('.toolbar .label-checkbox > input[type="checkbox"]').on('change', function() {
			ob.pages.cart.selectAll(this.checked);
			return false;
		});
	},
	selectAll: function( checked ) {
		if(checked) {
			$$('.ob-list .ob-item input[type="checkbox"]').prop('checked', true);
		} else {
			$$('.ob-list .ob-item input[type="checkbox"]').prop('checked', false);
		}
		ob.pages.cart.calculate();
	},
	calculate: function() {
		var count = 0;
		var amount = 0;
		ob.pages.cart.container.find('.ob-list .ob-item').each(function() {
			if($$(this).find('input[type="checkbox"]').prop('checked')) {
				var i = $$(this).find('input.qty');
				var q = parseInt(i.val(), 10);
				if(q > 0) {
					count ++;
					amount += q * i.data('price');
				}
			}
		});
		$$('.toolbar .cart-selected .cart-total').text(ob.currency(amount));
		var ctxt = '';
		if(count>0) {
			if(count > 1) {
				ctxt = count + ' items';
			} else {
				ctxt = '1 item';
			}
		}
		$$('.toolbar .checkout .item-count').text(ctxt);
	},
	show: function( json ) {
		if(typeof json.count === 'number' && typeof json.data === 'object' && json.count > 0) {
			ob.pages.cart.container.find('.ob-item .loading').remove();
			ob.pages.cart.container.find('.ob-list').append('<ul></ul>');
			for(var index=ob.cart.skus.length - 1; index>=0; index--) {
				var item = ob.cart.skus[index];
				var qty = item.qty;
				for(var i = 0; i < json.data.length; i++) {
					if(item.skuId === json.data[i]['k.skuId']) {
						item = json.data[i];
						item.qty = qty;
						break;
					}
				}
				if(!item['k.skuId']) {
					continue;
				}
				var e = $$('<li><div class="ob-item"><label class="label-checkbox item-content"><input type="checkbox"></input><div class="item-media"><i class="icon icon-form-checkbox"></i><a href="#" class="after-checkbox item-link-real"><img src="images/image-placeholder.png" class="lazy lazy-fadein" width="80" height="80"></img></a></div><div class="item-inner"><div class="item-title-row"><div class="item-title"><a href="#" class="item-link-real"></a></div><div class="item-after price"></div></div><div class="item-subtitle"><div class="promo"><span class="icon"></span><span class="desc"></span></div><div class="category"></div><div class="brand"></div></div><div class="item-title-row"><div class="item-title"></div><div class="item-after"><input type="number" class="qty"></input></div></div></div></label></div></li>');
				e.find('.item-title').find('a').text(item['i.displayName'] ? item['i.displayName'] : item['t.itemName']);
				e.find('.price').text(ob.currency(item['k.price']));
				if(item['ph.promotionId']) {
					e.find('.promo > .desc').text(item['ph.promotionName']);
				} else {
					e.find('.promo').remove();
				}
				if(item['i.pictureURL']) {
					var img = ob.url('/images/' + item['i.pictureURL'] + '-80x80.PNG');
					e.find('img').attr('data-src', img);
					e.find('a.item-link-real').data('id', item['t.itemId']).data('img', img);
				} else {
					e.find('a.item-link-real').data('id', item['t.itemId']);
				}
				e.find('input.qty')
					.data('skuid', item['k.skuId'])
					.data('price', item['k.price'])
					.val(item.qty)
					.on('change', function() {
						$$(this).val(parseInt($$(this).val(), 10));
						ob.cart.update($$(this).data('skuid'), $$(this).val());
						ob.pages.cart.calculate();
					});
				e.find('a.item-link-real').on('click', function() {
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
				e.find('input[type="checkbox"]').on('change', function() {
					ob.pages.cart.calculate();
				});
				ob.pages.cart.container.find('.ob-list ul').append(e);
			}
		} else {
			ob.pages.cart.container.find('.ob-item .loading').html('').append('<div><span>fail to get item info</span></div>');
		}
	}
};

fw.onPageInit('cart', function (page) {
	ob.pages.cart.init(page);
	ob.toolbar.init();
});

fw.onPageAfterAnimation('cart', function (page) { 
	
});
