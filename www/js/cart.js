ob.cart = {
	skus: [],
	init: function(page) {
		var cache = window.localStorage.getItem('cart');
		if(cache) {
			this.skus = JSON.parse(cache);
		}
		this.flush();
		var toolbar_showcart = function() {
			if(!ob.mainView.allowPageChange) {
				ob.log('showme: allowPageChange=false;');
				ob.mainView.allowPageChange = true;
			}
			ob.mainView.router.load({
				url: 'pages/cart.html'
			});
			return false;
		};
		var toolbar_addcart = function() {
			if(ob.pages.item) {
				if(ob.pages.item.sku) {
					ob.cart.add(ob.pages.item.sku, 1);
					ob.cart.animate(ob.pages.item.container.find('.main-img'), $('.toolbar .cart'));
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
		};
		$('.toolbar .cart').off('click', toolbar_showcart);
		$('.toolbar .add').off('click', toolbar_addcart);
		if(page && page.name) {
			$('div.page').each(function() {
				if($(this).data('page') === page.name) {
					$(this).find('.toolbar .cart').on('click', toolbar_showcart);
					$(this).find('.toolbar .add').on('click', toolbar_addcart);
				}
			});
		}
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
	cleanup: function( v ) {
		for(var index=0; index<v.length; index++) {
			for(var j=0; j<this.skus.length; j++) {
				if(v[index].skuId === this.skus[j].skuId) {
					this.skus.splice(j, 1);
					break;
				}
			}
		}
		this.flush();
	},
	flush: function() {
		window.localStorage.setItem('cart', JSON.stringify(this.skus));
		$('.toolbar .cart .badge').text(this.skus.length);
	},
	animate: function( flyer, flyingTo ) {
		var $func = $(this);
		var divider = 3;
		var flyerClone = $(flyer).clone();
		$(flyerClone).css({position: 'absolute', top: $(flyer).offset().top + "px", left: $(flyer).offset().left + "px", opacity: 1, 'z-index': 99999});
		$('body').append($(flyerClone));
		var gotoX = $(flyingTo).offset().left + ($(flyingTo).width() / 2) - ($(flyer).width()/divider)/2;
		var gotoY = $(flyingTo).offset().top + ($(flyingTo).height() / 2) - ($(flyer).height()/divider)/2;

		$(flyerClone).animate({
			opacity: 0.4,
			left: gotoX,
			top: gotoY,
			width: $(flyer).width()/divider,
			height: $(flyer).height()/divider
		}, 700,
		function () {
			$(flyingTo).fadeOut('fast', function () {
				$(flyingTo).fadeIn('fast', function () {
					$(flyerClone).fadeOut('fast', function () {
						$(flyerClone).remove();
					});
				});
			});
		});
	}
};

ob.pages.cart = {
	init: function( page ) {
		ob.pages.cart.container = $(page.container);
		if(ob.cart.skus.length > 0) {
			ob.pages.cart.container.find('.loading').append('<p><span class="progressbar-infinite"></span></p>');
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
					// console.log(dt);
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
				noerror: true,
				data: {}
			});
		}
		$('.toolbar .checkout').on('click', function() {
			ob.pages.cart.checkout(this);
			return false;
		});
		$('.toolbar .label-checkbox > input[type="checkbox"]').on('click change', function() {
			ob.pages.cart.selectAll(this.checked);
			return true;
		});
	},
	selectAll: function( checked ) {
		if(checked) {
			$('.ob-list .ob-item input[type="checkbox"]').prop('checked', true);
		} else {
			$('.ob-list .ob-item input[type="checkbox"]').prop('checked', false);
		}
		ob.pages.cart.calculate();
	},
	calculate: function() {
		var count = 0;
		var amount = 0;
		ob.pages.cart.container.find('.ob-list .ob-item').each(function() {
			if($(this).find('input[type="checkbox"]').prop('checked')) {
				var i = $(this).find('input.qty');
				var q = parseInt(i.val(), 10);
				if(q > 0) {
					count ++;
					amount += q * i.data('price');
				}
			}
		});
		$('.toolbar .cart-selected .cart-total').text(ob.currency(amount));
		var ctxt = '';
		if(count>0) {
			if(count > 1) {
				ctxt = count + ' items';
			} else {
				ctxt = '1 item';
			}
			$('.toolbar .checkout').removeClass('btn-disable');
		} else {
			$('.toolbar .checkout').addClass('btn-disable');
		}
		$('.toolbar .checkout .item-count').text(ctxt);
	},
	show: function( json ) {
		if(typeof json.count === 'number' && typeof json.data === 'object' && json.count > 0) {
			ob.pages.cart.container.find('.loading').remove();
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
					ob.cart.skus.splice(index, 1);
					ob.cart.flush();
					continue;
				}
				var e = $(
					'<li class="swipeout">' + 
						'<div class="ob-item swipeout-content">' + 
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
										'<div class="spec"></div>' +
										'<div class="promo"><span class="icon"></span><span class="desc"></span></div>' + 
										'<div class="category"></div>' + 
										'<div class="brand"></div>' + 
									'</div>' + 
									'<div class="item-title-row">' + 
										'<div class="item-title">' + 
											'<div class="price"></div>' + 
										'</div>' + 
										'<div class="item-after">' + 
											'<a href="#" class="minus"><i class="icon f7-icons">delete</i></a><input type="number" class="qty"></input><a href="#" class="plus"><i class="icon f7-icons">add</i></a>' + 
										'</div>' + 
									'</div>' + 
								'</div>' + 
							'</div>' + 
						'</div>' + 
						'<div class="swipeout-actions-right">' +
							'<a href="#" class="action1 bg-red ob-item-remove"><i class="icon f7-icons">delete_round</i><span>Remove</span></a>' + 
						'</div>' + 
					'</li>'
				);
				var itemName = item['i.displayName'] ? item['i.displayName'] : item['t.itemName'];
				e.find('.item-title').find('a').text(itemName);
				e.find('.price').text(ob.$ + ' ' + ob.currency(item['k.price']));
				if(item['ph.promotionId']) {
					e.find('.promo > .desc').text(item['ph.promotionName']);
				} else {
					e.find('.promo').remove();
				}
				if(item['i.pictureURL']) {
					var img = ob.url('/images/' + item['i.pictureURL'] + '-80x80.PNG');
					e.find('img').attr('data-src', img).attr('data-rel', 'external');
					e.find('a.item-link-real').data('id', item['t.itemId']).data('img', img);
				} else {
					e.find('a.item-link-real').data('id', item['t.itemId']);
				}
				if(item['c.specValue'] && item['c.specValue']!=='-') {
					e.find('.spec').text(item['c.specValue']);
				}
				if(item['r.brandName'] && item['r.brandName']!=='NA' && item['r.brandName']!=='N/A' && itemName.indexOf(item['r.brandName']) < 0) {
					e.find('.brand').text(item['r.brandName']);
				}
				e.find('input.qty')
					.data('skuid', item['k.skuId'])
					.data('price', item['k.price'])
					.val(item.qty)
					.on('change', function() {
						var v = parseInt($(this).val(), 10);
						if(v >= 9999) {
							v = 9999;
							$(this).parent().find('.plus').attr('disabled', 'disabled');
						} else {
							$(this).parent().find('.plus').removeAttr('disabled');
						}
						if(v <= 1) {
							v = 1;
							$(this).parent().find('.minus').attr('disabled', 'disabled');
						} else {
							$(this).parent().find('.minus').removeAttr('disabled');
						}
						$(this).val(v);
						ob.cart.update($(this).data('skuid'), $(this).val());
						ob.pages.cart.calculate();
					});
				if(item.qty <= 1) {
					e.find('.minus').attr('disabled', 'disabled');
				}
				if(item.qty >= 9999) {
					e.find('.plus').attr('disabled', 'disabled');
				}
				e.find('.plus').on('click', function() {
					var q = $(this).parent().find('input.qty');
					var v = parseInt(q.val(), 10) + 1;
					if(v<10000) {
						q.val(v).trigger('change');
					}
					return false;
				});
				e.find('.minus').on('click', function() {
					var q = $(this).parent().find('input.qty');
					var v = parseInt(q.val(), 10) - 1;
					if(v>0) {
						q.val(v).trigger('change');
					}
					return false;
				});
				e.find('a.item-link-real').on('click', function() {
					var img = $(this).data('img');
					var url = 'pages/item.html?id=' + $(this).data('id'); 
					if(img) {
						url += ( '&img=' + escape(img) );
					}
					ob.mainView.router.load({
						url: url
					});
					return false;
				});
				e.find('input[type="checkbox"]').on('click change', function() {
					var checkall = true;
					$('.ob-list .ob-item input[type="checkbox"]').each(function() {
						if(!$(this).prop('checked')) {
							checkall = false;
						}
					});
					$('.toolbar .label-checkbox > input[type="checkbox"]').prop('checked', checkall);
					ob.pages.cart.calculate();
					return true;
				});
				e.find('a.ob-item-remove').data('id', item['k.skuId']);
				e.find('a.ob-item-remove').on('click', function() {
					ob.cart.cleanup([{
						skuId: $(this).data('id')
					}]);
					fw.swipeoutDelete($(this).parents('li.swipeout')[0], function() {
						ob.pages.cart.calculate();
						if(ob.pages.cart.container.find('.ob-list').find('ul').children().length <= 1 && ob.cart.skus.length === 0) {
							ob.pages.cart.container.find('.ob-cart-empty').show();
						}
					});
				});
				e.on('taphold', function() {
					fw.swipeoutOpen(this, 'right');
				});
				ob.pages.cart.container.find('.ob-list ul').append(e);
				e.find('input.qty').css('height', e.find('.plus').outerHeight() + 'px');
			}
			if(ob.pages.cart.container.find('.ob-list').find('ul').children().length > 5) {
				ob.pages.cart.container.find('.ob-cart-head').remove();
				ob.pages.cart.container.find('.ob-cart-empty').hide();
			} else if(ob.pages.cart.container.find('.ob-list').find('ul').children().length === 0) {
				ob.pages.cart.container.find('.ob-cart-empty').show();
			} else {
				ob.pages.cart.container.find('.ob-cart-empty').hide();
			}
			fw.initImagesLazyLoad(ob.pages.cart.container);
		} else if(json.noerror) {
			ob.pages.cart.container.find('.loading').remove();
			ob.pages.cart.container.find('.ob-cart-empty').show();
		} else {
			ob.pages.cart.container.find('.loading').html('').append('<div><span>fail to get item info</span></div>');
		}
	},
	checkout: function( t ) {
		var btn = $(t);
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
			if($(this).find('input[type="checkbox"]').prop('checked')) {
				var i = $(this).find('input.qty');
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
});

fw.onPageAfterAnimation('cart', function (page) { 
	ob.toolbar.init(page);
});
