ob.pages.checkout = {
	init: function( page ) {
		ob.pages.checkout.container = $(page.container);
		ob.pages.checkout.data = page.query;
		ob.pages.checkout.container.find('.ob-address a.add').on('click', function() {
			ob.addr({
				selector: $(this).parents('.tab').attr('id') === 'tab-billing' ? '.popup-address-billing' : '.popup-address',
				success: function( a ) {
					ob.pages.checkout.merge(a);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
		});
		ob.pages.checkout.container.find('#tab-delivery select[name="delop"]').on('change', function() {
			if($(this).val() === 'Self-Collecting') {
				$('#tab-delivery .ob-address .addrtitle').hide();
				$('#tab-delivery .ob-address .card.addrlist').hide();
				$('#tab-delivery .ob-address .card.self-collect').show();
				
				var bilop = ob.pages.checkout.container.find('#tab-billing select[name="bilop"]');
				if(bilop.val() === 'A') {
					bilop.val('C');
					bilop.next('.item-content').find('.item-after').text('Leave it Blank');
					bilop.trigger('change');
				}
			} else {
				$('#tab-delivery .ob-address .addrtitle').show();
				$('#tab-delivery .ob-address .card.addrlist').show();
				$('#tab-delivery .ob-address .card.self-collect').hide();
			}
		});
		ob.pages.checkout.container.find('#tab-billing select[name="bilop"]').on('change', function() {
			if($(this).val() === 'A') {
				$('#tab-billing .ob-address .addrtitle').hide();
				$('#tab-billing .ob-address .card.addrlist').hide();
				$('#tab-billing .ob-address .card.addrdeli').show();
			} else if($(this).val() === 'B') {
				$('#tab-billing .ob-address .addrtitle').show();
				$('#tab-billing .ob-address .card.addrlist').show();
				$('#tab-billing .ob-address .card.addrdeli').hide();
			} else {
				$('#tab-billing .ob-address .addrtitle').hide();
				$('#tab-billing .ob-address .card.addrlist').hide();
				$('#tab-billing .ob-address .card.addrdeli').hide();
			}
		});
		$('.toolbar .confirm-order').on('click', function() {
			ob.pages.checkout.order($(this));
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
				var selector = i['a.isBilling'] === 'Y' ?
					'#tab-delivery .ob-address .swiper-container > .swiper-wrapper > div.swiper-slide' :
					'#tab-billing .ob-address .addrlist .swiper-container > .swiper-wrapper > div.swiper-slide';
				ob.pages.checkout.container.find(selector).each(function() {
					if($(this).data('id') === i['a.addressId']) {
						ob.pages.checkout.fillAddr($(this), i);
					}
				});
				isnew = false;
				break;
			}
		}
		if(isnew) {
			ob.pages.checkout.data.addrs.push(i);
			var selector = i['a.isBilling'] === 'Y' ?
				'#tab-billing .ob-address .addrlist .ob-swiper' :
				'#tab-delivery .ob-address .ob-swiper';
			ob.pages.checkout.container.find(selector).find('.swiper-wrapper').children().remove();
			for(var index=0; index<ob.pages.checkout.data.addrs.length; index++) {
				var item = ob.pages.checkout.data.addrs[index];
				if(item['a.isBilling'] === i['a.isBilling']) {
					ob.pages.checkout.insertAddr(item);
				}
			}
			if(ob.pages.checkout.container.find(selector).find('.swiper-slide').length > 1) {
				ob.pages.checkout.container.find(selector).find('.swiper-button-next').show();
				ob.pages.checkout.container.find(selector).find('.swiper-button-prev').show();
				var w = fw.swiper(ob.pages.checkout.container.find(selector).find('.swiper-container'), {
					pagination: selector + ' .swiper-pagination',
					nextButton: selector + ' .swiper-button-next',
					prevButton: selector + ' .swiper-button-prev'
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
		var selector = '#tab-delivery .ob-address .ob-swiper';
		if(ob.pages.checkout.container.find(selector).find('.swiper-slide').length > 1) {
			ob.pages.checkout.container.find(selector).find('.swiper-button-next').show();
			ob.pages.checkout.container.find(selector).find('.swiper-button-prev').show();
			fw.swiper(ob.pages.checkout.container.find(selector).find('.swiper-container'), {
				pagination: '#tab-delivery .swiper-pagination',
				nextButton: '#tab-delivery .swiper-button-next',
				prevButton: '#tab-delivery .swiper-button-prev'
			});
		} else {
			ob.pages.checkout.container.find(selector).find('.swiper-button-next').hide();
			ob.pages.checkout.container.find(selector).find('.swiper-button-prev').hide();
		}
		selector = '#tab-billing .ob-address .addrlist .ob-swiper';
		if(ob.pages.checkout.container.find(selector).find('.swiper-slide').length > 1) {
			ob.pages.checkout.container.find(selector).find('.swiper-button-next').show();
			ob.pages.checkout.container.find(selector).find('.swiper-button-prev').show();
			fw.swiper(ob.pages.checkout.container.find(selector).find('.swiper-container'), {
				pagination: '#tab-billing.swiper-pagination',
				nextButton: '#tab-billing.swiper-button-next',
				prevButton: '#tab-billing.swiper-button-prev'
			});
		} else {
			ob.pages.checkout.container.find(selector).find('.swiper-button-next').hide();
			ob.pages.checkout.container.find(selector).find('.swiper-button-prev').hide();
		}
		
		var dcwaiveMin = ob.pages.checkout.data['m.dcwaiveMin'];
		var dcnormal = ob.pages.checkout.data['m.dcnormal'];
		if(parseFloat(dcnormal, 10) > 0) {
			var dctip = 'Enjoy free delivery worth $<i>' + dcnormal + '</i> for orders with minimum amount $<i>' + dcwaiveMin + '</i>.';
			ob.pages.checkout.container.find('div.ob-checkout-dctip').html(dctip);
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
		fw.initImagesLazyLoad(ob.pages.checkout.container);
		$('.coupon-popover input.coupon-value').val('');
		$('.coupon-popover').on('opened', function() {
			$(this).find('input.coupon-value').focus();
		});
		$('.coupon-popover .coupon-close').on('click', function() {
			fw.closeModal('.coupon-popover.modal-in');
			return false;
		});
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
			  '</ul>' +
			'</div>'
		);
		ob.pages.checkout.fillAddr(e, item);
		e.data('id', item['a.addressId']).on('click', function() {
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
		if(item['a.isBilling'] === 'Y') {
			ob.pages.checkout.container.find('#tab-billing .ob-address .addrlist .swiper-container > .swiper-wrapper').append(e);
		} else {
			ob.pages.checkout.container.find('#tab-delivery .ob-address .swiper-container > .swiper-wrapper').append(e);
		}
	},
	order: function( btn ) {
		if(btn.data('working')) {
			return false;
		}
		btn.data('working', true).attr('disabled', 'disabled');
		var release = function( btn ) {
			btn.data('working', false).removeAttr('disabled');
		};
		var data = {};
		var deliveryOption = ob.pages.checkout.container.find('#tab-delivery select[name="delop"]').val();
		if(!deliveryOption) {
			fw.alert('Please choose delivery option.');
			release(btn);
			return false;
		}
		data['deliveryOption'] = deliveryOption;
		var billingOption = ob.pages.checkout.container.find('#tab-billing select[name="bilop"]').val();
		
		var paymentOption = ob.pages.checkout.container.find('#tab-payment input[name="payop"]:checked').val();
		if(deliveryOption !== 'Self-Collecting') {
			var addrs = ob.pages.checkout.container.find('#tab-delivery .ob-address .swiper-container > .swiper-wrapper');
			var addressId = '';
			if(addrs.find('.swiper-slide-active').length > 0) {
				addressId = addrs.find('.swiper-slide-active').data('id');
			} else if(addrs.find('.swiper-slide').length === 1) {
				addressId = addrs.find('.swiper-slide').data('id');
			} else {
				addressId = false;
			}
			if(!addressId) {
				fw.alert('Please choose your delivery address.');
				release(btn);
				return false;
			}
			data['a.addressId'] = addressId;
			if(billingOption === 'A') {
				data['b.addressId'] = addressId;
			}
		} else {
			if(billingOption === 'A') {
				fw.alert('Self-Collecting is selected, please open Billing Options and choose another billing address or choose to leave it blank and submit order again.');
				release(btn);
				return false;
			}
		}
		if(billingOption === 'B') {
			var addrs = ob.pages.checkout.container.find('#tab-billing .ob-address .swiper-container > .swiper-wrapper');
			var addressId = '';
			if(addrs.find('.swiper-slide-active').length > 0) {
				addressId = addrs.find('.swiper-slide-active').data('id');
			} else if(addrs.find('.swiper-slide').length === 1) {
				addressId = addrs.find('.swiper-slide').data('id');
			} else {
				addressId = false;
			}
			if(!addressId) {
				fw.alert('Please choose your billing address.');
				release(btn);
				return false;
			}
			data['b.addressId'] = addressId;
		}
		data['paymentOption'] = paymentOption;
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
		data['skus'] = JSON.stringify(skus);
		data['coupon'] = $('.coupon-popover input.coupon-value').val();
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
						var popt = json.rflag.paymentOption;
						ob.cart.cleanup(skus);
						if(id && ordno && amt && (popt === 'Online' || popt === 'PayPal') && ob.paypal.avail) {
							ob.paypal.pay({
								id: id,
								ordno: ordno,
								amt: amt,
								success: function( id ) {
									var url = 'pages/m/shopping/after-checkout.html?id=' + id + '&chkout=yes'; 
									ob.mainView.router.load({
										url: url
									});
								},
								failure: function( rt ) {
									var url = 'pages/m/shopping/after-checkout.html?id=' + id + '&chkout=yes'; 
									ob.mainView.router.load({
										url: url
									});
								}
							});
						} else {
							if(id) {
								var url = 'pages/m/shopping/after-checkout.html?id=' + id + '&chkout=yes'; 
								ob.mainView.router.load({
									url: url
								});
							} else {
								ob.error('Oops! Something goes wrong.');
							}
						}
					} else {
						if(json.msgs && json.msgs.length > 0) {
							var txt = '';
							for(var index=0; index<json.msgs.length; index++) {
								txt += ( json.msgs[index].text + '\n');
							}
							ob.error(txt, true);
						} else {
							ob.error('Oops! Something goes wrong.');
						}
						release(btn);
					}
				} catch(e) {
					ob.error(e);
				}
			},
			error: function(xhr, code) {
				if(code === 403) {
					fw.loginScreen();
					release(btn);
				} else {
					ob.error(code);
					release(btn);
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

fw.onPageBack('checkout', function (page) { 
	fw.closeModal('.coupon-popover.modal-in');
});