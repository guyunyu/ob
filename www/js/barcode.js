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
			if(/^obsrv:http:\/\/.*/.test(c.text)) {
				window.localStorage.setItem('url', c.text.substr(6));
			}
			fw.alert('Office Buddy service updated: ' + ob.url(''));
		}
	}
};