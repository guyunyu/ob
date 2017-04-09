ob.pages.my = {
	init: function( page ) {

		ob.pages.my.container = $$(page.container);
		ob.pages.my.container.find('.ob-address .head .add > a').on('click', function() {
			ob.addr({
				success: function( a ) {
					ob.pages.my.merge(a);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
		});

		if(ob.session.mc) {
			$$('.ob-icon-login').children('i').text('person');
			$$('.ob-icon-login').find('a > span.name').text(ob.session.mn);
			var signout = $$('<a href="#"><span>[ Sign Out ]</span></a>');
			$$('.ob-icon-login').append(signout);
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

		} else {
			$$('.ob-icon-login').find('a').on('click', function() {
				fw.loginScreen();
				return false;
			});
			$$('.ob-orderhistory').hide();
			$$('.ob-address').hide();
		}
		ob.pages.my.container.find('.ob-address .ob-list').css({
			height: (ob.pages.my.container.find('.toolbar').offset().top - ob.pages.my.container.find('.ob-address .ob-list').offset().top - 25) + 'px',
			overflow: 'scroll',
			'margin-bottom': '0px'
		});
	},
	merge: function( i ) {
		var isnew = true;
		for(var j=0; j<ob.pages.my.data.addresses.length; j++) {
			var a = ob.pages.my.data.addresses[j];
			if(i['a.addressId'] === a['a.addressId']) {
				ob.pages.my.data.addresses[j] = i;
				ob.pages.my.container.find('div.ob-address > .ob-list > ul > li').each(function() {
					if($$(this).data('id') === i['a.addressId']) {
						ob.pages.my.fillAddr($$(this), i);
					}
				});
				isnew = false;
				break;
			}
		}
		if(isnew) {
			ob.pages.my.data.addresses.push(i);
			ob.pages.my.container.find('div.ob-address > .ob-list > ul').children().remove();
			for(var index=0; index<ob.pages.my.data.addresses.length; index++) {
				var item = ob.pages.my.data.addresses[index];
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
		var ul = ob.pages.my.container.find('div.ob-address > .ob-list > ul');
		if(ul.length === 0) {
			ul = $$('<ul></ul>');
			ob.pages.my.container.find('div.ob-address > .ob-list').append(ul);
		}
		var e = $$(
			'<li>' + 
				'<div class="ob-item">' + 
					'<div class="item-content">' + 
						'<div class="item-inner">' + 
							'<div class="item-title-row">' + 
								'<div><strong class="addr1"></strong></div>' + 
								'<div class="addr2"></div>' + 
							'</div>' + 
						'</div>' + 
					'</div>' + 
				'</div>' + 
			'</li>'
		);
		ob.pages.my.fillAddr(e, item);
		e.data('id', item['a.addressId']).on('click', function() {
			var addressId = $$(this).data('id');
			var data = {};
			for(var i=0; i<ob.pages.my.data.addresses.length; i++) {
				var a = ob.pages.my.data.addresses[i];
				if(addressId === a['a.addressId']) {
					data = a;
					break;
				}
			}
			ob.addr({
				data: data,
				success: function( i ) {
					ob.pages.my.merge(i);
				},
				error: function( e ) {
					ob.error(e);
				}
			});
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
