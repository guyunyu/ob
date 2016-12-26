ob.toolbar = {
	init: function() {
		ob.cart.init();
		$$('.toolbar .me').on('click', function() {
			ob.mainView.router.load({
				url: 'pages/m/my.html'
			});
			return false;
		});
		$$('.toolbar .catalog').on('click', function() {
			ob.mainView.router.load({
				url: 'pages/catalog.html'
			});
			return false;
		});
		$$('.ob-search input.search-on-main').on('click', function() {
			return ob.list({
				q: ''
			});
		});
		if($$('.ob-search input.search-on-list').length === 1) {
			var ajax_queue = [];
			var ajax_delay = function( ) {
				var autocomplete, query, render;
				if(ajax_queue.length > 0) {
					var index = ajax_queue.length - 1;
					var e = ajax_queue[index];
					autocomplete = e.a;
					query = e.q;
					render = e.r;
					ajax_queue.splice(0, index + 1);
				} else {
					return;
				}
				autocomplete.showPreloader();
				ob.ajax({
					url: ob.url('/a/catalog/Item.List'),
					method: 'GET',
					data: {
						q: query,
						pageSize: 1,
						pageOffset: 99999
					},
					success: function(dt) {
						console.log(dt);
						autocomplete.hidePreloader();
						var results = [];
						var json = JSON.parse(dt);
						if(typeof json.count == 'number' && json.count > 0) {
							var t = Template7.compile('<div class="item-title gray">{{left}}</div><div class="item-after dark">{{right}}</div>');
							results.push({
								id: 0,
								q: query,
								name: t({
									left: 'show all items matching <b>' + ob.escapeHtml(query) + '</b>' + ' (' + json.count + ( parseInt(json.count, 10) > 1 ? ' items' : ' item' ) + ')',
									right: ''
								})
							});
							if(json.variables.facets) {
								if(json.variables.facets.category_id) {
									if(json.variables.facets.category_id.length > 0) {
										results.push({
											id: -1,
											q: query,
											name: t({
												left: '',
												right: 'items within selected category'
											})
										});
									}
									for(var index = 0; index < json.variables.facets.category_id.length && index < 5; index++) {
										var item = json.variables.facets.category_id[index];
										results.push({
											id: results.length,
											c: item.id,
											q: query,
											name: t({
												left: query + ' (' + item.count + ( parseInt(item.count, 10) > 1 ? ' items' : ' item' ) + ')',
												right: item.name
											})
										});
									}
								}
								if(json.variables.facets.brand_id) {
									if(json.variables.facets.brand_id.length > 0) {
										results.push({
											id: -2,
											q: query,
											name: t({
												left: '',
												right: 'items within selected brand'
											})
										});
									}
									for(var index = 0; index < json.variables.facets.brand_id.length && index < 5; index++) {
										var item = json.variables.facets.brand_id[index];
										results.push({
											id: results.length,
											r: item.id,
											q: query,
											name: t({
												left: query + ' (' + item.count + ( parseInt(item.count, 10) > 1 ? ' items' : ' item' ) + ')',
												right: item.name
											})
										});
									}
								}
							}
						}
						render(results);
					}
				});
			};
			var i = fw.autocomplete({
				input: '.ob-search input.search-on-list',
				openIn: 'page',
				view: ob.mainView,
				opener: $$('.ob-search input[type="search"]'),
				pageTitle: 'Find Product ...',
				notFoundText: 'No Item matches!',
				preloader: true,
				backOnSelect: false,
				valueProperty: 'id',
				textProperty: 'name',
				limit: 20,
				expandInput: true,
				itemTemplate: 
					'<li>' +
						'<label class="label-{{inputType}} item-content">' +
							'<input type="{{inputType}}" name="{{inputName}}" value="{{value}}" {{#if selected}}checked{{/if}}>' +
							'{{#if material}}' +
							'<div class="item-media">' +
								'<i class="icon icon-form-{{inputType}}"></i>' +
							'</div>' +
							'<div class="item-inner">{{text}}</div>' +
							'{{else}}' +
							'{{#if checkbox}}' +
							'<div class="item-media">' +
								'<i class="icon icon-form-checkbox"></i>' +
							'</div>' +
							'{{/if}}' +
							'<div class="item-inner">{{text}}</div>' +
							'{{/if}}' +
						'</label>' +
					'</li>',
				source: function (autocomplete, query, render) {
					if (query.length === 0) {
						render([]);
						return;
					}
					ajax_queue.push({
						a: autocomplete,
						q: query,
						r: render
					});
					setTimeout(ajax_delay, 500);
				},
				onOpen: function( autocomplete ) {
				},
				onChange: function( autocomplete, value ) {
					if(value.length === 1 && value[0].id >= 0) {
						autocomplete.params.view.router.back();
					}
				},
				onClose: function( autocomplete ) {
					if(autocomplete.value.length === 1 && (autocomplete.value[0].q || autocomplete.value[0].c || autocomplete.value[0].r)) {
						if(autocomplete.value[0].q) {
							$$(autocomplete.input).val(autocomplete.value[0].q);
						}
						ob.pages.list.go(
							autocomplete.value[0].q,
							autocomplete.value[0].c,
							autocomplete.value[0].r
						);
						return false;
					} else {
						return false;
					}
				}
			});
			fw.onPageAfterAnimation('autocomplete-' + i.inputName, function( page ) { 
				$$('.autocomplete-page .searchbar .searchbar-input').find('input[type="search"]').focus();
			});
		}
		$$('.view-main > .navbar').removeClass('ob-transparent');
	}
};