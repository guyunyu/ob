ob.pages.checkout = {
	init: function( page ) {
		ob.pages.checkout.container = $(page.container);
		ob.pages.checkout.data = page.query;
		ob.pages.checkout.container.find('.ob-address .head .add > a').on('click', function() {
			ob.addr({
				success: function( a ) {
					ob.pages.checkout.merge(a);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
		});
		$('.toolbar .confirm-order').on('click', function() {
			ob.pages.checkout.order();
			return false;
		});
		this.show();
	},
	merge: function( i ) {
		var isnew = true;
		for(var j=0; j<ob.pages.checkout.data.addrs.length; j++) {
			var a = ob.pages.checkout.data.addrs[j];
			if(i['a.addressId'] === a['a.addressId']) {
				ob.pages.checkout.data.addrs[j] = i;
				ob.pages.checkout.container.find('div.ob-address > .swiper-container > .swiper-wrapper > div.swiper-slide').each(function() {
					if($(this).find('a.edit').data('id') === i['a.addressId']) {
						ob.pages.checkout.fillAddr($(this), i);
					}
				});
				isnew = false;
				break;
			}
		}
		if(isnew) {
			ob.pages.checkout.data.addrs.push(i);
			ob.pages.checkout.container.find('div.ob-address > .swiper-container > .swiper-wrapper').children().remove();
			for(var index=0; index<ob.pages.checkout.data.addrs.length; index++) {
				var item = ob.pages.checkout.data.addrs[index];
				ob.pages.checkout.insertAddr(item);
			}
			if(ob.pages.checkout.container.find('div.ob-address > .swiper-container > .swiper-wrapper > .swiper-slide').length > 1) {
				var w = fw.swiper(ob.pages.checkout.container.find('.swiper-container'), {
					pagination:'.swiper-pagination'
				});
				for(var index=0; index<ob.pages.checkout.data.addrs.length; index++) {
					w.slideNext();
				}
			}
		}
	},
	show: function() {
		var json = ob.pages.checkout.data;
		for(var index=0; index<json.addrs.length; index++) {
			var item = json.addrs[index];
			if(!item['addrs.checked']) {
				continue;
			}
			this.insertAddr(item);
		}
		if(ob.pages.checkout.container.find('div.ob-address > .swiper-container > .swiper-wrapper > .swiper-slide').length > 1) {
			fw.swiper(ob.pages.checkout.container.find('.swiper-container'), {
				pagination:'.swiper-pagination'
			});
		}
		ob.pages.checkout.container.find('.ob-list').append('<ul></ul>');
		for(var index=0; index<json.cart.length; index++) {
			var item = json.cart[index];
			if(!item['cart.checked']) {
				continue;
			}
			var e = $(
				'<li>' + 
					'<div class="ob-item">' + 
						'<div class="item-content">' + 
							'<div class="item-media">' + 
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
										'<div class="qty"></div>' + 
									'</div>' + 
								'</div>' + 
							'</div>' + 
						'</div>' + 
					'</div>' + 
				'</li>'
			);
			e.find('.item-title').find('a').text(item['i.displayName'] ? item['i.displayName'] : item['t.itemName']);
			e.find('.price').text(ob.$ + ' ' + ob.currency(item['k.price']));
			e.find('.qty').text(ob.quantity(item['h.quantity']) + ' ' + item['t.itemUOM']);
			if(item['ph.promotionId']) {
				e.find('.promo > .desc').text(item['ph.promotionName']);
			} else {
				e.find('.promo').remove();
			}
			if(item['i.pictureURL']) {
				var img = ob.url('/images/' + item['i.pictureURL'] + '-80x80.PNG');
				e.find('img').attr('data-src', img);
			}
			ob.pages.checkout.container.find('.ob-list ul').append(e);
		}
		$('.toolbar .order-summary .order-total').text(ob.currency(json['m.totalAmount']));
	},
	fillAddr: function( e, item ) {
		e.find('.name').text(item['a.contactPerson']);
		e.find('.phone').text(item['a.phone']);
		e.find('.addr').text(item['a.address1'] + ( item['a.address2'] ? ' ' + item['a.address2'] : ''));
	},
	insertAddr: function( item ) {
		var e = $(
			'<div class="swiper-slide">' +
			  '<ul>' +
			    '<li><span class="name"></span></li>' +
			    '<li><span class="phone"></span></li>' +
			    '<li><span class="addr"></span></li>' +
			    '<li><a href="#" class="edit">Edit</a></li>' +
			  '</ul>' +
			'</div>'
		);
		ob.pages.checkout.fillAddr(e, item);
		e.find('a.edit').data('id', item['a.addressId']).on('click', function() {
			var addressId = $(this).data('id');
			var data = {};
			for(var i=0; i<ob.pages.checkout.data.addrs.length; i++) {
				var a = ob.pages.checkout.data.addrs[i];
				if(addressId === a['a.addressId']) {
					data = a;
					break;
				}
			}
			ob.addr({
				data: data,
				success: function( i ) {
					ob.pages.checkout.merge(i);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
		});
		ob.pages.checkout.container.find('div.ob-address > .swiper-container > .swiper-wrapper').append(e);
	},
	order: function() {
		var addressId = ob.pages.checkout.container.find('div.ob-address > .swiper-container > .swiper-wrapper > .swiper-slide-active').find('a.edit').data('id');
		if(!addressId) {
			fw.alert('Please choose your delivery address.');
			return false;
		}
		var skus = [];
		for(var index=0; index<ob.pages.checkout.data.cart.length; index++) {
			var item = ob.pages.checkout.data.cart[index];
			if(!item['cart.checked'] || !item['h.quantity'] || item['h.quantity'] <=0) {
				continue;
			}
			skus.push({
				skuId: item['k.skuId'],
				qty: item['h.quantity']
			});
		}
		var data = {
			addressId: addressId,
			paymentOption: 'Online',
			skus: JSON.stringify(skus)
		};
		ob.ajax({
			url: ob.url('/a/execute/shopping/CreateOrder'),
			method: 'POST',
			data: data,
			success: function(dt) {
				try {
					var json = JSON.parse(dt);
					if(json.status === 'success') {
						var id = json.rflag.transactionId;
						var ordno = json.rflag.transactionNo;
						var amt = json.rflag.totalAmount;
						ob.cart.cleanup(skus);
						if(id && ordno && amt && ob.paypal.avail) {
							ob.paypal.pay({
								id: id,
								ordno: ordno,
								amt: amt,
								success: function( id ) {
									var url = 'pages/m/shopping/order.html?id=' + id; 
									ob.mainView.router.load({
										url: url
									});
								},
								failure: function( rt ) {
									var url = 'pages/m/shopping/order.html?id=' + id; 
									ob.mainView.router.load({
										url: url
									});
								}
							});
						} else {
							if(id) {
								var url = 'pages/m/shopping/order.html?id=' + id; 
								ob.mainView.router.load({
									url: url
								});
							} else {
								ob.error('Oops! Something goes wrong.');
							}
						}
					} else {
						ob.error('It fails to connect Office Buddy.')
					}
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
	}
};

fw.onPageInit('checkout', function (page) {
	ob.pages.checkout.init(page);
});

fw.onPageAfterAnimation('checkout', function (page) { 
	ob.toolbar.init(page);
});
