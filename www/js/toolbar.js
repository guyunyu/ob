ob.toolbar = {
	init: function( page ) {
		ob.log('ob.toolbar.init(' + (page && page.name ? page.name : ' - ') + ')');
		ob.cart.init(page);
		var toolbar_showme = function() {
			if(!ob.mainView.allowPageChange) {
				ob.log('showme: allowPageChange=false;');
				ob.mainView.allowPageChange = true;
			}
			ob.mainView.router.load({
				url: 'pages/m/my.html'
			});
			return false;
		};
		var toolbar_showcat = function() {
			if(!ob.mainView.allowPageChange) {
				ob.log('showme: allowPageChange=false;');
				ob.mainView.allowPageChange = true;
			}
			ob.mainView.router.load({
				url: 'pages/catalog.html'
			});
			return false;
		};
		$('.toolbar .me').off('click', toolbar_showme);
		$('.toolbar .catalog').off('click', toolbar_showcat);
		if(page && page.name) {
			$('div.page').each(function() {
				if($(this).data('page') === page.name) {
					$(this).find('.toolbar .me').on('click', toolbar_showme);
					$(this).find('.toolbar .catalog').on('click', toolbar_showcat);
				}
			});
		}
		var toolbar_acrender = function( dl ) {
			var ul = $('.popup-search .help-text .searchbar-found > ul.ac');
			if(ul.length === 0) {
				ul = $('<ul class="ac"></ul>');
				$('.popup-search .help-text .searchbar-found').prepend(ul);
			}
			ul.children().remove();
			for(var index=0; index<dl.length; index++) {
				var li = $(dl[index].name);
				ul.append(li);
			}
		};
		var toolbar_recentsearch = function( i ) {
			var recents = ob.pages.list.getRecent();
			if(recents && recents.length > 0) {
				var div = $('.popup-search .help-text .searchbar-found > div.recents');
				if(div.length === 0) {
					div = $('<div class="recents accordion-list"></div>');
					$('.popup-search .help-text .searchbar-found').prepend(div);
					div.append('<ul><li class="accordion-item"><a href="#" class="item-content item-link"><div class="item-inner"><div class="item-title">Recent Search Keywords</div></div></a><div class="accordion-item-content"><div class="content-block keywords"></div></div></li></ul>');
				}
				var blocks = div.find('div.keywords');
				blocks.children().remove();
				for(var index=0; index<recents.length; index++) {
					var entry = $('<div class="chip"><div class="chip-label"><a href="#"></a></div></div>');
					entry.find('.chip-label > a').data('q', recents[index]).text(recents[index].length > 20 ? (recents[index].substring(0, 20) + '...') : recents[index]);
					blocks.append(entry);
				}
				div.find('a').on('click', function() {
					i.val($(this).data('q'));
					// i.trigger('input change');
					i.trigger('search');
				});
			}
		};
		var toolbar_acmainsearch = function( iref ) {
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
					daemon: true,
					url: ob.url('/a/catalog/Item.List'),
					method: 'GET',
					data: {
						q: query,
						pageSize: 1,
						pageOffset: 99999
					},
					success: function(dt) {
						// console.log(dt);
						autocomplete.hidePreloader();
						var results = [];
						var json = JSON.parse(dt);
						if(typeof json.count == 'number' && json.count > 0) {
							var t1 = Template7.compile('<li class="item-content"><div class="item-inner"><a href="pages/list.html?q={{q}}&c={{c}}&r={{r}}" onclick="fw.closeModal(\'.popup-search.modal-in\'); return true;"><div class="item-title">{{title}}</div></a></div></li>');
							var t2 = Template7.compile('<li class="item-content"><div class="item-inner"><div class="item-title">{{title}}</div></div></li>');
							results.push({
								id: 0,
								q: query,
								name: t1({
									title: 'show all items matching <strong>' + ob.escapeHtml(query) + '</strong>' + ' (' + json.count + ( parseInt(json.count, 10) > 1 ? ' items' : ' item' ) + ')',
									q: query,
									c: '',
									r: ''
								})
							});
							if(json.variables.facets) {
								if(json.variables.facets.category_id) {
									if(json.variables.facets.category_id.length > 0) {
										results.push({
											id: -1,
											q: query,
											name: t2({
												title: 'items within selected category'
											})
										});
									}
									for(var index = 0; index < json.variables.facets.category_id.length && index < 5; index++) {
										var item = json.variables.facets.category_id[index];
										results.push({
											id: results.length,
											c: item.id,
											q: query,
											name: t1({
												title: item.name + ' (' + item.count + ( parseInt(item.count, 10) > 1 ? ' items' : ' item' ) + ')',
												q: query,
												c: item.id,
												r: ''
											})
										});
									}
								}
								if(json.variables.facets.brand_id) {
									if(json.variables.facets.brand_id.length > 0) {
										results.push({
											id: -2,
											q: query,
											name: t2({
												title: 'items within selected brand'
											})
										});
									}
									for(var index = 0; index < json.variables.facets.brand_id.length && index < 5; index++) {
										var item = json.variables.facets.brand_id[index];
										results.push({
											id: results.length,
											r: item.id,
											q: query,
											name: t1({
												title: item.name + ' (' + item.count + ( parseInt(item.count, 10) > 1 ? ' items' : ' item' ) + ')',
												q: query,
												c: '',
												r: item.id
											})
										});
									}
								}
							}
						}
						toolbar_acrender(results);
					}
				});
			};
			var i = fw.autocomplete({
				input: 'input.search-on-popup',
				openIn: 'dropdown',
				preloader: false,
				expandInput: false,
				valueProperty: 'id',
				textProperty: 'name',
				dropdownPlaceholderText: 'Search Keywords ...',
				limit: 20,
				expandInput: true,
				source: function (autocomplete, query, render) {
					if (query.length === 0) {
						toolbar_acrender([]);
						return;
					}
					ajax_queue.push({
						a: autocomplete,
						q: query,
						r: render
					});
					//setTimeout(ajax_delay, 500);
					ajax_delay();
				},
				onOpen: function( autocomplete ) {
				},
				onChange: function( autocomplete, value ) {
				},
				onClose: function( autocomplete ) {
				}
			});
			i.positionDropDown = function() {};
			fw.onPageAfterAnimation('autocomplete-' + i.inputName, function( page ) { 
				$('.autocomplete-page .searchbar .searchbar-input').find('input[type="search"]').focus();
			});
		};
		var toolbar_onmainsearch = function() {
			if(this.value) {
				ob.list({
					q: this.value
				});
				fw.closeModal('.popup-search.modal-in');
			}
			return false;
		};
		var toolbar_showmainsearch = function() {
			if(!$('.popup-search').data('init')) {
				var xpop = $('.popup-search');
//				xpop.on('opened', function() {
//					toolbar_recentsearch($(this).find('input.search-on-popup'));
//					$(this).find('input.search-on-popup').focus();
//				});
				xpop.find('a.ob-cancel').on('click', function() {
					fw.closeModal('.popup-search.modal-in');
				});
				xpop.find('input.search-on-popup').on('search', toolbar_onmainsearch)
					.on('focus', function() {
						var div = $('.popup-search .help-text .searchbar-found > div.recents');
						fw.accordionOpen(div.find('li.accordion-item'));
					});
				// toolbar_acmainsearch(xpop.find('input.search-on-popup'));
				xpop.data('init', true);
			}
			toolbar_recentsearch($('.popup-search input.search-on-popup'));
			fw.popup('.popup-search');
			return false;
		};
		$('.ob-search input.search-on-main').off('focus', toolbar_showmainsearch);
		$('.ob-search input.search-on-main').on('focus', toolbar_showmainsearch);
		$('.ob-search input.search-on-list').off('focus', toolbar_showmainsearch);
		$('.ob-search input.search-on-list').on('focus', toolbar_showmainsearch);
		$('.view-main > .navbar').removeClass('ob-transparent');
	}
};