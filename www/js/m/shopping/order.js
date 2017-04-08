ob.pages.order = {
	init: function( page ) {
		ob.pages.order.container = $$(page.container);
		ob.pages.order.id = page.query.id;
		ob.ajax({
			url: ob.url('/a/shopping/ViewOrder'),
			method: 'GET',
			data: {
				'oh.transactionId': ob.pages.order.id
			},
			success: function(dt) {
				console.log(dt);
				try {
					var json = JSON.parse(dt);
					ob.pages.order.show(json);
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
	},
	show: function( json ) {
		if(json.status === 'success') {
			ob.pages.order.data = json.data;
			ob.pages.order.container.find('.ob-order .head .ordno').text(json.data['oh.transactionNo']);
			ob.pages.order.container.find('.ob-order .addr .name').text(json.data['oa.contactPerson']);
			ob.pages.order.container.find('.ob-order .addr .phone').text(json.data['oa.phone']);
			ob.pages.order.container.find('.ob-order .addr .detail').text(json.data['oa.address1'] + ( json.data['oa.address2'] ? ' ' + json.data['oa.address2'] : ''));

			ob.pages.order.container.find('.ob-list').append('<ul></ul>');
			for(var index=0; index<json.data.detail.length; index++) {
				var item = json.data.detail[index];
				if(!item['detail.checked']) {
					continue;
				}
				var e = $$(
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
				e.find('.item-title').find('a').text(item['od.itemName']);
				e.find('.price').text(ob.$ + ' ' + ob.currency(item['od.price']));
				e.find('.qty').text(ob.quantity(item['od.quantity']) + ' ' + item['od.itemUOM']);
				if(item['od.promotionId']) {
					e.find('.promo > .desc').text(item['od.promotionName']);
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
				ob.pages.order.container.find('.ob-list ul').append(e);
			}
			var pays = ob.pages.order.container.find('.ob-order .pay');
			var opIndex = 0;
			var opTemplate = pays.find('.entry');
			for(var index=0; index<json.data.payments.length; index++) {
				var item = json.data.payments[index];
				if(!item['payments.checked']) {
					continue;
				}
				var e;
				if(opIndex ++ == 0) {
					e = opTemplate;
				} else {
					e = opTemplate.clone();
					pays.append(e);
				}
				e.find('.channel').text(item['op.channel']);
				e.find('.date').text(ob.datetime(item['op.paymentDate']));
				e.find('.ref').text(item['op.paymentReference']);
				e.find('.amt').text(ob.currency(item['op.paymentAmount']));
			}
			if(opIndex == 0) {
				pays.remove();
			} else {
				if(json.data['oh.paymentStatus'] === 'Paid') {
					pays.addClass('paid');
				}
			}
		} else {
			ob.pages.order.container.find('.ob-order').html('').append('<div><span>fail to get order info</span></div>');
		}
		ob.pages.order.container.find('.ob-order .total .subtotal-amt').text(ob.currency(json.data['oh.subtotalAmount']));
		ob.pages.order.container.find('.ob-order .total .discount-amt').text(ob.currency(json.data['oh.discountAmount']));
		ob.pages.order.container.find('.ob-order .total .total-amt').text(ob.currency(json.data['oh.totalAmount']));
		if(parseFloat(json.data['oh.taxAmount']) > 0) {
			ob.pages.order.container.find('.ob-order .total .tax-info').text('(' + json.data['oh.taxCode'] + ' of ' + ob.currency(json.data['oh.taxAmount']) + ' inclusive)');
		}

		if(json.data['oh.transactionStatus'] === 'Pending Payment' && json.data['oh.paymentStatus'] === 'Pending Payment') {
			if(ob.paypal.paying(json.data['oh.transactionId'])) {
				ob.pages.order.container.find('.ob-order .head .status').text('Processing Payment');
			} else {
				ob.pages.order.container.find('.ob-order .head .status').text(json.data['oh.transactionStatus']);
				ob.pages.order.container.find('.ob-shoppingbar .order-total').text(ob.currency(json.data['oh.totalAmount']));
				ob.pages.order.container.find('.ob-shoppingbar .confirm-order').on('click', function() {
					if(ob.paypal.avail) {
						ob.paypal.pay({
							id: ob.pages.order.data['oh.transactionId'],
							ordno: ob.pages.order.data['oh.transactionNo'],
							amt: ob.pages.order.data['oh.totalAmount'],
							success: function( id ) {
								ob.pages.order.container.find('.ob-order .head .status').text('Processing Payment');
								ob.pages.order.container.find('.ob-shoppingbar').remove();
								ob.pages.order.container.find('.ob-order .pay').addClass('paid');
							}
						});
					} else {
						ob.error('PayPal is not available.', true);
					}
				});
			}
		} else {
			ob.pages.order.container.find('.ob-shoppingbar').remove();
			ob.paypal.remove(json.data['oh.transactionId']);
		}
	},
};

fw.onPageInit('order', function (page) {
	ob.pages.order.init(page);
});

fw.onPageAfterAnimation('order', function (page) { 
	ob.toolbar.init(page);
});
