(function() {
	'use strict';
	var regModules = ['ng'],
		regInvokes = [],
		regConfigs = [],
		ocLazyLoad = angular.module('oc.lazyLoad', ['ng']),
		broadcast = angular.noop;

	ocLazyLoad.provider('$ocLazyLoad', ['$controllerProvider', '$provide', '$compileProvider', '$filterProvider', '$injector', '$animateProvider',
		function($controllerProvider, $provide, $compileProvider, $filterProvider, $injector, $animateProvider) {
			var modules = {},
				providers = {
					$controllerProvider: $controllerProvider,
					$compileProvider: $compileProvider,
					$filterProvider: $filterProvider,
					$provide: $provide, // other things
					$injector: $injector,
					$animateProvider: $animateProvider
				},
				anchor = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0],
				jsLoader, cssLoader, templatesLoader,
				debug = false,
				events = false;

			// Let's get the list of loaded modules & components
			init(angular.element(window.document));

			this.$get = ['$timeout', '$log', '$q', '$templateCache', '$http', '$rootElement', '$rootScope', '$cacheFactory', function($timeout, $log, $q, $templateCache, $http, $rootElement, $rootScope, $cacheFactory) {
				var instanceInjector,
					filesCache = $cacheFactory('ocLazyLoad');

				if(!debug) {
					$log = {};
					$log['error'] = angular.noop;
					$log['warn'] = angular.noop;
				}

				// Make this lazy because at the moment that $get() is called the instance injector hasn't been assigned to the rootElement yet
				providers.getInstanceInjector = function() {
					return (instanceInjector) ? instanceInjector : (instanceInjector = $rootElement.data('$injector'));
				};

				broadcast = function broadcast(eventName, params) {
					if(events) {
						$rootScope.$broadcast(eventName, params);
					}
				}

				/**
				 * Load a js/css file
				 * @param type
				 * @param path
				 * @returns promise
				 */
				var buildElement = function buildElement(type, path, params) {
					var deferred = $q.defer(),
						el, loaded,
						cacheBuster = function cacheBuster(url) {
							var dc = new Date().getTime();
							if(url.indexOf('?') != -1) {
								if(url.substring(0, url.length - 1) === '&') {
									return url + '_dc=' + dc;
								}
								return url + '&_dc=' + dc;
							} else {
								return url + '?_dc=' + dc;
							}
						};

					// Switch in case more content types are added later
					switch(type) {
						case 'css':
							el = document.createElement('link');
							el.type = 'text/css';
							el.rel = 'stylesheet';
							el.href = params.cache === false ? cacheBuster(path) : path;
							break;
						case 'js':
							el = document.createElement('script');
							el.src = params.cache === false ? cacheBuster(path) : path;
							break;
						default:
							deferred.reject(new Error('Requested type "' + type + '" is not known. Could not inject "' + path + '"'));
							break;
					}
					el.onload = el['onreadystatechange'] = function(e) {
						if((el['readyState'] && !(/^c|loade/.test(el['readyState']))) || loaded) return;
						el.onload = el['onreadystatechange'] = null
						loaded = 1;
						if(angular.isUndefined(filesCache.get(path))) {
							filesCache.put(path, true);
						}
						broadcast('ocLazyLoad.fileLoaded', path);
						deferred.resolve();
					}
					el.onerror = function(e) {
						deferred.reject(new Error('Unable to load '+path));
					}
					el.async = 1;
					anchor.insertBefore(el, anchor.lastChild);

					return deferred.promise;
				}

				if(angular.isUndefined(jsLoader)) {
					/**
					 * jsLoader function
					 * @type Function
					 * @param paths array list of js files to load
					 * @param callback to call when everything is loaded. We use a callback and not a promise
					 * @param params object config parameters
					 * because the user can overwrite jsLoader and it will probably not use promises :(
					 */
					jsLoader = function(paths, callback, params) {
						var promises = [];
						angular.forEach(paths, function loading(path) {
							promises.push(buildElement('js', path, params));
						});
						$q.all(promises).then(function success() {
							callback();
						}, function error(err) {
							callback(err);
						});
					}
					jsLoader.ocLazyLoadLoader = true;
				}

				if(angular.isUndefined(cssLoader)) {
					/**
					 * cssLoader function
					 * @type Function
					 * @param paths array list of css files to load
					 * @param callback to call when everything is loaded. We use a callback and not a promise
					 * @param params object config parameters
					 * because the user can overwrite cssLoader and it will probably not use promises :(
					 */
					cssLoader = function(paths, callback, params) {
						var promises = [];
						angular.forEach(paths, function loading(path) {
							promises.push(buildElement('css', path, params));
						});
						$q.all(promises).then(function success() {
							callback();
						}, function error(err) {
							callback(err);
						});
					}
					cssLoader.ocLazyLoadLoader = true;
				}

				if(angular.isUndefined(templatesLoader)) {
					/**
					 * templatesLoader function
					 * @type Function
					 * @param paths array list of css files to load
					 * @param callback to call when everything is loaded. We use a callback and not a promise
					 * @param params object config parameters for $http
					 * because the user can overwrite templatesLoader and it will probably not use promises :(
					 */
					templatesLoader = function(paths, callback, params) {
						if(angular.isString(paths)) {
							paths = [paths];
						}
						var promises = [];
						angular.forEach(paths, function(url) {
							var deferred = $q.defer();
							promises.push(deferred.promise);
							$http.get(url, params).success(function(data) {
								angular.forEach(angular.element(data), function(node) {
									if(node.nodeName === 'SCRIPT' && node.type === 'text/ng-template') {
										$templateCache.put(node.id, node.innerHTML);
									}
								});
								if(angular.isUndefined(filesCache.get(url))) {
									filesCache.put(url, true);
								}
								deferred.resolve();
							}).error(function(data) {
								var err = 'Error load template "' + url + '": ' + data;
								$log.error(err);
								deferred.reject(new Error(err));
							});
						});
						return $q.all(promises).then(function success() {
							callback();
						}, function error(err) {
							callback(err);
						});
					}
					templatesLoader.ocLazyLoadLoader = true;
				}

				var filesLoader = function(config, params) {
					var cssFiles = [],
						templatesFiles = [],
						jsFiles = [],
						promises = [];

					angular.extend(params || {}, config);

					angular.forEach(params.files, function(path) {
						if(angular.isUndefined(filesCache.get(path)) || params.cache === false) {
							if(/\.css[^\.]*$/.test(path) && cssFiles.indexOf(path) === -1) {
								cssFiles.push(path);
							} else if(/\.(htm|html)[^\.]*$/.test(path) && templatesFiles.indexOf(path) === -1) {
								templatesFiles.push(path);
							} else if (jsFiles.indexOf(path) === -1) {
								jsFiles.push(path);
							}
						}
					});

					if(cssFiles.length > 0) {
						var cssDeferred = $q.defer();
						cssLoader(cssFiles, function(err) {
							if(angular.isDefined(err) && cssLoader.hasOwnProperty('ocLazyLoadLoader')) {
								$log.error(err);
								cssDeferred.reject(err);
							} else {
								cssDeferred.resolve();
							}
						}, params);
						promises.push(cssDeferred.promise);
					}

					if(templatesFiles.length > 0) {
						var templatesDeferred = $q.defer();
						templatesLoader(templatesFiles, function(err) {
							if(angular.isDefined(err) && templatesLoader.hasOwnProperty('ocLazyLoadLoader')) {
								$log.error(err);
								templatesDeferred.reject(err);
							} else {
								templatesDeferred.resolve();
							}
						}, params);
						promises.push(templatesDeferred.promise);
					}

					if(jsFiles.length > 0) {
						var jsDeferred = $q.defer();
						jsLoader(jsFiles, function(err) {
							if(angular.isDefined(err) && jsLoader.hasOwnProperty('ocLazyLoadLoader')) {
								$log.error(err);
								jsDeferred.reject(err);
							} else {
								jsDeferred.resolve();
							}
						}, params);
						promises.push(jsDeferred.promise);
					}

					return $q.all(promises);
				}

				return {
					getModuleConfig: function(name) {
						if(!modules[name]) {
							return null;
						}
						return modules[name];
					},

					setModuleConfig: function(module) {
						modules[module.name] = module;
						return module;
					},

					getModules: function() {
						return regModules;
					},

					// deprecated
					loadTemplateFile: function(paths, params) {
						return filesLoader({files: paths}, params);
					},

					load: function(module, params) {
						var self = this,
							config = null,
							moduleCache = [],
							deferredList = [],
							deferred = $q.defer(),
							moduleName,
							errText;

						if(angular.isUndefined(params)) {
							params = {};
						}

						// If module is an array, break it down
						if(angular.isArray(module)) {
							// Resubmit each entry as a single module
							angular.forEach(module, function(m) {
                                if (m) {
                                    deferredList.push(self.load(m, params));
                                }
							});

							// Resolve the promise once everything has loaded
							$q.all(deferredList).then(function() {
								deferred.resolve(module);
							});

							return deferred.promise;
						}

						moduleName = getModuleName(module);

						// Get or Set a configuration depending on what was passed in
						if(typeof module === 'string') {
							config = self.getModuleConfig(module);
							if(!config) {
								config = {
									files: [module]
								};
								moduleName = null;
							}
						} else if(typeof module === 'object') {
							config = self.setModuleConfig(module);
						}

						if(config === null) {
							errText = 'Module "' + moduleName + '" is not configured, cannot load.';
							$log.error(errText);
							deferred.reject(new Error(errText));
						} else {
							// deprecated
							if(angular.isDefined(config.template)) {
								if(angular.isUndefined(config.files)) {
									config.files = [];
								}
								if(angular.isString(config.template)) {
									config.files.push(config.template);
								} else if(angular.isArray(config.template)) {
									config.files.concat(config.template);
								}
							}
						}

						moduleCache.push = function(value) {
							if(this.indexOf(value) === -1) {
								Array.prototype.push.apply(this, arguments);
							}
						};

						// If this module has been loaded before, re-use it.
						if(angular.isDefined(moduleName) && moduleExists(moduleName) && regModules.indexOf(moduleName) !== -1) {
							moduleCache.push(moduleName);

							// if we don't want to load new files, resolve here
							if(angular.isUndefined(config.files)) {
								deferred.resolve();
								return deferred.promise;
							}
						}

						var loadDependencies = function loadDependencies(module) {
							var moduleName,
								loadedModule,
								requires,
                                diff,
								promisesList = [];

							moduleName = getModuleName(module);
							if(moduleName === null) {
								return $q.when();
							} else {
								try {
									loadedModule = getModule(moduleName);
								} catch(e) {
									var deferred = $q.defer();
									$log.error(e.message);
									deferred.reject(e);
									return deferred.promise;
								}
								requires = getRequires(loadedModule);
							}

							angular.forEach(requires, function(requireEntry) {
								// If no configuration is provided, try and find one from a previous load.
								// If there isn't one, bail and let the normal flow run
								if(typeof requireEntry === 'string') {
									var config = self.getModuleConfig(requireEntry);
									if(config === null) {
										moduleCache.push(requireEntry); // We don't know about this module, but something else might, so push it anyway.
										return;
									}
									requireEntry = config;
								}

								// Check if this dependency has been loaded previously or is already in the moduleCache
								if(moduleExists(requireEntry.name) || moduleCache.indexOf(requireEntry.name) !== -1) {
									if(typeof module !== 'string') {
                                        // compare against the already loaded module to see if the new definition adds any new files
                                        diff = requireEntry.files.filter(function (n) {
                                            return self.getModuleConfig(requireEntry.name).files.indexOf(n) < 0
                                        });
                                        if (diff.length !== 0) {
                                            $log.warn('Module "', moduleName, '" attempted to redefine configuration for dependency. "', requireEntry.name, '"\n Additional Files Loaded:', diff);
	                                        var c = angular.copy(requireEntry);
	                                        c.files = diff;
                                            promisesList.push(filesLoader(c, params).then(function () {
                                                return loadDependencies(requireEntry);
                                            }));
                                        }
                                    }
									return;
								} else if(typeof requireEntry === 'object') {
									if(requireEntry.hasOwnProperty('name') && requireEntry['name']) {
										// The dependency doesn't exist in the module cache and is a new configuration, so store and push it.
										self.setModuleConfig(requireEntry);
										moduleCache.push(requireEntry['name']);
									}

									// CSS Loading Handler
									if(requireEntry.hasOwnProperty('css') && requireEntry['css'].length !== 0) {
										// Locate the document insertion point
										angular.forEach(requireEntry['css'], function(path) {
											buildElement('css', path, params);
										});
									}
									// CSS End.
								}

								// Check if the dependency has any files that need to be loaded. If there are, push a new promise to the promise list.
								if(requireEntry.hasOwnProperty('files') && requireEntry.files.length !== 0) {
									if(requireEntry.files) {
										promisesList.push(filesLoader(requireEntry, params).then(function() {
											return loadDependencies(requireEntry)
										}));
									}
								}
							});

							// Create a wrapper promise to watch the promise list and resolve it once everything is done.
							return $q.all(promisesList);
						}

						filesLoader(config, params).then(function success() {
							if(moduleName === null) {
								deferred.resolve(module);
							} else {
								moduleCache.push(moduleName);
								loadDependencies(moduleName).then(function success() {
									try {
										register(providers, moduleCache, params);
									} catch(e) {
										$log.error(e.message);
										deferred.reject(e);
										return;
									}
									$timeout(function() {
										deferred.resolve(module);
									});
								}, function error(err) {
									$timeout(function() {
										deferred.reject(err);
									});
								});
							}
						}, function error(err) {
							deferred.reject(err);
						});

						return deferred.promise;
					}
				};
			}];

			this.config = function(config) {
				if(angular.isDefined(config.jsLoader) || angular.isDefined(config.asyncLoader)) {
					jsLoader = config.jsLoader || config.asyncLoader;
					if(!angular.isFunction(jsLoader)) {
						throw('The js loader needs to be a function');
					}
				}

				if(angular.isDefined(config.cssLoader)) {
					cssLoader = config.cssLoader;
					if(!angular.isFunction(cssLoader)) {
						throw('The css loader needs to be a function');
					}
				}

				if(angular.isDefined(config.templatesLoader)) {
					templatesLoader = config.templatesLoader;
					if(!angular.isFunction(templatesLoader)) {
						throw('The template loader needs to be a function');
					}
				}

				// for bootstrap apps, we need to define the main module name
				if(angular.isDefined(config.loadedModules)) {
					var addRegModule = function(loadedModule) {
						if(regModules.indexOf(loadedModule) < 0) {
							regModules.push(loadedModule);
							angular.forEach(angular.module(loadedModule).requires, addRegModule);
						}
					};
					angular.forEach(config.loadedModules, addRegModule);
				}

				// If we want to define modules configs
				if(angular.isDefined(config.modules)) {
					if(angular.isArray(config.modules)) {
						angular.forEach(config.modules, function(moduleConfig) {
							modules[moduleConfig.name] = moduleConfig;
						});
					} else {
						modules[config.modules.name] = config.modules;
					}
				}

				if(angular.isDefined(config.debug)) {
					debug = config.debug;
				}

				if(angular.isDefined(config.events)) {
					events = config.events;
				}
			};
		}]);

	ocLazyLoad.directive('ocLazyLoad', ['$http', '$log', '$ocLazyLoad', '$compile', '$timeout', '$templateCache', '$animate',
		function($http, $log, $ocLazyLoad, $compile, $timeout, $templateCache, $animate) {
			return {
				restrict: 'A',
				terminal: true,
				priority: 401, // 1 more than ngInclude
				transclude: 'element',
				controller: angular.noop,
				compile: function(element, attrs) {
					return function($scope, $element, $attr, ctrl, $transclude) {
						var childScope,
							evaluated = $scope.$eval($attr.ocLazyLoad),
							onloadExp = evaluated && evaluated.onload ? evaluated.onload : '';

						/**
						 * Destroy the current scope of this element and empty the html
						 */
						function clearContent() {
							if(childScope) {
								childScope.$destroy();
								childScope = null;
							}
							$element.html('');
						}

						/**
						 * Load a template from cache or url
						 * @param url
						 * @param callback
						 */
						function loadTemplate(url, callback) {
							var view;

							if(typeof(view = $templateCache.get(url)) !== 'undefined') {
								callback(view);
							} else {
								$http.get(url)
									.success(function(data) {
										$templateCache.put('view:' + url, data);
										callback(data);
									})
									.error(function(data) {
										$log.error('Error load template "' + url + '": ' + data);
									});
							}
						}

						$scope.$watch($attr.ocLazyLoad, function(moduleName) {
							if(angular.isDefined(moduleName)) {
								$ocLazyLoad.load(moduleName).then(function(moduleConfig) {
									$transclude($scope, function cloneConnectFn(clone) {
										$animate.enter(clone, null, $element);
									});
								});
							} else {
								clearContent();
							}
						}, true);
					};
				}
				/*link: function($scope, $element, $attr) {

				 }*/
			};
		}]);

	/**
	 * Get the list of required modules/services/... for this module
	 * @param module
	 * @returns {Array}
	 */
	function getRequires(module) {
		var requires = [];
		angular.forEach(module.requires, function(requireModule) {
			if(regModules.indexOf(requireModule) === -1) {
				requires.push(requireModule);
			}
		});
		return requires;
	}

	/**
	 * Check if a module exists and returns it if it does
	 * @param moduleName
	 * @returns {boolean}
	 */
	function moduleExists(moduleName) {
		try {
			return angular.module(moduleName);
		} catch(e) {
			if(/No module/.test(e) || (e.message.indexOf('$injector:nomod') > -1)) {
				return false;
			}
		}
	}

	function getModule(moduleName) {
		try {
			return angular.module(moduleName);
		} catch(e) {
			// this error message really suxx
			if(/No module/.test(e) || (e .message.indexOf('$injector:nomod') > -1)) {
				e.message = 'The module "'+moduleName+'" that you are trying to load does not exist. ' + e.message
			}
			throw e;
		}
	}

	function invokeQueue(providers, queue, moduleName, reconfig) {
		if(!queue) {
			return;
		}

		var i, len, args, provider;
		for(i = 0, len = queue.length; i < len; i++) {
			args = queue[i];
			if(angular.isArray(args)) {
				if(providers.hasOwnProperty(args[0])) {
					provider = providers[args[0]];
				} else {
					throw new Error('unsupported provider ' + args[0]);
				}
				var invoked = regConfigs.indexOf(moduleName);
				if(registerInvokeList(args[2][0]) && (args[1] !== 'invoke' || (args[1] === 'invoke' && (!invoked || reconfig)))) {
					if(!invoked) {
						regConfigs.push(moduleName);
					}
					provider[args[1]].apply(provider, args[2]);
				}
			}
		}
	}

	/**
	 * Register a new module and load it
	 * @param providers
	 * @param registerModules
	 * @returns {*}
	 */
	function register(providers, registerModules, params) {
		if(registerModules) {
			var k, moduleName, moduleFn, runBlocks = [];
			for(k = registerModules.length - 1; k >= 0; k--) {
				moduleName = registerModules[k];
				if(typeof moduleName !== 'string') {
					moduleName = getModuleName(moduleName);
				}
				if(!moduleName) {
					continue;
				}
				moduleFn = angular.module(moduleName);
				if(regModules.indexOf(moduleName) === -1) { // new module
					regModules.push(moduleName);
					register(providers, moduleFn.requires, params);
					runBlocks = runBlocks.concat(moduleFn._runBlocks);
				}
				invokeQueue(providers, moduleFn._invokeQueue, moduleName, params.reconfig);
				invokeQueue(providers, moduleFn._configBlocks, moduleName, params.reconfig); // angular 1.3+
				broadcast('ocLazyLoad.moduleLoaded', moduleName);
				registerModules.pop();
			}
			var instanceInjector = providers.getInstanceInjector();
			angular.forEach(runBlocks, function(fn) {
				instanceInjector.invoke(fn);
			});
		}
	}

	/**
	 * Register an invoke
	 * @param invokeList
	 * @returns {*}
	 */
	function registerInvokeList(invokeList) {
		var newInvoke = false;
		if(angular.isString(invokeList)) {
			if(regInvokes.indexOf(invokeList) === -1) {
				newInvoke = true;
				regInvokes.push(invokeList);
				broadcast('ocLazyLoad.componentLoaded', invokeList);
			}
		} else if(angular.isObject(invokeList)) {
			angular.forEach(invokeList, function(invoke) {
				if(angular.isString(invoke) && regInvokes.indexOf(invoke) === -1) {
					newInvoke = true;
					regInvokes.push(invoke);
				}
			});
		} else {
			return true;
		}
		return newInvoke;
	}

	function getModuleName(module) {
		if(module === null) {
			return null;
		}
		var moduleName = null;
		if(typeof module === 'string') {
			moduleName = module;
		} else if(typeof module === 'object' && module.hasOwnProperty('name') && typeof module.name === 'string') {
			moduleName = module.name;
		}
		return moduleName;
	}

	/**
	 * Get the list of existing registered modules
	 * @param element
	 */
	function init(element) {
		var elements = [element],
			appElement,
			module,
			names = ['ng:app', 'ng-app', 'x-ng-app', 'data-ng-app'],
			NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;

		function append(elm) {
			return (elm && elements.push(elm));
		}

		angular.forEach(names, function(name) {
			names[name] = true;
			append(document.getElementById(name));
			name = name.replace(':', '\\:');
			if(element.querySelectorAll) {
				angular.forEach(element.querySelectorAll('.' + name), append);
				angular.forEach(element.querySelectorAll('.' + name + '\\:'), append);
				angular.forEach(element.querySelectorAll('[' + name + ']'), append);
			}
		});

		//TODO: search the script tags for angular.bootstrap
		angular.forEach(elements, function(elm) {
			if(!appElement) {
				var className = ' ' + element.className + ' ';
				var match = NG_APP_CLASS_REGEXP.exec(className);
				if(match) {
					appElement = elm;
					module = (match[2] || '').replace(/\s+/g, ',');
				} else {
					angular.forEach(elm.attributes, function(attr) {
						if(!appElement && names[attr.name]) {
							appElement = elm;
							module = attr.value;
						}
					});
				}
			}
		});

		if(appElement) {
			(function addReg(module) {
				if(regModules.indexOf(module) === -1) {
					// register existing modules
					regModules.push(module);
					var mainModule = angular.module(module);

					// register existing components (directives, services, ...)
					var queue = mainModule._invokeQueue,
						i, len, args;
					for(i = 0, len = queue.length; i < len; i++) {
						args = queue[i];
						if(angular.isArray(args)) {
							registerInvokeList(args[2][0]);
						}
					}

					// register config blocks (angular 1.3+)
					if(angular.isDefined(mainModule._configBlocks)) {
						var queue = mainModule._configBlocks,
							i, len, args;
						for(i = 0, len = queue.length; i < len; i++) {
							args = queue[i];
							if(angular.isArray(args)) {
								registerInvokeList(args[2][0]);
							}
						}
					}

					angular.forEach(mainModule.requires, addReg);
				}
			})(module);
		}
	}
})();
