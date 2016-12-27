fw.onPageInit('my', function (page) {
	if(ob.session.mc) {
		$$('.ob-icon-login').children('i').text('person');
		$$('.ob-icon-login').find('a > span.name').text(ob.session.mn);
	} else {
		$$('.ob-icon-login').find('a').on('click', function() {
			fw.loginScreen();
			return false;
		});
	}
});
fw.onPageAfterAnimation('my', function (page) { 
	ob.toolbar.init(page);
});
