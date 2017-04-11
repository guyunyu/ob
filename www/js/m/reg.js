ob.pages.reg = {
	init: function( page ) {
		ob.pages.reg.container = $$(page.container);
		ob.pages.reg.container.find('div.reg-cmd > a').on('click', function() {
			if($$(this).data('working')) {
				return false;
			}
			$$(this).data('working', true);
			var releaseBtn = function() {
				ob.pages.reg.container.find('div.reg-cmd > a').data('working', false);
			};
			var validated = true;
			var f = ob.pages.reg.container.find('#reg-form');
			f.find('input').each(function() {
				if(validated && !$$(this).val()) {
					fw.popover('<div class="popover"><div class="popover-inner"><div class="ob-popover">' + $$(this).data('errmsg') + '</div></div></div>', this);
					validated = false;
				}
			});
			var data;
			if(validated) {
				data = {
					name: f.find('input[name="name"]').val(),
					email: f.find('input[name="email"]').val(),
					password1: f.find('input[name="password1"]').val(),
					password2: f.find('input[name="password2"]').val(),
					ajx: true
				};
				if(data.name && data.email && data.password1 && data.password2) {
					if(data.password1 !== data.password2) {
						fw.popover('<div class="popover"><div class="popover-inner"><div class="ob-popover">Passwords does not match!</div></div></div>', f.find('input[name="password2"]'));
						validated = false;
					}
				} else {
					validated = false;
				}
			}
			if(validated) {
				ob.ajax({
					url: ob.url('/m/account/reg.html'),
					method: 'POST',
					data: data,
					success: function(dt) {
						var json = JSON.parse(dt);
						if(json.reg === '1') {
							fw.addNotification({
								title: 'Office Buddy Sign Up',
								subtitle: '',
								message: 'Congratulation! You have been signed up to Office Buddy. Start shopping now!',
								media: '<img src="images/ob-48x48.png">',
								onClose: function () {
								}
						    });
							ob.pages.reg.container.find('div.reg-cmd > a').text('Signed Up. Login automatically ...');
							ob.ajax({
								url: ob.url('/m/account/login.html'),
								method: 'POST',
								data: {
									loginId: data.email,
									password: data.password1,
									rem: 1,
									ajx: 1
								},
								success: function(dt) {
									var json = JSON.parse(dt);
									if(json.login === '1') {
										window.localStorage.setItem('session', dt);
										if($$('div.notifications').length > 0) {
											setTimeout(function() {
												fw.closeModal();
												window.location.reload();
											}, 2000);
										} else {
											fw.closeModal();
											window.location.reload();
										}
									} else {
										fw.alert('Oops! It fails to sign in.');
									}
								}
							});
						} else {
							if(json.msg) {
								fw.alert(json.msg);
							} else {
								fw.alert('Oops! It fails to sign up.');
							}
							releaseBtn();
						}
					},
					error: function() {
						releaseBtn();
					}
				});
			} else {
				releaseBtn();
			}
		});
	}
};

fw.onPageInit('reg', function (page) {
	ob.pages.reg.init(page);
});
fw.onPageAfterAnimation('reg', function (page) { 
	ob.toolbar.init(page);
});
