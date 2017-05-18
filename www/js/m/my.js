ob.pages.my = {
	init: function( page ) {

		ob.pages.my.container = $(page.container);
		ob.pages.my.container.find('.ob-address .head .add > a').on('click', function() {
			ob.addr({
				selector: $(this).parents('.ob-address').hasClass('billing') ? '.popup-address-billing' : '.popup-address',
				success: function( a ) {
					ob.pages.my.merge(a);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
		});

		if(ob.session.mc) {
			ob.pages.my.container.find('.ob-icon-login').find('.icon > i').text('person');
			ob.pages.my.container.find('.ob-icon-login').find('a > span.name').text(ob.session.mn);
			var signout = $('<a href="#"><span>[ Sign Out ]</span></a>');
			ob.pages.my.container.find('.ob-icon-login .text .signout').append(signout);
			signout.on('click', function() {
				window.localStorage.setItem('session', '{}');
				ob.session = {};
				window.location.reload();
				return false;
			});

			ob.ajax({
				url: ob.url('/a/account/MemberInfo'),
				method: 'GET',
				success: function(dt) {
					try {
						var json = JSON.parse(dt);
						if(json.status === 'success') {
							ob.pages.my.data = json.data;
							for(var index=0; index<ob.pages.my.data.billings.length; index++) {
								var entry = ob.pages.my.data.billings[index];
								var replacing = {};
								for(var key in entry) {
									replacing[key.replace('b.', 'a.')] = entry[key];
								}
								ob.pages.my.data.billings[index] = replacing;
							}
							ob.pages.my.show();
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
			ob.pages.my.container.find('.ob-signed-in').show();
			ob.pages.my.container.find('.ob-signed-out').hide();
		} else {
			ob.pages.my.container.find('.ob-signed-out').find('a.sign-in').on('click', function() {
				fw.loginScreen();
				return false;
			});
			ob.pages.my.container.find('.ob-signed-out').find('a.sign-up').on('click', function() {
				ob.mainView.router.load({
					url: 'pages/m/reg.html'
				});
				return false;
			});
			ob.pages.my.container.find('.ob-signed-out').show();
			ob.pages.my.container.find('.ob-signed-in').hide();
		}
	},
	merge: function( i ) {
		var isnew = true;
		var selector = i['a.isBilling'] === 'Y' ? 'div.ob-address.billing > .ob-list > ul' : 'div.ob-address.delivery > .ob-list > ul';
		var addrlist = i['a.isBilling'] === 'Y' ? ob.pages.my.data.billings : ob.pages.my.data.addresses;
		for(var j=0; j<addrlist.length; j++) {
			var a = addrlist[j];
			if(i['a.addressId'] === a['a.addressId']) {
				addrlist[j] = i;
				ob.pages.my.container.find(selector).children().each(function() {
					if($(this).data('id') === i['a.addressId']) {
						ob.pages.my.fillAddr($(this), i);
					}
				});
				isnew = false;
				break;
			}
		}
		if(isnew) {
			addrlist.push(i);
			ob.pages.my.container.find(selector).children().remove();
			for(var index=0; index<addrlist.length; index++) {
				var item = addrlist[index];
				ob.pages.my.insertAddr(item);
			}
		}
	},
	show: function() {
		var json = ob.pages.my.data;
		for(var index=0; index<json.addresses.length; index++) {
			var item = json.addresses[index];
			if(!item['addresses.checked']) {
				continue;
			}
			this.insertAddr(item);
		}
	},
	fillAddr: function( e, item ) {
		e.find('.addr1').text(item['a.contactPerson'] + ' ' + ( item['a.phone'] ? item['a.phone'] : ''));
		e.find('.addr2').text(item['a.address1'] + ( item['a.address2'] ? ' ' + item['a.address2'] : ''));
	},
	insertAddr: function( item ) {
		if(!item['a.addressId']) {
			return false;
		}
		var selector = item['a.isBilling'] === 'Y' ? 'div.ob-address.billing > .ob-list' : 'div.ob-address.delivery > .ob-list';
		var ul = ob.pages.my.container.find(selector).children('ul');
		if(ul.length === 0) {
			ul = $('<ul></ul>');
			ob.pages.my.container.find(selector).append(ul);
		}
		var e = $(
			'<li class="swipeout">' + 
				'<div class="ob-item swipeout-content">' + 
					'<div class="item-content">' + 
						'<div class="item-inner">' + 
							'<div class="item-title-row">' + 
								'<div><strong class="addr1"></strong></div>' + 
								'<div class="addr2"></div>' + 
							'</div>' + 
						'</div>' + 
					'</div>' + 
				'</div>' +
				'<div class="swipeout-actions-right">' +
					'<a href="#" class="action1 bg-red ob-item-remove"><i class="icon f7-icons">delete_round</i><span>Remove</span></a>' + 
				'</div>' + 
			'</li>'
		);
		ob.pages.my.fillAddr(e, item);
		e.data('id', item['a.addressId']).on('click', function() {
			var addressId = $(this).data('id');
			var data = {};
			for(var i=0; i<ob.pages.my.data.addresses.length; i++) {
				var a = ob.pages.my.data.addresses[i];
				if(addressId === a['a.addressId']) {
					data = a;
					break;
				}
			}
			if(!data['a.addressId']) {
				for(var i=0; i<ob.pages.my.data.billings.length; i++) {
					var a = ob.pages.my.data.billings[i];
					if(addressId === a['a.addressId']) {
						data = a;
						break;
					}
				}
			}
			ob.addr({
				selector: data['a.isBilling'] === 'Y' ? '.popup-address-billing' : '.popup-address',
				data: data,
				success: function( i ) {
					ob.pages.my.merge(i);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
		});
		e.find('a.ob-item-remove').on('click', function() {
			var swipeout = $(this).parents('li.swipeout');
			var addressId = swipeout.data('id');
			if(addressId) {
				ob.ajax({
					url: ob.url('/a/execute/account/DeleteAddress'),
					method: 'POST',
					data: {
						'a.addressId': addressId
					},
					success: function(dt) {
						try {
							var json = JSON.parse(dt);
							if(json.status === 'success') {
								fw.swipeoutDelete(swipeout[0], function() {
									
								});
							} else {
								ob.error('Oops! It fails to remove the address.');
							}
						} catch(e) {
							ob.error(e);
						}
					},
					error: function(e) {
						ob.error(e);
					}
				});
			}
			return false;
		});
		e.on('taphold', function() {
			fw.swipeoutOpen(this, 'right');
		});
		ul.append(e);
	}
};

fw.onPageInit('my', function (page) {
	ob.pages.my.init(page);
});
fw.onPageAfterAnimation('my', function (page) { 
	ob.toolbar.init(page);
});
