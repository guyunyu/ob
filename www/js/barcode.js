ob.barcode = {
	init: function() {
		$$('.ob-icon-scan').on('click', function() {
			try {
				cordova.plugins.barcodeScanner.scan(
					function (result) {
						if(!result.cancelled) {
							ob.barcode.handle(result);
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
	},
	handle: function( c ) {
		if(typeof c.text === 'string') {
			var itemURLpre = ob.url('/i/catalog/item/');
			if(c.text.indexOf(itemURLpre) === 0) {
				var component = c.text.substr(itemURLpre.length);
				if(/^[A-Z0-9a-z]{12}\.html$/.test(component)) {
					var tokens = component.split('.');
					var url = 'pages/item.html?id=' + tokens[0];
					ob.mainView.router.load({
						url: url
					});
				}
			} else if(/^obsrv:http:\/\/.*/.test(c.text)) {
				window.localStorage.setItem('url', c.text.substr(6));
				fw.alert('Office Buddy service updated: ' + ob.url(''));
			} else {
				fw.alert('Barcode is not recognized: ' + c.text);
			}
		}
	}
};