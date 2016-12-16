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
				url: ob.url('/a/open/CartForApps.List'),
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
				error: function(xhr, code) {
					if(code === 403) {
						fw.loginScreen();
					} else {
						ob.error(code);
					}
				}
			});
		} else {
			this.show({
				count: 0,
				data: {}
			});
		}
		$$('.toolbar .checkout').on('click', function() {
			ob.pages.cart.checkout(this);
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
			$$('.toolbar .checkout').removeClass('btn-disable');
		} else {
			$$('.toolbar .checkout').addClass('btn-disable');
		}
		$$('.toolbar .checkout .item-count').text(ctxt);
	},
	show: function( json ) {
		if(typeof json.count === 'number' && typeof json.data === 'object' && json.count > 0) {
			ob.pages.cart.container.find('.ob-list .loading').remove();
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
				var e = $$(
					'<li>' + 
						'<div class="ob-item">' + 
							'<div class="item-content">' + 
								'<div class="item-media">' + 
									'<label class="label-checkbox">' + 
										'<input type="checkbox"></input><span class="item-media"><i class="icon icon-form-checkbox"></i></span>' + 
									'</label>' + 
									'<a href="#" class="after-checkbox item-link-real"><img src="images/image-placeholder.png" class="lazy lazy-fadein" width="80" height="80"></img></a>' + 
								'</div>' + 
								'<div class="item-inner">' + 
									'<div class="item-title-row">' + 
										'<div class="item-title"><a href="#" class="item-link-real"></a></div>' + 
									'</div>' + 
									'<div class="item-subtitle">' + 
										'<div class="promo"><span class="icon"></span><span class="desc"></span></div>' + 
										'<div class="category"></div>' + 
										'<div class="brand"></div>' + 
									'</div>' + 
									'<div class="item-title-row">' + 
										'<div class="item-title">' + 
											'<div class="price"></div>' + 
										'</div>' + 
										'<div class="item-after">' + 
											'<button class="minus">-</button><input type="number" class="qty"></input><button class="plus">+</button>' + 
										'</div>' + 
									'</div>' + 
								'</div>' + 
							'</div>' + 
						'</div>' + 
					'</li>'
				);
				e.find('.item-title').find('a').text(item['i.displayName'] ? item['i.displayName'] : item['t.itemName']);
				e.find('.price').text('SGD ' + ob.currency(item['k.price']));
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
				e.find('button.plus').on('click', function() {
					var q = $$(this).parent().find('input.qty');
					var v = parseInt(q.val(), 10) + 1;
					if(v<10000) {
						q.val(v).trigger('change');
					}
					return false;
				});
				e.find('button.minus').on('click', function() {
					var q = $$(this).parent().find('input.qty');
					var v = parseInt(q.val(), 10) - 1;
					if(v>0) {
						q.val(v).trigger('change');
					}
					return false;
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
					var checkall = true;
					$$('.ob-list .ob-item input[type="checkbox"]').each(function() {
						if(!$$(this).prop('checked')) {
							checkall = false;
						}
					});
					$$('.toolbar .label-checkbox > input[type="checkbox"]').prop('checked', checkall);
					ob.pages.cart.calculate();
				});
				ob.pages.cart.container.find('.ob-list ul').append(e);
			}
		} else {
			ob.pages.cart.container.find('.ob-item .loading').html('').append('<div><span>fail to get item info</span></div>');
		}
	},
	checkout: function( t ) {
		var btn = $$(t);
		if(btn.hasClass('btn-disable')) {
			return false;
		}
		if(btn.data('working')) {
			return false;
		}
		btn.data('working', true);
		var release = function( btn ) {
			btn.data('working', false);
			return false;
		};
		var cart = [];
		ob.pages.cart.container.find('.ob-list .ob-item').each(function() {
			if($$(this).find('input[type="checkbox"]').prop('checked')) {
				var i = $$(this).find('input.qty');
				var q = parseInt(i.val(), 10);
				var skuId = i.data('skuid');
				if(skuId && q > 0) {
					cart.push({
						'skuId': skuId,
						'qty': q
					});
				}
			}
		});
		if(cart.length === 0) {
			fw.alert('Please choose items to check out!');
			return release(btn);
		}
		ob.ajax({
			url: ob.url('/a/shopping/CheckoutForApps'),
			method: 'GET',
			data: {
				skus: JSON.stringify(cart)
			},
			success: function(dt) {
				try {
					var json = JSON.parse(dt);
					var next = function( json ) {
						ob.mainView.router.load({
							url: 'pages/checkout.html',
							query: json.data
						});
					};
					if(json.status === 'success') {
						if(!json.data.addrs[0]['addrs.checked']) {
							ob.addr({
								success: function( i ) {
									json.data.addrs[0] = i;
									json.data.addrs[0]['addrs.checked'] = true;
									next(json);
								},
								error: function( e ) {
									ob.error(e);
								}
							});
						} else {
							next(json);
						}
					} else {
						ob.error('It fails to connect Office Buddy.')
					}
				} catch(e) {
					ob.error(e);
				}
				release(btn);
			},
			error: function(xhr, code) {
				if(code === 403) {
					fw.loginScreen();
				} else {
					ob.error(code);
				}
				release(btn);
			}
		});
		return true;
	}
};

fw.onPageInit('cart', function (page) {
	ob.pages.cart.init(page);
	ob.toolbar.init();
});

fw.onPageAfterAnimation('cart', function (page) { 
	
});
