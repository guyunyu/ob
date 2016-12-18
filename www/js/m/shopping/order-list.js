ob.pages.orderlist = {
	init: function( page ) {
		ob.pages.orderlist.container = $$(page.container);
		this.find(true);
	},
	loading: false,
	pageOffset: 0,
	pageSize: 20,
	find: function( initial ) {
		if(initial) {
			ob.pages.orderlist.loading = false;
			ob.pages.orderlist.pageOffset = 0;
			ob.pages.orderlist.pageSize = 20;
			fw.attachInfiniteScroll(ob.pages.orderlist.container.find('.infinite-scroll'));
		}
		if(ob.pages.orderlist.loading) {
			return;
		}
		ob.pages.orderlist.loading = true;
		ob.ajax({
			url: ob.url('/a/shopping/OrderForApps.List'),
			method: 'GET',
			data: {
				pageSize: ob.pages.orderlist.pageSize,
				pageOffset: ob.pages.orderlist.pageOffset
			},
			success: function(dt) {
				console.log(dt);
				ob.pages.orderlist.pageOffset += ob.pages.orderlist.pageSize;
				try {
					var json = JSON.parse(dt);
					if(typeof json.data === 'object') {
						if(initial) {
							ob.pages.orderlist.container.find('.ob-list').html('');
							if(json.data.length > 0) {
								//
							} else {
								ob.pages.orderlist.container.find('.ob-list').append('<div><span>There is no order!</span></div>');
							}
						}
						ob.pages.orderlist.show(json);
					} else {
						fw.detachInfiniteScroll(ob.pages.orderlist.container.find('.infinite-scroll'));
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
	},
	show: function( json ) {
		if(typeof json.count === 'number' && typeof json.data === 'object' && json.count > 0) {
			var list = ob.pages.orderlist.container.find('.ob-list');
			var group = false;
			for(var index = 0; index < json.data.length; index++) {
				var item = json.data[index];
				if(!group || group.data('id') !== item['oh.transactionId']) {
					group = $$(
						'<div class="list-group">' +
							'<ul>' +
								'<li class="list-group-title">' +
									'<span class="ordno"></span>' +
									'<a href="#" class="pay">Pay Now</a>' +
								'</li>' +
							'</ul>' +
						'</div>'
					);
					group.data('id', item['oh.transactionId']);
					group.find('.list-group-title .ordno').text(item['oh.transactionNo']);
					if(item['oh.paymentStatus'] === 'Pending Payment') {
						group.find('a.pay')
							.data('id', item['oh.transactionId'])
							.data('ordno', item['oh.transactionNo'])
							.data('amt', item['oh.totalAmount'])
							.on('click', function() {

							if(ob.paypal.avail) {
								var id = $$(this).data('id');
								PayPalMobile.renderSinglePaymentUI(new PayPalPayment(ob.currency($$(this).data('amt')), 'SGD', 'Office Buddy Order ' + $$(this).data('ordno'), 'Sale', new PayPalPaymentDetails(ob.currency($$(this).data('amt')), '0.00', '0.00')), function( rt ) {
									console.log(JSON.stringify(rt));
									ob.paypal.cache(id, rt);
								}, function( rt ) {
									ob.error(JSON.stringify(rt));
								});

							} else {
								ob.error('PayPal is not available.', true);
							}
						});
					} else {
						group.find('a.pay').remove();
					}
					list.append(group);
				}
				var e = $$(
					'<li class="item-content">' + 
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
					'</li>'
				);
				e.find('.item-title').find('a').text(item['od.itemName']);
				e.find('.price').text('SGD ' + ob.currency(item['od.price']));
				e.find('.qty').text(ob.quantity(item['od.quantity']) + ' ' + item['od.itemUOM']);
				if(item['od.promotionName']) {
					e.find('.promo > .desc').text(item['od.promotionName']);
				} else {
					e.find('.promo').remove();
				}
				if(item['i.pictureURL']) {
					var img = ob.url('/images/' + item['i.pictureURL'] + '-80x80.PNG');
					e.find('img').attr('data-src', img);
					e.find('a.item-link-real').data('id', item['od.itemId']).data('img', img);
				} else {
					e.find('a.item-link-real').data('id', item['od.itemId']);
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
				group.find('ul').append(e);
			}
		}
	}
};

fw.onPageInit('order-list', function (page) {
	ob.pages.orderlist.init(page);
	ob.toolbar.init();
});
fw.onPageAfterAnimation('order-list', function (page) { 
	
});
