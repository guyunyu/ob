var fw = new Framework7({
	modalTitle: 'Office Buddy'
});
var $$ = Dom7;

var ob = new Object();

ob.mainView = fw.addView('.view-main', {
	dynamicNavbar: true,
	tapHold: true
});

ob.version = '0.0.1';
ob.debug = true;
ob.online = true;
ob.$ = 'SGD';
ob.pages = {};

ob.loginfo = [];
ob.log = function( m, s ) {
	if(s) {
		var divx = $$('#div-x');
		divx.children().remove();
		var html = $$('<ol></ol>');
		for(var index=0; index<ob.loginfo.length; index++) {
			var e = $$('<li></li>');
			e.text(ob.loginfo[index]);
			html.append(e);
		}
		divx.append(html);
	} else {
		if(ob.debug && m) {
			ob.loginfo.push(m);
		}
	}
};

ob.paypal = {
	avail: false,
	cache: function( id, rt ) {
		var json = this.getCache();
		json[id] = rt;
		window.localStorage.setItem('paypal', JSON.stringify(json));
		this.post(id, rt);
	},
	post: function( id, v ) {
		if(v!=='posted') {
			ob.ajax({
				daemon: true,
				url: ob.url('/a/execute/shopping/PayWithPaypal'),
				method: 'POST',
				data: {
					data: JSON.stringify({
						id: id,
						paypal: v
					})
				},
				success: function( dt ) {
					try {
						var json = JSON.parse(dt);
						if(json.status === 'success') {
							if(json.rflag.transactionId) {
								var c = ob.paypal.getCache();
								delete c[json.rflag.transactionId];
								c[json.rflag.transactionId] = 'posted';
								window.localStorage.setItem('paypal', JSON.stringify(c));
							}
						}
					} catch(e) {}
				}
			});
		}
	},
	getCache: function() {
		var c = window.localStorage.getItem('paypal');
		if(c) {
			return JSON.parse(c);
		} else {
			return {};
		}
	},
	cleanup: function() {
		var json = ob.paypal.getCache();
		for(var key in json) {
			this.post(key, json[key]);
		}
	},
	paying: function( id ) {
		var v = this.getCache()[id];
		return (typeof v === 'object' || typeof v === 'string');
	},
	remove: function( id ) {
		var c = ob.paypal.getCache();
		if(c[id]) {
			delete c[id];
			window.localStorage.setItem('paypal', JSON.stringify(c));
		}
	},
	pay: function( opt ) {
		var ppp = new PayPalPayment(
			ob.currency(opt.amt), 
			ob.$, 
			'Office Buddy Order', 
			'Sale');
		ppp.invoiceNumber(opt.ordno);
		ppp.custom(opt.id);
		PayPalMobile.renderSinglePaymentUI(ppp, function( rt ) {
			ob.paypal.cache(opt.id, rt);
			if(typeof opt.success === 'function') {
				opt.success(opt.id);
			}
		}, function( rt ) {
			if(typeof opt.failure === 'function') {
				opt.failure(rt);
			} else {
				ob.error(JSON.stringify(rt));
			}
		});
	}
};

ob.url = function( uri ) {
	var url = window.localStorage.getItem('url');
	if(typeof url === 'string') {
		return url + uri;
	} else {
		return 'http://www.officebuddy.com.sg/ob' + uri;
	}
};

ob.error = function(e, f) {
	if(ob.debug || f) {
		fw.alert(e);
	} else {
		fw.alert('Oops! Something goes wrong.');
	}
};

ob.quantity = function( q ) {
	var v;
	if(q || typeof q === 'number') {
		v = q.toString();
		if(v.indexOf('.') > 0) {
			v = v.substr(0, v.indexOf('.'));
		}
	} else {
		v = '0';
	}
	return v;
};

ob.currency = function( q ) {
	var v;
	if(q || typeof q === 'number') {
		v = q.toString();
		var i = v.indexOf('.');
		if(i > 0) {
			if(i < v.length - 2) {
				v = v.substr(0, i + 3);
			} else if(i < v.length - 1) {
				v = v.substr(0, i + 2) + '0';
			} else {
				v = v + '00';
			}
		} else {
			v = v + '.00';
		}
	} else {
		v = '0.00';
	}
	return v;
};

ob.date = function( v ) {
	var d = new Date(v);
	var m = d.getMonth() + 1;
	var date = d.getDate();
	return (date < 10 ? '0' + date + '/' : date + '/') + (m < 10 ? '0' + m + '/' : m + '/') + d.getFullYear();
};

ob.datetime = function( v ) {
	var d = new Date(v);
	var m = d.getMonth() + 1;
	var date = d.getDate();
	var h = d.getHours();
	var min = d.getMinutes();
	var s = d.getSeconds();
	return (date < 10 ? '0' + date + '/' : date + '/') + (m < 10 ? '0' + m + '/' : m + '/') + d.getFullYear()
		+ ' '
		+ ( h < 10 ? '0' + h + ':' : h + ':')
		+ ( min < 10 ? '0' + min + ':' : min + ':')
		+ ( s < 10 ? '0' + s : s);
};

ob.escapeHtml = function( m ) {
	var esc = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#39;'
	};
	return m.replace(/[&<>"']/g, function( m ) {
		return esc[m];
	});
};

ob.setValue = function( i, v ) {
	var $i = $$(i);
	if($i.attr('type') === 'checkbox') {
		if($i.data('yes') === v) {
			$i.prop('checked', true);
		} else {
			$i.prop('checked', false);
		}
	} else {
		$i.val(v);
	}
};

ob.getValue = function( i ) {
	var $i = $$(i);
	if($i.attr('type') === 'checkbox') {
		if($i.prop('checked')) {
			return $i.data('yes');
		} else {
			return $i.data('no');
		}
	} else {
		return $i.val();
	}
};

ob.loading = function( flag ) {
	if(flag) {
		$$('div.loading').show();
	} else {
		$$('div.loading').hide();
	}
};

ob.init = function() {
	var session = window.localStorage.getItem('session');
	if(typeof session === 'string') {
		ob.session = JSON.parse(session);
	} else {
		ob.session = {};
	}
	if(!ob.session.mc) {
		$$('.ob-icon-login').on('click', function() {
			if(!ob.session.mc) {
				fw.loginScreen();
			} else {
				//TODO
			}
			return false;
		});
	} else {
		$$('.ob-icon-login').children('i').text('person');
	}
	{
		$$('.ob-btn-login').on('click', function() {
			var f = $$(this).parents('form')[0];
			var data = {
				rem: 1,
				ajx: 1
			};
			for(var index=0; index<f.elements.length; index++) {
				var e = f.elements[index];
				if(!e.value) {
					var popover = '<div class="popover popover-password">'
                        + '<div class="popover-angle"></div>'
                        + '<div class="popover-inner">'
                        + '<div class="content-block">'
                        + '<p>Oops!</p>'
                        + '<p>This field is required to sign in!</p>'
                        + '</div>'
                        + '</div>'
                        + '</div>';
					fw.popover(popover, e);
					return false;
				} else {
					data[e.name] = e.value;
				}
			}
			ob.ajax({
				url: ob.url('/m/account/login.html'),
				method: 'POST',
				data: data,
				success: function(dt) {
					var json = JSON.parse(dt);
					if(json.login === '1') {
						window.localStorage.setItem('session', dt);
						fw.closeModal();
						window.location.reload();
					} else {
						fw.alert('Oops! It fails to sign in.');
					}
				}
			});
			return false;
		});
	}
};

ob.list = function( v ) {
	ob.mainView.router.load({
		url: 'pages/list.html?q=' + escape(v.q) + '&c=' + (v.c ? v.c : '') + '&r=' + (v.r ? v.r : '')
	});
	return false;
};

ob.ajax = function( opt ) {
	if(!ob.online) {
		if(!opt.daemon) {
			fw.alert('Oops! Please check your network connection!');
		}
		return false;
	}
	var headers = opt.headers || {};
	if(ob.session && ob.session.mc) {
		headers['mc'] = ob.session.mc;
	}
	headers['ver'] = ob.version;
	try {
		$$.ajax({
			url: opt.url,
			method: opt.method,
			data: opt.data,
			timeout: opt.timeout || 20000,
			headers: headers,
			success: function(dt) {
				if(!opt.daemon) {
					ob.loading(false);
				}
				opt.success(dt);
			},
			error: function(xhr, code) {
				if(!opt.daemon) {
					ob.loading(false);
				}
				if(ob.debug) {
					fw.alert('visit to url ' + opt.url + ' encounters error in ajax!');
				}
				if(typeof opt.error === 'function') {
					opt.error(xhr, code);
				} else {
					if(!opt.daemon) {
						ob.error(code);
					}
				}
			}
		});
		if(!opt.daemon) {
			ob.loading(true);
		}
	} catch(e) {
		if(!opt.daemon) {
			ob.loading(false);
		}
		if(ob.debug) {
			fw.alert('visit to url ' + opt.url + ' encounters error in try-catch!');
		}
		if(typeof opt.error === 'function') {
			opt.error(e);
		} else {
			ob.error(e);
		}
	}
};

ob.addr = function( opt ) {
	var popup = $$('.popup-address');
	popup.find('.column').each(function() {
		if(opt.data && opt.data[this.name]) {
			ob.setValue(this, opt.data[this.name]);
		} else {
			ob.setValue(this, '');
		}
	});
	if(!popup.data('init')) {
		popup.data('init', true);
		popup.find('a.update').on('click', function() {
			var validated = true;
			$$(this).parents('.popup-address').find('input[required]').each(function() {
				if(validated && !$$(this).val()) {
					fw.popover('<div class="popover"><div class="popover-inner"><div class="ob-popover">' + $$(this).data('errmsg') + '</div></div></div>', this);
					validated = false;
				}
			});
			if(validated) {
				$$(this).parents('.popup-address').find('select[required]').each(function() {
					if(validated && !$$(this).val()) {
						fw.popover('<div class="popover"><div class="popover-inner"><div class="ob-popover">' + $$(this).data('errmsg') + '</div></div></div>', this);
						validated = false;
					}
				});
			}
			if(validated) {
				var data = {};
				$$(this).parents('.popup-address').find('.column').each(function() {
					data[$$(this).attr('name')] = ob.getValue(this);
				});
				ob.ajax({
					url: ob.url('/a/execute/account/Address'),
					method: 'POST',
					data: data,
					success: function(dt) {
						try {
							var json = JSON.parse(dt);
							if(json.status === 'success') {
								if(typeof opt.success === 'function') {
									data['a.addressId'] = json.rflag.addressId;
									opt.success(data);
								}
								fw.closeModal('.popup-address');
							} else {
								if(typeof opt.error === 'function') {
									opt.error();
								}
							}
						} catch(e) {
							if(typeof opt.error === 'function') {
								opt.error(e);
							} else {
								ob.error(e);
							}
						}
					},
					error: opt.error
				});
			} else {
//				if(typeof opt.error === 'function') {
//					opt.error();
//				}
			}
		});
	}
	fw.popup('.popup-address');
};

ob.checkNetwork = function() {
	if(navigator && navigator.connection) {
		var n = navigator.connection.type;
		if(n === Connection.NONE) {
			ob.online = false;
		} else {
			ob.online = true;
		}
	}
};

ob.ready = function() {

	ob.toolbar.init({
		name: 'index'
	});
	ob.barcode.init();

	if(typeof cordova !== 'undefined') {
		$$(document).on('deviceready', function() {
		
			document.addEventListener("backbutton", function(e) {
				if(ob.mainView.activePage.name === 'index') {
					fw.closeModal();
					fw.actions([
						{
							text: '<i class="icon f7-icons">reply</i>&nbsp;<span>Stay</span>',
						},
						{
							text: '<i class="icon f7-icons">logout</i>&nbsp;<span>Quit</span>',
							color: 'red',
							onClick: function() {
								try {
									navigator.app.exitApp();
								} catch(e) {}
							}
						}
					]);
				} else {
					ob.mainView.router.back();
				}
			});

			document.addEventListener('offline', function() {
				ob.checkNetwork();
			}, false);
			document.addEventListener('online', function() {
				ob.checkNetwork();
			}, false);
			ob.checkNetwork();

			try {
				PayPalMobile.init({
					PayPalEnvironmentProduction: '',
					PayPalEnvironmentSandbox: 'AaHN535MGVNHweeZudwvVmi8hCrGL4S12MbbmwFriqm3oNco_dXNZSY51Av60Ca_BMaXi8_I5is0EQzj'
				}, function() {
					PayPalMobile.prepareToRender('PayPalEnvironmentSandbox', new PayPalConfiguration({
							merchantName: 'ob'/*,
							merchantPrivacyPolicyURL: 'http://www.officebuddy.com.sg/ob/privacy.html',
							merchantUserAgreementURL: 'http://www.officebuddy.com.sg/ob/tc.html'*/
					}), function() {
						ob.paypal.avail = true;
						ob.paypal.cleanup();
					});
				});
			} catch(e) {
			}

			ob.init();

			navigator.splashscreen.hide();

		});
	} else {
		ob.init();
	}

	fw.swiper('div.ob-main-slide > .swiper-container');
	$$('.view-main > .navbar').addClass('ob-f07e58');

	ob.loading(false);

	return false;
};

fw.onPageInit('index', function (page) {
	ob.init();
	ob.barcode.init();
	fw.swiper('div.ob-main-slide > .swiper-container');
});

fw.onPageAfterAnimation('index', function (page) { 
	ob.toolbar.init({
		name: 'index'
	});
	$$('.view-main > .navbar').addClass('ob-f07e58');
});
