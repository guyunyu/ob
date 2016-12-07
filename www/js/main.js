var fw = new Framework7({
	modalTitle: 'Office Buddy'
});
var $$ = Dom7;

var ob = new Object();

ob.mainView = fw.addView('.view-main', {
	dynamicNavbar: true
});

ob.debug = true;
ob.pages = {};

ob.url = function( uri ) {
	var url = window.localStorage.getItem('url');
	if(typeof url === 'string') {
		return url + uri;
	} else {
		return 'http://192.168.2.103:8180/ob' + uri;
	}
};

ob.error = function(e) {
	if(ob.debug) {
		fw.alert(e);
	} else {
		fw.alert('Opps! Something goes wrong.');
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

ob.init = function() {
	var session = window.localStorage.getItem('session');
	if(typeof session === 'string') {
		ob.session = JSON.parse(session);
	} else {
		ob.session = {};
	}
	$$('.ob-icon-login').off('click');
	$$('.ob-btn-login').off('click');
	if(!ob.session.mc) {
		$$('.ob-icon-login').on('click', function() {
			if(!ob.session.mc) {
				fw.loginScreen();
			} else {
				//TODO
			}
			return false;
		});
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
                        + '<p>Opps!</p>'
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
					window.localStorage.setItem('session', dt);
					fw.closeModal();
					ob.init();
				}
			});
			return false;
		});
	} else {
		$$('.ob-icon-login').find('.icon-form-password').removeClass('icon-form-password').addClass('icon-form-name');
	}
};

ob.list = function( f ) {
	var q = $$(f).find('input[type="search"]').val();
	ob.mainView.router.load({
		url: 'pages/list.html?q=' + escape(q)
	});
	return false;
};

ob.ajax = function( opt ) {
	var headers = opt.headers || {};
	if(ob.session && ob.session.mc) {
		headers['mc'] = ob.session.mc;
	}
	try {
		$$.ajax({
			url: opt.url,
			method: opt.method,
			data: opt.data,
			timeout: opt.timeout || 20000,
			headers: headers,
			success: opt.success,
			error: function(xhr, e) {
				if(typeof opt.error === 'function') {
					opt.error(e, xhr);
				} else {
					ob.error(e);
				}
			}
		});
	} catch(e) {
		if(typeof opt.error === 'function') {
			opt.error(e);
		} else {
			ob.error(e);
		}
	}
};

ob.ready = function() {

	ob.toolbar.init();

	if(typeof cordova !== 'undefined') {
		$$(document).on('deviceready', function() {
		
			document.addEventListener("backbutton", function(e) {
				if(ob.mainView.activePage.name === 'index') {
					fw.closeModal();
					fw.actions([
						{
							text: 'Stay with Office Buddy'
						},
						{
							text: 'Confirm to Exit',
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
		
			ob.init();
		
			$$('#div-x').append($$('<div>device is ready to use</div><hr></hr><ol><li><div><input type="text" class="mod-url"></input></div><div><button id="btn-ajax">Test Ajax</button></div></li><li><button id="btn-img">Test Image</button></li><li><button id="btn-scan">Test Scan</button></li><li><button id="btn-pay">Pay</button></li></ol>'));
			$$('.mod-url').val(ob.url(''));
			$$('#btn-ajax').on('click', function() {
				window.localStorage.setItem('url', $$('.mod-url').val());
				try {
					$$.ajax({
						url: ob.url('/a/catalog/Item.List'),
						method: 'GET',
						timeout: 20000,
						data: {
							q: 'coffee',
							pageSize: 1,
							pageOffset: 0
						},
						success: function(dt) {
							var itemlist = JSON.parse(dt);
							$$('#div-x').append($$('<div>' + JSON.stringify(itemlist) + '</div>'));
							$$('#btn-ajax').attr('disabled', 'disabled');
							$$('#btn-ajax').off('click');
						},
						error: function(xhr, e) {
							fw.alert('error: ' + e);
						}
					});
				} catch(err) { fw.alert(err); }
			});
			$$('#btn-img').on('click', function() {
				$$('#div-x').append($$('<img src="' + ob.url('/res/images/ob-logo.png') + '" width="250" height="90"></img>'));
				$$('#btn-img').attr('disabled', 'disabled');
				$$('#btn-img').off('click');
			});
			$$('#btn-scan').on('click', function() {
				try {
					cordova.plugins.barcodeScanner.scan(
						function (result) {
							if(!result.cancelled) {
								$$('#div-x').append($$('<div>barcode ' + result.format + ' : ' + result.text + '</div>'));
								$$('#btn-scan').attr('disabled', 'disabled');
								$$('#btn-scan').off('click');
							}
						},
						function (error) {
							fw.alert("Scanning failed: " + error);
						},
						{
							prompt: 'Place a barcode inside the scan area'
						}
					);
				} catch(e) {
					fw.alert(e);
				}
			});
		
			var logs = $$('<ol></ol>');
			$$('#div-x').append(logs);
			logs.append('<li> init paypal mobile ... </li>');
			try {
				PayPalMobile.init({
					PayPalEnvironmentProduction: '',
					PayPalEnvironmentSandbox: 'AboCysAL656E1KlAKs4k94VxrmkBpMGOSAKIQ_Oa42RG-BZIYmuAwkbrfcfY3qXUbEsghNVLVsWYFuRX'
				}, function() {
					console.log = function(m) {
						logs.append('<li> console.log: ' + m + ' </li>');
					};
					logs.append('<li> prepareToRender ... </li>');
					PayPalMobile.prepareToRender('PayPalEnvironmentSandbox', new PayPalConfiguration({
							merchantName: 'ob'/*,
							merchantPrivacyPolicyURL: 'http://www.officebuddy.com.sg/ob/privacy.html',
							merchantUserAgreementURL: 'http://www.officebuddy.com.sg/ob/tc.html'*/
					}), function() {
						logs.append('<li> callback ... ready, init onclick</li>');
						$$('#btn-pay').on('click', function() {
							PayPalMobile.renderSinglePaymentUI(new PayPalPayment('1.23', 'SGD', 'Copier Paper A4', 'Sale', new PayPalPaymentDetails('1.23', '0.00', '0.00')), function( rt ) {
								var dom = $$('<span style="color: blue;"></span>');
								$$('#div-x').append(dom);
								dom.text(JSON.stringify(rt, null, 4));
							}, function( rt ) {
								var dom = $$('<span style="color: red;"></span>');
								$$('#div-x').append(dom);
								dom.text(JSON.stringify(rt, null, 4));
							});
						});
					});
				});
			} catch(e) {
				logs.append('<li> ' + e + ' </li>');
			}
		
		});
	} else {
		ob.init();
	}
	return false;
};

fw.onPageInit('index', function (page) {
	ob.toolbar.init();
});

fw.onPageAfterAnimation('index', function (page) { 
	
});
