/**
 * what-input - A global utility for tracking the current input method (mouse, keyboard or touch).
 * @version v4.3.1
 * @link https://github.com/ten1seven/what-input
 * @license MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define("whatInput", [], factory);
    else if (typeof exports === 'object')
        exports["whatInput"] = factory();
    else
        root["whatInput"] = factory();
})(this, function() {
    return /******/ (function(modules) { // webpackBootstrap
        /******/ // The module cache
        /******/
        var installedModules = {};

        /******/ // The require function
        /******/
        function __webpack_require__(moduleId) {

            /******/ // Check if module is in cache
            /******/
            if (installedModules[moduleId])
                /******/
                return installedModules[moduleId].exports;

            /******/ // Create a new module (and put it into the cache)
            /******/
            var module = installedModules[moduleId] = {
                /******/
                exports: {},
                /******/
                id: moduleId,
                /******/
                loaded: false
                /******/
            };

            /******/ // Execute the module function
            /******/
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

            /******/ // Flag the module as loaded
            /******/
            module.loaded = true;

            /******/ // Return the exports of the module
            /******/
            return module.exports;
            /******/
        }


        /******/ // expose the modules object (__webpack_modules__)
        /******/
        __webpack_require__.m = modules;

        /******/ // expose the module cache
        /******/
        __webpack_require__.c = installedModules;

        /******/ // __webpack_public_path__
        /******/
        __webpack_require__.p = "";

        /******/ // Load entry module and return exports
        /******/
        return __webpack_require__(0);
        /******/
    })
    /************************************************************************/
    /******/
    ([
        /* 0 */
        /***/
        function(module, exports) {

            'use strict';

            module.exports = function() {
                /*
                 * variables
                 */

                // last used input type
                var currentInput = 'initial';

                // last used input intent
                var currentIntent = null;

                // cache document.documentElement
                var doc = document.documentElement;

                // form input types
                var formInputs = ['input', 'select', 'textarea'];

                var functionList = [];

                // list of modifier keys commonly used with the mouse and
                // can be safely ignored to prevent false keyboard detection
                var ignoreMap = [16, // shift
                    17, // control
                    18, // alt
                    91, // Windows key / left Apple cmd
                    93 // Windows menu / right Apple cmd
                ];

                // list of keys for which we change intent even for form inputs
                var changeIntentMap = [9 // tab
                ];

                // mapping of events to input types
                var inputMap = {
                    keydown: 'keyboard',
                    keyup: 'keyboard',
                    mousedown: 'mouse',
                    mousemove: 'mouse',
                    MSPointerDown: 'pointer',
                    MSPointerMove: 'pointer',
                    pointerdown: 'pointer',
                    pointermove: 'pointer',
                    touchstart: 'touch'
                };

                // array of all used input types
                var inputTypes = [];

                // boolean: true if touch buffer is active
                var isBuffering = false;

                // boolean: true if the page is being scrolled
                var isScrolling = false;

                // store current mouse position
                var mousePos = {
                    x: null,
                    y: null
                };

                // map of IE 10 pointer events
                var pointerMap = {
                    2: 'touch',
                    3: 'touch', // treat pen like touch
                    4: 'mouse'
                };

                var supportsPassive = false;

                try {
                    var opts = Object.defineProperty({}, 'passive', {
                        get: function get() {
                            supportsPassive = true;
                        }
                    });

                    window.addEventListener('test', null, opts);
                } catch (e) {}

                /*
                 * set up
                 */

                var setUp = function setUp() {
                    // add correct mouse wheel event mapping to `inputMap`
                    inputMap[detectWheel()] = 'mouse';

                    addListeners();
                    setInput();
                };

                /*
                 * events
                 */

                var addListeners = function addListeners() {
                    // `pointermove`, `MSPointerMove`, `mousemove` and mouse wheel event binding
                    // can only demonstrate potential, but not actual, interaction
                    // and are treated separately
                    var options = supportsPassive ? {
                        passive: true
                    } : false;

                    // pointer events (mouse, pen, touch)
                    if (window.PointerEvent) {
                        doc.addEventListener('pointerdown', updateInput);
                        doc.addEventListener('pointermove', setIntent);
                    } else if (window.MSPointerEvent) {
                        doc.addEventListener('MSPointerDown', updateInput);
                        doc.addEventListener('MSPointerMove', setIntent);
                    } else {
                        // mouse events
                        doc.addEventListener('mousedown', updateInput);
                        doc.addEventListener('mousemove', setIntent);

                        // touch events
                        if ('ontouchstart' in window) {
                            doc.addEventListener('touchstart', touchBuffer, options);
                            doc.addEventListener('touchend', touchBuffer);
                        }
                    }

                    // mouse wheel
                    doc.addEventListener(detectWheel(), setIntent, options);

                    // keyboard events
                    doc.addEventListener('keydown', updateInput);
                    doc.addEventListener('keyup', updateInput);
                };

                // checks conditions before updating new input
                var updateInput = function updateInput(event) {
                    // only execute if the touch buffer timer isn't running
                    if (!isBuffering) {
                        var eventKey = event.which;
                        var value = inputMap[event.type];
                        if (value === 'pointer') value = pointerType(event);

                        if (currentInput !== value || currentIntent !== value) {
                            var activeElem = document.activeElement;
                            var activeInput = false;
                            var notFormInput = activeElem && activeElem.nodeName && formInputs.indexOf(activeElem.nodeName.toLowerCase()) === -1;

                            if (notFormInput || changeIntentMap.indexOf(eventKey) !== -1) {
                                activeInput = true;
                            }

                            if (value === 'touch' ||
                                // ignore mouse modifier keys
                                value === 'mouse' ||
                                // don't switch if the current element is a form input
                                value === 'keyboard' && eventKey && activeInput && ignoreMap.indexOf(eventKey) === -1) {
                                // set the current and catch-all variable
                                currentInput = currentIntent = value;

                                setInput();
                            }
                        }
                    }
                };

                // updates the doc and `inputTypes` array with new input
                var setInput = function setInput() {
                    doc.setAttribute('data-whatinput', currentInput);
                    doc.setAttribute('data-whatintent', currentInput);

                    if (inputTypes.indexOf(currentInput) === -1) {
                        inputTypes.push(currentInput);
                        doc.className += ' whatinput-types-' + currentInput;
                    }

                    fireFunctions('input');
                };

                // updates input intent for `mousemove` and `pointermove`
                var setIntent = function setIntent(event) {
                    // test to see if `mousemove` happened relative to the screen
                    // to detect scrolling versus mousemove
                    if (mousePos['x'] !== event.screenX || mousePos['y'] !== event.screenY) {
                        isScrolling = false;

                        mousePos['x'] = event.screenX;
                        mousePos['y'] = event.screenY;
                    } else {
                        isScrolling = true;
                    }

                    // only execute if the touch buffer timer isn't running
                    // or scrolling isn't happening
                    if (!isBuffering && !isScrolling) {
                        var value = inputMap[event.type];
                        if (value === 'pointer') value = pointerType(event);

                        if (currentIntent !== value) {
                            currentIntent = value;

                            doc.setAttribute('data-whatintent', currentIntent);

                            fireFunctions('intent');
                        }
                    }
                };

                // buffers touch events because they frequently also fire mouse events
                var touchBuffer = function touchBuffer(event) {
                    if (event.type === 'touchstart') {
                        isBuffering = false;

                        // set the current input
                        updateInput(event);
                    } else {
                        isBuffering = true;
                    }
                };

                var fireFunctions = function fireFunctions(type) {
                    for (var i = 0, len = functionList.length; i < len; i++) {
                        if (functionList[i].type === type) {
                            functionList[i].fn.call(undefined, currentIntent);
                        }
                    }
                };

                /*
                 * utilities
                 */

                var pointerType = function pointerType(event) {
                    if (typeof event.pointerType === 'number') {
                        return pointerMap[event.pointerType];
                    } else {
                        // treat pen like touch
                        return event.pointerType === 'pen' ? 'touch' : event.pointerType;
                    }
                };

                // detect version of mouse wheel event to use
                // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
                var detectWheel = function detectWheel() {
                    var wheelType = void 0;

                    // Modern browsers support "wheel"
                    if ('onwheel' in document.createElement('div')) {
                        wheelType = 'wheel';
                    } else {
                        // Webkit and IE support at least "mousewheel"
                        // or assume that remaining browsers are older Firefox
                        wheelType = document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
                    }

                    return wheelType;
                };

                var objPos = function objPos(match) {
                    for (var i = 0, len = functionList.length; i < len; i++) {
                        if (functionList[i].fn === match) {
                            return i;
                        }
                    }
                };

                /*
                 * init
                 */

                // don't start script unless browser cuts the mustard
                // (also passes if polyfills are used)
                if ('addEventListener' in window && Array.prototype.indexOf) {
                    setUp();
                }

                /*
                 * api
                 */

                return {
                    // returns string: the current input type
                    // opt: 'loose'|'strict'
                    // 'strict' (default): returns the same value as the `data-whatinput` attribute
                    // 'loose': includes `data-whatintent` value if it's more current than `data-whatinput`
                    ask: function ask(opt) {
                        return opt === 'loose' ? currentIntent : currentInput;
                    },

                    // returns array: all the detected input types
                    types: function types() {
                        return inputTypes;
                    },

                    // overwrites ignored keys with provided array
                    ignoreKeys: function ignoreKeys(arr) {
                        ignoreMap = arr;
                    },

                    // attach functions to input and intent "events"
                    // funct: function to fire on change
                    // eventType: 'input'|'intent'
                    registerOnChange: function registerOnChange(fn, eventType) {
                        functionList.push({
                            fn: fn,
                            type: eventType || 'input'
                        });
                    },

                    unRegisterOnChange: function unRegisterOnChange(fn) {
                        var position = objPos(fn);

                        if (position) {
                            functionList.splice(position, 1);
                        }
                    }
                };
            }();

            /***/
        }
        /******/
    ])
});;
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 6); /******/
})( /************************************************************************/ /******/ [ /* 0 */ /***/ function(module, exports) {
    module.exports = jQuery; /***/
}, /* 1 */ /***/ function(module, __webpack_exports__, __webpack_require__) {
    "use strict"; /* harmony export (binding) */
    __webpack_require__.d(__webpack_exports__, "a", function() {
        return rtl;
    }); /* harmony export (binding) */
    __webpack_require__.d(__webpack_exports__, "b", function() {
        return GetYoDigits;
    }); /* harmony export (binding) */
    __webpack_require__.d(__webpack_exports__, "c", function() {
        return transitionend;
    }); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); // Core Foundation Utilities, utilized in a number of places.
    /**
     * Returns a boolean for RTL support
     */
    function rtl() {
        return __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html').attr('dir') === 'rtl';
    }
    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    function GetYoDigits(length, namespace) {
        length = length || 6;
        return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    }

    function transitionend($elem) {
        var transitions = {
            'transition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'otransitionend'
        };
        var elem = document.createElement('div'),
            end;
        for (var t in transitions) {
            if (typeof elem.style[t] !== 'undefined') {
                end = transitions[t];
            }
        }
        if (end) {
            return end;
        } else {
            end = setTimeout(function() {
                $elem.triggerHandler('transitionend', [$elem]);
            }, 1);
            return 'transitionend';
        }
    } /***/
}, /* 2 */ /***/ function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    Object.defineProperty(__webpack_exports__, "__esModule", {
        value: true
    }); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_1__foundation_core__ = __webpack_require__(3); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__ = __webpack_require__(1); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(4);
    __WEBPACK_IMPORTED_MODULE_1__foundation_core__["a" /* Foundation */ ].addToJquery(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a); // These are now separated out, but historically were a part of this module,
    // and since this is here for backwards compatibility we include them in
    // this entry.
    __WEBPACK_IMPORTED_MODULE_1__foundation_core__["a" /* Foundation */ ].rtl = __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["a" /* rtl */ ];
    __WEBPACK_IMPORTED_MODULE_1__foundation_core__["a" /* Foundation */ ].GetYoDigits = __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["b" /* GetYoDigits */ ];
    __WEBPACK_IMPORTED_MODULE_1__foundation_core__["a" /* Foundation */ ].transitionend = __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["c" /* transitionend */ ]; // Every plugin depends on plugin now, we can include that on the core for the
    // script inclusion path.
    __WEBPACK_IMPORTED_MODULE_1__foundation_core__["a" /* Foundation */ ].Plugin = __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["a" /* Plugin */ ];
    window.Foundation = __WEBPACK_IMPORTED_MODULE_1__foundation_core__["a" /* Foundation */ ]; /***/
}, /* 3 */ /***/ function(module, __webpack_exports__, __webpack_require__) {
    "use strict"; /* harmony export (binding) */
    __webpack_require__.d(__webpack_exports__, "a", function() {
        return Foundation;
    }); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core__ = __webpack_require__(1); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__ = __webpack_require__(5);
    var FOUNDATION_VERSION = '6.4.3'; // Global Foundation object
    // This is attached to the window, or used as a module for AMD/Browserify
    var Foundation = {
        version: FOUNDATION_VERSION,
        /**
         * Stores initialized plugins.
         */
        _plugins: {},
        /**
         * Stores generated unique ids for plugin instances
         */
        _uuids: [],
        /**
         * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
         * @param {Object} plugin - The constructor of the plugin.
         */
        plugin: function plugin(_plugin, name) { // Object key to use when adding to global Foundation object
            // Examples: Foundation.Reveal, Foundation.OffCanvas
            var className = name || functionName(_plugin); // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
            // Examples: data-reveal, data-off-canvas
            var attrName = hyphenate(className); // Add to the Foundation object and the plugins list (for reflowing)
            this._plugins[attrName] = this[className] = _plugin;
        },
        /**
         * @function
         * Populates the _uuids array with pointers to each individual plugin instance.
         * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
         * Also fires the initialization event for each plugin, consolidating repetitive code.
         * @param {Object} plugin - an instance of a plugin, usually `this` in context.
         * @param {String} name - the name of the plugin, passed as a camelCased string.
         * @fires Plugin#init
         */
        registerPlugin: function registerPlugin(plugin, name) {
            var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
            plugin.uuid = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__["b" /* GetYoDigits */ ])(6, pluginName);
            if (!plugin.$element.attr('data-' + pluginName)) {
                plugin.$element.attr('data-' + pluginName, plugin.uuid);
            }
            if (!plugin.$element.data('zfPlugin')) {
                plugin.$element.data('zfPlugin', plugin);
            }
            /**
             * Fires when the plugin has initialized.
             * @event Plugin#init
             */
            plugin.$element.trigger('init.zf.' + pluginName);
            this._uuids.push(plugin.uuid);
            return;
        },
        /**
         * @function
         * Removes the plugins uuid from the _uuids array.
         * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
         * Also fires the destroyed event for the plugin, consolidating repetitive code.
         * @param {Object} plugin - an instance of a plugin, usually `this` in context.
         * @fires Plugin#destroyed
         */
        unregisterPlugin: function unregisterPlugin(plugin) {
            var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));
            this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
            plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
                /**
                 * Fires when the plugin has been destroyed.
                 * @event Plugin#destroyed
                 */
                .trigger('destroyed.zf.' + pluginName);
            for (var prop in plugin) {
                plugin[prop] = null; //clean up script to prep for garbage collection.
            }
            return;
        },
        /**
         * @function
         * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
         * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
         * @default If no argument is passed, reflow all currently active plugins.
         */
        reInit: function reInit(plugins) {
            var isJQ = plugins instanceof __WEBPACK_IMPORTED_MODULE_0_jquery___default.a;
            try {
                if (isJQ) {
                    plugins.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('zfPlugin')._init();
                    });
                } else {
                    var type = typeof plugins === 'undefined' ? 'undefined' : _typeof(plugins),
                        _this = this,
                        fns = {
                            'object': function object(plgs) {
                                plgs.forEach(function(p) {
                                    p = hyphenate(p);
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + p + ']').foundation('_init');
                                });
                            },
                            'string': function string() {
                                plugins = hyphenate(plugins);
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugins + ']').foundation('_init');
                            },
                            'undefined': function undefined() {
                                this['object'](Object.keys(_this._plugins));
                            }
                        };
                    fns[type](plugins);
                }
            } catch (err) {
                console.error(err);
            } finally {
                return plugins;
            }
        },
        /**
         * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
         * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
         * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
         */
        reflow: function reflow(elem, plugins) { // If plugins is undefined, just grab everything
            if (typeof plugins === 'undefined') {
                plugins = Object.keys(this._plugins);
            } // If plugins is a string, convert it to an array with one item
            else if (typeof plugins === 'string') {
                plugins = [plugins];
            }
            var _this = this; // Iterate through each plugin
            __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.each(plugins, function(i, name) { // Get the current plugin
                var plugin = _this._plugins[name]; // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
                var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(elem).find('[data-' + name + ']').addBack('[data-' + name + ']'); // For each plugin found, initialize it
                $elem.each(function() {
                    var $el = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                        opts = {}; // Don't double-dip on plugins
                    if ($el.data('zfPlugin')) {
                        console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
                        return;
                    }
                    if ($el.attr('data-options')) {
                        var thing = $el.attr('data-options').split(';').forEach(function(e, i) {
                            var opt = e.split(':').map(function(el) {
                                return el.trim();
                            });
                            if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
                        });
                    }
                    try {
                        $el.data('zfPlugin', new plugin(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), opts));
                    } catch (er) {
                        console.error(er);
                    } finally {
                        return;
                    }
                });
            });
        },
        getFnName: functionName,
        addToJquery: function addToJquery($) { // TODO: consider not making this a jQuery function
            // TODO: need way to reflow vs. re-initialize
            /**
             * The Foundation jQuery method.
             * @param {String|Array} method - An action to perform on the current jQuery object.
             */
            var foundation = function foundation(method) {
                var type = typeof method === 'undefined' ? 'undefined' : _typeof(method),
                    $noJS = $('.no-js');
                if ($noJS.length) {
                    $noJS.removeClass('no-js');
                }
                if (type === 'undefined') { //needs to initialize the Foundation object, or an individual plugin.
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["a" /* MediaQuery */ ]._init();
                    Foundation.reflow(this);
                } else if (type === 'string') { //an individual method to invoke on a plugin or group of plugins
                    var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
                    var plugClass = this.data('zfPlugin'); //determine the class of plugin
                    if (plugClass !== undefined && plugClass[method] !== undefined) { //make sure both the class and method exist
                        if (this.length === 1) { //if there's only one, call it directly.
                            plugClass[method].apply(plugClass, args);
                        } else {
                            this.each(function(i, el) { //otherwise loop through the jQuery collection and invoke the method on each
                                plugClass[method].apply($(el).data('zfPlugin'), args);
                            });
                        }
                    } else { //error for no class or no method
                        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
                    }
                } else { //error for invalid argument type
                    throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
                }
                return this;
            };
            $.fn.foundation = foundation;
            return $;
        }
    };
    Foundation.util = {
        /**
         * Function for applying a debounce effect to a function call.
         * @function
         * @param {Function} func - Function to be called at end of timeout.
         * @param {Number} delay - Time in ms to delay the call of `func`.
         * @returns function
         */
        throttle: function throttle(func, delay) {
            var timer = null;
            return function() {
                var context = this,
                    args = arguments;
                if (timer === null) {
                    timer = setTimeout(function() {
                        func.apply(context, args);
                        timer = null;
                    }, delay);
                }
            };
        }
    };
    window.Foundation = Foundation; // Polyfill for requestAnimationFrame
    (function() {
        if (!Date.now || !window.Date.now) window.Date.now = Date.now = function() {
            return new Date().getTime();
        };
        var vendors = ['webkit', 'moz'];
        for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
            var vp = vendors[i];
            window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
        }
        if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
            var lastTime = 0;
            window.requestAnimationFrame = function(callback) {
                var now = Date.now();
                var nextTime = Math.max(lastTime + 16, now);
                return setTimeout(function() {
                    callback(lastTime = nextTime);
                }, nextTime - now);
            };
            window.cancelAnimationFrame = clearTimeout;
        }
        /**
         * Polyfill for performance.now, required by rAF
         */
        if (!window.performance || !window.performance.now) {
            window.performance = {
                start: Date.now(),
                now: function now() {
                    return Date.now() - this.start;
                }
            };
        }
    })();
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(oThis) {
            if (typeof this !== 'function') { // closest thing possible to the ECMAScript 5
                // internal IsCallable function
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }
            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function fNOP() {},
                fBound = function fBound() {
                    return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            if (this.prototype) { // native functions don't have a prototype
                fNOP.prototype = this.prototype;
            }
            fBound.prototype = new fNOP();
            return fBound;
        };
    } // Polyfill to get the name of a function in IE9
    function functionName(fn) {
        if (Function.prototype.name === undefined) {
            var funcNameRegex = /function\s([^(]{1,})\(/;
            var results = funcNameRegex.exec(fn.toString());
            return results && results.length > 1 ? results[1].trim() : "";
        } else if (fn.prototype === undefined) {
            return fn.constructor.name;
        } else {
            return fn.prototype.constructor.name;
        }
    }

    function parseValue(str) {
        if ('true' === str) return true;
        else if ('false' === str) return false;
        else if (!isNaN(str * 1)) return parseFloat(str);
        return str;
    } // Convert PascalCase to kebab-case
    // Thank you: http://stackoverflow.com/a/8955580
    function hyphenate(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    } /***/
}, /* 4 */ /***/ function(module, __webpack_exports__, __webpack_require__) {
    "use strict"; /* harmony export (binding) */
    __webpack_require__.d(__webpack_exports__, "a", function() {
        return Plugin;
    }); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core__ = __webpack_require__(1);
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    } // Abstract class for providing lifecycle hooks. Expect plugins to define AT LEAST
    // {function} _setup (replaces previous constructor),
    // {function} _destroy (replaces previous destroy)
    var Plugin = function() {
        function Plugin(element, options) {
            _classCallCheck(this, Plugin);
            this._setup(element, options);
            var pluginName = getPluginName(this);
            this.uuid = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__["b" /* GetYoDigits */ ])(6, pluginName);
            if (!this.$element.attr('data-' + pluginName)) {
                this.$element.attr('data-' + pluginName, this.uuid);
            }
            if (!this.$element.data('zfPlugin')) {
                this.$element.data('zfPlugin', this);
            }
            /**
             * Fires when the plugin has initialized.
             * @event Plugin#init
             */
            this.$element.trigger('init.zf.' + pluginName);
        }
        _createClass(Plugin, [{
            key: 'destroy',
            value: function destroy() {
                this._destroy();
                var pluginName = getPluginName(this);
                this.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
                    /**
                     * Fires when the plugin has been destroyed.
                     * @event Plugin#destroyed
                     */
                    .trigger('destroyed.zf.' + pluginName);
                for (var prop in this) {
                    this[prop] = null; //clean up script to prep for garbage collection.
                }
            }
        }]);
        return Plugin;
    }(); // Convert PascalCase to kebab-case
    // Thank you: http://stackoverflow.com/a/8955580
    function hyphenate(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    function getPluginName(obj) {
        if (typeof obj.constructor.name !== 'undefined') {
            return hyphenate(obj.constructor.name);
        } else {
            return hyphenate(obj.className);
        }
    } /***/
}, /* 5 */ /***/ function(module, __webpack_exports__, __webpack_require__) {
    "use strict"; /* harmony export (binding) */
    __webpack_require__.d(__webpack_exports__, "a", function() {
        return MediaQuery;
    }); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
    var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); // Default set of media queries
    var defaultQueries = {
        'default': 'only screen',
        landscape: 'only screen and (orientation: landscape)',
        portrait: 'only screen and (orientation: portrait)',
        retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
    }; // matchMedia() polyfill - Test a CSS media type/query in JS.
    // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
    var matchMedia = window.matchMedia || function() {
        'use strict'; // For browsers that support matchMedium api such as IE 9 and webkit
        var styleMedia = window.styleMedia || window.media; // For those that don't support matchMedium
        if (!styleMedia) {
            var style = document.createElement('style'),
                script = document.getElementsByTagName('script')[0],
                info = null;
            style.type = 'text/css';
            style.id = 'matchmediajs-test';
            script && script.parentNode && script.parentNode.insertBefore(style, script); // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
            info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;
            styleMedia = {
                matchMedium: function matchMedium(media) {
                    var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }'; // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                    if (style.styleSheet) {
                        style.styleSheet.cssText = text;
                    } else {
                        style.textContent = text;
                    } // Test if media query is true or false
                    return info.width === '1px';
                }
            };
        }
        return function(media) {
            return {
                matches: styleMedia.matchMedium(media || 'all'),
                media: media || 'all'
            };
        };
    }();
    var MediaQuery = {
        queries: [],
        current: '',
        /**
         * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
         * @function
         * @private
         */
        _init: function _init() {
            var self = this;
            var $meta = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('meta.foundation-mq');
            if (!$meta.length) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<meta class="foundation-mq">').appendTo(document.head);
            }
            var extractedStyles = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('.foundation-mq').css('font-family');
            var namedQueries;
            namedQueries = parseStyleToObject(extractedStyles);
            for (var key in namedQueries) {
                if (namedQueries.hasOwnProperty(key)) {
                    self.queries.push({
                        name: key,
                        value: 'only screen and (min-width: ' + namedQueries[key] + ')'
                    });
                }
            }
            this.current = this._getCurrentSize();
            this._watcher();
        },
        /**
         * Checks if the screen is at least as wide as a breakpoint.
         * @function
         * @param {String} size - Name of the breakpoint to check.
         * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
         */
        atLeast: function atLeast(size) {
            var query = this.get(size);
            if (query) {
                return matchMedia(query).matches;
            }
            return false;
        },
        /**
         * Checks if the screen matches to a breakpoint.
         * @function
         * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
         * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
         */
        is: function is(size) {
            size = size.trim().split(' ');
            if (size.length > 1 && size[1] === 'only') {
                if (size[0] === this._getCurrentSize()) return true;
            } else {
                return this.atLeast(size[0]);
            }
            return false;
        },
        /**
         * Gets the media query of a breakpoint.
         * @function
         * @param {String} size - Name of the breakpoint to get.
         * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
         */
        get: function get(size) {
            for (var i in this.queries) {
                if (this.queries.hasOwnProperty(i)) {
                    var query = this.queries[i];
                    if (size === query.name) return query.value;
                }
            }
            return null;
        },
        /**
         * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
         * @function
         * @private
         * @returns {String} Name of the current breakpoint.
         */
        _getCurrentSize: function _getCurrentSize() {
            var matched;
            for (var i = 0; i < this.queries.length; i++) {
                var query = this.queries[i];
                if (matchMedia(query.value).matches) {
                    matched = query;
                }
            }
            if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
                return matched.name;
            } else {
                return matched;
            }
        },
        /**
         * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
         * @function
         * @private
         */
        _watcher: function _watcher() {
            var _this = this;
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('resize.zf.mediaquery').on('resize.zf.mediaquery', function() {
                var newSize = _this._getCurrentSize(),
                    currentSize = _this.current;
                if (newSize !== currentSize) { // Change the current media query
                    _this.current = newSize; // Broadcast the media query change on the window
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
                }
            });
        }
    }; // Thank you: https://github.com/sindresorhus/query-string
    function parseStyleToObject(str) {
        var styleObject = {};
        if (typeof str !== 'string') {
            return styleObject;
        }
        str = str.trim().slice(1, -1); // browsers re-quote string style values
        if (!str) {
            return styleObject;
        }
        styleObject = str.split('&').reduce(function(ret, param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            var key = parts[0];
            var val = parts[1];
            key = decodeURIComponent(key); // missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            val = val === undefined ? null : decodeURIComponent(val);
            if (!ret.hasOwnProperty(key)) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }
            return ret;
        }, {});
        return styleObject;
    } /***/
}, /* 6 */ /***/ function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(2); /***/
}] /******/ );
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 100); /******/
})( /************************************************************************/ /******/ { /***/
    1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 100: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(34); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 34: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_box__ = __webpack_require__(64);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].Box = __WEBPACK_IMPORTED_MODULE_1__foundation_util_box__["a" /* Box */ ]; /***/
    },
    /***/ 64: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Box;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_util_core__);
        var Box = {
            ImNotTouchingYou: ImNotTouchingYou,
            OverlapArea: OverlapArea,
            GetDimensions: GetDimensions,
            GetOffsets: GetOffsets,
            GetExplicitOffsets: GetExplicitOffsets
            /**
             * Compares the dimensions of an element to a container and determines collision events with container.
             * @function
             * @param {jQuery} element - jQuery object to test for collisions.
             * @param {jQuery} parent - jQuery object to use as bounding container.
             * @param {Boolean} lrOnly - set to true to check left and right values only.
             * @param {Boolean} tbOnly - set to true to check top and bottom values only.
             * @default if no parent object passed, detects collisions with `window`.
             * @returns {Boolean} - true if collision free, false if a collision in any direction.
             */
        };

        function ImNotTouchingYou(element, parent, lrOnly, tbOnly, ignoreBottom) {
            return OverlapArea(element, parent, lrOnly, tbOnly, ignoreBottom) === 0;
        };

        function OverlapArea(element, parent, lrOnly, tbOnly, ignoreBottom) {
            var eleDims = GetDimensions(element),
                topOver, bottomOver, leftOver, rightOver;
            if (parent) {
                var parDims = GetDimensions(parent);
                bottomOver = parDims.height + parDims.offset.top - (eleDims.offset.top + eleDims.height);
                topOver = eleDims.offset.top - parDims.offset.top;
                leftOver = eleDims.offset.left - parDims.offset.left;
                rightOver = parDims.width + parDims.offset.left - (eleDims.offset.left + eleDims.width);
            } else {
                bottomOver = eleDims.windowDims.height + eleDims.windowDims.offset.top - (eleDims.offset.top + eleDims.height);
                topOver = eleDims.offset.top - eleDims.windowDims.offset.top;
                leftOver = eleDims.offset.left - eleDims.windowDims.offset.left;
                rightOver = eleDims.windowDims.width - (eleDims.offset.left + eleDims.width);
            }
            bottomOver = ignoreBottom ? 0 : Math.min(bottomOver, 0);
            topOver = Math.min(topOver, 0);
            leftOver = Math.min(leftOver, 0);
            rightOver = Math.min(rightOver, 0);
            if (lrOnly) {
                return leftOver + rightOver;
            }
            if (tbOnly) {
                return topOver + bottomOver;
            } // use sum of squares b/c we care about overlap area.
            return Math.sqrt(topOver * topOver + bottomOver * bottomOver + leftOver * leftOver + rightOver * rightOver);
        }
        /**
         * Uses native methods to return an object of dimension values.
         * @function
         * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
         * @returns {Object} - nested object of integer pixel values
         * TODO - if element is window, return only those values.
         */
        function GetDimensions(elem) {
            elem = elem.length ? elem[0] : elem;
            if (elem === window || elem === document) {
                throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
            }
            var rect = elem.getBoundingClientRect(),
                parRect = elem.parentNode.getBoundingClientRect(),
                winRect = document.body.getBoundingClientRect(),
                winY = window.pageYOffset,
                winX = window.pageXOffset;
            return {
                width: rect.width,
                height: rect.height,
                offset: {
                    top: rect.top + winY,
                    left: rect.left + winX
                },
                parentDims: {
                    width: parRect.width,
                    height: parRect.height,
                    offset: {
                        top: parRect.top + winY,
                        left: parRect.left + winX
                    }
                },
                windowDims: {
                    width: winRect.width,
                    height: winRect.height,
                    offset: {
                        top: winY,
                        left: winX
                    }
                }
            };
        }
        /**
         * Returns an object of top and left integer pixel values for dynamically rendered elements,
         * such as: Tooltip, Reveal, and Dropdown. Maintained for backwards compatibility, and where
         * you don't know alignment, but generally from
         * 6.4 forward you should use GetExplicitOffsets, as GetOffsets conflates position and alignment.
         * @function
         * @param {jQuery} element - jQuery object for the element being positioned.
         * @param {jQuery} anchor - jQuery object for the element's anchor point.
         * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
         * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
         * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
         * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
         * TODO alter/rewrite to work with `em` values as well/instead of pixels
         */
        function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
            console.log("NOTE: GetOffsets is deprecated in favor of GetExplicitOffsets and will be removed in 6.5");
            switch (position) {
                case 'top':
                    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__foundation_util_core__["rtl"])() ? GetExplicitOffsets(element, anchor, 'top', 'left', vOffset, hOffset, isOverflow) : GetExplicitOffsets(element, anchor, 'top', 'right', vOffset, hOffset, isOverflow);
                case 'bottom':
                    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__foundation_util_core__["rtl"])() ? GetExplicitOffsets(element, anchor, 'bottom', 'left', vOffset, hOffset, isOverflow) : GetExplicitOffsets(element, anchor, 'bottom', 'right', vOffset, hOffset, isOverflow);
                case 'center top':
                    return GetExplicitOffsets(element, anchor, 'top', 'center', vOffset, hOffset, isOverflow);
                case 'center bottom':
                    return GetExplicitOffsets(element, anchor, 'bottom', 'center', vOffset, hOffset, isOverflow);
                case 'center left':
                    return GetExplicitOffsets(element, anchor, 'left', 'center', vOffset, hOffset, isOverflow);
                case 'center right':
                    return GetExplicitOffsets(element, anchor, 'right', 'center', vOffset, hOffset, isOverflow);
                case 'left bottom':
                    return GetExplicitOffsets(element, anchor, 'bottom', 'left', vOffset, hOffset, isOverflow);
                case 'right bottom':
                    return GetExplicitOffsets(element, anchor, 'bottom', 'right', vOffset, hOffset, isOverflow); // Backwards compatibility... this along with the reveal and reveal full
                    // classes are the only ones that didn't reference anchor
                case 'center':
                    return {
                        left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2 + hOffset,
                        top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - ($eleDims.height / 2 + vOffset)
                    };
                case 'reveal':
                    return {
                        left: ($eleDims.windowDims.width - $eleDims.width) / 2 + hOffset,
                        top: $eleDims.windowDims.offset.top + vOffset
                    };
                case 'reveal full':
                    return {
                        left: $eleDims.windowDims.offset.left,
                        top: $eleDims.windowDims.offset.top
                    };
                    break;
                default:
                    return {
                        left: __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__foundation_util_core__["rtl"])() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width - hOffset : $anchorDims.offset.left + hOffset,
                        top: $anchorDims.offset.top + $anchorDims.height + vOffset
                    };
            }
        }

        function GetExplicitOffsets(element, anchor, position, alignment, vOffset, hOffset, isOverflow) {
            var $eleDims = GetDimensions(element),
                $anchorDims = anchor ? GetDimensions(anchor) : null;
            var topVal, leftVal; // set position related attribute
            switch (position) {
                case 'top':
                    topVal = $anchorDims.offset.top - ($eleDims.height + vOffset);
                    break;
                case 'bottom':
                    topVal = $anchorDims.offset.top + $anchorDims.height + vOffset;
                    break;
                case 'left':
                    leftVal = $anchorDims.offset.left - ($eleDims.width + hOffset);
                    break;
                case 'right':
                    leftVal = $anchorDims.offset.left + $anchorDims.width + hOffset;
                    break;
            } // set alignment related attribute
            switch (position) {
                case 'top':
                case 'bottom':
                    switch (alignment) {
                        case 'left':
                            leftVal = $anchorDims.offset.left + hOffset;
                            break;
                        case 'right':
                            leftVal = $anchorDims.offset.left - $eleDims.width + $anchorDims.width - hOffset;
                            break;
                        case 'center':
                            leftVal = isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2 + hOffset;
                            break;
                    }
                    break;
                case 'right':
                case 'left':
                    switch (alignment) {
                        case 'bottom':
                            topVal = $anchorDims.offset.top - vOffset + $anchorDims.height - $eleDims.height;
                            break;
                        case 'top':
                            topVal = $anchorDims.offset.top + vOffset;
                            break;
                        case 'center':
                            topVal = $anchorDims.offset.top + vOffset + $anchorDims.height / 2 - $eleDims.height / 2;
                            break;
                    }
                    break;
            }
            return {
                top: topVal,
                left: leftVal
            };
        } /***/
    } /******/
});
"use strict";
! function(t) {
    function e(i) {
        if (o[i]) return o[i].exports;
        var n = o[i] = {
            i: i,
            l: !1,
            exports: {}
        };
        return t[i].call(n.exports, n, n.exports, e), n.l = !0, n.exports;
    }
    var o = {};
    e.m = t, e.c = o, e.i = function(t) {
        return t;
    }, e.d = function(t, o, i) {
        e.o(t, o) || Object.defineProperty(t, o, {
            configurable: !1,
            enumerable: !0,
            get: i
        });
    }, e.n = function(t) {
        var o = t && t.__esModule ? function() {
            return t.default;
        } : function() {
            return t;
        };
        return e.d(o, "a", o), o;
    }, e.o = function(t, e) {
        return Object.prototype.hasOwnProperty.call(t, e);
    }, e.p = "", e(e.s = 100);
}({
    1: function _(t, e) {
        t.exports = {
            Foundation: window.Foundation
        };
    },
    100: function _(t, e, o) {
        t.exports = o(34);
    },
    3: function _(t, e) {
        t.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        };
    },
    34: function _(t, e, o) {
        "use strict";
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var i = o(1),
            n = (o.n(i), o(64));
        i.Foundation.Box = n.a;
    },
    64: function _(t, e, o) {
        "use strict";

        function i(t, e, o, i, f) {
            return 0 === n(t, e, o, i, f);
        }

        function n(t, e, o, i, n) {
            var s, r, h, a, c = f(t);
            if (e) {
                var l = f(e);
                r = l.height + l.offset.top - (c.offset.top + c.height), s = c.offset.top - l.offset.top, h = c.offset.left - l.offset.left, a = l.width + l.offset.left - (c.offset.left + c.width);
            } else r = c.windowDims.height + c.windowDims.offset.top - (c.offset.top + c.height), s = c.offset.top - c.windowDims.offset.top, h = c.offset.left - c.windowDims.offset.left, a = c.windowDims.width - (c.offset.left + c.width);
            return r = n ? 0 : Math.min(r, 0), s = Math.min(s, 0), h = Math.min(h, 0), a = Math.min(a, 0), o ? h + a : i ? s + r : Math.sqrt(s * s + r * r + h * h + a * a);
        }

        function f(t) {
            if ((t = t.length ? t[0] : t) === window || t === document) throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
            var e = t.getBoundingClientRect(),
                o = t.parentNode.getBoundingClientRect(),
                i = document.body.getBoundingClientRect(),
                n = window.pageYOffset,
                f = window.pageXOffset;
            return {
                width: e.width,
                height: e.height,
                offset: {
                    top: e.top + n,
                    left: e.left + f
                },
                parentDims: {
                    width: o.width,
                    height: o.height,
                    offset: {
                        top: o.top + n,
                        left: o.left + f
                    }
                },
                windowDims: {
                    width: i.width,
                    height: i.height,
                    offset: {
                        top: n,
                        left: f
                    }
                }
            };
        }

        function s(t, e, i, n, f, s) {
            switch (console.log("NOTE: GetOffsets is deprecated in favor of GetExplicitOffsets and will be removed in 6.5"), i) {
                case "top":
                    return o.i(h.rtl)() ? r(t, e, "top", "left", n, f, s) : r(t, e, "top", "right", n, f, s);
                case "bottom":
                    return o.i(h.rtl)() ? r(t, e, "bottom", "left", n, f, s) : r(t, e, "bottom", "right", n, f, s);
                case "center top":
                    return r(t, e, "top", "center", n, f, s);
                case "center bottom":
                    return r(t, e, "bottom", "center", n, f, s);
                case "center left":
                    return r(t, e, "left", "center", n, f, s);
                case "center right":
                    return r(t, e, "right", "center", n, f, s);
                case "left bottom":
                    return r(t, e, "bottom", "left", n, f, s);
                case "right bottom":
                    return r(t, e, "bottom", "right", n, f, s);
                case "center":
                    return {
                        left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2 + f,
                        top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - ($eleDims.height / 2 + n)
                    };
                case "reveal":
                    return {
                        left: ($eleDims.windowDims.width - $eleDims.width) / 2 + f,
                        top: $eleDims.windowDims.offset.top + n
                    };
                case "reveal full":
                    return {
                        left: $eleDims.windowDims.offset.left,
                        top: $eleDims.windowDims.offset.top
                    };
                default:
                    return {
                        left: o.i(h.rtl)() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width - f : $anchorDims.offset.left + f,
                        top: $anchorDims.offset.top + $anchorDims.height + n
                    };
            }
        }

        function r(t, e, o, i, n, s, r) {
            var h, a, c = f(t),
                l = e ? f(e) : null;
            switch (o) {
                case "top":
                    h = l.offset.top - (c.height + n);
                    break;
                case "bottom":
                    h = l.offset.top + l.height + n;
                    break;
                case "left":
                    a = l.offset.left - (c.width + s);
                    break;
                case "right":
                    a = l.offset.left + l.width + s;
            }
            switch (o) {
                case "top":
                case "bottom":
                    switch (i) {
                        case "left":
                            a = l.offset.left + s;
                            break;
                        case "right":
                            a = l.offset.left - c.width + l.width - s;
                            break;
                        case "center":
                            a = r ? s : l.offset.left + l.width / 2 - c.width / 2 + s;
                    }
                    break;
                case "right":
                case "left":
                    switch (i) {
                        case "bottom":
                            h = l.offset.top - n + l.height - c.height;
                            break;
                        case "top":
                            h = l.offset.top + n;
                            break;
                        case "center":
                            h = l.offset.top + n + l.height / 2 - c.height / 2;
                    }
            }
            return {
                top: h,
                left: a
            };
        }
        o.d(e, "a", function() {
            return a;
        });
        var h = o(3),
            a = (o.n(h), {
                ImNotTouchingYou: i,
                OverlapArea: n,
                GetDimensions: f,
                GetOffsets: s,
                GetExplicitOffsets: r
            });
    }
});
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 101); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 101: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(35); /***/
    },
    /***/ 35: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_imageLoader__ = __webpack_require__(65);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].onImagesLoaded = __WEBPACK_IMPORTED_MODULE_1__foundation_util_imageLoader__["a" /* onImagesLoaded */ ]; /***/
    },
    /***/ 65: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return onImagesLoaded;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
        /**
         * Runs a callback function when images are fully loaded.
         * @param {Object} images - Image(s) to check if loaded.
         * @param {Func} callback - Function to execute when image is fully loaded.
         */
        function onImagesLoaded(images, callback) {
            var self = this,
                unloaded = images.length;
            if (unloaded === 0) {
                callback();
            }
            images.each(function() { // Check if image is loaded
                if (this.complete && this.naturalWidth !== undefined) {
                    singleImageLoaded();
                } else { // If the above check failed, simulate loading on detached element.
                    var image = new Image(); // Still count image as loaded if it finalizes with an error.
                    var events = "load.zf.images error.zf.images";
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(image).one(events, function me(event) { // Unbind the event listeners. We're using 'one' but only one of the two events will have fired.
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).off(events, me);
                        singleImageLoaded();
                    });
                    image.src = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).attr('src');
                }
            });

            function singleImageLoaded() {
                unloaded--;
                if (unloaded === 0) {
                    callback();
                }
            }
        } /***/
    } /******/
});
"use strict";
! function(n) {
    function t(o) {
        if (e[o]) return e[o].exports;
        var r = e[o] = {
            i: o,
            l: !1,
            exports: {}
        };
        return n[o].call(r.exports, r, r.exports, t), r.l = !0, r.exports;
    }
    var e = {};
    t.m = n, t.c = e, t.i = function(n) {
        return n;
    }, t.d = function(n, e, o) {
        t.o(n, e) || Object.defineProperty(n, e, {
            configurable: !1,
            enumerable: !0,
            get: o
        });
    }, t.n = function(n) {
        var e = n && n.__esModule ? function() {
            return n.default;
        } : function() {
            return n;
        };
        return t.d(e, "a", e), e;
    }, t.o = function(n, t) {
        return Object.prototype.hasOwnProperty.call(n, t);
    }, t.p = "", t(t.s = 101);
}({
    0: function _(n, t) {
        n.exports = jQuery;
    },
    1: function _(n, t) {
        n.exports = {
            Foundation: window.Foundation
        };
    },
    101: function _(n, t, e) {
        n.exports = e(35);
    },
    35: function _(n, t, e) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var o = e(1),
            r = (e.n(o), e(65));
        o.Foundation.onImagesLoaded = r.a;
    },
    65: function _(n, t, e) {
        "use strict";

        function o(n, t) {
            function e() {
                0 === --o && t();
            }
            var o = n.length;
            0 === o && t(), n.each(function() {
                if (this.complete && void 0 !== this.naturalWidth) e();
                else {
                    var n = new Image(),
                        t = "load.zf.images error.zf.images";
                    i()(n).one(t, function n(o) {
                        i()(this).off(t, n), e();
                    }), n.src = i()(this).attr("src");
                }
            });
        }
        e.d(t, "a", function() {
            return o;
        });
        var r = e(0),
            i = e.n(r);
    }
});
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 102); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 102: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(36); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 36: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(66);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].Keyboard = __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["a" /* Keyboard */ ]; /***/
    },
    /***/ 66: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Keyboard;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__);
        /*******************************************
         *                                         *
         * This util was created by Marius Olbertz *
         * Please thank Marius on GitHub /owlbertz *
         * or the web http://www.mariusolbertz.de/ *
         *                                         *
         ******************************************/
        var keyCodes = {
            9: 'TAB',
            13: 'ENTER',
            27: 'ESCAPE',
            32: 'SPACE',
            35: 'END',
            36: 'HOME',
            37: 'ARROW_LEFT',
            38: 'ARROW_UP',
            39: 'ARROW_RIGHT',
            40: 'ARROW_DOWN'
        };
        var commands = {}; // Functions pulled out to be referenceable from internals
        function findFocusable($element) {
            if (!$element) {
                return false;
            }
            return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function() {
                if (!__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is(':visible') || __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).attr('tabindex') < 0) {
                    return false;
                } //only have visible elements and those that have a tabindex greater or equal 0
                return true;
            });
        }

        function parseKey(event) {
            var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase(); // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
            key = key.replace(/\W+/, '');
            if (event.shiftKey) key = 'SHIFT_' + key;
            if (event.ctrlKey) key = 'CTRL_' + key;
            if (event.altKey) key = 'ALT_' + key; // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
            key = key.replace(/_$/, '');
            return key;
        }
        var Keyboard = {
            keys: getKeyCodes(keyCodes),
            /**
             * Parses the (keyboard) event and returns a String that represents its key
             * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
             * @param {Event} event - the event generated by the event handler
             * @return String key - String that represents the key pressed
             */
            parseKey: parseKey,
            /**
             * Handles the given (keyboard) event
             * @param {Event} event - the event generated by the event handler
             * @param {String} component - Foundation component's name, e.g. Slider or Reveal
             * @param {Objects} functions - collection of functions that are to be executed
             */
            handleKey: function handleKey(event, component, functions) {
                var commandList = commands[component],
                    keyCode = this.parseKey(event),
                    cmds, command, fn;
                if (!commandList) return console.warn('Component not defined!');
                if (typeof commandList.ltr === 'undefined') { // this component does not differentiate between ltr and rtl
                    cmds = commandList; // use plain list
                } else { // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
                    if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__["rtl"])()) cmds = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, commandList.ltr, commandList.rtl);
                    else cmds = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, commandList.rtl, commandList.ltr);
                }
                command = cmds[keyCode];
                fn = functions[command];
                if (fn && typeof fn === 'function') { // execute function  if exists
                    var returnValue = fn.apply();
                    if (functions.handled || typeof functions.handled === 'function') { // execute function when event was handled
                        functions.handled(returnValue);
                    }
                } else {
                    if (functions.unhandled || typeof functions.unhandled === 'function') { // execute function when event was not handled
                        functions.unhandled();
                    }
                }
            },
            /**
             * Finds all focusable elements within the given `$element`
             * @param {jQuery} $element - jQuery object to search within
             * @return {jQuery} $focusable - all focusable elements within `$element`
             */
            findFocusable: findFocusable,
            /**
             * Returns the component name name
             * @param {Object} component - Foundation component, e.g. Slider or Reveal
             * @return String componentName
             */
            register: function register(componentName, cmds) {
                commands[componentName] = cmds;
            }, // TODO9438: These references to Keyboard need to not require global. Will 'this' work in this context?
            //
            /**
             * Traps the focus in the given element.
             * @param  {jQuery} $element  jQuery object to trap the foucs into.
             */
            trapFocus: function trapFocus($element) {
                var $focusable = findFocusable($element),
                    $firstFocusable = $focusable.eq(0),
                    $lastFocusable = $focusable.eq(-1);
                $element.on('keydown.zf.trapfocus', function(event) {
                    if (event.target === $lastFocusable[0] && parseKey(event) === 'TAB') {
                        event.preventDefault();
                        $firstFocusable.focus();
                    } else if (event.target === $firstFocusable[0] && parseKey(event) === 'SHIFT_TAB') {
                        event.preventDefault();
                        $lastFocusable.focus();
                    }
                });
            },
            /**
             * Releases the trapped focus from the given element.
             * @param  {jQuery} $element  jQuery object to release the focus for.
             */
            releaseFocus: function releaseFocus($element) {
                $element.off('keydown.zf.trapfocus');
            }
        };
        /*
         * Constants for easier comparing.
         * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
         */
        function getKeyCodes(kcs) {
            var k = {};
            for (var kc in kcs) {
                k[kcs[kc]] = kcs[kc];
            }
            return k;
        } /***/
    } /******/
});
"use strict";
! function(n) {
    function t(o) {
        if (e[o]) return e[o].exports;
        var r = e[o] = {
            i: o,
            l: !1,
            exports: {}
        };
        return n[o].call(r.exports, r, r.exports, t), r.l = !0, r.exports;
    }
    var e = {};
    t.m = n, t.c = e, t.i = function(n) {
        return n;
    }, t.d = function(n, e, o) {
        t.o(n, e) || Object.defineProperty(n, e, {
            configurable: !1,
            enumerable: !0,
            get: o
        });
    }, t.n = function(n) {
        var e = n && n.__esModule ? function() {
            return n.default;
        } : function() {
            return n;
        };
        return t.d(e, "a", e), e;
    }, t.o = function(n, t) {
        return Object.prototype.hasOwnProperty.call(n, t);
    }, t.p = "", t(t.s = 102);
}({
    0: function _(n, t) {
        n.exports = jQuery;
    },
    1: function _(n, t) {
        n.exports = {
            Foundation: window.Foundation
        };
    },
    102: function _(n, t, e) {
        n.exports = e(36);
    },
    3: function _(n, t) {
        n.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        };
    },
    36: function _(n, t, e) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var o = e(1),
            r = (e.n(o), e(66));
        o.Foundation.Keyboard = r.a;
    },
    66: function _(n, t, e) {
        "use strict";

        function o(n) {
            return !!n && n.find("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]").filter(function() {
                return !(!a()(this).is(":visible") || a()(this).attr("tabindex") < 0);
            });
        }

        function r(n) {
            var t = d[n.which || n.keyCode] || String.fromCharCode(n.which).toUpperCase();
            return t = t.replace(/\W+/, ""), n.shiftKey && (t = "SHIFT_" + t), n.ctrlKey && (t = "CTRL_" + t), n.altKey && (t = "ALT_" + t), t = t.replace(/_$/, "");
        }
        e.d(t, "a", function() {
            return c;
        });
        var i = e(0),
            a = e.n(i),
            u = e(3),
            d = (e.n(u), {
                9: "TAB",
                13: "ENTER",
                27: "ESCAPE",
                32: "SPACE",
                35: "END",
                36: "HOME",
                37: "ARROW_LEFT",
                38: "ARROW_UP",
                39: "ARROW_RIGHT",
                40: "ARROW_DOWN"
            }),
            f = {},
            c = {
                keys: function(n) {
                    var t = {};
                    for (var e in n) {
                        t[n[e]] = n[e];
                    }
                    return t;
                }(d),
                parseKey: r,
                handleKey: function handleKey(n, t, o) {
                    var r, i, d, c = f[t],
                        s = this.parseKey(n);
                    if (!c) return console.warn("Component not defined!");
                    if (r = void 0 === c.ltr ? c : e.i(u.rtl)() ? a.a.extend({}, c.ltr, c.rtl) : a.a.extend({}, c.rtl, c.ltr), i = r[s], (d = o[i]) && "function" == typeof d) {
                        var l = d.apply();
                        (o.handled || "function" == typeof o.handled) && o.handled(l);
                    } else(o.unhandled || "function" == typeof o.unhandled) && o.unhandled();
                },
                findFocusable: o,
                register: function register(n, t) {
                    f[n] = t;
                },
                trapFocus: function trapFocus(n) {
                    var t = o(n),
                        e = t.eq(0),
                        i = t.eq(-1);
                    n.on("keydown.zf.trapfocus", function(n) {
                        n.target === i[0] && "TAB" === r(n) ? (n.preventDefault(), e.focus()) : n.target === e[0] && "SHIFT_TAB" === r(n) && (n.preventDefault(), i.focus());
                    });
                },
                releaseFocus: function releaseFocus(n) {
                    n.off("keydown.zf.trapfocus");
                }
            };
    }
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 103); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 103: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(37); /***/
    },
    /***/ 37: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__ = __webpack_require__(67);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].MediaQuery = __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["a" /* MediaQuery */ ];
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].MediaQuery._init(); /***/
    },
    /***/ 67: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return MediaQuery;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); // Default set of media queries
        var defaultQueries = {
            'default': 'only screen',
            landscape: 'only screen and (orientation: landscape)',
            portrait: 'only screen and (orientation: portrait)',
            retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
        }; // matchMedia() polyfill - Test a CSS media type/query in JS.
        // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
        var matchMedia = window.matchMedia || function() {
            'use strict'; // For browsers that support matchMedium api such as IE 9 and webkit
            var styleMedia = window.styleMedia || window.media; // For those that don't support matchMedium
            if (!styleMedia) {
                var style = document.createElement('style'),
                    script = document.getElementsByTagName('script')[0],
                    info = null;
                style.type = 'text/css';
                style.id = 'matchmediajs-test';
                script && script.parentNode && script.parentNode.insertBefore(style, script); // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
                info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;
                styleMedia = {
                    matchMedium: function matchMedium(media) {
                        var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }'; // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                        if (style.styleSheet) {
                            style.styleSheet.cssText = text;
                        } else {
                            style.textContent = text;
                        } // Test if media query is true or false
                        return info.width === '1px';
                    }
                };
            }
            return function(media) {
                return {
                    matches: styleMedia.matchMedium(media || 'all'),
                    media: media || 'all'
                };
            };
        }();
        var MediaQuery = {
            queries: [],
            current: '',
            /**
             * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
             * @function
             * @private
             */
            _init: function _init() {
                var self = this;
                var $meta = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('meta.foundation-mq');
                if (!$meta.length) {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<meta class="foundation-mq">').appendTo(document.head);
                }
                var extractedStyles = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('.foundation-mq').css('font-family');
                var namedQueries;
                namedQueries = parseStyleToObject(extractedStyles);
                for (var key in namedQueries) {
                    if (namedQueries.hasOwnProperty(key)) {
                        self.queries.push({
                            name: key,
                            value: 'only screen and (min-width: ' + namedQueries[key] + ')'
                        });
                    }
                }
                this.current = this._getCurrentSize();
                this._watcher();
            },
            /**
             * Checks if the screen is at least as wide as a breakpoint.
             * @function
             * @param {String} size - Name of the breakpoint to check.
             * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
             */
            atLeast: function atLeast(size) {
                var query = this.get(size);
                if (query) {
                    return matchMedia(query).matches;
                }
                return false;
            },
            /**
             * Checks if the screen matches to a breakpoint.
             * @function
             * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
             * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
             */
            is: function is(size) {
                size = size.trim().split(' ');
                if (size.length > 1 && size[1] === 'only') {
                    if (size[0] === this._getCurrentSize()) return true;
                } else {
                    return this.atLeast(size[0]);
                }
                return false;
            },
            /**
             * Gets the media query of a breakpoint.
             * @function
             * @param {String} size - Name of the breakpoint to get.
             * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
             */
            get: function get(size) {
                for (var i in this.queries) {
                    if (this.queries.hasOwnProperty(i)) {
                        var query = this.queries[i];
                        if (size === query.name) return query.value;
                    }
                }
                return null;
            },
            /**
             * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
             * @function
             * @private
             * @returns {String} Name of the current breakpoint.
             */
            _getCurrentSize: function _getCurrentSize() {
                var matched;
                for (var i = 0; i < this.queries.length; i++) {
                    var query = this.queries[i];
                    if (matchMedia(query.value).matches) {
                        matched = query;
                    }
                }
                if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
                    return matched.name;
                } else {
                    return matched;
                }
            },
            /**
             * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
             * @function
             * @private
             */
            _watcher: function _watcher() {
                var _this = this;
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('resize.zf.mediaquery').on('resize.zf.mediaquery', function() {
                    var newSize = _this._getCurrentSize(),
                        currentSize = _this.current;
                    if (newSize !== currentSize) { // Change the current media query
                        _this.current = newSize; // Broadcast the media query change on the window
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
                    }
                });
            }
        }; // Thank you: https://github.com/sindresorhus/query-string
        function parseStyleToObject(str) {
            var styleObject = {};
            if (typeof str !== 'string') {
                return styleObject;
            }
            str = str.trim().slice(1, -1); // browsers re-quote string style values
            if (!str) {
                return styleObject;
            }
            styleObject = str.split('&').reduce(function(ret, param) {
                var parts = param.replace(/\+/g, ' ').split('=');
                var key = parts[0];
                var val = parts[1];
                key = decodeURIComponent(key); // missing `=` should be `null`:
                // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
                val = val === undefined ? null : decodeURIComponent(val);
                if (!ret.hasOwnProperty(key)) {
                    ret[key] = val;
                } else if (Array.isArray(ret[key])) {
                    ret[key].push(val);
                } else {
                    ret[key] = [ret[key], val];
                }
                return ret;
            }, {});
            return styleObject;
        } /***/
    } /******/
});
"use strict";
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
! function(e) {
    function t(r) {
        if (n[r]) return n[r].exports;
        var i = n[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return e[r].call(i.exports, i, i.exports, t), i.l = !0, i.exports;
    }
    var n = {};
    t.m = e, t.c = n, t.i = function(e) {
        return e;
    }, t.d = function(e, n, r) {
        t.o(e, n) || Object.defineProperty(e, n, {
            configurable: !1,
            enumerable: !0,
            get: r
        });
    }, t.n = function(e) {
        var n = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return t.d(n, "a", n), n;
    }, t.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }, t.p = "", t(t.s = 103);
}({
    0: function _(e, t) {
        e.exports = jQuery;
    },
    1: function _(e, t) {
        e.exports = {
            Foundation: window.Foundation
        };
    },
    103: function _(e, t, n) {
        e.exports = n(37);
    },
    37: function _(e, t, n) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var r = n(1),
            i = (n.n(r), n(67));
        r.Foundation.MediaQuery = i.a, r.Foundation.MediaQuery._init();
    },
    67: function _(e, t, n) {
        "use strict";

        function r(e) {
            var t = {};
            return "string" != typeof e ? t : (e = e.trim().slice(1, -1)) ? t = e.split("&").reduce(function(e, t) {
                var n = t.replace(/\+/g, " ").split("="),
                    r = n[0],
                    i = n[1];
                return r = decodeURIComponent(r), i = void 0 === i ? null : decodeURIComponent(i), e.hasOwnProperty(r) ? Array.isArray(e[r]) ? e[r].push(i) : e[r] = [e[r], i] : e[r] = i, e;
            }, {}) : t;
        }
        n.d(t, "a", function() {
            return a;
        });
        var i = n(0),
            u = n.n(i),
            o = window.matchMedia || function() {
                var e = window.styleMedia || window.media;
                if (!e) {
                    var t = document.createElement("style"),
                        n = document.getElementsByTagName("script")[0],
                        r = null;
                    t.type = "text/css", t.id = "matchmediajs-test", n && n.parentNode && n.parentNode.insertBefore(t, n), r = "getComputedStyle" in window && window.getComputedStyle(t, null) || t.currentStyle, e = {
                        matchMedium: function matchMedium(e) {
                            var n = "@media " + e + "{ #matchmediajs-test { width: 1px; } }";
                            return t.styleSheet ? t.styleSheet.cssText = n : t.textContent = n, "1px" === r.width;
                        }
                    };
                }
                return function(t) {
                    return {
                        matches: e.matchMedium(t || "all"),
                        media: t || "all"
                    };
                };
            }(),
            a = {
                queries: [],
                current: "",
                _init: function _init() {
                    var e = this;
                    u()("meta.foundation-mq").length || u()('<meta class="foundation-mq">').appendTo(document.head);
                    var t, n = u()(".foundation-mq").css("font-family");
                    t = r(n);
                    for (var i in t) {
                        t.hasOwnProperty(i) && e.queries.push({
                            name: i,
                            value: "only screen and (min-width: " + t[i] + ")"
                        });
                    }
                    this.current = this._getCurrentSize(), this._watcher();
                },
                atLeast: function atLeast(e) {
                    var t = this.get(e);
                    return !!t && o(t).matches;
                },
                is: function is(e) {
                    return e = e.trim().split(" "), e.length > 1 && "only" === e[1] ? e[0] === this._getCurrentSize() : this.atLeast(e[0]);
                },
                get: function get(e) {
                    for (var t in this.queries) {
                        if (this.queries.hasOwnProperty(t)) {
                            var n = this.queries[t];
                            if (e === n.name) return n.value;
                        }
                    }
                    return null;
                },
                _getCurrentSize: function _getCurrentSize() {
                    for (var e, t = 0; t < this.queries.length; t++) {
                        var n = this.queries[t];
                        o(n.value).matches && (e = n);
                    }
                    return "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) ? e.name : e;
                },
                _watcher: function _watcher() {
                    var e = this;
                    u()(window).off("resize.zf.mediaquery").on("resize.zf.mediaquery", function() {
                        var t = e._getCurrentSize(),
                            n = e.current;
                        t !== n && (e.current = t, u()(window).trigger("changed.zf.mediaquery", [t, n]));
                    });
                }
            };
    }
});
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 104); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 104: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(38); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 38: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(68);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].Motion = __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["a" /* Motion */ ];
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].Move = __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["b" /* Move */ ]; /***/
    },
    /***/ 68: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "b", function() {
            return Move;
        }); /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Motion;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__);
        /**
         * Motion module.
         * @module foundation.motion
         */
        var initClasses = ['mui-enter', 'mui-leave'];
        var activeClasses = ['mui-enter-active', 'mui-leave-active'];
        var Motion = {
            animateIn: function animateIn(element, animation, cb) {
                animate(true, element, animation, cb);
            },
            animateOut: function animateOut(element, animation, cb) {
                animate(false, element, animation, cb);
            }
        };

        function Move(duration, elem, fn) {
            var anim, prog, start = null; // console.log('called');
            if (duration === 0) {
                fn.apply(elem);
                elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
                return;
            }

            function move(ts) {
                if (!start) start = ts; // console.log(start, ts);
                prog = ts - start;
                fn.apply(elem);
                if (prog < duration) {
                    anim = window.requestAnimationFrame(move, elem);
                } else {
                    window.cancelAnimationFrame(anim);
                    elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
                }
            }
            anim = window.requestAnimationFrame(move);
        }
        /**
         * Animates an element in or out using a CSS transition class.
         * @function
         * @private
         * @param {Boolean} isIn - Defines if the animation is in or out.
         * @param {Object} element - jQuery or HTML object to animate.
         * @param {String} animation - CSS class to use.
         * @param {Function} cb - Callback to run when animation is finished.
         */
        function animate(isIn, element, animation, cb) {
            element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(element).eq(0);
            if (!element.length) return;
            var initClass = isIn ? initClasses[0] : initClasses[1];
            var activeClass = isIn ? activeClasses[0] : activeClasses[1]; // Set up the animation
            reset();
            element.addClass(animation).css('transition', 'none');
            requestAnimationFrame(function() {
                element.addClass(initClass);
                if (isIn) element.show();
            }); // Start the animation
            requestAnimationFrame(function() {
                element[0].offsetWidth;
                element.css('transition', '').addClass(activeClass);
            }); // Clean up the animation when it finishes
            element.one(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__["transitionend"])(element), finish); // Hides the element (for out animations), resets the element, and runs a callback
            function finish() {
                if (!isIn) element.hide();
                reset();
                if (cb) cb.apply(element);
            } // Resets transitions and removes motion-specific classes
            function reset() {
                element[0].style.transitionDuration = 0;
                element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
            }
        } /***/
    } /******/
});
"use strict";
! function(n) {
    function t(e) {
        if (i[e]) return i[e].exports;
        var o = i[e] = {
            i: e,
            l: !1,
            exports: {}
        };
        return n[e].call(o.exports, o, o.exports, t), o.l = !0, o.exports;
    }
    var i = {};
    t.m = n, t.c = i, t.i = function(n) {
        return n;
    }, t.d = function(n, i, e) {
        t.o(n, i) || Object.defineProperty(n, i, {
            configurable: !1,
            enumerable: !0,
            get: e
        });
    }, t.n = function(n) {
        var i = n && n.__esModule ? function() {
            return n.default;
        } : function() {
            return n;
        };
        return t.d(i, "a", i), i;
    }, t.o = function(n, t) {
        return Object.prototype.hasOwnProperty.call(n, t);
    }, t.p = "", t(t.s = 104);
}({
    0: function _(n, t) {
        n.exports = jQuery;
    },
    1: function _(n, t) {
        n.exports = {
            Foundation: window.Foundation
        };
    },
    104: function _(n, t, i) {
        n.exports = i(38);
    },
    3: function _(n, t) {
        n.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        };
    },
    38: function _(n, t, i) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var e = i(1),
            o = (i.n(e), i(68));
        e.Foundation.Motion = o.a, e.Foundation.Move = o.b;
    },
    68: function _(n, t, i) {
        "use strict";

        function e(n, t, i) {
            function e(u) {
                a || (a = u), r = u - a, i.apply(t), r < n ? o = window.requestAnimationFrame(e, t) : (window.cancelAnimationFrame(o), t.trigger("finished.zf.animate", [t]).triggerHandler("finished.zf.animate", [t]));
            }
            var o, r, a = null;
            if (0 === n) return i.apply(t), void t.trigger("finished.zf.animate", [t]).triggerHandler("finished.zf.animate", [t]);
            o = window.requestAnimationFrame(e);
        }

        function o(n, t, e, o) {
            function r() {
                n || t.hide(), d(), o && o.apply(t);
            }

            function d() {
                t[0].style.transitionDuration = 0, t.removeClass(c + " " + l + " " + e);
            }
            if (t = a()(t).eq(0), t.length) {
                var c = n ? s[0] : s[1],
                    l = n ? f[0] : f[1];
                d(), t.addClass(e).css("transition", "none"), requestAnimationFrame(function() {
                    t.addClass(c), n && t.show();
                }), requestAnimationFrame(function() {
                    t[0].offsetWidth, t.css("transition", "").addClass(l);
                }), t.one(i.i(u.transitionend)(t), r);
            }
        }
        i.d(t, "b", function() {
            return e;
        }), i.d(t, "a", function() {
            return d;
        });
        var r = i(0),
            a = i.n(r),
            u = i(3),
            s = (i.n(u), ["mui-enter", "mui-leave"]),
            f = ["mui-enter-active", "mui-leave-active"],
            d = {
                animateIn: function animateIn(n, t, i) {
                    o(!0, n, t, i);
                },
                animateOut: function animateOut(n, t, i) {
                    o(!1, n, t, i);
                }
            };
    }
});
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 105); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 105: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(39); /***/
    },
    /***/ 39: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_nest__ = __webpack_require__(69);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].Nest = __WEBPACK_IMPORTED_MODULE_1__foundation_util_nest__["a" /* Nest */ ]; /***/
    },
    /***/ 69: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Nest;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
        var Nest = {
            Feather: function Feather(menu) {
                var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'zf';
                menu.attr('role', 'menubar');
                var items = menu.find('li').attr({
                        'role': 'menuitem'
                    }),
                    subMenuClass = 'is-' + type + '-submenu',
                    subItemClass = subMenuClass + '-item',
                    hasSubClass = 'is-' + type + '-submenu-parent',
                    applyAria = type !== 'accordion'; // Accordions handle their own ARIA attriutes.
                items.each(function() {
                    var $item = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                        $sub = $item.children('ul');
                    if ($sub.length) {
                        $item.addClass(hasSubClass);
                        $sub.addClass('submenu ' + subMenuClass).attr({
                            'data-submenu': ''
                        });
                        if (applyAria) {
                            $item.attr({
                                'aria-haspopup': true,
                                'aria-label': $item.children('a:first').text()
                            }); // Note:  Drilldowns behave differently in how they hide, and so need
                            // additional attributes.  We should look if this possibly over-generalized
                            // utility (Nest) is appropriate when we rework menus in 6.4
                            if (type === 'drilldown') {
                                $item.attr({
                                    'aria-expanded': false
                                });
                            }
                        }
                        $sub.addClass('submenu ' + subMenuClass).attr({
                            'data-submenu': '',
                            'role': 'menu'
                        });
                        if (type === 'drilldown') {
                            $sub.attr({
                                'aria-hidden': true
                            });
                        }
                    }
                    if ($item.parent('[data-submenu]').length) {
                        $item.addClass('is-submenu-item ' + subItemClass);
                    }
                });
                return;
            },
            Burn: function Burn(menu, type) {
                var //items = menu.find('li'),
                    subMenuClass = 'is-' + type + '-submenu',
                    subItemClass = subMenuClass + '-item',
                    hasSubClass = 'is-' + type + '-submenu-parent';
                menu.find('>li, .menu, .menu > li').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');
            }
        }; /***/
    } /******/
});
"use strict";
! function(n) {
    function e(r) {
        if (t[r]) return t[r].exports;
        var u = t[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return n[r].call(u.exports, u, u.exports, e), u.l = !0, u.exports;
    }
    var t = {};
    e.m = n, e.c = t, e.i = function(n) {
        return n;
    }, e.d = function(n, t, r) {
        e.o(n, t) || Object.defineProperty(n, t, {
            configurable: !1,
            enumerable: !0,
            get: r
        });
    }, e.n = function(n) {
        var t = n && n.__esModule ? function() {
            return n.default;
        } : function() {
            return n;
        };
        return e.d(t, "a", t), t;
    }, e.o = function(n, e) {
        return Object.prototype.hasOwnProperty.call(n, e);
    }, e.p = "", e(e.s = 105);
}({
    0: function _(n, e) {
        n.exports = jQuery;
    },
    1: function _(n, e) {
        n.exports = {
            Foundation: window.Foundation
        };
    },
    105: function _(n, e, t) {
        n.exports = t(39);
    },
    39: function _(n, e, t) {
        "use strict";
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var r = t(1),
            u = (t.n(r), t(69));
        r.Foundation.Nest = u.a;
    },
    69: function _(n, e, t) {
        "use strict";
        t.d(e, "a", function() {
            return a;
        });
        var r = t(0),
            u = t.n(r),
            a = {
                Feather: function Feather(n) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "zf";
                    n.attr("role", "menubar");
                    var t = n.find("li").attr({
                            role: "menuitem"
                        }),
                        r = "is-" + e + "-submenu",
                        a = r + "-item",
                        i = "is-" + e + "-submenu-parent",
                        o = "accordion" !== e;
                    t.each(function() {
                        var n = u()(this),
                            t = n.children("ul");
                        t.length && (n.addClass(i), t.addClass("submenu " + r).attr({
                            "data-submenu": ""
                        }), o && (n.attr({
                            "aria-haspopup": !0,
                            "aria-label": n.children("a:first").text()
                        }), "drilldown" === e && n.attr({
                            "aria-expanded": !1
                        })), t.addClass("submenu " + r).attr({
                            "data-submenu": "",
                            role: "menu"
                        }), "drilldown" === e && t.attr({
                            "aria-hidden": !0
                        })), n.parent("[data-submenu]").length && n.addClass("is-submenu-item " + a);
                    });
                },
                Burn: function Burn(n, e) {
                    var t = "is-" + e + "-submenu",
                        r = t + "-item",
                        u = "is-" + e + "-submenu-parent";
                    n.find(">li, .menu, .menu > li").removeClass(t + " " + r + " " + u + " is-submenu-item submenu is-active").removeAttr("data-submenu").css("display", "");
                }
            };
    }
});
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 106); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 106: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(40); /***/
    },
    /***/ 40: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_timer__ = __webpack_require__(70);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].Timer = __WEBPACK_IMPORTED_MODULE_1__foundation_util_timer__["a" /* Timer */ ]; /***/
    },
    /***/ 70: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Timer;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);

        function Timer(elem, options, cb) {
            var _this = this,
                duration = options.duration, //options is an object for easily adding features later.
                nameSpace = Object.keys(elem.data())[0] || 'timer',
                remain = -1,
                start, timer;
            this.isPaused = false;
            this.restart = function() {
                remain = -1;
                clearTimeout(timer);
                this.start();
            };
            this.start = function() {
                this.isPaused = false; // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
                clearTimeout(timer);
                remain = remain <= 0 ? duration : remain;
                elem.data('paused', false);
                start = Date.now();
                timer = setTimeout(function() {
                    if (options.infinite) {
                        _this.restart(); //rerun the timer.
                    }
                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                }, remain);
                elem.trigger('timerstart.zf.' + nameSpace);
            };
            this.pause = function() {
                this.isPaused = true; //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
                clearTimeout(timer);
                elem.data('paused', true);
                var end = Date.now();
                remain = remain - (end - start);
                elem.trigger('timerpaused.zf.' + nameSpace);
            };
        } /***/
    } /******/
});
"use strict";
! function(t) {
    function e(r) {
        if (n[r]) return n[r].exports;
        var i = n[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return t[r].call(i.exports, i, i.exports, e), i.l = !0, i.exports;
    }
    var n = {};
    e.m = t, e.c = n, e.i = function(t) {
        return t;
    }, e.d = function(t, n, r) {
        e.o(t, n) || Object.defineProperty(t, n, {
            configurable: !1,
            enumerable: !0,
            get: r
        });
    }, e.n = function(t) {
        var n = t && t.__esModule ? function() {
            return t.default;
        } : function() {
            return t;
        };
        return e.d(n, "a", n), n;
    }, e.o = function(t, e) {
        return Object.prototype.hasOwnProperty.call(t, e);
    }, e.p = "", e(e.s = 106);
}({
    0: function _(t, e) {
        t.exports = jQuery;
    },
    1: function _(t, e) {
        t.exports = {
            Foundation: window.Foundation
        };
    },
    106: function _(t, e, n) {
        t.exports = n(40);
    },
    40: function _(t, e, n) {
        "use strict";
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var r = n(1),
            i = (n.n(r), n(70));
        r.Foundation.Timer = i.a;
    },
    70: function _(t, e, n) {
        "use strict";

        function r(t, e, n) {
            var r, i, o = this,
                u = e.duration,
                a = Object.keys(t.data())[0] || "timer",
                s = -1;
            this.isPaused = !1, this.restart = function() {
                s = -1, clearTimeout(i), this.start();
            }, this.start = function() {
                this.isPaused = !1, clearTimeout(i), s = s <= 0 ? u : s, t.data("paused", !1), r = Date.now(), i = setTimeout(function() {
                    e.infinite && o.restart(), n && "function" == typeof n && n();
                }, s), t.trigger("timerstart.zf." + a);
            }, this.pause = function() {
                this.isPaused = !0, clearTimeout(i), t.data("paused", !0);
                var e = Date.now();
                s -= e - r, t.trigger("timerpaused.zf." + a);
            };
        }
        n.d(e, "a", function() {
            return r;
        });
        var i = n(0);
        n.n(i);
    }
});
'use strict';
! function($) {
    function Timer(elem, options, cb) {
        var _this = this,
            duration = options.duration, //options is an object for easily adding features later.
            nameSpace = Object.keys(elem.data())[0] || 'timer',
            remain = -1,
            start, timer;
        this.isPaused = false;
        this.restart = function() {
            remain = -1;
            clearTimeout(timer);
            this.start();
        };
        this.start = function() {
            this.isPaused = false; // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
            clearTimeout(timer);
            remain = remain <= 0 ? duration : remain;
            elem.data('paused', false);
            start = Date.now();
            timer = setTimeout(function() {
                if (options.infinite) {
                    _this.restart(); //rerun the timer.
                }
                if (cb && typeof cb === 'function') {
                    cb();
                }
            }, remain);
            elem.trigger('timerstart.zf.' + nameSpace);
        };
        this.pause = function() {
            this.isPaused = true; //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
            clearTimeout(timer);
            elem.data('paused', true);
            var end = Date.now();
            remain = remain - (end - start);
            elem.trigger('timerpaused.zf.' + nameSpace);
        };
    }
    /**
     * Runs a callback function when images are fully loaded.
     * @param {Object} images - Image(s) to check if loaded.
     * @param {Func} callback - Function to execute when image is fully loaded.
     */
    function onImagesLoaded(images, callback) {
        var self = this,
            unloaded = images.length;
        if (unloaded === 0) {
            callback();
        }
        images.each(function() { // Check if image is loaded
            if (this.complete || this.readyState === 4 || this.readyState === 'complete') {
                singleImageLoaded();
            } // Force load the image
            else { // fix for IE. See https://css-tricks.com/snippets/jquery/fixing-load-in-ie-for-cached-images/
                var src = $(this).attr('src');
                $(this).attr('src', src + (src.indexOf('?') >= 0 ? '&' : '?') + new Date().getTime());
                $(this).one('load', function() {
                    singleImageLoaded();
                });
            }
        });

        function singleImageLoaded() {
            unloaded--;
            if (unloaded === 0) {
                callback();
            }
        }
    }
    Foundation.Timer = Timer;
    Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
"use strict";
! function(t) {
    function e(t, e, i) {
        var a, s, n = this,
            r = e.duration,
            o = Object.keys(t.data())[0] || "timer",
            u = -1;
        this.isPaused = !1, this.restart = function() {
            u = -1, clearTimeout(s), this.start();
        }, this.start = function() {
            this.isPaused = !1, clearTimeout(s), u = u <= 0 ? r : u, t.data("paused", !1), a = Date.now(), s = setTimeout(function() {
                e.infinite && n.restart(), i && "function" == typeof i && i();
            }, u), t.trigger("timerstart.zf." + o);
        }, this.pause = function() {
            this.isPaused = !0, clearTimeout(s), t.data("paused", !0);
            var e = Date.now();
            u -= e - a, t.trigger("timerpaused.zf." + o);
        };
    }

    function i(e, i) {
        function a() {
            s--, 0 === s && i();
        }
        var s = e.length;
        0 === s && i(), e.each(function() {
            if (this.complete || 4 === this.readyState || "complete" === this.readyState) a();
            else {
                var e = t(this).attr("src");
                t(this).attr("src", e + (e.indexOf("?") >= 0 ? "&" : "?") + new Date().getTime()), t(this).one("load", function() {
                    a();
                });
            }
        });
    }
    Foundation.Timer = e, Foundation.onImagesLoaded = i;
}(jQuery);
'use strict'; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 107); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 107: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(41); /***/
    },
    /***/ 41: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_touch__ = __webpack_require__(71);
        __WEBPACK_IMPORTED_MODULE_1__foundation_util_touch__["a" /* Touch */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
        window.Foundation.Touch = __WEBPACK_IMPORTED_MODULE_1__foundation_util_touch__["a" /* Touch */ ]; /***/
    },
    /***/ 71: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Touch;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        } //**************************************************
        //**Work inspired by multiple jquery swipe plugins**
        //**Done by Yohai Ararat ***************************
        //**************************************************
        var Touch = {};
        var startPosX, startPosY, startTime, elapsedTime, isMoving = false;

        function onTouchEnd() { //  alert(this);
            this.removeEventListener('touchmove', onTouchMove);
            this.removeEventListener('touchend', onTouchEnd);
            isMoving = false;
        }

        function onTouchMove(e) {
            if (__WEBPACK_IMPORTED_MODULE_0_jquery___default.a.spotSwipe.preventDefault) {
                e.preventDefault();
            }
            if (isMoving) {
                var x = e.touches[0].pageX;
                var y = e.touches[0].pageY;
                var dx = startPosX - x;
                var dy = startPosY - y;
                var dir;
                elapsedTime = new Date().getTime() - startTime;
                if (Math.abs(dx) >= __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.spotSwipe.moveThreshold && elapsedTime <= __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.spotSwipe.timeThreshold) {
                    dir = dx > 0 ? 'left' : 'right';
                } // else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
                //   dir = dy > 0 ? 'down' : 'up';
                // }
                if (dir) {
                    e.preventDefault();
                    onTouchEnd.call(this);
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('swipe', dir).trigger('swipe' + dir);
                }
            }
        }

        function onTouchStart(e) {
            if (e.touches.length == 1) {
                startPosX = e.touches[0].pageX;
                startPosY = e.touches[0].pageY;
                isMoving = true;
                startTime = new Date().getTime();
                this.addEventListener('touchmove', onTouchMove, false);
                this.addEventListener('touchend', onTouchEnd, false);
            }
        }

        function init() {
            this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
        }

        function teardown() {
            this.removeEventListener('touchstart', onTouchStart);
        }
        var SpotSwipe = function() {
            function SpotSwipe($) {
                _classCallCheck(this, SpotSwipe);
                this.version = '1.0.0';
                this.enabled = 'ontouchstart' in document.documentElement;
                this.preventDefault = false;
                this.moveThreshold = 75;
                this.timeThreshold = 200;
                this.$ = $;
                this._init();
            }
            _createClass(SpotSwipe, [{
                key: '_init',
                value: function _init() {
                    var $ = this.$;
                    $.event.special.swipe = {
                        setup: init
                    };
                    $.each(['left', 'up', 'down', 'right'], function() {
                        $.event.special['swipe' + this] = {
                            setup: function setup() {
                                $(this).on('swipe', $.noop);
                            }
                        };
                    });
                }
            }]);
            return SpotSwipe;
        }();
        /****************************************************
         * As far as I can tell, both setupSpotSwipe and    *
         * setupTouchHandler should be idempotent,          *
         * because they directly replace functions &        *
         * values, and do not add event handlers directly.  *
         ****************************************************/
        Touch.setupSpotSwipe = function($) {
            $.spotSwipe = new SpotSwipe($);
        };
        /****************************************************
         * Method for adding pseudo drag events to elements *
         ***************************************************/
        Touch.setupTouchHandler = function($) {
            $.fn.addTouch = function() {
                this.each(function(i, el) {
                    $(el).bind('touchstart touchmove touchend touchcancel', function() { //we pass the original event object because the jQuery event
                        //object is normalized to w3c specs and does not provide the TouchList
                        handleTouch(event);
                    });
                });
                var handleTouch = function handleTouch(event) {
                    var touches = event.changedTouches,
                        first = touches[0],
                        eventTypes = {
                            touchstart: 'mousedown',
                            touchmove: 'mousemove',
                            touchend: 'mouseup'
                        },
                        type = eventTypes[event.type],
                        simulatedEvent;
                    if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
                        simulatedEvent = new window.MouseEvent(type, {
                            'bubbles': true,
                            'cancelable': true,
                            'screenX': first.screenX,
                            'screenY': first.screenY,
                            'clientX': first.clientX,
                            'clientY': first.clientY
                        });
                    } else {
                        simulatedEvent = document.createEvent('MouseEvent');
                        simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/ , null);
                    }
                    first.target.dispatchEvent(simulatedEvent);
                };
            };
        };
        Touch.init = function($) {
            if (typeof $.spotSwipe === 'undefined') {
                Touch.setupSpotSwipe($);
                Touch.setupTouchHandler($);
            }
        }; /***/
    } /******/
});
"use strict";
! function(e) {
    function t(o) {
        if (n[o]) return n[o].exports;
        var i = n[o] = {
            i: o,
            l: !1,
            exports: {}
        };
        return e[o].call(i.exports, i, i.exports, t), i.l = !0, i.exports;
    }
    var n = {};
    t.m = e, t.c = n, t.i = function(e) {
        return e;
    }, t.d = function(e, n, o) {
        t.o(e, n) || Object.defineProperty(e, n, {
            configurable: !1,
            enumerable: !0,
            get: o
        });
    }, t.n = function(e) {
        var n = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return t.d(n, "a", n), n;
    }, t.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }, t.p = "", t(t.s = 107);
}({
    0: function _(e, t) {
        e.exports = jQuery;
    },
    107: function _(e, t, n) {
        e.exports = n(41);
    },
    41: function _(e, t, n) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var o = n(0),
            i = n.n(o),
            u = n(71);
        u.a.init(i.a), window.Foundation.Touch = u.a;
    },
    71: function _(e, t, n) {
        "use strict";

        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }

        function i() {
            this.removeEventListener("touchmove", u), this.removeEventListener("touchend", i), w = !1;
        }

        function u(e) {
            if (l.a.spotSwipe.preventDefault && e.preventDefault(), w) {
                var t, n = e.touches[0].pageX,
                    o = (e.touches[0].pageY, s - n);
                p = new Date().getTime() - h, Math.abs(o) >= l.a.spotSwipe.moveThreshold && p <= l.a.spotSwipe.timeThreshold && (t = o > 0 ? "left" : "right"), t && (e.preventDefault(), i.call(this), l()(this).trigger("swipe", t).trigger("swipe" + t));
            }
        }

        function r(e) {
            1 == e.touches.length && (s = e.touches[0].pageX, a = e.touches[0].pageY, w = !0, h = new Date().getTime(), this.addEventListener("touchmove", u, !1), this.addEventListener("touchend", i, !1));
        }

        function c() {
            this.addEventListener && this.addEventListener("touchstart", r, !1);
        }
        n.d(t, "a", function() {
            return v;
        });
        var s, a, h, p, f = n(0),
            l = n.n(f),
            d = function() {
                function e(e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var o = t[n];
                        o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, o.key, o);
                    }
                }
                return function(t, n, o) {
                    return n && e(t.prototype, n), o && e(t, o), t;
                };
            }(),
            v = {},
            w = !1,
            m = function() {
                function e(t) {
                    o(this, e), this.version = "1.0.0", this.enabled = "ontouchstart" in document.documentElement, this.preventDefault = !1, this.moveThreshold = 75, this.timeThreshold = 200, this.$ = t, this._init();
                }
                return d(e, [{
                    key: "_init",
                    value: function value() {
                        var e = this.$;
                        e.event.special.swipe = {
                            setup: c
                        }, e.each(["left", "up", "down", "right"], function() {
                            e.event.special["swipe" + this] = {
                                setup: function setup() {
                                    e(this).on("swipe", e.noop);
                                }
                            };
                        });
                    }
                }]), e;
            }();
        v.setupSpotSwipe = function(e) {
            e.spotSwipe = new m(e);
        }, v.setupTouchHandler = function(e) {
            e.fn.addTouch = function() {
                this.each(function(n, o) {
                    e(o).bind("touchstart touchmove touchend touchcancel", function() {
                        t(event);
                    });
                });
                var t = function t(e) {
                    var t, n = e.changedTouches,
                        o = n[0],
                        i = {
                            touchstart: "mousedown",
                            touchmove: "mousemove",
                            touchend: "mouseup"
                        },
                        u = i[e.type];
                    "MouseEvent" in window && "function" == typeof window.MouseEvent ? t = new window.MouseEvent(u, {
                        bubbles: !0,
                        cancelable: !0,
                        screenX: o.screenX,
                        screenY: o.screenY,
                        clientX: o.clientX,
                        clientY: o.clientY
                    }) : (t = document.createEvent("MouseEvent"), t.initMouseEvent(u, !0, !0, window, 1, o.screenX, o.screenY, o.clientX, o.clientY, !1, !1, !1, !1, 0, null)), o.target.dispatchEvent(t);
                };
            };
        }, v.init = function(e) {
            void 0 === e.spotSwipe && (v.setupSpotSwipe(e), v.setupTouchHandler(e));
        };
    }
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 108); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 108: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(42); /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 42: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_triggers__ = __webpack_require__(7);
        __WEBPACK_IMPORTED_MODULE_2__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_1_jquery___default.a, __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"]); /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    } /******/
});
"use strict";
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
! function(e) {
    function t(r) {
        if (i[r]) return i[r].exports;
        var n = i[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return e[r].call(n.exports, n, n.exports, t), n.l = !0, n.exports;
    }
    var i = {};
    t.m = e, t.c = i, t.i = function(e) {
        return e;
    }, t.d = function(e, i, r) {
        t.o(e, i) || Object.defineProperty(e, i, {
            configurable: !1,
            enumerable: !0,
            get: r
        });
    }, t.n = function(e) {
        var i = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return t.d(i, "a", i), i;
    }, t.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }, t.p = "", t(t.s = 108);
}({
    0: function _(e, t) {
        e.exports = jQuery;
    },
    1: function _(e, t) {
        e.exports = {
            Foundation: window.Foundation
        };
    },
    108: function _(e, t, i) {
        e.exports = i(42);
    },
    4: function _(e, t) {
        e.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        };
    },
    42: function _(e, t, i) {
        "use strict";
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var r = i(1),
            n = (i.n(r), i(0)),
            s = i.n(n);
        i(7).a.init(s.a, r.Foundation);
    },
    7: function _(e, t, i) {
        "use strict";

        function r(e, t, i) {
            var r = void 0,
                n = Array.prototype.slice.call(arguments, 3);
            s()(window).off(t).on(t, function(t) {
                r && clearTimeout(r), r = setTimeout(function() {
                    i.apply(null, n);
                }, e || 10);
            });
        }
        i.d(t, "a", function() {
            return c;
        });
        var n = i(0),
            s = i.n(n),
            a = i(4),
            o = (i.n(a), function() {
                for (var e = ["WebKit", "Moz", "O", "Ms", ""], t = 0; t < e.length; t++) {
                    if (e[t] + "MutationObserver" in window) return window[e[t] + "MutationObserver"];
                }
                return !1;
            }()),
            l = function l(e, t) {
                e.data(t).split(" ").forEach(function(i) {
                    s()("#" + i)["close" === t ? "trigger" : "triggerHandler"](t + ".zf.trigger", [e]);
                });
            },
            c = {
                Listeners: {
                    Basic: {},
                    Global: {}
                },
                Initializers: {}
            };
        c.Listeners.Basic = {
            openListener: function openListener() {
                l(s()(this), "open");
            },
            closeListener: function closeListener() {
                s()(this).data("close") ? l(s()(this), "close") : s()(this).trigger("close.zf.trigger");
            },
            toggleListener: function toggleListener() {
                s()(this).data("toggle") ? l(s()(this), "toggle") : s()(this).trigger("toggle.zf.trigger");
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var t = s()(this).data("closable");
                "" !== t ? a.Motion.animateOut(s()(this), t, function() {
                    s()(this).trigger("closed.zf");
                }) : s()(this).fadeOut().trigger("closed.zf");
            },
            toggleFocusListener: function toggleFocusListener() {
                var e = s()(this).data("toggle-focus");
                s()("#" + e).triggerHandler("toggle.zf.trigger", [s()(this)]);
            }
        }, c.Initializers.addOpenListener = function(e) {
            e.off("click.zf.trigger", c.Listeners.Basic.openListener), e.on("click.zf.trigger", "[data-open]", c.Listeners.Basic.openListener);
        }, c.Initializers.addCloseListener = function(e) {
            e.off("click.zf.trigger", c.Listeners.Basic.closeListener), e.on("click.zf.trigger", "[data-close]", c.Listeners.Basic.closeListener);
        }, c.Initializers.addToggleListener = function(e) {
            e.off("click.zf.trigger", c.Listeners.Basic.toggleListener), e.on("click.zf.trigger", "[data-toggle]", c.Listeners.Basic.toggleListener);
        }, c.Initializers.addCloseableListener = function(e) {
            e.off("close.zf.trigger", c.Listeners.Basic.closeableListener), e.on("close.zf.trigger", "[data-closeable], [data-closable]", c.Listeners.Basic.closeableListener);
        }, c.Initializers.addToggleFocusListener = function(e) {
            e.off("focus.zf.trigger blur.zf.trigger", c.Listeners.Basic.toggleFocusListener), e.on("focus.zf.trigger blur.zf.trigger", "[data-toggle-focus]", c.Listeners.Basic.toggleFocusListener);
        }, c.Listeners.Global = {
            resizeListener: function resizeListener(e) {
                o || e.each(function() {
                    s()(this).triggerHandler("resizeme.zf.trigger");
                }), e.attr("data-events", "resize");
            },
            scrollListener: function scrollListener(e) {
                o || e.each(function() {
                    s()(this).triggerHandler("scrollme.zf.trigger");
                }), e.attr("data-events", "scroll");
            },
            closeMeListener: function closeMeListener(e, t) {
                var i = e.namespace.split(".")[0];
                s()("[data-" + i + "]").not('[data-yeti-box="' + t + '"]').each(function() {
                    var e = s()(this);
                    e.triggerHandler("close.zf.trigger", [e]);
                });
            }
        }, c.Initializers.addClosemeListener = function(e) {
            var t = s()("[data-yeti-box]"),
                i = ["dropdown", "tooltip", "reveal"];
            if (e && ("string" == typeof e ? i.push(e) : "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) && "string" == typeof e[0] ? i.concat(e) : console.error("Plugin names must be strings")), t.length) {
                var r = i.map(function(e) {
                    return "closeme.zf." + e;
                }).join(" ");
                s()(window).off(r).on(r, c.Listeners.Global.closeMeListener);
            }
        }, c.Initializers.addResizeListener = function(e) {
            var t = s()("[data-resize]");
            t.length && r(e, "resize.zf.trigger", c.Listeners.Global.resizeListener, t);
        }, c.Initializers.addScrollListener = function(e) {
            var t = s()("[data-scroll]");
            t.length && r(e, "scroll.zf.trigger", c.Listeners.Global.scrollListener, t);
        }, c.Initializers.addMutationEventsListener = function(e) {
            if (!o) return !1;
            var t = e.find("[data-resize], [data-scroll], [data-mutate]"),
                i = function i(e) {
                    var t = s()(e[0].target);
                    switch (e[0].type) {
                        case "attributes":
                            "scroll" === t.attr("data-events") && "data-events" === e[0].attributeName && t.triggerHandler("scrollme.zf.trigger", [t, window.pageYOffset]), "resize" === t.attr("data-events") && "data-events" === e[0].attributeName && t.triggerHandler("resizeme.zf.trigger", [t]), "style" === e[0].attributeName && (t.closest("[data-mutate]").attr("data-events", "mutate"), t.closest("[data-mutate]").triggerHandler("mutateme.zf.trigger", [t.closest("[data-mutate]")]));
                            break;
                        case "childList":
                            t.closest("[data-mutate]").attr("data-events", "mutate"), t.closest("[data-mutate]").triggerHandler("mutateme.zf.trigger", [t.closest("[data-mutate]")]);
                            break;
                        default:
                            return !1;
                    }
                };
            if (t.length)
                for (var r = 0; r <= t.length - 1; r++) {
                    var n = new o(i);
                    n.observe(t[r], {
                        attributes: !0,
                        childList: !0,
                        characterData: !1,
                        subtree: !0,
                        attributeFilter: ["data-events", "style"]
                    });
                }
        }, c.Initializers.addSimpleListeners = function() {
            var e = s()(document);
            c.Initializers.addOpenListener(e), c.Initializers.addCloseListener(e), c.Initializers.addToggleListener(e), c.Initializers.addCloseableListener(e), c.Initializers.addToggleFocusListener(e);
        }, c.Initializers.addGlobalListeners = function() {
            var e = s()(document);
            c.Initializers.addMutationEventsListener(e), c.Initializers.addResizeListener(), c.Initializers.addScrollListener(), c.Initializers.addClosemeListener();
        }, c.init = function(e, t) {
            if (void 0 === e.triggersInitialized) {
                e(document);
                "complete" === document.readyState ? (c.Initializers.addSimpleListeners(), c.Initializers.addGlobalListeners()) : e(window).on("load", function() {
                    c.Initializers.addSimpleListeners(), c.Initializers.addGlobalListeners();
                }), e.triggersInitialized = !0;
            }
            t && (t.Triggers = c, t.IHearYou = c.Initializers.addGlobalListeners);
        };
    }
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 80); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 14: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_accordion__ = __webpack_require__(44);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_accordion__["a" /* Accordion */ ], 'Accordion'); /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 44: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Accordion;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Accordion module.
         * @module foundation.accordion
         * @requires foundation.util.keyboard
         */
        var Accordion = function(_Plugin) {
            _inherits(Accordion, _Plugin);

            function Accordion() {
                _classCallCheck(this, Accordion);
                return _possibleConstructorReturn(this, (Accordion.__proto__ || Object.getPrototypeOf(Accordion)).apply(this, arguments));
            }
            _createClass(Accordion, [{
                key: '_setup',
                /**
                 * Creates a new instance of an accordion.
                 * @class
                 * @name Accordion
                 * @fires Accordion#init
                 * @param {jQuery} element - jQuery object to make into an accordion.
                 * @param {Object} options - a plain object with settings to override the default options.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Accordion.defaults, this.$element.data(), options);
                    this.className = 'Accordion'; // ie9 back compat
                    this._init();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('Accordion', {
                        'ENTER': 'toggle',
                        'SPACE': 'toggle',
                        'ARROW_DOWN': 'next',
                        'ARROW_UP': 'previous'
                    });
                }
                /**
                 * Initializes the accordion by animating the preset active pane(s).
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var _this3 = this;
                    this.$element.attr('role', 'tablist');
                    this.$tabs = this.$element.children('[data-accordion-item]');
                    this.$tabs.each(function(idx, el) {
                        var $el = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(el),
                            $content = $el.children('[data-tab-content]'),
                            id = $content[0].id || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["GetYoDigits"])(6, 'accordion'),
                            linkId = el.id || id + '-label';
                        $el.find('a:first').attr({
                            'aria-controls': id,
                            'role': 'tab',
                            'id': linkId,
                            'aria-expanded': false,
                            'aria-selected': false
                        });
                        $content.attr({
                            'role': 'tabpanel',
                            'aria-labelledby': linkId,
                            'aria-hidden': true,
                            'id': id
                        });
                    });
                    var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
                    this.firstTimeInit = true;
                    if ($initActive.length) {
                        this.down($initActive, this.firstTimeInit);
                        this.firstTimeInit = false;
                    }
                    this._checkDeepLink = function() {
                        var anchor = window.location.hash; //need a hash and a relevant anchor in this tabset
                        if (anchor.length) {
                            var $link = _this3.$element.find('[href$="' + anchor + '"]'),
                                $anchor = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(anchor);
                            if ($link.length && $anchor) {
                                if (!$link.parent('[data-accordion-item]').hasClass('is-active')) {
                                    _this3.down($anchor, _this3.firstTimeInit);
                                    _this3.firstTimeInit = false;
                                }; //roll up a little to show the titles
                                if (_this3.options.deepLinkSmudge) {
                                    var _this = _this3;
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).load(function() {
                                        var offset = _this.$element.offset();
                                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html, body').animate({
                                            scrollTop: offset.top
                                        }, _this.options.deepLinkSmudgeDelay);
                                    });
                                }
                                /**
                                 * Fires when the zplugin has deeplinked at pageload
                                 * @event Accordion#deeplink
                                 */
                                _this3.$element.trigger('deeplink.zf.accordion', [$link, $anchor]);
                            }
                        }
                    }; //use browser to open a tab, if it exists in this tabset
                    if (this.options.deepLink) {
                        this._checkDeepLink();
                    }
                    this._events();
                }
                /**
                 * Adds event handlers for items within the accordion.
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    this.$tabs.each(function() {
                        var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                        var $tabContent = $elem.children('[data-tab-content]');
                        if ($tabContent.length) {
                            $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function(e) {
                                e.preventDefault();
                                _this.toggle($tabContent);
                            }).on('keydown.zf.accordion', function(e) {
                                __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'Accordion', {
                                    toggle: function toggle() {
                                        _this.toggle($tabContent);
                                    },
                                    next: function next() {
                                        var $a = $elem.next().find('a').focus();
                                        if (!_this.options.multiExpand) {
                                            $a.trigger('click.zf.accordion');
                                        }
                                    },
                                    previous: function previous() {
                                        var $a = $elem.prev().find('a').focus();
                                        if (!_this.options.multiExpand) {
                                            $a.trigger('click.zf.accordion');
                                        }
                                    },
                                    handled: function handled() {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                });
                            });
                        }
                    });
                    if (this.options.deepLink) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('popstate', this._checkDeepLink);
                    }
                }
                /**
                 * Toggles the selected content pane's open/close state.
                 * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
                 * @function
                 */
            }, {
                key: 'toggle',
                value: function toggle($target) {
                    if ($target.closest('[data-accordion]').is('[disabled]')) {
                        console.info('Cannot toggle an accordion that is disabled.');
                        return;
                    }
                    if ($target.parent().hasClass('is-active')) {
                        this.up($target);
                    } else {
                        this.down($target);
                    } //either replace or update browser history
                    if (this.options.deepLink) {
                        var anchor = $target.prev('a').attr('href');
                        if (this.options.updateHistory) {
                            history.pushState({}, '', anchor);
                        } else {
                            history.replaceState({}, '', anchor);
                        }
                    }
                }
                /**
                 * Opens the accordion tab defined by `$target`.
                 * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
                 * @param {Boolean} firstTime - flag to determine if reflow should happen.
                 * @fires Accordion#down
                 * @function
                 */
            }, {
                key: 'down',
                value: function down($target, firstTime) {
                    var _this4 = this;
                    /**
                     * checking firstTime allows for initial render of the accordion
                     * to render preset is-active panes.
                     */
                    if ($target.closest('[data-accordion]').is('[disabled]') && !firstTime) {
                        console.info('Cannot call down on an accordion that is disabled.');
                        return;
                    }
                    $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');
                    if (!this.options.multiExpand && !firstTime) {
                        var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
                        if ($currentActive.length) {
                            this.up($currentActive.not($target));
                        }
                    }
                    $target.slideDown(this.options.slideSpeed, function() {
                        /**
                         * Fires when the tab is done opening.
                         * @event Accordion#down
                         */
                        _this4.$element.trigger('down.zf.accordion', [$target]);
                    });
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + $target.attr('aria-labelledby')).attr({
                        'aria-expanded': true,
                        'aria-selected': true
                    });
                }
                /**
                 * Closes the tab defined by `$target`.
                 * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
                 * @fires Accordion#up
                 * @function
                 */
            }, {
                key: 'up',
                value: function up($target) {
                    if ($target.closest('[data-accordion]').is('[disabled]')) {
                        console.info('Cannot call up on an accordion that is disabled.');
                        return;
                    }
                    var $aunts = $target.parent().siblings(),
                        _this = this;
                    if (!this.options.allowAllClosed && !$aunts.hasClass('is-active') || !$target.parent().hasClass('is-active')) {
                        return;
                    }
                    $target.slideUp(_this.options.slideSpeed, function() {
                        /**
                         * Fires when the tab is done collapsing up.
                         * @event Accordion#up
                         */
                        _this.$element.trigger('up.zf.accordion', [$target]);
                    });
                    $target.attr('aria-hidden', true).parent().removeClass('is-active');
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + $target.attr('aria-labelledby')).attr({
                        'aria-expanded': false,
                        'aria-selected': false
                    });
                }
                /**
                 * Destroys an instance of an accordion.
                 * @fires Accordion#destroyed
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$element.find('[data-tab-content]').stop(true).slideUp(0).css('display', '');
                    this.$element.find('a').off('.zf.accordion');
                    if (this.options.deepLink) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('popstate', this._checkDeepLink);
                    }
                }
            }]);
            return Accordion;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["Plugin"]);
        Accordion.defaults = {
            /**
             * Amount of time to animate the opening of an accordion pane.
             * @option
             * @type {number}
             * @default 250
             */
            slideSpeed: 250,
            /**
             * Allow the accordion to have multiple open panes.
             * @option
             * @type {boolean}
             * @default false
             */
            multiExpand: false,
            /**
             * Allow the accordion to close all panes.
             * @option
             * @type {boolean}
             * @default false
             */
            allowAllClosed: false,
            /**
             * Allows the window to scroll to content of pane specified by hash anchor
             * @option
             * @type {boolean}
             * @default false
             */
            deepLink: false,
            /**
             * Adjust the deep link scroll to make sure the top of the accordion panel is visible
             * @option
             * @type {boolean}
             * @default false
             */
            deepLinkSmudge: false,
            /**
             * Animation time (ms) for the deep link adjustment
             * @option
             * @type {number}
             * @default 300
             */
            deepLinkSmudgeDelay: 300,
            /**
             * Update the browser history with the open accordion
             * @option
             * @type {boolean}
             * @default false
             */
            updateHistory: false
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 80: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(14); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 81); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 15: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_accordionMenu__ = __webpack_require__(45);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_accordionMenu__["a" /* AccordionMenu */ ], 'AccordionMenu'); /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 45: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return AccordionMenu;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__ = __webpack_require__(9); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * AccordionMenu module.
         * @module foundation.accordionMenu
         * @requires foundation.util.keyboard
         * @requires foundation.util.nest
         */
        var AccordionMenu = function(_Plugin) {
            _inherits(AccordionMenu, _Plugin);

            function AccordionMenu() {
                _classCallCheck(this, AccordionMenu);
                return _possibleConstructorReturn(this, (AccordionMenu.__proto__ || Object.getPrototypeOf(AccordionMenu)).apply(this, arguments));
            }
            _createClass(AccordionMenu, [{
                key: '_setup',
                /**
                 * Creates a new instance of an accordion menu.
                 * @class
                 * @name AccordionMenu
                 * @fires AccordionMenu#init
                 * @param {jQuery} element - jQuery object to make into an accordion menu.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, AccordionMenu.defaults, this.$element.data(), options);
                    this.className = 'AccordionMenu'; // ie9 back compat
                    this._init();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('AccordionMenu', {
                        'ENTER': 'toggle',
                        'SPACE': 'toggle',
                        'ARROW_RIGHT': 'open',
                        'ARROW_UP': 'up',
                        'ARROW_DOWN': 'down',
                        'ARROW_LEFT': 'close',
                        'ESCAPE': 'closeAll'
                    });
                }
                /**
                 * Initializes the accordion menu by hiding all nested menus.
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__["Nest"].Feather(this.$element, 'accordion');
                    var _this = this;
                    this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
                    this.$element.attr({
                        'role': 'tree',
                        'aria-multiselectable': this.options.multiOpen
                    });
                    this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
                    this.$menuLinks.each(function() {
                        var linkId = this.id || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["GetYoDigits"])(6, 'acc-menu-link'),
                            $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            $sub = $elem.children('[data-submenu]'),
                            subId = $sub[0].id || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["GetYoDigits"])(6, 'acc-menu'),
                            isActive = $sub.hasClass('is-active');
                        if (_this.options.submenuToggle) {
                            $elem.addClass('has-submenu-toggle');
                            $elem.children('a').after('<button id="' + linkId + '" class="submenu-toggle" aria-controls="' + subId + '" aria-expanded="' + isActive + '" title="' + _this.options.submenuToggleText + '"><span class="submenu-toggle-text">' + _this.options.submenuToggleText + '</span></button>');
                        } else {
                            $elem.attr({
                                'aria-controls': subId,
                                'aria-expanded': isActive,
                                'id': linkId
                            });
                        }
                        $sub.attr({
                            'aria-labelledby': linkId,
                            'aria-hidden': !isActive,
                            'role': 'group',
                            'id': subId
                        });
                    });
                    this.$element.find('li').attr({
                        'role': 'treeitem'
                    });
                    var initPanes = this.$element.find('.is-active');
                    if (initPanes.length) {
                        var _this = this;
                        initPanes.each(function() {
                            _this.down(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this));
                        });
                    }
                    this._events();
                }
                /**
                 * Adds event handlers for items within the menu.
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    this.$element.find('li').each(function() {
                        var $submenu = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).children('[data-submenu]');
                        if ($submenu.length) {
                            if (_this.options.submenuToggle) {
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).children('.submenu-toggle').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function(e) {
                                    _this.toggle($submenu);
                                });
                            } else {
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function(e) {
                                    e.preventDefault();
                                    _this.toggle($submenu);
                                });
                            }
                        }
                    }).on('keydown.zf.accordionmenu', function(e) {
                        var $element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            $elements = $element.parent('ul').children('li'),
                            $prevElement, $nextElement, $target = $element.children('[data-submenu]');
                        $elements.each(function(i) {
                            if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is($element)) {
                                $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
                                $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();
                                if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).children('[data-submenu]:visible').length) { // has open sub menu
                                    $nextElement = $element.find('li:first-child').find('a').first();
                                }
                                if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is(':first-child')) { // is first element of sub menu
                                    $prevElement = $element.parents('li').first().find('a').first();
                                } else if ($prevElement.parents('li').first().children('[data-submenu]:visible').length) { // if previous element has open sub menu
                                    $prevElement = $prevElement.parents('li').find('li:last-child').find('a').first();
                                }
                                if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is(':last-child')) { // is last element of sub menu
                                    $nextElement = $element.parents('li').first().next('li').find('a').first();
                                }
                                return;
                            }
                        });
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'AccordionMenu', {
                            open: function open() {
                                if ($target.is(':hidden')) {
                                    _this.down($target);
                                    $target.find('li').first().find('a').first().focus();
                                }
                            },
                            close: function close() {
                                if ($target.length && !$target.is(':hidden')) { // close active sub of this item
                                    _this.up($target);
                                } else if ($element.parent('[data-submenu]').length) { // close currently open sub
                                    _this.up($element.parent('[data-submenu]'));
                                    $element.parents('li').first().find('a').first().focus();
                                }
                            },
                            up: function up() {
                                $prevElement.focus();
                                return true;
                            },
                            down: function down() {
                                $nextElement.focus();
                                return true;
                            },
                            toggle: function toggle() {
                                if (_this.options.submenuToggle) {
                                    return false;
                                }
                                if ($element.children('[data-submenu]').length) {
                                    _this.toggle($element.children('[data-submenu]'));
                                    return true;
                                }
                            },
                            closeAll: function closeAll() {
                                _this.hideAll();
                            },
                            handled: function handled(preventDefault) {
                                if (preventDefault) {
                                    e.preventDefault();
                                }
                                e.stopImmediatePropagation();
                            }
                        });
                    }); //.attr('tabindex', 0);
                }
                /**
                 * Closes all panes of the menu.
                 * @function
                 */
            }, {
                key: 'hideAll',
                value: function hideAll() {
                    this.up(this.$element.find('[data-submenu]'));
                }
                /**
                 * Opens all panes of the menu.
                 * @function
                 */
            }, {
                key: 'showAll',
                value: function showAll() {
                    this.down(this.$element.find('[data-submenu]'));
                }
                /**
                 * Toggles the open/close state of a submenu.
                 * @function
                 * @param {jQuery} $target - the submenu to toggle
                 */
            }, {
                key: 'toggle',
                value: function toggle($target) {
                    if (!$target.is(':animated')) {
                        if (!$target.is(':hidden')) {
                            this.up($target);
                        } else {
                            this.down($target);
                        }
                    }
                }
                /**
                 * Opens the sub-menu defined by `$target`.
                 * @param {jQuery} $target - Sub-menu to open.
                 * @fires AccordionMenu#down
                 */
            }, {
                key: 'down',
                value: function down($target) {
                    var _this = this;
                    if (!this.options.multiOpen) {
                        this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
                    }
                    $target.addClass('is-active').attr({
                        'aria-hidden': false
                    });
                    if (this.options.submenuToggle) {
                        $target.prev('.submenu-toggle').attr({
                            'aria-expanded': true
                        });
                    } else {
                        $target.parent('.is-accordion-submenu-parent').attr({
                            'aria-expanded': true
                        });
                    }
                    $target.slideDown(_this.options.slideSpeed, function() {
                        /**
                         * Fires when the menu is done opening.
                         * @event AccordionMenu#down
                         */
                        _this.$element.trigger('down.zf.accordionMenu', [$target]);
                    });
                }
                /**
                 * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
                 * @param {jQuery} $target - Sub-menu to close.
                 * @fires AccordionMenu#up
                 */
            }, {
                key: 'up',
                value: function up($target) {
                    var _this = this;
                    $target.slideUp(_this.options.slideSpeed, function() {
                        /**
                         * Fires when the menu is done collapsing up.
                         * @event AccordionMenu#up
                         */
                        _this.$element.trigger('up.zf.accordionMenu', [$target]);
                    });
                    var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);
                    if (this.options.submenuToggle) {
                        $menus.prev('.submenu-toggle').attr('aria-expanded', false);
                    } else {
                        $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
                    }
                }
                /**
                 * Destroys an instance of accordion menu.
                 * @fires AccordionMenu#destroyed
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$element.find('[data-submenu]').slideDown(0).css('display', '');
                    this.$element.find('a').off('click.zf.accordionMenu');
                    if (this.options.submenuToggle) {
                        this.$element.find('.has-submenu-toggle').removeClass('has-submenu-toggle');
                        this.$element.find('.submenu-toggle').remove();
                    }
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__["Nest"].Burn(this.$element, 'accordion');
                }
            }]);
            return AccordionMenu;
        }(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__["Plugin"]);
        AccordionMenu.defaults = {
            /**
             * Amount of time to animate the opening of a submenu in ms.
             * @option
             * @type {number}
             * @default 250
             */
            slideSpeed: 250,
            /**
             * Adds a separate submenu toggle button. This allows the parent item to have a link.
             * @option
             * @example true
             */
            submenuToggle: false,
            /**
             * The text used for the submenu toggle if enabled. This is used for screen readers only.
             * @option
             * @example true
             */
            submenuToggleText: 'Toggle menu',
            /**
             * Allow the menu to have multiple open panes.
             * @option
             * @type {boolean}
             * @default true
             */
            multiOpen: true
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 81: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(15); /***/
    },
    /***/ 9: /***/ function _(module, exports) {
        module.exports = {
            Nest: window.Foundation.Nest
        }; /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 83); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 11: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Positionable;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_util_box__ = __webpack_require__(8); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_util_box___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_util_box__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        var POSITIONS = ['left', 'right', 'top', 'bottom'];
        var VERTICAL_ALIGNMENTS = ['top', 'bottom', 'center'];
        var HORIZONTAL_ALIGNMENTS = ['left', 'right', 'center'];
        var ALIGNMENTS = {
            'left': VERTICAL_ALIGNMENTS,
            'right': VERTICAL_ALIGNMENTS,
            'top': HORIZONTAL_ALIGNMENTS,
            'bottom': HORIZONTAL_ALIGNMENTS
        };

        function nextItem(item, array) {
            var currentIdx = array.indexOf(item);
            if (currentIdx === array.length - 1) {
                return array[0];
            } else {
                return array[currentIdx + 1];
            }
        }
        var Positionable = function(_Plugin) {
            _inherits(Positionable, _Plugin);

            function Positionable() {
                _classCallCheck(this, Positionable);
                return _possibleConstructorReturn(this, (Positionable.__proto__ || Object.getPrototypeOf(Positionable)).apply(this, arguments));
            }
            _createClass(Positionable, [{
                key: '_init',
                /**
                 * Abstract class encapsulating the tether-like explicit positioning logic
                 * including repositioning based on overlap.
                 * Expects classes to define defaults for vOffset, hOffset, position,
                 * alignment, allowOverlap, and allowBottomOverlap. They can do this by
                 * extending the defaults, or (for now recommended due to the way docs are
                 * generated) by explicitly declaring them.
                 *
                 **/
                value: function _init() {
                    this.triedPositions = {};
                    this.position = this.options.position === 'auto' ? this._getDefaultPosition() : this.options.position;
                    this.alignment = this.options.alignment === 'auto' ? this._getDefaultAlignment() : this.options.alignment;
                }
            }, {
                key: '_getDefaultPosition',
                value: function _getDefaultPosition() {
                    return 'bottom';
                }
            }, {
                key: '_getDefaultAlignment',
                value: function _getDefaultAlignment() {
                    switch (this.position) {
                        case 'bottom':
                        case 'top':
                            return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["rtl"])() ? 'right' : 'left';
                        case 'left':
                        case 'right':
                            return 'bottom';
                    }
                }
                /**
                 * Adjusts the positionable possible positions by iterating through alignments
                 * and positions.
                 * @function
                 * @private
                 */
            }, {
                key: '_reposition',
                value: function _reposition() {
                    if (this._alignmentsExhausted(this.position)) {
                        this.position = nextItem(this.position, POSITIONS);
                        this.alignment = ALIGNMENTS[this.position][0];
                    } else {
                        this._realign();
                    }
                }
                /**
                 * Adjusts the dropdown pane possible positions by iterating through alignments
                 * on the current position.
                 * @function
                 * @private
                 */
            }, {
                key: '_realign',
                value: function _realign() {
                    this._addTriedPosition(this.position, this.alignment);
                    this.alignment = nextItem(this.alignment, ALIGNMENTS[this.position]);
                }
            }, {
                key: '_addTriedPosition',
                value: function _addTriedPosition(position, alignment) {
                    this.triedPositions[position] = this.triedPositions[position] || [];
                    this.triedPositions[position].push(alignment);
                }
            }, {
                key: '_positionsExhausted',
                value: function _positionsExhausted() {
                    var isExhausted = true;
                    for (var i = 0; i < POSITIONS.length; i++) {
                        isExhausted = isExhausted && this._alignmentsExhausted(POSITIONS[i]);
                    }
                    return isExhausted;
                }
            }, {
                key: '_alignmentsExhausted',
                value: function _alignmentsExhausted(position) {
                    return this.triedPositions[position] && this.triedPositions[position].length == ALIGNMENTS[position].length;
                } // When we're trying to center, we don't want to apply offset that's going to
                // take us just off center, so wrap around to return 0 for the appropriate
                // offset in those alignments.  TODO: Figure out if we want to make this
                // configurable behavior... it feels more intuitive, especially for tooltips, but
                // it's possible someone might actually want to start from center and then nudge
                // slightly off.
            }, {
                key: '_getVOffset',
                value: function _getVOffset() {
                    return this.options.vOffset;
                }
            }, {
                key: '_getHOffset',
                value: function _getHOffset() {
                    return this.options.hOffset;
                }
            }, {
                key: '_setPosition',
                value: function _setPosition($anchor, $element, $parent) {
                    if ($anchor.attr('aria-expanded') === 'false') {
                        return false;
                    }
                    var $eleDims = __WEBPACK_IMPORTED_MODULE_0__foundation_util_box__["Box"].GetDimensions($element),
                        $anchorDims = __WEBPACK_IMPORTED_MODULE_0__foundation_util_box__["Box"].GetDimensions($anchor);
                    $element.offset(__WEBPACK_IMPORTED_MODULE_0__foundation_util_box__["Box"].GetExplicitOffsets($element, $anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
                    if (!this.options.allowOverlap) {
                        var overlaps = {};
                        var minOverlap = 100000000; // default coordinates to how we start, in case we can't figure out better
                        var minCoordinates = {
                            position: this.position,
                            alignment: this.alignment
                        };
                        while (!this._positionsExhausted()) {
                            var overlap = __WEBPACK_IMPORTED_MODULE_0__foundation_util_box__["Box"].OverlapArea($element, $parent, false, false, this.options.allowBottomOverlap);
                            if (overlap === 0) {
                                return;
                            }
                            if (overlap < minOverlap) {
                                minOverlap = overlap;
                                minCoordinates = {
                                    position: this.position,
                                    alignment: this.alignment
                                };
                            }
                            this._reposition();
                            $element.offset(__WEBPACK_IMPORTED_MODULE_0__foundation_util_box__["Box"].GetExplicitOffsets($element, $anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
                        } // If we get through the entire loop, there was no non-overlapping
                        // position available. Pick the version with least overlap.
                        this.position = minCoordinates.position;
                        this.alignment = minCoordinates.alignment;
                        $element.offset(__WEBPACK_IMPORTED_MODULE_0__foundation_util_box__["Box"].GetExplicitOffsets($element, $anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
                    }
                }
            }]);
            return Positionable;
        }(__WEBPACK_IMPORTED_MODULE_1__foundation_plugin__["Plugin"]);
        Positionable.defaults = {
            /**
             * Position of positionable relative to anchor. Can be left, right, bottom, top, or auto.
             * @option
             * @type {string}
             * @default 'auto'
             */
            position: 'auto',
            /**
             * Alignment of positionable relative to anchor. Can be left, right, bottom, top, center, or auto.
             * @option
             * @type {string}
             * @default 'auto'
             */
            alignment: 'auto',
            /**
             * Allow overlap of container/window. If false, dropdown positionable first
             * try to position as defined by data-position and data-alignment, but
             * reposition if it would cause an overflow.
             * @option
             * @type {boolean}
             * @default false
             */
            allowOverlap: false,
            /**
             * Allow overlap of only the bottom of the container. This is the most common
             * behavior for dropdowns, allowing the dropdown to extend the bottom of the
             * screen but not otherwise influence or break out of the container.
             * @option
             * @type {boolean}
             * @default true
             */
            allowBottomOverlap: true,
            /**
             * Number of pixels the positionable should be separated vertically from anchor
             * @option
             * @type {number}
             * @default 0
             */
            vOffset: 0,
            /**
             * Number of pixels the positionable should be separated horizontally from anchor
             * @option
             * @type {number}
             * @default 0
             */
            hOffset: 0
        }; /***/
    },
    /***/ 17: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_dropdown__ = __webpack_require__(47);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_dropdown__["a" /* Dropdown */ ], 'Dropdown'); /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 47: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Dropdown;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_positionable__ = __webpack_require__(11); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_util_triggers__ = __webpack_require__(7);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();
        var _get = function get(object, property, receiver) {
            if (object === null) object = Function.prototype;
            var desc = Object.getOwnPropertyDescriptor(object, property);
            if (desc === undefined) {
                var parent = Object.getPrototypeOf(object);
                if (parent === null) {
                    return undefined;
                } else {
                    return get(parent, property, receiver);
                }
            } else if ("value" in desc) {
                return desc.value;
            } else {
                var getter = desc.get;
                if (getter === undefined) {
                    return undefined;
                }
                return getter.call(receiver);
            }
        };

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Dropdown module.
         * @module foundation.dropdown
         * @requires foundation.util.keyboard
         * @requires foundation.util.box
         * @requires foundation.util.triggers
         */
        var Dropdown = function(_Positionable) {
            _inherits(Dropdown, _Positionable);

            function Dropdown() {
                _classCallCheck(this, Dropdown);
                return _possibleConstructorReturn(this, (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).apply(this, arguments));
            }
            _createClass(Dropdown, [{
                key: '_setup',
                /**
                 * Creates a new instance of a dropdown.
                 * @class
                 * @name Dropdown
                 * @param {jQuery} element - jQuery object to make into a dropdown.
                 *        Object should be of the dropdown panel, rather than its anchor.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Dropdown.defaults, this.$element.data(), options);
                    this.className = 'Dropdown'; // ie9 back compat
                    // Triggers init is idempotent, just need to make sure it is initialized
                    __WEBPACK_IMPORTED_MODULE_4__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    this._init();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('Dropdown', {
                        'ENTER': 'open',
                        'SPACE': 'open',
                        'ESCAPE': 'close'
                    });
                }
                /**
                 * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var $id = this.$element.attr('id');
                    this.$anchors = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-toggle="' + $id + '"]').length ? __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-toggle="' + $id + '"]') : __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-open="' + $id + '"]');
                    this.$anchors.attr({
                        'aria-controls': $id,
                        'data-is-focus': false,
                        'data-yeti-box': $id,
                        'aria-haspopup': true,
                        'aria-expanded': false
                    });
                    this._setCurrentAnchor(this.$anchors.first());
                    if (this.options.parentClass) {
                        this.$parent = this.$element.parents('.' + this.options.parentClass);
                    } else {
                        this.$parent = null;
                    }
                    this.$element.attr({
                        'aria-hidden': 'true',
                        'data-yeti-box': $id,
                        'data-resize': $id,
                        'aria-labelledby': this.$currentAnchor.id || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["GetYoDigits"])(6, 'dd-anchor')
                    });
                    _get(Dropdown.prototype.__proto__ || Object.getPrototypeOf(Dropdown.prototype), '_init', this).call(this);
                    this._events();
                }
            }, {
                key: '_getDefaultPosition',
                value: function _getDefaultPosition() { // handle legacy classnames
                    var position = this.$element[0].className.match(/(top|left|right|bottom)/g);
                    if (position) {
                        return position[0];
                    } else {
                        return 'bottom';
                    }
                }
            }, {
                key: '_getDefaultAlignment',
                value: function _getDefaultAlignment() { // handle legacy float approach
                    var horizontalPosition = /float-(\S+)/.exec(this.$currentAnchor.className);
                    if (horizontalPosition) {
                        return horizontalPosition[1];
                    }
                    return _get(Dropdown.prototype.__proto__ || Object.getPrototypeOf(Dropdown.prototype), '_getDefaultAlignment', this).call(this);
                }
                /**
                 * Sets the position and orientation of the dropdown pane, checks for collisions if allow-overlap is not true.
                 * Recursively calls itself if a collision is detected, with a new position class.
                 * @function
                 * @private
                 */
            }, {
                key: '_setPosition',
                value: function _setPosition() {
                    _get(Dropdown.prototype.__proto__ || Object.getPrototypeOf(Dropdown.prototype), '_setPosition', this).call(this, this.$currentAnchor, this.$element, this.$parent);
                }
                /**
                 * Make it a current anchor.
                 * Current anchor as the reference for the position of Dropdown panes.
                 * @param {HTML} el - DOM element of the anchor.
                 * @function
                 * @private
                 */
            }, {
                key: '_setCurrentAnchor',
                value: function _setCurrentAnchor(el) {
                    this.$currentAnchor = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(el);
                }
                /**
                 * Adds event listeners to the element utilizing the triggers utility library.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    this.$element.on({
                        'open.zf.trigger': this.open.bind(this),
                        'close.zf.trigger': this.close.bind(this),
                        'toggle.zf.trigger': this.toggle.bind(this),
                        'resizeme.zf.trigger': this._setPosition.bind(this)
                    });
                    this.$anchors.off('click.zf.trigger').on('click.zf.trigger', function() {
                        _this._setCurrentAnchor(this);
                    });
                    if (this.options.hover) {
                        this.$anchors.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function() {
                            _this._setCurrentAnchor(this);
                            var bodyData = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').data();
                            if (typeof bodyData.whatinput === 'undefined' || bodyData.whatinput === 'mouse') {
                                clearTimeout(_this.timeout);
                                _this.timeout = setTimeout(function() {
                                    _this.open();
                                    _this.$anchors.data('hover', true);
                                }, _this.options.hoverDelay);
                            }
                        }).on('mouseleave.zf.dropdown', function() {
                            clearTimeout(_this.timeout);
                            _this.timeout = setTimeout(function() {
                                _this.close();
                                _this.$anchors.data('hover', false);
                            }, _this.options.hoverDelay);
                        });
                        if (this.options.hoverPane) {
                            this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function() {
                                clearTimeout(_this.timeout);
                            }).on('mouseleave.zf.dropdown', function() {
                                clearTimeout(_this.timeout);
                                _this.timeout = setTimeout(function() {
                                    _this.close();
                                    _this.$anchors.data('hover', false);
                                }, _this.options.hoverDelay);
                            });
                        }
                    }
                    this.$anchors.add(this.$element).on('keydown.zf.dropdown', function(e) {
                        var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            visibleFocusableElements = __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].findFocusable(_this.$element);
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'Dropdown', {
                            open: function open() {
                                if ($target.is(_this.$anchors)) {
                                    _this.open();
                                    _this.$element.attr('tabindex', -1).focus();
                                    e.preventDefault();
                                }
                            },
                            close: function close() {
                                _this.close();
                                _this.$anchors.focus();
                            }
                        });
                    });
                }
                /**
                 * Adds an event handler to the body to close any dropdowns on a click.
                 * @function
                 * @private
                 */
            }, {
                key: '_addBodyHandler',
                value: function _addBodyHandler() {
                    var $body = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document.body).not(this.$element),
                        _this = this;
                    $body.off('click.zf.dropdown').on('click.zf.dropdown', function(e) {
                        if (_this.$anchors.is(e.target) || _this.$anchors.find(e.target).length) {
                            return;
                        }
                        if (_this.$element.find(e.target).length) {
                            return;
                        }
                        _this.close();
                        $body.off('click.zf.dropdown');
                    });
                }
                /**
                 * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
                 * @function
                 * @fires Dropdown#closeme
                 * @fires Dropdown#show
                 */
            }, {
                key: 'open',
                value: function open() { // var _this = this;
                    /**
                     * Fires to close other open dropdowns, typically when dropdown is opening
                     * @event Dropdown#closeme
                     */
                    this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
                    this.$anchors.addClass('hover').attr({
                        'aria-expanded': true
                    }); // this.$element/*.show()*/;
                    this.$element.addClass('is-opening');
                    this._setPosition();
                    this.$element.removeClass('is-opening').addClass('is-open').attr({
                        'aria-hidden': false
                    });
                    if (this.options.autoFocus) {
                        var $focusable = __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].findFocusable(this.$element);
                        if ($focusable.length) {
                            $focusable.eq(0).focus();
                        }
                    }
                    if (this.options.closeOnClick) {
                        this._addBodyHandler();
                    }
                    if (this.options.trapFocus) {
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].trapFocus(this.$element);
                    }
                    /**
                     * Fires once the dropdown is visible.
                     * @event Dropdown#show
                     */
                    this.$element.trigger('show.zf.dropdown', [this.$element]);
                }
                /**
                 * Closes the open dropdown pane.
                 * @function
                 * @fires Dropdown#hide
                 */
            }, {
                key: 'close',
                value: function close() {
                    if (!this.$element.hasClass('is-open')) {
                        return false;
                    }
                    this.$element.removeClass('is-open').attr({
                        'aria-hidden': true
                    });
                    this.$anchors.removeClass('hover').attr('aria-expanded', false);
                    /**
                     * Fires once the dropdown is no longer visible.
                     * @event Dropdown#hide
                     */
                    this.$element.trigger('hide.zf.dropdown', [this.$element]);
                    if (this.options.trapFocus) {
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].releaseFocus(this.$element);
                    }
                }
                /**
                 * Toggles the dropdown pane's visibility.
                 * @function
                 */
            }, {
                key: 'toggle',
                value: function toggle() {
                    if (this.$element.hasClass('is-open')) {
                        if (this.$anchors.data('hover')) return;
                        this.close();
                    } else {
                        this.open();
                    }
                }
                /**
                 * Destroys the dropdown.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$element.off('.zf.trigger').hide();
                    this.$anchors.off('.zf.dropdown');
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document.body).off('click.zf.dropdown');
                }
            }]);
            return Dropdown;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_positionable__["a" /* Positionable */ ]);
        Dropdown.defaults = {
            /**
             * Class that designates bounding container of Dropdown (default: window)
             * @option
             * @type {?string}
             * @default null
             */
            parentClass: null,
            /**
             * Amount of time to delay opening a submenu on hover event.
             * @option
             * @type {number}
             * @default 250
             */
            hoverDelay: 250,
            /**
             * Allow submenus to open on hover events
             * @option
             * @type {boolean}
             * @default false
             */
            hover: false,
            /**
             * Don't close dropdown when hovering over dropdown pane
             * @option
             * @type {boolean}
             * @default false
             */
            hoverPane: false,
            /**
             * Number of pixels between the dropdown pane and the triggering element on open.
             * @option
             * @type {number}
             * @default 0
             */
            vOffset: 0,
            /**
             * Number of pixels between the dropdown pane and the triggering element on open.
             * @option
             * @type {number}
             * @default 0
             */
            hOffset: 0,
            /**
             * DEPRECATED: Class applied to adjust open position.
             * @option
             * @type {string}
             * @default ''
             */
            positionClass: '',
            /**
             * Position of dropdown. Can be left, right, bottom, top, or auto.
             * @option
             * @type {string}
             * @default 'auto'
             */
            position: 'auto',
            /**
             * Alignment of dropdown relative to anchor. Can be left, right, bottom, top, center, or auto.
             * @option
             * @type {string}
             * @default 'auto'
             */
            alignment: 'auto',
            /**
             * Allow overlap of container/window. If false, dropdown will first try to position as defined by data-position and data-alignment, but reposition if it would cause an overflow.
             * @option
             * @type {boolean}
             * @default false
             */
            allowOverlap: false,
            /**
             * Allow overlap of only the bottom of the container. This is the most common
             * behavior for dropdowns, allowing the dropdown to extend the bottom of the
             * screen but not otherwise influence or break out of the container.
             * @option
             * @type {boolean}
             * @default true
             */
            allowBottomOverlap: true,
            /**
             * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
             * @option
             * @type {boolean}
             * @default false
             */
            trapFocus: false,
            /**
             * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
             * @option
             * @type {boolean}
             * @default false
             */
            autoFocus: false,
            /**
             * Allows a click on the body to close the dropdown.
             * @option
             * @type {boolean}
             * @default false
             */
            closeOnClick: false
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    },
    /***/ 8: /***/ function _(module, exports) {
        module.exports = {
            Box: window.Foundation.Box
        }; /***/
    },
    /***/ 83: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(17); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 84); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 18: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_dropdownMenu__ = __webpack_require__(48);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_dropdownMenu__["a" /* DropdownMenu */ ], 'DropdownMenu'); /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 48: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return DropdownMenu;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__ = __webpack_require__(9); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_box__ = __webpack_require__(8); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_box___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_util_box__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * DropdownMenu module.
         * @module foundation.dropdown-menu
         * @requires foundation.util.keyboard
         * @requires foundation.util.box
         * @requires foundation.util.nest
         */
        var DropdownMenu = function(_Plugin) {
            _inherits(DropdownMenu, _Plugin);

            function DropdownMenu() {
                _classCallCheck(this, DropdownMenu);
                return _possibleConstructorReturn(this, (DropdownMenu.__proto__ || Object.getPrototypeOf(DropdownMenu)).apply(this, arguments));
            }
            _createClass(DropdownMenu, [{
                key: '_setup',
                /**
                 * Creates a new instance of DropdownMenu.
                 * @class
                 * @name DropdownMenu
                 * @fires DropdownMenu#init
                 * @param {jQuery} element - jQuery object to make into a dropdown menu.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, DropdownMenu.defaults, this.$element.data(), options);
                    this.className = 'DropdownMenu'; // ie9 back compat
                    this._init();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('DropdownMenu', {
                        'ENTER': 'open',
                        'SPACE': 'open',
                        'ARROW_RIGHT': 'next',
                        'ARROW_UP': 'up',
                        'ARROW_DOWN': 'down',
                        'ARROW_LEFT': 'previous',
                        'ESCAPE': 'close'
                    });
                }
                /**
                 * Initializes the plugin, and calls _prepareMenu
                 * @private
                 * @function
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__["Nest"].Feather(this.$element, 'dropdown');
                    var subs = this.$element.find('li.is-dropdown-submenu-parent');
                    this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');
                    this.$menuItems = this.$element.find('[role="menuitem"]');
                    this.$tabs = this.$element.children('[role="menuitem"]');
                    this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);
                    if (this.options.alignment === 'auto') {
                        if (this.$element.hasClass(this.options.rightClass) || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__foundation_util_core__["rtl"])() || this.$element.parents('.top-bar-right').is('*')) {
                            this.options.alignment = 'right';
                            subs.addClass('opens-left');
                        } else {
                            this.options.alignment = 'left';
                            subs.addClass('opens-right');
                        }
                    } else {
                        if (this.options.alignment === 'right') {
                            subs.addClass('opens-left');
                        } else {
                            subs.addClass('opens-right');
                        }
                    }
                    this.changed = false;
                    this._events();
                }
            }, {
                key: '_isVertical',
                value: function _isVertical() {
                    return this.$tabs.css('display') === 'block' || this.$element.css('flex-direction') === 'column';
                }
            }, {
                key: '_isRtl',
                value: function _isRtl() {
                    return this.$element.hasClass('align-right') || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__foundation_util_core__["rtl"])() && !this.$element.hasClass('align-left');
                }
                /**
                 * Adds event listeners to elements within the menu
                 * @private
                 * @function
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this,
                        hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
                        parClass = 'is-dropdown-submenu-parent'; // used for onClick and in the keyboard handlers
                    var handleClickFn = function handleClickFn(e) {
                        var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(e.target).parentsUntil('ul', '.' + parClass),
                            hasSub = $elem.hasClass(parClass),
                            hasClicked = $elem.attr('data-is-click') === 'true',
                            $sub = $elem.children('.is-dropdown-submenu');
                        if (hasSub) {
                            if (hasClicked) {
                                if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                                    return;
                                } else {
                                    e.stopImmediatePropagation();
                                    e.preventDefault();
                                    _this._hide($elem);
                                }
                            } else {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                _this._show($sub);
                                $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
                            }
                        }
                    };
                    if (this.options.clickOpen || hasTouch) {
                        this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
                    } // Handle Leaf element Clicks
                    if (_this.options.closeOnClickInside) {
                        this.$menuItems.on('click.zf.dropdownmenu', function(e) {
                            var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                                hasSub = $elem.hasClass(parClass);
                            if (!hasSub) {
                                _this._hide();
                            }
                        });
                    }
                    if (!this.options.disableHover) {
                        this.$menuItems.on('mouseenter.zf.dropdownmenu', function(e) {
                            var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                                hasSub = $elem.hasClass(parClass);
                            if (hasSub) {
                                clearTimeout($elem.data('_delay'));
                                $elem.data('_delay', setTimeout(function() {
                                    _this._show($elem.children('.is-dropdown-submenu'));
                                }, _this.options.hoverDelay));
                            }
                        }).on('mouseleave.zf.dropdownmenu', function(e) {
                            var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                                hasSub = $elem.hasClass(parClass);
                            if (hasSub && _this.options.autoclose) {
                                if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                                    return false;
                                }
                                clearTimeout($elem.data('_delay'));
                                $elem.data('_delay', setTimeout(function() {
                                    _this._hide($elem);
                                }, _this.options.closingTime));
                            }
                        });
                    }
                    this.$menuItems.on('keydown.zf.dropdownmenu', function(e) {
                        var $element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(e.target).parentsUntil('ul', '[role="menuitem"]'),
                            isTab = _this.$tabs.index($element) > -1,
                            $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
                            $prevElement, $nextElement;
                        $elements.each(function(i) {
                            if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is($element)) {
                                $prevElement = $elements.eq(i - 1);
                                $nextElement = $elements.eq(i + 1);
                                return;
                            }
                        });
                        var nextSibling = function nextSibling() {
                                $nextElement.children('a:first').focus();
                                e.preventDefault();
                            },
                            prevSibling = function prevSibling() {
                                $prevElement.children('a:first').focus();
                                e.preventDefault();
                            },
                            openSub = function openSub() {
                                var $sub = $element.children('ul.is-dropdown-submenu');
                                if ($sub.length) {
                                    _this._show($sub);
                                    $element.find('li > a:first').focus();
                                    e.preventDefault();
                                } else {
                                    return;
                                }
                            },
                            closeSub = function closeSub() { //if ($element.is(':first-child')) {
                                var close = $element.parent('ul').parent('li');
                                close.children('a:first').focus();
                                _this._hide(close);
                                e.preventDefault(); //}
                            };
                        var functions = {
                            open: openSub,
                            close: function close() {
                                _this._hide(_this.$element);
                                _this.$menuItems.eq(0).children('a').focus(); // focus to first element
                                e.preventDefault();
                            },
                            handled: function handled() {
                                e.stopImmediatePropagation();
                            }
                        };
                        if (isTab) {
                            if (_this._isVertical()) { // vertical menu
                                if (_this._isRtl()) { // right aligned
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend(functions, {
                                        down: nextSibling,
                                        up: prevSibling,
                                        next: closeSub,
                                        previous: openSub
                                    });
                                } else { // left aligned
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend(functions, {
                                        down: nextSibling,
                                        up: prevSibling,
                                        next: openSub,
                                        previous: closeSub
                                    });
                                }
                            } else { // horizontal menu
                                if (_this._isRtl()) { // right aligned
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend(functions, {
                                        next: prevSibling,
                                        previous: nextSibling,
                                        down: openSub,
                                        up: closeSub
                                    });
                                } else { // left aligned
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend(functions, {
                                        next: nextSibling,
                                        previous: prevSibling,
                                        down: openSub,
                                        up: closeSub
                                    });
                                }
                            }
                        } else { // not tabs -> one sub
                            if (_this._isRtl()) { // right aligned
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend(functions, {
                                    next: closeSub,
                                    previous: openSub,
                                    down: nextSibling,
                                    up: prevSibling
                                });
                            } else { // left aligned
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend(functions, {
                                    next: openSub,
                                    previous: closeSub,
                                    down: nextSibling,
                                    up: prevSibling
                                });
                            }
                        }
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'DropdownMenu', functions);
                    });
                }
                /**
                 * Adds an event handler to the body to close any dropdowns on a click.
                 * @function
                 * @private
                 */
            }, {
                key: '_addBodyHandler',
                value: function _addBodyHandler() {
                    var $body = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document.body),
                        _this = this;
                    $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function(e) {
                        var $link = _this.$element.find(e.target);
                        if ($link.length) {
                            return;
                        }
                        _this._hide();
                        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
                    });
                }
                /**
                 * Opens a dropdown pane, and checks for collisions first.
                 * @param {jQuery} $sub - ul element that is a submenu to show
                 * @function
                 * @private
                 * @fires DropdownMenu#show
                 */
            }, {
                key: '_show',
                value: function _show($sub) {
                    var idx = this.$tabs.index(this.$tabs.filter(function(i, el) {
                        return __WEBPACK_IMPORTED_MODULE_0_jquery___default()(el).find($sub).length > 0;
                    }));
                    var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
                    this._hide($sibs, idx);
                    $sub.css('visibility', 'hidden').addClass('js-dropdown-active').parent('li.is-dropdown-submenu-parent').addClass('is-active');
                    var clear = __WEBPACK_IMPORTED_MODULE_3__foundation_util_box__["Box"].ImNotTouchingYou($sub, null, true);
                    if (!clear) {
                        var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
                            $parentLi = $sub.parent('.is-dropdown-submenu-parent');
                        $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
                        clear = __WEBPACK_IMPORTED_MODULE_3__foundation_util_box__["Box"].ImNotTouchingYou($sub, null, true);
                        if (!clear) {
                            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
                        }
                        this.changed = true;
                    }
                    $sub.css('visibility', '');
                    if (this.options.closeOnClick) {
                        this._addBodyHandler();
                    }
                    /**
                     * Fires when the new dropdown pane is visible.
                     * @event DropdownMenu#show
                     */
                    this.$element.trigger('show.zf.dropdownmenu', [$sub]);
                }
                /**
                 * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
                 * @function
                 * @param {jQuery} $elem - element with a submenu to hide
                 * @param {Number} idx - index of the $tabs collection to hide
                 * @private
                 */
            }, {
                key: '_hide',
                value: function _hide($elem, idx) {
                    var $toClose;
                    if ($elem && $elem.length) {
                        $toClose = $elem;
                    } else if (idx !== undefined) {
                        $toClose = this.$tabs.not(function(i, el) {
                            return i === idx;
                        });
                    } else {
                        $toClose = this.$element;
                    }
                    var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;
                    if (somethingToClose) {
                        $toClose.find('li.is-active').add($toClose).attr({
                            'data-is-click': false
                        }).removeClass('is-active');
                        $toClose.find('ul.js-dropdown-active').removeClass('js-dropdown-active');
                        if (this.changed || $toClose.find('opens-inner').length) {
                            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
                            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
                            this.changed = false;
                        }
                        /**
                         * Fires when the open menus are closed.
                         * @event DropdownMenu#hide
                         */
                        this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
                    }
                }
                /**
                 * Destroys the plugin.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document.body).off('.zf.dropdownmenu');
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_nest__["Nest"].Burn(this.$element, 'dropdown');
                }
            }]);
            return DropdownMenu;
        }(__WEBPACK_IMPORTED_MODULE_5__foundation_plugin__["Plugin"]);
        /**
         * Default settings for plugin
         */
        DropdownMenu.defaults = {
            /**
             * Disallows hover events from opening submenus
             * @option
             * @type {boolean}
             * @default false
             */
            disableHover: false,
            /**
             * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
             * @option
             * @type {boolean}
             * @default true
             */
            autoclose: true,
            /**
             * Amount of time to delay opening a submenu on hover event.
             * @option
             * @type {number}
             * @default 50
             */
            hoverDelay: 50,
            /**
             * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
             * @option
             * @type {boolean}
             * @default false
             */
            clickOpen: false,
            /**
             * Amount of time to delay closing a submenu on a mouseleave event.
             * @option
             * @type {number}
             * @default 500
             */
            closingTime: 500,
            /**
             * Position of the menu relative to what direction the submenus should open. Handled by JS. Can be `'auto'`, `'left'` or `'right'`.
             * @option
             * @type {string}
             * @default 'auto'
             */
            alignment: 'auto',
            /**
             * Allow clicks on the body to close any open submenus.
             * @option
             * @type {boolean}
             * @default true
             */
            closeOnClick: true,
            /**
             * Allow clicks on leaf anchor links to close any open submenus.
             * @option
             * @type {boolean}
             * @default true
             */
            closeOnClickInside: true,
            /**
             * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
             * @option
             * @type {string}
             * @default 'vertical'
             */
            verticalClass: 'vertical',
            /**
             * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
             * @option
             * @type {string}
             * @default 'align-right'
             */
            rightClass: 'align-right',
            /**
             * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
             * @option
             * @type {boolean}
             * @default true
             */
            forceFollow: true
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 8: /***/ function _(module, exports) {
        module.exports = {
            Box: window.Foundation.Box
        }; /***/
    },
    /***/ 84: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(18); /***/
    },
    /***/ 9: /***/ function _(module, exports) {
        module.exports = {
            Nest: window.Foundation.Nest
        }; /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 85); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 10: /***/ function _(module, exports) {
        module.exports = {
            onImagesLoaded: window.Foundation.onImagesLoaded
        }; /***/
    },
    /***/ 19: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_equalizer__ = __webpack_require__(49);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_equalizer__["a" /* Equalizer */ ], 'Equalizer'); /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 49: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Equalizer;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader__ = __webpack_require__(10); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Equalizer module.
         * @module foundation.equalizer
         * @requires foundation.util.mediaQuery
         * @requires foundation.util.imageLoader if equalizer contains images
         */
        var Equalizer = function(_Plugin) {
            _inherits(Equalizer, _Plugin);

            function Equalizer() {
                _classCallCheck(this, Equalizer);
                return _possibleConstructorReturn(this, (Equalizer.__proto__ || Object.getPrototypeOf(Equalizer)).apply(this, arguments));
            }
            _createClass(Equalizer, [{
                key: '_setup',
                /**
                 * Creates a new instance of Equalizer.
                 * @class
                 * @name Equalizer
                 * @fires Equalizer#init
                 * @param {Object} element - jQuery object to add the trigger to.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Equalizer.defaults, this.$element.data(), options);
                    this.className = 'Equalizer'; // ie9 back compat
                    this._init();
                }
                /**
                 * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var eqId = this.$element.attr('data-equalizer') || '';
                    var $watched = this.$element.find('[data-equalizer-watch="' + eqId + '"]');
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"]._init();
                    this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
                    this.$element.attr('data-resize', eqId || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["GetYoDigits"])(6, 'eq'));
                    this.$element.attr('data-mutate', eqId || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["GetYoDigits"])(6, 'eq'));
                    this.hasNested = this.$element.find('[data-equalizer]').length > 0;
                    this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
                    this.isOn = false;
                    this._bindHandler = {
                        onResizeMeBound: this._onResizeMe.bind(this),
                        onPostEqualizedBound: this._onPostEqualized.bind(this)
                    };
                    var imgs = this.$element.find('img');
                    var tooSmall;
                    if (this.options.equalizeOn) {
                        tooSmall = this._checkMQ();
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
                    } else {
                        this._events();
                    }
                    if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
                        if (imgs.length) {
                            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader__["onImagesLoaded"])(imgs, this._reflow.bind(this));
                        } else {
                            this._reflow();
                        }
                    }
                }
                /**
                 * Removes event listeners if the breakpoint is too small.
                 * @private
                 */
            }, {
                key: '_pauseEvents',
                value: function _pauseEvents() {
                    this.isOn = false;
                    this.$element.off({
                        '.zf.equalizer': this._bindHandler.onPostEqualizedBound,
                        'resizeme.zf.trigger': this._bindHandler.onResizeMeBound,
                        'mutateme.zf.trigger': this._bindHandler.onResizeMeBound
                    });
                }
                /**
                 * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
                 * @private
                 */
            }, {
                key: '_onResizeMe',
                value: function _onResizeMe(e) {
                    this._reflow();
                }
                /**
                 * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
                 * @private
                 */
            }, {
                key: '_onPostEqualized',
                value: function _onPostEqualized(e) {
                    if (e.target !== this.$element[0]) {
                        this._reflow();
                    }
                }
                /**
                 * Initializes events for Equalizer.
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    this._pauseEvents();
                    if (this.hasNested) {
                        this.$element.on('postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
                    } else {
                        this.$element.on('resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
                        this.$element.on('mutateme.zf.trigger', this._bindHandler.onResizeMeBound);
                    }
                    this.isOn = true;
                }
                /**
                 * Checks the current breakpoint to the minimum required size.
                 * @private
                 */
            }, {
                key: '_checkMQ',
                value: function _checkMQ() {
                    var tooSmall = !__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"].is(this.options.equalizeOn);
                    if (tooSmall) {
                        if (this.isOn) {
                            this._pauseEvents();
                            this.$watched.css('height', 'auto');
                        }
                    } else {
                        if (!this.isOn) {
                            this._events();
                        }
                    }
                    return tooSmall;
                }
                /**
                 * A noop version for the plugin
                 * @private
                 */
            }, {
                key: '_killswitch',
                value: function _killswitch() {
                    return;
                }
                /**
                 * Calls necessary functions to update Equalizer upon DOM change
                 * @private
                 */
            }, {
                key: '_reflow',
                value: function _reflow() {
                    if (!this.options.equalizeOnStack) {
                        if (this._isStacked()) {
                            this.$watched.css('height', 'auto');
                            return false;
                        }
                    }
                    if (this.options.equalizeByRow) {
                        this.getHeightsByRow(this.applyHeightByRow.bind(this));
                    } else {
                        this.getHeights(this.applyHeight.bind(this));
                    }
                }
                /**
                 * Manually determines if the first 2 elements are *NOT* stacked.
                 * @private
                 */
            }, {
                key: '_isStacked',
                value: function _isStacked() {
                    if (!this.$watched[0] || !this.$watched[1]) {
                        return true;
                    }
                    return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
                }
                /**
                 * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
                 * @param {Function} cb - A non-optional callback to return the heights array to.
                 * @returns {Array} heights - An array of heights of children within Equalizer container
                 */
            }, {
                key: 'getHeights',
                value: function getHeights(cb) {
                    var heights = [];
                    for (var i = 0, len = this.$watched.length; i < len; i++) {
                        this.$watched[i].style.height = 'auto';
                        heights.push(this.$watched[i].offsetHeight);
                    }
                    cb(heights);
                }
                /**
                 * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
                 * @param {Function} cb - A non-optional callback to return the heights array to.
                 * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
                 */
            }, {
                key: 'getHeightsByRow',
                value: function getHeightsByRow(cb) {
                    var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
                        groups = [],
                        group = 0; //group by Row
                    groups[group] = [];
                    for (var i = 0, len = this.$watched.length; i < len; i++) {
                        this.$watched[i].style.height = 'auto'; //maybe could use this.$watched[i].offsetTop
                        var elOffsetTop = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this.$watched[i]).offset().top;
                        if (elOffsetTop != lastElTopOffset) {
                            group++;
                            groups[group] = [];
                            lastElTopOffset = elOffsetTop;
                        }
                        groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
                    }
                    for (var j = 0, ln = groups.length; j < ln; j++) {
                        var heights = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(groups[j]).map(function() {
                            return this[1];
                        }).get();
                        var max = Math.max.apply(null, heights);
                        groups[j].push(max);
                    }
                    cb(groups);
                }
                /**
                 * Changes the CSS height property of each child in an Equalizer parent to match the tallest
                 * @param {array} heights - An array of heights of children within Equalizer container
                 * @fires Equalizer#preequalized
                 * @fires Equalizer#postequalized
                 */
            }, {
                key: 'applyHeight',
                value: function applyHeight(heights) {
                    var max = Math.max.apply(null, heights);
                    /**
                     * Fires before the heights are applied
                     * @event Equalizer#preequalized
                     */
                    this.$element.trigger('preequalized.zf.equalizer');
                    this.$watched.css('height', max);
                    /**
                     * Fires when the heights have been applied
                     * @event Equalizer#postequalized
                     */
                    this.$element.trigger('postequalized.zf.equalizer');
                }
                /**
                 * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
                 * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
                 * @fires Equalizer#preequalized
                 * @fires Equalizer#preequalizedrow
                 * @fires Equalizer#postequalizedrow
                 * @fires Equalizer#postequalized
                 */
            }, {
                key: 'applyHeightByRow',
                value: function applyHeightByRow(groups) {
                    /**
                     * Fires before the heights are applied
                     */
                    this.$element.trigger('preequalized.zf.equalizer');
                    for (var i = 0, len = groups.length; i < len; i++) {
                        var groupsILength = groups[i].length,
                            max = groups[i][groupsILength - 1];
                        if (groupsILength <= 2) {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(groups[i][0][0]).css({
                                'height': 'auto'
                            });
                            continue;
                        }
                        /**
                         * Fires before the heights per row are applied
                         * @event Equalizer#preequalizedrow
                         */
                        this.$element.trigger('preequalizedrow.zf.equalizer');
                        for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(groups[i][j][0]).css({
                                'height': max
                            });
                        }
                        /**
                         * Fires when the heights per row have been applied
                         * @event Equalizer#postequalizedrow
                         */
                        this.$element.trigger('postequalizedrow.zf.equalizer');
                    }
                    /**
                     * Fires when the heights have been applied
                     */
                    this.$element.trigger('postequalized.zf.equalizer');
                }
                /**
                 * Destroys an instance of Equalizer.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this._pauseEvents();
                    this.$watched.css('height', 'auto');
                }
            }]);
            return Equalizer;
        }(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__["Plugin"]);
        /**
         * Default settings for plugin
         */
        Equalizer.defaults = {
            /**
             * Enable height equalization when stacked on smaller screens.
             * @option
             * @type {boolean}
             * @default false
             */
            equalizeOnStack: false,
            /**
             * Enable height equalization row by row.
             * @option
             * @type {boolean}
             * @default false
             */
            equalizeByRow: false,
            /**
             * String representing the minimum breakpoint size the plugin should equalize heights on.
             * @option
             * @type {string}
             * @default ''
             */
            equalizeOn: ''
        }; /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 85: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(19); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 88); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 22: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_offcanvas__ = __webpack_require__(52);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_offcanvas__["a" /* OffCanvas */ ], 'OffCanvas'); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 52: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return OffCanvas;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_util_triggers__ = __webpack_require__(7);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * OffCanvas module.
         * @module foundation.offcanvas
         * @requires foundation.util.keyboard
         * @requires foundation.util.mediaQuery
         * @requires foundation.util.triggers
         */
        var OffCanvas = function(_Plugin) {
            _inherits(OffCanvas, _Plugin);

            function OffCanvas() {
                _classCallCheck(this, OffCanvas);
                return _possibleConstructorReturn(this, (OffCanvas.__proto__ || Object.getPrototypeOf(OffCanvas)).apply(this, arguments));
            }
            _createClass(OffCanvas, [{
                key: '_setup',
                /**
                 * Creates a new instance of an off-canvas wrapper.
                 * @class
                 * @name OffCanvas
                 * @fires OffCanvas#init
                 * @param {Object} element - jQuery object to initialize.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    var _this3 = this;
                    this.className = 'OffCanvas'; // ie9 back compat
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, OffCanvas.defaults, this.$element.data(), options);
                    this.contentClasses = {
                        base: [],
                        reveal: []
                    };
                    this.$lastTrigger = __WEBPACK_IMPORTED_MODULE_0_jquery___default()();
                    this.$triggers = __WEBPACK_IMPORTED_MODULE_0_jquery___default()();
                    this.position = 'left';
                    this.$content = __WEBPACK_IMPORTED_MODULE_0_jquery___default()();
                    this.nested = !!this.options.nested; // Defines the CSS transition/position classes of the off-canvas content container.
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(['push', 'overlap']).each(function(index, val) {
                        _this3.contentClasses.base.push('has-transition-' + val);
                    });
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(['left', 'right', 'top', 'bottom']).each(function(index, val) {
                        _this3.contentClasses.base.push('has-position-' + val);
                        _this3.contentClasses.reveal.push('has-reveal-' + val);
                    }); // Triggers init is idempotent, just need to make sure it is initialized
                    __WEBPACK_IMPORTED_MODULE_5__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"]._init();
                    this._init();
                    this._events();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('OffCanvas', {
                        'ESCAPE': 'close'
                    });
                }
                /**
                 * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var id = this.$element.attr('id');
                    this.$element.attr('aria-hidden', 'true'); // Find off-canvas content, either by ID (if specified), by siblings or by closest selector (fallback)
                    if (this.options.contentId) {
                        this.$content = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + this.options.contentId);
                    } else if (this.$element.siblings('[data-off-canvas-content]').length) {
                        this.$content = this.$element.siblings('[data-off-canvas-content]').first();
                    } else {
                        this.$content = this.$element.closest('[data-off-canvas-content]').first();
                    }
                    if (!this.options.contentId) { // Assume that the off-canvas element is nested if it isn't a sibling of the content
                        this.nested = this.$element.siblings('[data-off-canvas-content]').length === 0;
                    } else if (this.options.contentId && this.options.nested === null) { // Warning if using content ID without setting the nested option
                        // Once the element is nested it is required to work properly in this case
                        console.warn('Remember to use the nested option if using the content ID option!');
                    }
                    if (this.nested === true) { // Force transition overlap if nested
                        this.options.transition = 'overlap'; // Remove appropriate classes if already assigned in markup
                        this.$element.removeClass('is-transition-push');
                    }
                    this.$element.addClass('is-transition-' + this.options.transition + ' is-closed'); // Find triggers that affect this element and add aria-expanded to them
                    this.$triggers = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id); // Get position by checking for related CSS class
                    this.position = this.$element.is('.position-left, .position-top, .position-right, .position-bottom') ? this.$element.attr('class').match(/position\-(left|top|right|bottom)/)[1] : this.position; // Add an overlay over the content if necessary
                    if (this.options.contentOverlay === true) {
                        var overlay = document.createElement('div');
                        var overlayPosition = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this.$element).css("position") === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
                        overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
                        this.$overlay = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(overlay);
                        if (overlayPosition === 'is-overlay-fixed') {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this.$overlay).insertAfter(this.$element);
                        } else {
                            this.$content.append(this.$overlay);
                        }
                    }
                    this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);
                    if (this.options.isRevealed === true) {
                        this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
                        this._setMQChecker();
                    }
                    if (this.options.transitionTime) {
                        this.$element.css('transition-duration', this.options.transitionTime);
                    } // Initally remove all transition/position CSS classes from off-canvas content container.
                    this._removeContentClasses();
                }
                /**
                 * Adds event handlers to the off-canvas wrapper and the exit overlay.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    this.$element.off('.zf.trigger .zf.offcanvas').on({
                        'open.zf.trigger': this.open.bind(this),
                        'close.zf.trigger': this.close.bind(this),
                        'toggle.zf.trigger': this.toggle.bind(this),
                        'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
                    });
                    if (this.options.closeOnClick === true) {
                        var $target = this.options.contentOverlay ? this.$overlay : this.$content;
                        $target.on({
                            'click.zf.offcanvas': this.close.bind(this)
                        });
                    }
                }
                /**
                 * Applies event listener for elements that will reveal at certain breakpoints.
                 * @private
                 */
            }, {
                key: '_setMQChecker',
                value: function _setMQChecker() {
                    var _this = this;
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('changed.zf.mediaquery', function() {
                        if (__WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"].atLeast(_this.options.revealOn)) {
                            _this.reveal(true);
                        } else {
                            _this.reveal(false);
                        }
                    }).one('load.zf.offcanvas', function() {
                        if (__WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"].atLeast(_this.options.revealOn)) {
                            _this.reveal(true);
                        }
                    });
                }
                /**
                 * Removes the CSS transition/position classes of the off-canvas content container.
                 * Removing the classes is important when another off-canvas gets opened that uses the same content container.
                 * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
                 * @private
                 */
            }, {
                key: '_removeContentClasses',
                value: function _removeContentClasses(hasReveal) {
                    if (typeof hasReveal !== 'boolean') {
                        this.$content.removeClass(this.contentClasses.base.join(' '));
                    } else if (hasReveal === false) {
                        this.$content.removeClass('has-reveal-' + this.position);
                    }
                }
                /**
                 * Adds the CSS transition/position classes of the off-canvas content container, based on the opening off-canvas element.
                 * Beforehand any transition/position class gets removed.
                 * @param {Boolean} hasReveal - true if related off-canvas element is revealed.
                 * @private
                 */
            }, {
                key: '_addContentClasses',
                value: function _addContentClasses(hasReveal) {
                    this._removeContentClasses(hasReveal);
                    if (typeof hasReveal !== 'boolean') {
                        this.$content.addClass('has-transition-' + this.options.transition + ' has-position-' + this.position);
                    } else if (hasReveal === true) {
                        this.$content.addClass('has-reveal-' + this.position);
                    }
                }
                /**
                 * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
                 * @param {Boolean} isRevealed - true if element should be revealed.
                 * @function
                 */
            }, {
                key: 'reveal',
                value: function reveal(isRevealed) {
                    if (isRevealed) {
                        this.close();
                        this.isRevealed = true;
                        this.$element.attr('aria-hidden', 'false');
                        this.$element.off('open.zf.trigger toggle.zf.trigger');
                        this.$element.removeClass('is-closed');
                    } else {
                        this.isRevealed = false;
                        this.$element.attr('aria-hidden', 'true');
                        this.$element.off('open.zf.trigger toggle.zf.trigger').on({
                            'open.zf.trigger': this.open.bind(this),
                            'toggle.zf.trigger': this.toggle.bind(this)
                        });
                        this.$element.addClass('is-closed');
                    }
                    this._addContentClasses(isRevealed);
                }
                /**
                 * Stops scrolling of the body when offcanvas is open on mobile Safari and other troublesome browsers.
                 * @private
                 */
            }, {
                key: '_stopScrolling',
                value: function _stopScrolling(event) {
                    return false;
                } // Taken and adapted from http://stackoverflow.com/questions/16889447/prevent-full-page-scrolling-ios
                // Only really works for y, not sure how to extend to x or if we need to.
            }, {
                key: '_recordScrollable',
                value: function _recordScrollable(event) {
                    var elem = this; // called from event handler context with this as elem
                    // If the element is scrollable (content overflows), then...
                    if (elem.scrollHeight !== elem.clientHeight) { // If we're at the top, scroll down one pixel to allow scrolling up
                        if (elem.scrollTop === 0) {
                            elem.scrollTop = 1;
                        } // If we're at the bottom, scroll up one pixel to allow scrolling down
                        if (elem.scrollTop === elem.scrollHeight - elem.clientHeight) {
                            elem.scrollTop = elem.scrollHeight - elem.clientHeight - 1;
                        }
                    }
                    elem.allowUp = elem.scrollTop > 0;
                    elem.allowDown = elem.scrollTop < elem.scrollHeight - elem.clientHeight;
                    elem.lastY = event.originalEvent.pageY;
                }
            }, {
                key: '_stopScrollPropagation',
                value: function _stopScrollPropagation(event) {
                    var elem = this; // called from event handler context with this as elem
                    var up = event.pageY < elem.lastY;
                    var down = !up;
                    elem.lastY = event.pageY;
                    if (up && elem.allowUp || down && elem.allowDown) {
                        event.stopPropagation();
                    } else {
                        event.preventDefault();
                    }
                }
                /**
                 * Opens the off-canvas menu.
                 * @function
                 * @param {Object} event - Event object passed from listener.
                 * @param {jQuery} trigger - element that triggered the off-canvas to open.
                 * @fires OffCanvas#opened
                 */
            }, {
                key: 'open',
                value: function open(event, trigger) {
                    if (this.$element.hasClass('is-open') || this.isRevealed) {
                        return;
                    }
                    var _this = this;
                    if (trigger) {
                        this.$lastTrigger = trigger;
                    }
                    if (this.options.forceTo === 'top') {
                        window.scrollTo(0, 0);
                    } else if (this.options.forceTo === 'bottom') {
                        window.scrollTo(0, document.body.scrollHeight);
                    }
                    if (this.options.transitionTime && this.options.transition !== 'overlap') {
                        this.$element.siblings('[data-off-canvas-content]').css('transition-duration', this.options.transitionTime);
                    } else {
                        this.$element.siblings('[data-off-canvas-content]').css('transition-duration', '');
                    }
                    /**
                     * Fires when the off-canvas menu opens.
                     * @event OffCanvas#opened
                     */
                    this.$element.addClass('is-open').removeClass('is-closed');
                    this.$triggers.attr('aria-expanded', 'true');
                    this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');
                    this.$content.addClass('is-open-' + this.position); // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
                    if (this.options.contentScroll === false) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').addClass('is-off-canvas-open').on('touchmove', this._stopScrolling);
                        this.$element.on('touchstart', this._recordScrollable);
                        this.$element.on('touchmove', this._stopScrollPropagation);
                    }
                    if (this.options.contentOverlay === true) {
                        this.$overlay.addClass('is-visible');
                    }
                    if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
                        this.$overlay.addClass('is-closable');
                    }
                    if (this.options.autoFocus === true) {
                        this.$element.one(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["transitionend"])(this.$element), function() {
                            if (!_this.$element.hasClass('is-open')) {
                                return; // exit if prematurely closed
                            }
                            var canvasFocus = _this.$element.find('[data-autofocus]');
                            if (canvasFocus.length) {
                                canvasFocus.eq(0).focus();
                            } else {
                                _this.$element.find('a, button').eq(0).focus();
                            }
                        });
                    }
                    if (this.options.trapFocus === true) {
                        this.$content.attr('tabindex', '-1');
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].trapFocus(this.$element);
                    }
                    this._addContentClasses();
                }
                /**
                 * Closes the off-canvas menu.
                 * @function
                 * @param {Function} cb - optional cb to fire after closure.
                 * @fires OffCanvas#closed
                 */
            }, {
                key: 'close',
                value: function close(cb) {
                    if (!this.$element.hasClass('is-open') || this.isRevealed) {
                        return;
                    }
                    var _this = this;
                    this.$element.removeClass('is-open');
                    this.$element.attr('aria-hidden', 'true')
                        /**
                         * Fires when the off-canvas menu opens.
                         * @event OffCanvas#closed
                         */
                        .trigger('closed.zf.offcanvas');
                    this.$content.removeClass('is-open-left is-open-top is-open-right is-open-bottom'); // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
                    if (this.options.contentScroll === false) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').removeClass('is-off-canvas-open').off('touchmove', this._stopScrolling);
                        this.$element.off('touchstart', this._recordScrollable);
                        this.$element.off('touchmove', this._stopScrollPropagation);
                    }
                    if (this.options.contentOverlay === true) {
                        this.$overlay.removeClass('is-visible');
                    }
                    if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
                        this.$overlay.removeClass('is-closable');
                    }
                    this.$triggers.attr('aria-expanded', 'false');
                    if (this.options.trapFocus === true) {
                        this.$content.removeAttr('tabindex');
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].releaseFocus(this.$element);
                    } // Listen to transitionEnd and add class when done.
                    this.$element.one(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["transitionend"])(this.$element), function(e) {
                        _this.$element.addClass('is-closed');
                        _this._removeContentClasses();
                    });
                }
                /**
                 * Toggles the off-canvas menu open or closed.
                 * @function
                 * @param {Object} event - Event object passed from listener.
                 * @param {jQuery} trigger - element that triggered the off-canvas to open.
                 */
            }, {
                key: 'toggle',
                value: function toggle(event, trigger) {
                    if (this.$element.hasClass('is-open')) {
                        this.close(event, trigger);
                    } else {
                        this.open(event, trigger);
                    }
                }
                /**
                 * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
                 * @function
                 * @private
                 */
            }, {
                key: '_handleKeyboard',
                value: function _handleKeyboard(e) {
                    var _this4 = this;
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'OffCanvas', {
                        close: function close() {
                            _this4.close();
                            _this4.$lastTrigger.focus();
                            return true;
                        },
                        handled: function handled() {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    });
                }
                /**
                 * Destroys the offcanvas plugin.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.close();
                    this.$element.off('.zf.trigger .zf.offcanvas');
                    this.$overlay.off('.zf.offcanvas');
                }
            }]);
            return OffCanvas;
        }(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__["Plugin"]);
        OffCanvas.defaults = {
            /**
             * Allow the user to click outside of the menu to close it.
             * @option
             * @type {boolean}
             * @default true
             */
            closeOnClick: true,
            /**
             * Adds an overlay on top of `[data-off-canvas-content]`.
             * @option
             * @type {boolean}
             * @default true
             */
            contentOverlay: true,
            /**
             * Target an off-canvas content container by ID that may be placed anywhere. If null the closest content container will be taken.
             * @option
             * @type {?string}
             * @default null
             */
            contentId: null,
            /**
             * Define the off-canvas element is nested in an off-canvas content. This is required when using the contentId option for a nested element.
             * @option
             * @type {boolean}
             * @default null
             */
            nested: null,
            /**
             * Enable/disable scrolling of the main content when an off canvas panel is open.
             * @option
             * @type {boolean}
             * @default true
             */
            contentScroll: true,
            /**
             * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
             * @option
             * @type {number}
             * @default null
             */
            transitionTime: null,
            /**
             * Type of transition for the offcanvas menu. Options are 'push', 'detached' or 'slide'.
             * @option
             * @type {string}
             * @default push
             */
            transition: 'push',
            /**
             * Force the page to scroll to top or bottom on open.
             * @option
             * @type {?string}
             * @default null
             */
            forceTo: null,
            /**
             * Allow the offcanvas to remain open for certain breakpoints.
             * @option
             * @type {boolean}
             * @default false
             */
            isRevealed: false,
            /**
             * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
             * @option
             * @type {?string}
             * @default null
             */
            revealOn: null,
            /**
             * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
             * @option
             * @type {boolean}
             * @default true
             */
            autoFocus: true,
            /**
             * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
             * @option
             * @type {string}
             * @default reveal-for-
             * @todo improve the regex testing for this.
             */
            revealClass: 'reveal-for-',
            /**
             * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
             * @option
             * @type {boolean}
             * @default false
             */
            trapFocus: false
        }; /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    },
    /***/ 88: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(22); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 90); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 24: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_responsiveAccordionTabs__ = __webpack_require__(54);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_responsiveAccordionTabs__["a" /* ResponsiveAccordionTabs */ ], 'ResponsiveAccordionTabs'); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 54: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return ResponsiveAccordionTabs;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_accordion__ = __webpack_require__(72); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_accordion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_accordion__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_tabs__ = __webpack_require__(77); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_tabs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__foundation_tabs__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        } // The plugin matches the plugin classes with these plugin instances.
        var MenuPlugins = {
            tabs: {
                cssClass: 'tabs',
                plugin: __WEBPACK_IMPORTED_MODULE_5__foundation_tabs__["Tabs"]
            },
            accordion: {
                cssClass: 'accordion',
                plugin: __WEBPACK_IMPORTED_MODULE_4__foundation_accordion__["Accordion"]
            }
        };
        /**
         * ResponsiveAccordionTabs module.
         * @module foundation.responsiveAccordionTabs
         * @requires foundation.util.motion
         * @requires foundation.accordion
         * @requires foundation.tabs
         */
        var ResponsiveAccordionTabs = function(_Plugin) {
            _inherits(ResponsiveAccordionTabs, _Plugin);

            function ResponsiveAccordionTabs() {
                _classCallCheck(this, ResponsiveAccordionTabs);
                return _possibleConstructorReturn(this, (ResponsiveAccordionTabs.__proto__ || Object.getPrototypeOf(ResponsiveAccordionTabs)).apply(this, arguments));
            }
            _createClass(ResponsiveAccordionTabs, [{
                key: '_setup',
                /**
                 * Creates a new instance of a responsive accordion tabs.
                 * @class
                 * @name ResponsiveAccordionTabs
                 * @fires ResponsiveAccordionTabs#init
                 * @param {jQuery} element - jQuery object to make into Responsive Accordion Tabs.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(element);
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, this.$element.data(), options);
                    this.rules = this.$element.data('responsive-accordion-tabs');
                    this.currentMq = null;
                    this.currentPlugin = null;
                    this.className = 'ResponsiveAccordionTabs'; // ie9 back compat
                    if (!this.$element.attr('id')) {
                        this.$element.attr('id', __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["GetYoDigits"])(6, 'responsiveaccordiontabs'));
                    };
                    this._init();
                    this._events();
                }
                /**
                 * Initializes the Menu by parsing the classes from the 'data-responsive-accordion-tabs' attribute on the element.
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"]._init(); // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
                    if (typeof this.rules === 'string') {
                        var rulesTree = {}; // Parse rules from "classes" pulled from data attribute
                        var rules = this.rules.split(' '); // Iterate through every rule found
                        for (var i = 0; i < rules.length; i++) {
                            var rule = rules[i].split('-');
                            var ruleSize = rule.length > 1 ? rule[0] : 'small';
                            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];
                            if (MenuPlugins[rulePlugin] !== null) {
                                rulesTree[ruleSize] = MenuPlugins[rulePlugin];
                            }
                        }
                        this.rules = rulesTree;
                    }
                    this._getAllOptions();
                    if (!__WEBPACK_IMPORTED_MODULE_0_jquery___default.a.isEmptyObject(this.rules)) {
                        this._checkMediaQueries();
                    }
                }
            }, {
                key: '_getAllOptions',
                value: function _getAllOptions() { //get all defaults and options
                    var _this = this;
                    _this.allOptions = {};
                    for (var key in MenuPlugins) {
                        if (MenuPlugins.hasOwnProperty(key)) {
                            var obj = MenuPlugins[key];
                            try {
                                var dummyPlugin = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<ul></ul>');
                                var tmpPlugin = new obj.plugin(dummyPlugin, _this.options);
                                for (var keyKey in tmpPlugin.options) {
                                    if (tmpPlugin.options.hasOwnProperty(keyKey) && keyKey !== 'zfPlugin') {
                                        var objObj = tmpPlugin.options[keyKey];
                                        _this.allOptions[keyKey] = objObj;
                                    }
                                }
                                tmpPlugin.destroy();
                            } catch (e) {}
                        }
                    }
                }
                /**
                 * Initializes events for the Menu.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('changed.zf.mediaquery', function() {
                        _this._checkMediaQueries();
                    });
                }
                /**
                 * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
                 * @function
                 * @private
                 */
            }, {
                key: '_checkMediaQueries',
                value: function _checkMediaQueries() {
                    var matchedMq, _this = this; // Iterate through each rule and find the last matching rule
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.each(this.rules, function(key) {
                        if (__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"].atLeast(key)) {
                            matchedMq = key;
                        }
                    }); // No match? No dice
                    if (!matchedMq) return; // Plugin already initialized? We good
                    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return; // Remove existing plugin-specific CSS classes
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.each(MenuPlugins, function(key, value) {
                        _this.$element.removeClass(value.cssClass);
                    }); // Add the CSS class for the new plugin
                    this.$element.addClass(this.rules[matchedMq].cssClass); // Create an instance of the new plugin
                    if (this.currentPlugin) { //don't know why but on nested elements data zfPlugin get's lost
                        if (!this.currentPlugin.$element.data('zfPlugin') && this.storezfData) this.currentPlugin.$element.data('zfPlugin', this.storezfData);
                        this.currentPlugin.destroy();
                    }
                    this._handleMarkup(this.rules[matchedMq].cssClass);
                    this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
                    this.storezfData = this.currentPlugin.$element.data('zfPlugin');
                }
            }, {
                key: '_handleMarkup',
                value: function _handleMarkup(toSet) {
                    var _this = this,
                        fromString = 'accordion';
                    var $panels = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-tabs-content=' + this.$element.attr('id') + ']');
                    if ($panels.length) fromString = 'tabs';
                    if (fromString === toSet) {
                        return;
                    };
                    var tabsTitle = _this.allOptions.linkClass ? _this.allOptions.linkClass : 'tabs-title';
                    var tabsPanel = _this.allOptions.panelClass ? _this.allOptions.panelClass : 'tabs-panel';
                    this.$element.removeAttr('role');
                    var $liHeads = this.$element.children('.' + tabsTitle + ',[data-accordion-item]').removeClass(tabsTitle).removeClass('accordion-item').removeAttr('data-accordion-item');
                    var $liHeadsA = $liHeads.children('a').removeClass('accordion-title');
                    if (fromString === 'tabs') {
                        $panels = $panels.children('.' + tabsPanel).removeClass(tabsPanel).removeAttr('role').removeAttr('aria-hidden').removeAttr('aria-labelledby');
                        $panels.children('a').removeAttr('role').removeAttr('aria-controls').removeAttr('aria-selected');
                    } else {
                        $panels = $liHeads.children('[data-tab-content]').removeClass('accordion-content');
                    };
                    $panels.css({
                        display: '',
                        visibility: ''
                    });
                    $liHeads.css({
                        display: '',
                        visibility: ''
                    });
                    if (toSet === 'accordion') {
                        $panels.each(function(key, value) {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(value).appendTo($liHeads.get(key)).addClass('accordion-content').attr('data-tab-content', '').removeClass('is-active').css({
                                height: ''
                            });
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-tabs-content=' + _this.$element.attr('id') + ']').after('<div id="tabs-placeholder-' + _this.$element.attr('id') + '"></div>').detach();
                            $liHeads.addClass('accordion-item').attr('data-accordion-item', '');
                            $liHeadsA.addClass('accordion-title');
                        });
                    } else if (toSet === 'tabs') {
                        var $tabsContent = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-tabs-content=' + _this.$element.attr('id') + ']');
                        var $placeholder = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#tabs-placeholder-' + _this.$element.attr('id'));
                        if ($placeholder.length) {
                            $tabsContent = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<div class="tabs-content"></div>').insertAfter($placeholder).attr('data-tabs-content', _this.$element.attr('id'));
                            $placeholder.remove();
                        } else {
                            $tabsContent = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<div class="tabs-content"></div>').insertAfter(_this.$element).attr('data-tabs-content', _this.$element.attr('id'));
                        };
                        $panels.each(function(key, value) {
                            var tempValue = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(value).appendTo($tabsContent).addClass(tabsPanel);
                            var hash = $liHeadsA.get(key).hash.slice(1);
                            var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(value).attr('id') || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["GetYoDigits"])(6, 'accordion');
                            if (hash !== id) {
                                if (hash !== '') {
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(value).attr('id', hash);
                                } else {
                                    hash = id;
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(value).attr('id', hash);
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()($liHeadsA.get(key)).attr('href', __WEBPACK_IMPORTED_MODULE_0_jquery___default()($liHeadsA.get(key)).attr('href').replace('#', '') + '#' + hash);
                                };
                            };
                            var isActive = __WEBPACK_IMPORTED_MODULE_0_jquery___default()($liHeads.get(key)).hasClass('is-active');
                            if (isActive) {
                                tempValue.addClass('is-active');
                            };
                        });
                        $liHeads.addClass(tabsTitle);
                    };
                }
                /**
                 * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    if (this.currentPlugin) this.currentPlugin.destroy();
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('.zf.ResponsiveAccordionTabs');
                }
            }]);
            return ResponsiveAccordionTabs;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["Plugin"]);
        ResponsiveAccordionTabs.defaults = {}; /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 72: /***/ function _(module, exports) {
        module.exports = {
            Accordion: window.Foundation.Accordion
        }; /***/
    },
    /***/ 77: /***/ function _(module, exports) {
        module.exports = {
            Tabs: window.Foundation.Tabs
        }; /***/
    },
    /***/ 90: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(24); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 91); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 25: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_responsiveMenu__ = __webpack_require__(55);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_responsiveMenu__["a" /* ResponsiveMenu */ ], 'ResponsiveMenu'); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 55: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return ResponsiveMenu;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_dropdownMenu__ = __webpack_require__(75); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_dropdownMenu___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_dropdownMenu__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_drilldown__ = __webpack_require__(74); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_drilldown___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__foundation_drilldown__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_6__foundation_accordionMenu__ = __webpack_require__(73); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_6__foundation_accordionMenu___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6__foundation_accordionMenu__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        var MenuPlugins = {
            dropdown: {
                cssClass: 'dropdown',
                plugin: __WEBPACK_IMPORTED_MODULE_4__foundation_dropdownMenu__["DropdownMenu"]
            },
            drilldown: {
                cssClass: 'drilldown',
                plugin: __WEBPACK_IMPORTED_MODULE_5__foundation_drilldown__["Drilldown"]
            },
            accordion: {
                cssClass: 'accordion-menu',
                plugin: __WEBPACK_IMPORTED_MODULE_6__foundation_accordionMenu__["AccordionMenu"]
            }
        }; // import "foundation.util.triggers.js";
        /**
         * ResponsiveMenu module.
         * @module foundation.responsiveMenu
         * @requires foundation.util.triggers
         * @requires foundation.util.mediaQuery
         */
        var ResponsiveMenu = function(_Plugin) {
            _inherits(ResponsiveMenu, _Plugin);

            function ResponsiveMenu() {
                _classCallCheck(this, ResponsiveMenu);
                return _possibleConstructorReturn(this, (ResponsiveMenu.__proto__ || Object.getPrototypeOf(ResponsiveMenu)).apply(this, arguments));
            }
            _createClass(ResponsiveMenu, [{
                key: '_setup',
                /**
                 * Creates a new instance of a responsive menu.
                 * @class
                 * @name ResponsiveMenu
                 * @fires ResponsiveMenu#init
                 * @param {jQuery} element - jQuery object to make into a dropdown menu.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(element);
                    this.rules = this.$element.data('responsive-menu');
                    this.currentMq = null;
                    this.currentPlugin = null;
                    this.className = 'ResponsiveMenu'; // ie9 back compat
                    this._init();
                    this._events();
                }
                /**
                 * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"]._init(); // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
                    if (typeof this.rules === 'string') {
                        var rulesTree = {}; // Parse rules from "classes" pulled from data attribute
                        var rules = this.rules.split(' '); // Iterate through every rule found
                        for (var i = 0; i < rules.length; i++) {
                            var rule = rules[i].split('-');
                            var ruleSize = rule.length > 1 ? rule[0] : 'small';
                            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];
                            if (MenuPlugins[rulePlugin] !== null) {
                                rulesTree[ruleSize] = MenuPlugins[rulePlugin];
                            }
                        }
                        this.rules = rulesTree;
                    }
                    if (!__WEBPACK_IMPORTED_MODULE_0_jquery___default.a.isEmptyObject(this.rules)) {
                        this._checkMediaQueries();
                    } // Add data-mutate since children may need it.
                    this.$element.attr('data-mutate', this.$element.attr('data-mutate') || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_core__["GetYoDigits"])(6, 'responsive-menu'));
                }
                /**
                 * Initializes events for the Menu.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('changed.zf.mediaquery', function() {
                        _this._checkMediaQueries();
                    }); // $(window).on('resize.zf.ResponsiveMenu', function() {
                    //   _this._checkMediaQueries();
                    // });
                }
                /**
                 * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
                 * @function
                 * @private
                 */
            }, {
                key: '_checkMediaQueries',
                value: function _checkMediaQueries() {
                    var matchedMq, _this = this; // Iterate through each rule and find the last matching rule
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.each(this.rules, function(key) {
                        if (__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"].atLeast(key)) {
                            matchedMq = key;
                        }
                    }); // No match? No dice
                    if (!matchedMq) return; // Plugin already initialized? We good
                    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return; // Remove existing plugin-specific CSS classes
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.each(MenuPlugins, function(key, value) {
                        _this.$element.removeClass(value.cssClass);
                    }); // Add the CSS class for the new plugin
                    this.$element.addClass(this.rules[matchedMq].cssClass); // Create an instance of the new plugin
                    if (this.currentPlugin) this.currentPlugin.destroy();
                    this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
                }
                /**
                 * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.currentPlugin.destroy();
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('.zf.ResponsiveMenu');
                }
            }]);
            return ResponsiveMenu;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["Plugin"]);
        ResponsiveMenu.defaults = {}; /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 73: /***/ function _(module, exports) {
        module.exports = {
            AccordionMenu: window.Foundation.AccordionMenu
        }; /***/
    },
    /***/ 74: /***/ function _(module, exports) {
        module.exports = {
            Drilldown: window.Foundation.Drilldown
        }; /***/
    },
    /***/ 75: /***/ function _(module, exports) {
        module.exports = {
            DropdownMenu: window.Foundation.DropdownMenu
        }; /***/
    },
    /***/ 91: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(25); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 92); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 26: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_responsiveToggle__ = __webpack_require__(56);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_responsiveToggle__["a" /* ResponsiveToggle */ ], 'ResponsiveToggle'); /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 56: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return ResponsiveToggle;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * ResponsiveToggle module.
         * @module foundation.responsiveToggle
         * @requires foundation.util.mediaQuery
         * @requires foundation.util.motion
         */
        var ResponsiveToggle = function(_Plugin) {
            _inherits(ResponsiveToggle, _Plugin);

            function ResponsiveToggle() {
                _classCallCheck(this, ResponsiveToggle);
                return _possibleConstructorReturn(this, (ResponsiveToggle.__proto__ || Object.getPrototypeOf(ResponsiveToggle)).apply(this, arguments));
            }
            _createClass(ResponsiveToggle, [{
                key: '_setup',
                /**
                 * Creates a new instance of Tab Bar.
                 * @class
                 * @name ResponsiveToggle
                 * @fires ResponsiveToggle#init
                 * @param {jQuery} element - jQuery object to attach tab bar functionality to.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(element);
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);
                    this.className = 'ResponsiveToggle'; // ie9 back compat
                    this._init();
                    this._events();
                }
                /**
                 * Initializes the tab bar by finding the target element, toggling element, and running update().
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"]._init();
                    var targetID = this.$element.data('responsive-toggle');
                    if (!targetID) {
                        console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
                    }
                    this.$targetMenu = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + targetID);
                    this.$toggler = this.$element.find('[data-toggle]').filter(function() {
                        var target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                        return target === targetID || target === "";
                    });
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, this.options, this.$targetMenu.data()); // If they were set, parse the animation classes
                    if (this.options.animate) {
                        var input = this.options.animate.split(' ');
                        this.animationIn = input[0];
                        this.animationOut = input[1] || null;
                    }
                    this._update();
                }
                /**
                 * Adds necessary event handlers for the tab bar to work.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this;
                    this._updateMqHandler = this._update.bind(this);
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('changed.zf.mediaquery', this._updateMqHandler);
                    this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
                }
                /**
                 * Checks the current media query to determine if the tab bar should be visible or hidden.
                 * @function
                 * @private
                 */
            }, {
                key: '_update',
                value: function _update() { // Mobile
                    if (!__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"].atLeast(this.options.hideFor)) {
                        this.$element.show();
                        this.$targetMenu.hide();
                    } // Desktop
                    else {
                        this.$element.hide();
                        this.$targetMenu.show();
                    }
                }
                /**
                 * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
                 * @function
                 * @fires ResponsiveToggle#toggled
                 */
            }, {
                key: 'toggleMenu',
                value: function toggleMenu() {
                    var _this3 = this;
                    if (!__WEBPACK_IMPORTED_MODULE_1__foundation_util_mediaQuery__["MediaQuery"].atLeast(this.options.hideFor)) {
                        /**
                         * Fires when the element attached to the tab bar toggles.
                         * @event ResponsiveToggle#toggled
                         */
                        if (this.options.animate) {
                            if (this.$targetMenu.is(':hidden')) {
                                __WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__["Motion"].animateIn(this.$targetMenu, this.animationIn, function() {
                                    _this3.$element.trigger('toggled.zf.responsiveToggle');
                                    _this3.$targetMenu.find('[data-mutate]').triggerHandler('mutateme.zf.trigger');
                                });
                            } else {
                                __WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__["Motion"].animateOut(this.$targetMenu, this.animationOut, function() {
                                    _this3.$element.trigger('toggled.zf.responsiveToggle');
                                });
                            }
                        } else {
                            this.$targetMenu.toggle(0);
                            this.$targetMenu.find('[data-mutate]').trigger('mutateme.zf.trigger');
                            this.$element.trigger('toggled.zf.responsiveToggle');
                        }
                    }
                }
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$element.off('.zf.responsiveToggle');
                    this.$toggler.off('.zf.responsiveToggle');
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('changed.zf.mediaquery', this._updateMqHandler);
                }
            }]);
            return ResponsiveToggle;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["Plugin"]);
        ResponsiveToggle.defaults = {
            /**
             * The breakpoint after which the menu is always shown, and the tab bar is hidden.
             * @option
             * @type {string}
             * @default 'medium'
             */
            hideFor: 'medium',
            /**
             * To decide if the toggle should be animated or not.
             * @option
             * @type {boolean}
             * @default false
             */
            animate: false
        }; /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 92: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(26); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 93); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 27: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_reveal__ = __webpack_require__(57);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_reveal__["a" /* Reveal */ ], 'Reveal'); /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 57: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Reveal;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_util_motion__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_util_triggers__ = __webpack_require__(7);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Reveal module.
         * @module foundation.reveal
         * @requires foundation.util.keyboard
         * @requires foundation.util.triggers
         * @requires foundation.util.mediaQuery
         * @requires foundation.util.motion if using animations
         */
        var Reveal = function(_Plugin) {
            _inherits(Reveal, _Plugin);

            function Reveal() {
                _classCallCheck(this, Reveal);
                return _possibleConstructorReturn(this, (Reveal.__proto__ || Object.getPrototypeOf(Reveal)).apply(this, arguments));
            }
            _createClass(Reveal, [{
                key: '_setup',
                /**
                 * Creates a new instance of Reveal.
                 * @class
                 * @name Reveal
                 * @param {jQuery} element - jQuery object to use for the modal.
                 * @param {Object} options - optional parameters.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Reveal.defaults, this.$element.data(), options);
                    this.className = 'Reveal'; // ie9 back compat
                    this._init(); // Triggers init is idempotent, just need to make sure it is initialized
                    __WEBPACK_IMPORTED_MODULE_5__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('Reveal', {
                        'ESCAPE': 'close'
                    });
                }
                /**
                 * Initializes the modal by adding the overlay and close buttons, (if selected).
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"]._init();
                    this.id = this.$element.attr('id');
                    this.isActive = false;
                    this.cached = {
                        mq: __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"].current
                    };
                    this.isMobile = mobileSniff();
                    this.$anchor = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-open="' + this.id + '"]').length ? __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-open="' + this.id + '"]') : __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-toggle="' + this.id + '"]');
                    this.$anchor.attr({
                        'aria-controls': this.id,
                        'aria-haspopup': true,
                        'tabindex': 0
                    });
                    if (this.options.fullScreen || this.$element.hasClass('full')) {
                        this.options.fullScreen = true;
                        this.options.overlay = false;
                    }
                    if (this.options.overlay && !this.$overlay) {
                        this.$overlay = this._makeOverlay(this.id);
                    }
                    this.$element.attr({
                        'role': 'dialog',
                        'aria-hidden': true,
                        'data-yeti-box': this.id,
                        'data-resize': this.id
                    });
                    if (this.$overlay) {
                        this.$element.detach().appendTo(this.$overlay);
                    } else {
                        this.$element.detach().appendTo(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this.options.appendTo));
                        this.$element.addClass('without-overlay');
                    }
                    this._events();
                    if (this.options.deepLink && window.location.hash === '#' + this.id) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).one('load.zf.reveal', this.open.bind(this));
                    }
                }
                /**
                 * Creates an overlay div to display behind the modal.
                 * @private
                 */
            }, {
                key: '_makeOverlay',
                value: function _makeOverlay() {
                    var additionalOverlayClasses = '';
                    if (this.options.additionalOverlayClasses) {
                        additionalOverlayClasses = ' ' + this.options.additionalOverlayClasses;
                    }
                    return __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<div></div>').addClass('reveal-overlay' + additionalOverlayClasses).appendTo(this.options.appendTo);
                }
                /**
                 * Updates position of modal
                 * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
                 * @private
                 */
            }, {
                key: '_updatePosition',
                value: function _updatePosition() {
                    var width = this.$element.outerWidth();
                    var outerWidth = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).width();
                    var height = this.$element.outerHeight();
                    var outerHeight = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).height();
                    var left, top;
                    if (this.options.hOffset === 'auto') {
                        left = parseInt((outerWidth - width) / 2, 10);
                    } else {
                        left = parseInt(this.options.hOffset, 10);
                    }
                    if (this.options.vOffset === 'auto') {
                        if (height > outerHeight) {
                            top = parseInt(Math.min(100, outerHeight / 10), 10);
                        } else {
                            top = parseInt((outerHeight - height) / 4, 10);
                        }
                    } else {
                        top = parseInt(this.options.vOffset, 10);
                    }
                    this.$element.css({
                        top: top + 'px'
                    }); // only worry about left if we don't have an overlay or we havea  horizontal offset,
                    // otherwise we're perfectly in the middle
                    if (!this.$overlay || this.options.hOffset !== 'auto') {
                        this.$element.css({
                            left: left + 'px'
                        });
                        this.$element.css({
                            margin: '0px'
                        });
                    }
                }
                /**
                 * Adds event handlers for the modal.
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this3 = this;
                    var _this = this;
                    this.$element.on({
                        'open.zf.trigger': this.open.bind(this),
                        'close.zf.trigger': function closeZfTrigger(event, $element) {
                            if (event.target === _this.$element[0] || __WEBPACK_IMPORTED_MODULE_0_jquery___default()(event.target).parents('[data-closable]')[0] === $element) { // only close reveal when it's explicitly called
                                return _this3.close.apply(_this3);
                            }
                        },
                        'toggle.zf.trigger': this.toggle.bind(this),
                        'resizeme.zf.trigger': function resizemeZfTrigger() {
                            _this._updatePosition();
                        }
                    });
                    if (this.options.closeOnClick && this.options.overlay) {
                        this.$overlay.off('.zf.reveal').on('click.zf.reveal', function(e) {
                            if (e.target === _this.$element[0] || __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.contains(_this.$element[0], e.target) || !__WEBPACK_IMPORTED_MODULE_0_jquery___default.a.contains(document, e.target)) {
                                return;
                            }
                            _this.close();
                        });
                    }
                    if (this.options.deepLink) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
                    }
                }
                /**
                 * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
                 * @private
                 */
            }, {
                key: '_handleState',
                value: function _handleState(e) {
                    if (window.location.hash === '#' + this.id && !this.isActive) {
                        this.open();
                    } else {
                        this.close();
                    }
                }
                /**
                 * Opens the modal controlled by `this.$anchor`, and closes all others by default.
                 * @function
                 * @fires Reveal#closeme
                 * @fires Reveal#open
                 */
            }, {
                key: 'open',
                value: function open() {
                    var _this4 = this; // either update or replace browser history
                    if (this.options.deepLink) {
                        var hash = '#' + this.id;
                        if (window.history.pushState) {
                            if (this.options.updateHistory) {
                                window.history.pushState({}, '', hash);
                            } else {
                                window.history.replaceState({}, '', hash);
                            }
                        } else {
                            window.location.hash = hash;
                        }
                    }
                    this.isActive = true; // Make elements invisible, but remove display: none so we can get size and positioning
                    this.$element.css({
                        'visibility': 'hidden'
                    }).show().scrollTop(0);
                    if (this.options.overlay) {
                        this.$overlay.css({
                            'visibility': 'hidden'
                        }).show();
                    }
                    this._updatePosition();
                    this.$element.hide().css({
                        'visibility': ''
                    });
                    if (this.$overlay) {
                        this.$overlay.css({
                            'visibility': ''
                        }).hide();
                        if (this.$element.hasClass('fast')) {
                            this.$overlay.addClass('fast');
                        } else if (this.$element.hasClass('slow')) {
                            this.$overlay.addClass('slow');
                        }
                    }
                    if (!this.options.multipleOpened) {
                        /**
                         * Fires immediately before the modal opens.
                         * Closes any other modals that are currently open
                         * @event Reveal#closeme
                         */
                        this.$element.trigger('closeme.zf.reveal', this.id);
                    }
                    var _this = this;

                    function addRevealOpenClasses() {
                        if (_this.isMobile) {
                            if (!_this.originalScrollPos) {
                                _this.originalScrollPos = window.pageYOffset;
                            }
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html, body').addClass('is-reveal-open');
                        } else {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').addClass('is-reveal-open');
                        }
                    } // Motion UI method of reveal
                    if (this.options.animationIn) {
                        var afterAnimation = function afterAnimation() {
                            _this.$element.attr({
                                'aria-hidden': false,
                                'tabindex': -1
                            }).focus();
                            addRevealOpenClasses();
                            __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].trapFocus(_this.$element);
                        };
                        if (this.options.overlay) {
                            __WEBPACK_IMPORTED_MODULE_3__foundation_util_motion__["Motion"].animateIn(this.$overlay, 'fade-in');
                        }
                        __WEBPACK_IMPORTED_MODULE_3__foundation_util_motion__["Motion"].animateIn(this.$element, this.options.animationIn, function() {
                            if (_this4.$element) { // protect against object having been removed
                                _this4.focusableElements = __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].findFocusable(_this4.$element);
                                afterAnimation();
                            }
                        });
                    } // jQuery method of reveal
                    else {
                        if (this.options.overlay) {
                            this.$overlay.show(0);
                        }
                        this.$element.show(this.options.showDelay);
                    } // handle accessibility
                    this.$element.attr({
                        'aria-hidden': false,
                        'tabindex': -1
                    }).focus();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].trapFocus(this.$element);
                    addRevealOpenClasses();
                    this._extraHandlers();
                    /**
                     * Fires when the modal has successfully opened.
                     * @event Reveal#open
                     */
                    this.$element.trigger('open.zf.reveal');
                }
                /**
                 * Adds extra event handlers for the body and window if necessary.
                 * @private
                 */
            }, {
                key: '_extraHandlers',
                value: function _extraHandlers() {
                    var _this = this;
                    if (!this.$element) {
                        return;
                    } // If we're in the middle of cleanup, don't freak out
                    this.focusableElements = __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].findFocusable(this.$element);
                    if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').on('click.zf.reveal', function(e) {
                            if (e.target === _this.$element[0] || __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.contains(_this.$element[0], e.target) || !__WEBPACK_IMPORTED_MODULE_0_jquery___default.a.contains(document, e.target)) {
                                return;
                            }
                            _this.close();
                        });
                    }
                    if (this.options.closeOnEsc) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('keydown.zf.reveal', function(e) {
                            __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'Reveal', {
                                close: function close() {
                                    if (_this.options.closeOnEsc) {
                                        _this.close();
                                    }
                                }
                            });
                        });
                    }
                }
                /**
                 * Closes the modal.
                 * @function
                 * @fires Reveal#closed
                 */
            }, {
                key: 'close',
                value: function close() {
                    if (!this.isActive || !this.$element.is(':visible')) {
                        return false;
                    }
                    var _this = this; // Motion UI method of hiding
                    if (this.options.animationOut) {
                        if (this.options.overlay) {
                            __WEBPACK_IMPORTED_MODULE_3__foundation_util_motion__["Motion"].animateOut(this.$overlay, 'fade-out');
                        }
                        __WEBPACK_IMPORTED_MODULE_3__foundation_util_motion__["Motion"].animateOut(this.$element, this.options.animationOut, finishUp);
                    } // jQuery method of hiding
                    else {
                        this.$element.hide(this.options.hideDelay);
                        if (this.options.overlay) {
                            this.$overlay.hide(0, finishUp);
                        } else {
                            finishUp();
                        }
                    } // Conditionals to remove extra event listeners added on open
                    if (this.options.closeOnEsc) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('keydown.zf.reveal');
                    }
                    if (!this.options.overlay && this.options.closeOnClick) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').off('click.zf.reveal');
                    }
                    this.$element.off('keydown.zf.reveal');

                    function finishUp() {
                        if (_this.isMobile) {
                            if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()('.reveal:visible').length === 0) {
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html, body').removeClass('is-reveal-open');
                            }
                            if (_this.originalScrollPos) {
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').scrollTop(_this.originalScrollPos);
                                _this.originalScrollPos = null;
                            }
                        } else {
                            if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()('.reveal:visible').length === 0) {
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body').removeClass('is-reveal-open');
                            }
                        }
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].releaseFocus(_this.$element);
                        _this.$element.attr('aria-hidden', true);
                        /**
                         * Fires when the modal is done closing.
                         * @event Reveal#closed
                         */
                        _this.$element.trigger('closed.zf.reveal');
                    }
                    /**
                     * Resets the modal content
                     * This prevents a running video to keep going in the background
                     */
                    if (this.options.resetOnClose) {
                        this.$element.html(this.$element.html());
                    }
                    this.isActive = false;
                    if (_this.options.deepLink) {
                        if (window.history.replaceState) {
                            window.history.replaceState('', document.title, window.location.href.replace('#' + this.id, ''));
                        } else {
                            window.location.hash = '';
                        }
                    }
                    this.$anchor.focus();
                }
                /**
                 * Toggles the open/closed state of a modal.
                 * @function
                 */
            }, {
                key: 'toggle',
                value: function toggle() {
                    if (this.isActive) {
                        this.close();
                    } else {
                        this.open();
                    }
                }
            }, {
                key: '_destroy',
                /**
                 * Destroys an instance of a modal.
                 * @function
                 */
                value: function _destroy() {
                    if (this.options.overlay) {
                        this.$element.appendTo(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this.options.appendTo)); // move $element outside of $overlay to prevent error unregisterPlugin()
                        this.$overlay.hide().off().remove();
                    }
                    this.$element.hide().off();
                    this.$anchor.off('.zf');
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('.zf.reveal:' + this.id);
                }
            }]);
            return Reveal;
        }(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__["Plugin"]);
        Reveal.defaults = {
            /**
             * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
             * @option
             * @type {string}
             * @default ''
             */
            animationIn: '',
            /**
             * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
             * @option
             * @type {string}
             * @default ''
             */
            animationOut: '',
            /**
             * Time, in ms, to delay the opening of a modal after a click if no animation used.
             * @option
             * @type {number}
             * @default 0
             */
            showDelay: 0,
            /**
             * Time, in ms, to delay the closing of a modal after a click if no animation used.
             * @option
             * @type {number}
             * @default 0
             */
            hideDelay: 0,
            /**
             * Allows a click on the body/overlay to close the modal.
             * @option
             * @type {boolean}
             * @default true
             */
            closeOnClick: true,
            /**
             * Allows the modal to close if the user presses the `ESCAPE` key.
             * @option
             * @type {boolean}
             * @default true
             */
            closeOnEsc: true,
            /**
             * If true, allows multiple modals to be displayed at once.
             * @option
             * @type {boolean}
             * @default false
             */
            multipleOpened: false,
            /**
             * Distance, in pixels, the modal should push down from the top of the screen.
             * @option
             * @type {number|string}
             * @default auto
             */
            vOffset: 'auto',
            /**
             * Distance, in pixels, the modal should push in from the side of the screen.
             * @option
             * @type {number|string}
             * @default auto
             */
            hOffset: 'auto',
            /**
             * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
             * @option
             * @type {boolean}
             * @default false
             */
            fullScreen: false,
            /**
             * Percentage of screen height the modal should push up from the bottom of the view.
             * @option
             * @type {number}
             * @default 10
             */
            btmOffsetPct: 10,
            /**
             * Allows the modal to generate an overlay div, which will cover the view when modal opens.
             * @option
             * @type {boolean}
             * @default true
             */
            overlay: true,
            /**
             * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
             * @option
             * @type {boolean}
             * @default false
             */
            resetOnClose: false,
            /**
             * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
             * @option
             * @type {boolean}
             * @default false
             */
            deepLink: false,
            /**
             * Update the browser history with the open modal
             * @option
             * @default false
             */
            updateHistory: false,
            /**
             * Allows the modal to append to custom div.
             * @option
             * @type {string}
             * @default "body"
             */
            appendTo: "body",
            /**
             * Allows adding additional class names to the reveal overlay.
             * @option
             * @type {string}
             * @default ''
             */
            additionalOverlayClasses: ''
        };

        function iPhoneSniff() {
            return /iP(ad|hone|od).*OS/.test(window.navigator.userAgent);
        }

        function androidSniff() {
            return /Android/.test(window.navigator.userAgent);
        }

        function mobileSniff() {
            return iPhoneSniff() || androidSniff();
        } /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    },
    /***/ 93: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(27); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 94); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 12: /***/ function _(module, exports) {
        module.exports = {
            Touch: window.Foundation.Touch
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 28: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_slider__ = __webpack_require__(58);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_slider__["a" /* Slider */ ], 'Slider'); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 58: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Slider;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_util_touch__ = __webpack_require__(12); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_5__foundation_util_touch___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__foundation_util_touch__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_6__foundation_util_triggers__ = __webpack_require__(7);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Slider module.
         * @module foundation.slider
         * @requires foundation.util.motion
         * @requires foundation.util.triggers
         * @requires foundation.util.keyboard
         * @requires foundation.util.touch
         */
        var Slider = function(_Plugin) {
            _inherits(Slider, _Plugin);

            function Slider() {
                _classCallCheck(this, Slider);
                return _possibleConstructorReturn(this, (Slider.__proto__ || Object.getPrototypeOf(Slider)).apply(this, arguments));
            }
            _createClass(Slider, [{
                key: '_setup',
                /**
                 * Creates a new instance of a slider control.
                 * @class
                 * @name Slider
                 * @param {jQuery} element - jQuery object to make into a slider control.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Slider.defaults, this.$element.data(), options);
                    this.className = 'Slider'; // ie9 back compat
                    // Touch and Triggers inits are idempotent, we just need to make sure it's initialied.
                    __WEBPACK_IMPORTED_MODULE_5__foundation_util_touch__["Touch"].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    __WEBPACK_IMPORTED_MODULE_6__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    this._init();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('Slider', {
                        'ltr': {
                            'ARROW_RIGHT': 'increase',
                            'ARROW_UP': 'increase',
                            'ARROW_DOWN': 'decrease',
                            'ARROW_LEFT': 'decrease',
                            'SHIFT_ARROW_RIGHT': 'increase_fast',
                            'SHIFT_ARROW_UP': 'increase_fast',
                            'SHIFT_ARROW_DOWN': 'decrease_fast',
                            'SHIFT_ARROW_LEFT': 'decrease_fast',
                            'HOME': 'min',
                            'END': 'max'
                        },
                        'rtl': {
                            'ARROW_LEFT': 'increase',
                            'ARROW_RIGHT': 'decrease',
                            'SHIFT_ARROW_LEFT': 'increase_fast',
                            'SHIFT_ARROW_RIGHT': 'decrease_fast'
                        }
                    });
                }
                /**
                 * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    this.inputs = this.$element.find('input');
                    this.handles = this.$element.find('[data-slider-handle]');
                    this.$handle = this.handles.eq(0);
                    this.$input = this.inputs.length ? this.inputs.eq(0) : __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + this.$handle.attr('aria-controls'));
                    this.$fill = this.$element.find('[data-slider-fill]').css(this.options.vertical ? 'height' : 'width', 0);
                    var isDbl = false,
                        _this = this;
                    if (this.options.disabled || this.$element.hasClass(this.options.disabledClass)) {
                        this.options.disabled = true;
                        this.$element.addClass(this.options.disabledClass);
                    }
                    if (!this.inputs.length) {
                        this.inputs = __WEBPACK_IMPORTED_MODULE_0_jquery___default()().add(this.$input);
                        this.options.binding = true;
                    }
                    this._setInitAttr(0);
                    if (this.handles[1]) {
                        this.options.doubleSided = true;
                        this.$handle2 = this.handles.eq(1);
                        this.$input2 = this.inputs.length > 1 ? this.inputs.eq(1) : __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + this.$handle2.attr('aria-controls'));
                        if (!this.inputs[1]) {
                            this.inputs = this.inputs.add(this.$input2);
                        }
                        isDbl = true; // this.$handle.triggerHandler('click.zf.slider');
                        this._setInitAttr(1);
                    } // Set handle positions
                    this.setHandles();
                    this._events();
                }
            }, {
                key: 'setHandles',
                value: function setHandles() {
                    var _this3 = this;
                    if (this.handles[1]) {
                        this._setHandlePos(this.$handle, this.inputs.eq(0).val(), true, function() {
                            _this3._setHandlePos(_this3.$handle2, _this3.inputs.eq(1).val(), true);
                        });
                    } else {
                        this._setHandlePos(this.$handle, this.inputs.eq(0).val(), true);
                    }
                }
            }, {
                key: '_reflow',
                value: function _reflow() {
                    this.setHandles();
                }
                /**
                 * @function
                 * @private
                 * @param {Number} value - floating point (the value) to be transformed using to a relative position on the slider (the inverse of _value)
                 */
            }, {
                key: '_pctOfBar',
                value: function _pctOfBar(value) {
                    var pctOfBar = percent(value - this.options.start, this.options.end - this.options.start);
                    switch (this.options.positionValueFunction) {
                        case "pow":
                            pctOfBar = this._logTransform(pctOfBar);
                            break;
                        case "log":
                            pctOfBar = this._powTransform(pctOfBar);
                            break;
                    }
                    return pctOfBar.toFixed(2);
                }
                /**
                 * @function
                 * @private
                 * @param {Number} pctOfBar - floating point, the relative position of the slider (typically between 0-1) to be transformed to a value
                 */
            }, {
                key: '_value',
                value: function _value(pctOfBar) {
                    switch (this.options.positionValueFunction) {
                        case "pow":
                            pctOfBar = this._powTransform(pctOfBar);
                            break;
                        case "log":
                            pctOfBar = this._logTransform(pctOfBar);
                            break;
                    }
                    var value = (this.options.end - this.options.start) * pctOfBar + this.options.start;
                    return value;
                }
                /**
                 * @function
                 * @private
                 * @param {Number} value - floating point (typically between 0-1) to be transformed using the log function
                 */
            }, {
                key: '_logTransform',
                value: function _logTransform(value) {
                    return baseLog(this.options.nonLinearBase, value * (this.options.nonLinearBase - 1) + 1);
                }
                /**
                 * @function
                 * @private
                 * @param {Number} value - floating point (typically between 0-1) to be transformed using the power function
                 */
            }, {
                key: '_powTransform',
                value: function _powTransform(value) {
                    return (Math.pow(this.options.nonLinearBase, value) - 1) / (this.options.nonLinearBase - 1);
                }
                /**
                 * Sets the position of the selected handle and fill bar.
                 * @function
                 * @private
                 * @param {jQuery} $hndl - the selected handle to move.
                 * @param {Number} location - floating point between the start and end values of the slider bar.
                 * @param {Function} cb - callback function to fire on completion.
                 * @fires Slider#moved
                 * @fires Slider#changed
                 */
            }, {
                key: '_setHandlePos',
                value: function _setHandlePos($hndl, location, noInvert, cb) { // don't move if the slider has been disabled since its initialization
                    if (this.$element.hasClass(this.options.disabledClass)) {
                        return;
                    } //might need to alter that slightly for bars that will have odd number selections.
                    location = parseFloat(location); //on input change events, convert string to number...grumble.
                    // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
                    if (location < this.options.start) {
                        location = this.options.start;
                    } else if (location > this.options.end) {
                        location = this.options.end;
                    }
                    var isDbl = this.options.doubleSided; //this is for single-handled vertical sliders, it adjusts the value to account for the slider being "upside-down"
                    //for click and drag events, it's weird due to the scale(-1, 1) css property
                    if (this.options.vertical && !noInvert) {
                        location = this.options.end - location;
                    }
                    if (isDbl) { //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
                        if (this.handles.index($hndl) === 0) {
                            var h2Val = parseFloat(this.$handle2.attr('aria-valuenow'));
                            location = location >= h2Val ? h2Val - this.options.step : location;
                        } else {
                            var h1Val = parseFloat(this.$handle.attr('aria-valuenow'));
                            location = location <= h1Val ? h1Val + this.options.step : location;
                        }
                    }
                    var _this = this,
                        vert = this.options.vertical,
                        hOrW = vert ? 'height' : 'width',
                        lOrT = vert ? 'top' : 'left',
                        handleDim = $hndl[0].getBoundingClientRect()[hOrW],
                        elemDim = this.$element[0].getBoundingClientRect()[hOrW], //percentage of bar min/max value based on click or drag point
                        pctOfBar = this._pctOfBar(location), //number of actual pixels to shift the handle, based on the percentage obtained above
                        pxToMove = (elemDim - handleDim) * pctOfBar, //percentage of bar to shift the handle
                        movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal); //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
                    location = parseFloat(location.toFixed(this.options.decimal)); // declare empty object for css adjustments, only used with 2 handled-sliders
                    var css = {};
                    this._setValues($hndl, location); // TODO update to calculate based on values set to respective inputs??
                    if (isDbl) {
                        var isLeftHndl = this.handles.index($hndl) === 0, //empty variable, will be used for min-height/width for fill bar
                            dim, //percentage w/h of the handle compared to the slider bar
                            handlePct = ~~(percent(handleDim, elemDim) * 100); //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
                        if (isLeftHndl) { //left or top percentage value to apply to the fill bar.
                            css[lOrT] = movement + '%'; //calculate the new min-height/width for the fill bar.
                            dim = parseFloat(this.$handle2[0].style[lOrT]) - movement + handlePct; //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
                            //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
                            if (cb && typeof cb === 'function') {
                                cb();
                            } //this is only needed for the initialization of 2 handled sliders
                        } else { //just caching the value of the left/bottom handle's left/top property
                            var handlePos = parseFloat(this.$handle[0].style[lOrT]); //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
                            //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
                            dim = movement - (isNaN(handlePos) ? (this.options.initialStart - this.options.start) / ((this.options.end - this.options.start) / 100) : handlePos) + handlePct;
                        } // assign the min-height/width to our css object
                        css['min-' + hOrW] = dim + '%';
                    }
                    this.$element.one('finished.zf.animate', function() {
                        /**
                         * Fires when the handle is done moving.
                         * @event Slider#moved
                         */
                        _this.$element.trigger('moved.zf.slider', [$hndl]);
                    }); //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
                    var moveTime = this.$element.data('dragging') ? 1000 / 60 : this.options.moveTime;
                    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_motion__["Move"])(moveTime, $hndl, function() { // adjusting the left/top property of the handle, based on the percentage calculated above
                        // if movement isNaN, that is because the slider is hidden and we cannot determine handle width,
                        // fall back to next best guess.
                        if (isNaN(movement)) {
                            $hndl.css(lOrT, pctOfBar * 100 + '%');
                        } else {
                            $hndl.css(lOrT, movement + '%');
                        }
                        if (!_this.options.doubleSided) { //if single-handled, a simple method to expand the fill bar
                            _this.$fill.css(hOrW, pctOfBar * 100 + '%');
                        } else { //otherwise, use the css object we created above
                            _this.$fill.css(css);
                        }
                    });
                    /**
                     * Fires when the value has not been change for a given time.
                     * @event Slider#changed
                     */
                    clearTimeout(_this.timeout);
                    _this.timeout = setTimeout(function() {
                        _this.$element.trigger('changed.zf.slider', [$hndl]);
                    }, _this.options.changedDelay);
                }
                /**
                 * Sets the initial attribute for the slider element.
                 * @function
                 * @private
                 * @param {Number} idx - index of the current handle/input to use.
                 */
            }, {
                key: '_setInitAttr',
                value: function _setInitAttr(idx) {
                    var initVal = idx === 0 ? this.options.initialStart : this.options.initialEnd;
                    var id = this.inputs.eq(idx).attr('id') || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["GetYoDigits"])(6, 'slider');
                    this.inputs.eq(idx).attr({
                        'id': id,
                        'max': this.options.end,
                        'min': this.options.start,
                        'step': this.options.step
                    });
                    this.inputs.eq(idx).val(initVal);
                    this.handles.eq(idx).attr({
                        'role': 'slider',
                        'aria-controls': id,
                        'aria-valuemax': this.options.end,
                        'aria-valuemin': this.options.start,
                        'aria-valuenow': initVal,
                        'aria-orientation': this.options.vertical ? 'vertical' : 'horizontal',
                        'tabindex': 0
                    });
                }
                /**
                 * Sets the input and `aria-valuenow` values for the slider element.
                 * @function
                 * @private
                 * @param {jQuery} $handle - the currently selected handle.
                 * @param {Number} val - floating point of the new value.
                 */
            }, {
                key: '_setValues',
                value: function _setValues($handle, val) {
                    var idx = this.options.doubleSided ? this.handles.index($handle) : 0;
                    this.inputs.eq(idx).val(val);
                    $handle.attr('aria-valuenow', val);
                }
                /**
                 * Handles events on the slider element.
                 * Calculates the new location of the current handle.
                 * If there are two handles and the bar was clicked, it determines which handle to move.
                 * @function
                 * @private
                 * @param {Object} e - the `event` object passed from the listener.
                 * @param {jQuery} $handle - the current handle to calculate for, if selected.
                 * @param {Number} val - floating point number for the new value of the slider.
                 * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
                 */
            }, {
                key: '_handleEvent',
                value: function _handleEvent(e, $handle, val) {
                    var value, hasVal;
                    if (!val) { //click or drag events
                        e.preventDefault();
                        var _this = this,
                            vertical = this.options.vertical,
                            param = vertical ? 'height' : 'width',
                            direction = vertical ? 'top' : 'left',
                            eventOffset = vertical ? e.pageY : e.pageX,
                            halfOfHandle = this.$handle[0].getBoundingClientRect()[param] / 2,
                            barDim = this.$element[0].getBoundingClientRect()[param],
                            windowScroll = vertical ? __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).scrollTop() : __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).scrollLeft();
                        var elemOffset = this.$element.offset()[direction]; // touch events emulated by the touch util give position relative to screen, add window.scroll to event coordinates...
                        // best way to guess this is simulated is if clientY == pageY
                        if (e.clientY === e.pageY) {
                            eventOffset = eventOffset + windowScroll;
                        }
                        var eventFromBar = eventOffset - elemOffset;
                        var barXY;
                        if (eventFromBar < 0) {
                            barXY = 0;
                        } else if (eventFromBar > barDim) {
                            barXY = barDim;
                        } else {
                            barXY = eventFromBar;
                        }
                        var offsetPct = percent(barXY, barDim);
                        value = this._value(offsetPct); // turn everything around for RTL, yay math!
                        if (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__foundation_util_core__["rtl"])() && !this.options.vertical) {
                            value = this.options.end - value;
                        }
                        value = _this._adjustValue(null, value); //boolean flag for the setHandlePos fn, specifically for vertical sliders
                        hasVal = false;
                        if (!$handle) { //figure out which handle it is, pass it to the next function.
                            var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
                                secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
                            $handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
                        }
                    } else { //change event on input
                        value = this._adjustValue(null, val);
                        hasVal = true;
                    }
                    this._setHandlePos($handle, value, hasVal);
                }
                /**
                 * Adjustes value for handle in regard to step value. returns adjusted value
                 * @function
                 * @private
                 * @param {jQuery} $handle - the selected handle.
                 * @param {Number} value - value to adjust. used if $handle is falsy
                 */
            }, {
                key: '_adjustValue',
                value: function _adjustValue($handle, value) {
                    var val, step = this.options.step,
                        div = parseFloat(step / 2),
                        left, prev_val, next_val;
                    if (!!$handle) {
                        val = parseFloat($handle.attr('aria-valuenow'));
                    } else {
                        val = value;
                    }
                    left = val % step;
                    prev_val = val - left;
                    next_val = prev_val + step;
                    if (left === 0) {
                        return val;
                    }
                    val = val >= prev_val + div ? next_val : prev_val;
                    return val;
                }
                /**
                 * Adds event listeners to the slider elements.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    this._eventsForHandle(this.$handle);
                    if (this.handles[1]) {
                        this._eventsForHandle(this.$handle2);
                    }
                }
                /**
                 * Adds event listeners a particular handle
                 * @function
                 * @private
                 * @param {jQuery} $handle - the current handle to apply listeners to.
                 */
            }, {
                key: '_eventsForHandle',
                value: function _eventsForHandle($handle) {
                    var _this = this,
                        curHandle, timer;
                    this.inputs.off('change.zf.slider').on('change.zf.slider', function(e) {
                        var idx = _this.inputs.index(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this));
                        _this._handleEvent(e, _this.handles.eq(idx), __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).val());
                    });
                    if (this.options.clickSelect) {
                        this.$element.off('click.zf.slider').on('click.zf.slider', function(e) {
                            if (_this.$element.data('dragging')) {
                                return false;
                            }
                            if (!__WEBPACK_IMPORTED_MODULE_0_jquery___default()(e.target).is('[data-slider-handle]')) {
                                if (_this.options.doubleSided) {
                                    _this._handleEvent(e);
                                } else {
                                    _this._handleEvent(e, _this.$handle);
                                }
                            }
                        });
                    }
                    if (this.options.draggable) {
                        this.handles.addTouch();
                        var $body = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('body');
                        $handle.off('mousedown.zf.slider').on('mousedown.zf.slider', function(e) {
                                $handle.addClass('is-dragging');
                                _this.$fill.addClass('is-dragging'); //
                                _this.$element.data('dragging', true);
                                curHandle = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(e.currentTarget);
                                $body.on('mousemove.zf.slider', function(e) {
                                    e.preventDefault();
                                    _this._handleEvent(e, curHandle);
                                }).on('mouseup.zf.slider', function(e) {
                                    _this._handleEvent(e, curHandle);
                                    $handle.removeClass('is-dragging');
                                    _this.$fill.removeClass('is-dragging');
                                    _this.$element.data('dragging', false);
                                    $body.off('mousemove.zf.slider mouseup.zf.slider');
                                });
                            }) // prevent events triggered by touch
                            .on('selectstart.zf.slider touchmove.zf.slider', function(e) {
                                e.preventDefault();
                            });
                    }
                    $handle.off('keydown.zf.slider').on('keydown.zf.slider', function(e) {
                        var _$handle = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            idx = _this.options.doubleSided ? _this.handles.index(_$handle) : 0,
                            oldValue = parseFloat(_this.inputs.eq(idx).val()),
                            newValue; // handle keyboard event with keyboard util
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'Slider', {
                            decrease: function decrease() {
                                newValue = oldValue - _this.options.step;
                            },
                            increase: function increase() {
                                newValue = oldValue + _this.options.step;
                            },
                            decrease_fast: function decrease_fast() {
                                newValue = oldValue - _this.options.step * 10;
                            },
                            increase_fast: function increase_fast() {
                                newValue = oldValue + _this.options.step * 10;
                            },
                            min: function min() {
                                newValue = _this.options.start;
                            },
                            max: function max() {
                                newValue = _this.options.end;
                            },
                            handled: function handled() { // only set handle pos when event was handled specially
                                e.preventDefault();
                                _this._setHandlePos(_$handle, newValue, true);
                            }
                        });
                        /*if (newValue) { // if pressed key has special function, update value
                                  e.preventDefault();
                                  _this._setHandlePos(_$handle, newValue);
                                }*/
                    });
                }
                /**
                 * Destroys the slider plugin.
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.handles.off('.zf.slider');
                    this.inputs.off('.zf.slider');
                    this.$element.off('.zf.slider');
                    clearTimeout(this.timeout);
                }
            }]);
            return Slider;
        }(__WEBPACK_IMPORTED_MODULE_4__foundation_plugin__["Plugin"]);
        Slider.defaults = {
            /**
             * Minimum value for the slider scale.
             * @option
             * @type {number}
             * @default 0
             */
            start: 0,
            /**
             * Maximum value for the slider scale.
             * @option
             * @type {number}
             * @default 100
             */
            end: 100,
            /**
             * Minimum value change per change event.
             * @option
             * @type {number}
             * @default 1
             */
            step: 1,
            /**
             * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
             * @option
             * @type {number}
             * @default 0
             */
            initialStart: 0,
            /**
             * Value at which the right handle/second input should be set to on initialization.
             * @option
             * @type {number}
             * @default 100
             */
            initialEnd: 100,
            /**
             * Allows the input to be located outside the container and visible. Set to by the JS
             * @option
             * @type {boolean}
             * @default false
             */
            binding: false,
            /**
             * Allows the user to click/tap on the slider bar to select a value.
             * @option
             * @type {boolean}
             * @default true
             */
            clickSelect: true,
            /**
             * Set to true and use the `vertical` class to change alignment to vertical.
             * @option
             * @type {boolean}
             * @default false
             */
            vertical: false,
            /**
             * Allows the user to drag the slider handle(s) to select a value.
             * @option
             * @type {boolean}
             * @default true
             */
            draggable: true,
            /**
             * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
             * @option
             * @type {boolean}
             * @default false
             */
            disabled: false,
            /**
             * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
             * @option
             * @type {boolean}
             * @default false
             */
            doubleSided: false,
            /**
             * Potential future feature.
             */ // steps: 100,
            /**
             * Number of decimal places the plugin should go to for floating point precision.
             * @option
             * @type {number}
             * @default 2
             */
            decimal: 2,
            /**
             * Time delay for dragged elements.
             */ // dragDelay: 0,
            /**
             * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
             * @option
             * @type {number}
             * @default 200
             */
            moveTime: 200, //update this if changing the transition time in the sass
            /**
             * Class applied to disabled sliders.
             * @option
             * @type {string}
             * @default 'disabled'
             */
            disabledClass: 'disabled',
            /**
             * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
             * @option
             * @type {boolean}
             * @default false
             */
            invertVertical: false,
            /**
             * Milliseconds before the `changed.zf-slider` event is triggered after value change.
             * @option
             * @type {number}
             * @default 500
             */
            changedDelay: 500,
            /**
             * Basevalue for non-linear sliders
             * @option
             * @type {number}
             * @default 5
             */
            nonLinearBase: 5,
            /**
             * Basevalue for non-linear sliders, possible values are: `'linear'`, `'pow'` & `'log'`. Pow and Log use the nonLinearBase setting.
             * @option
             * @type {string}
             * @default 'linear'
             */
            positionValueFunction: 'linear'
        };

        function percent(frac, num) {
            return frac / num;
        }

        function absPosition($handle, dir, clickPos, param) {
            return Math.abs($handle.position()[dir] + $handle[param]() / 2 - clickPos);
        }

        function baseLog(base, value) {
            return Math.log(value) / Math.log(base);
        } /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    },
    /***/ 94: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(28); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 95); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 29: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_smoothScroll__ = __webpack_require__(59);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_smoothScroll__["a" /* SmoothScroll */ ], 'SmoothScroll'); /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 59: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return SmoothScroll;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * SmoothScroll module.
         * @module foundation.smooth-scroll
         */
        var SmoothScroll = function(_Plugin) {
            _inherits(SmoothScroll, _Plugin);

            function SmoothScroll() {
                _classCallCheck(this, SmoothScroll);
                return _possibleConstructorReturn(this, (SmoothScroll.__proto__ || Object.getPrototypeOf(SmoothScroll)).apply(this, arguments));
            }
            _createClass(SmoothScroll, [{
                key: '_setup',
                /**
                 * Creates a new instance of SmoothScroll.
                 * @class
                 * @name SmoothScroll
                 * @fires SmoothScroll#init
                 * @param {Object} element - jQuery object to add the trigger to.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, SmoothScroll.defaults, this.$element.data(), options);
                    this.className = 'SmoothScroll'; // ie9 back compat
                    this._init();
                }
                /**
                 * Initialize the SmoothScroll plugin
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var id = this.$element[0].id || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__["GetYoDigits"])(6, 'smooth-scroll');
                    var _this = this;
                    this.$element.attr({
                        'id': id
                    });
                    this._events();
                }
                /**
                 * Initializes events for SmoothScroll.
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    var _this = this; // click handler function.
                    var handleLinkClick = function handleLinkClick(e) { // exit function if the event source isn't coming from an anchor with href attribute starts with '#'
                        if (!__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is('a[href^="#"]')) {
                            return false;
                        }
                        var arrival = this.getAttribute('href');
                        _this._inTransition = true;
                        SmoothScroll.scrollToLoc(arrival, _this.options, function() {
                            _this._inTransition = false;
                        });
                        e.preventDefault();
                    };
                    this.$element.on('click.zf.smoothScroll', handleLinkClick);
                    this.$element.on('click.zf.smoothScroll', 'a[href^="#"]', handleLinkClick);
                }
                /**
                 * Function to scroll to a given location on the page.
                 * @param {String} loc - A properly formatted jQuery id selector. Example: '#foo'
                 * @param {Object} options - The options to use.
                 * @param {Function} callback - The callback function.
                 * @static
                 * @function
                 */
            }], [{
                key: 'scrollToLoc',
                value: function scrollToLoc(loc) {
                    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SmoothScroll.defaults;
                    var callback = arguments[2]; // Do nothing if target does not exist to prevent errors
                    if (!__WEBPACK_IMPORTED_MODULE_0_jquery___default()(loc).length) {
                        return false;
                    }
                    var scrollPos = Math.round(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(loc).offset().top - options.threshold / 2 - options.offset);
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html, body').stop(true).animate({
                        scrollTop: scrollPos
                    }, options.animationDuration, options.animationEasing, function() {
                        if (callback && typeof callback == "function") {
                            callback();
                        }
                    });
                }
            }]);
            return SmoothScroll;
        }(__WEBPACK_IMPORTED_MODULE_2__foundation_plugin__["Plugin"]);
        /**
         * Default settings for plugin.
         */
        SmoothScroll.defaults = {
            /**
             * Amount of time, in ms, the animated scrolling should take between locations.
             * @option
             * @type {number}
             * @default 500
             */
            animationDuration: 500,
            /**
             * Animation style to use when scrolling between locations. Can be `'swing'` or `'linear'`.
             * @option
             * @type {string}
             * @default 'linear'
             * @see {@link https://api.jquery.com/animate|Jquery animate}
             */
            animationEasing: 'linear',
            /**
             * Number of pixels to use as a marker for location changes.
             * @option
             * @type {number}
             * @default 50
             */
            threshold: 50,
            /**
             * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
             * @option
             * @type {number}
             * @default 0
             */
            offset: 0
        }; /***/
    },
    /***/ 95: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(29); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 96); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 3: /***/ function _(module, exports) {
        module.exports = {
            rtl: window.Foundation.rtl,
            GetYoDigits: window.Foundation.GetYoDigits,
            transitionend: window.Foundation.transitionend
        }; /***/
    },
    /***/ 30: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_sticky__ = __webpack_require__(60);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_sticky__["a" /* Sticky */ ], 'Sticky'); /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 6: /***/ function _(module, exports) {
        module.exports = {
            MediaQuery: window.Foundation.MediaQuery
        }; /***/
    },
    /***/ 60: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Sticky;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core__ = __webpack_require__(3); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__ = __webpack_require__(6); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_4__foundation_util_triggers__ = __webpack_require__(7);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Sticky module.
         * @module foundation.sticky
         * @requires foundation.util.triggers
         * @requires foundation.util.mediaQuery
         */
        var Sticky = function(_Plugin) {
            _inherits(Sticky, _Plugin);

            function Sticky() {
                _classCallCheck(this, Sticky);
                return _possibleConstructorReturn(this, (Sticky.__proto__ || Object.getPrototypeOf(Sticky)).apply(this, arguments));
            }
            _createClass(Sticky, [{
                key: '_setup',
                /**
                 * Creates a new instance of a sticky thing.
                 * @class
                 * @name Sticky
                 * @param {jQuery} element - jQuery object to make sticky.
                 * @param {Object} options - options object passed when creating the element programmatically.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Sticky.defaults, this.$element.data(), options);
                    this.className = 'Sticky'; // ie9 back compat
                    // Triggers init is idempotent, just need to make sure it is initialized
                    __WEBPACK_IMPORTED_MODULE_4__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    this._init();
                }
                /**
                 * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"]._init();
                    var $parent = this.$element.parent('[data-sticky-container]'),
                        id = this.$element[0].id || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__foundation_util_core__["GetYoDigits"])(6, 'sticky'),
                        _this = this;
                    if ($parent.length) {
                        this.$container = $parent;
                    } else {
                        this.wasWrapped = true;
                        this.$element.wrap(this.options.container);
                        this.$container = this.$element.parent();
                    }
                    this.$container.addClass(this.options.containerClass);
                    this.$element.addClass(this.options.stickyClass).attr({
                        'data-resize': id,
                        'data-mutate': id
                    });
                    if (this.options.anchor !== '') {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + _this.options.anchor).attr({
                            'data-mutate': id
                        });
                    }
                    this.scrollCount = this.options.checkEvery;
                    this.isStuck = false;
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).one('load.zf.sticky', function() { //We calculate the container height to have correct values for anchor points offset calculation.
                        _this.containerHeight = _this.$element.css("display") == "none" ? 0 : _this.$element[0].getBoundingClientRect().height;
                        _this.$container.css('height', _this.containerHeight);
                        _this.elemHeight = _this.containerHeight;
                        if (_this.options.anchor !== '') {
                            _this.$anchor = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + _this.options.anchor);
                        } else {
                            _this._parsePoints();
                        }
                        _this._setSizes(function() {
                            var scroll = window.pageYOffset;
                            _this._calc(false, scroll); //Unstick the element will ensure that proper classes are set.
                            if (!_this.isStuck) {
                                _this._removeSticky(scroll >= _this.topPoint ? false : true);
                            }
                        });
                        _this._events(id.split('-').reverse().join('-'));
                    });
                }
                /**
                 * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
                 * @function
                 * @private
                 */
            }, {
                key: '_parsePoints',
                value: function _parsePoints() {
                    var top = this.options.topAnchor == "" ? 1 : this.options.topAnchor,
                        btm = this.options.btmAnchor == "" ? document.documentElement.scrollHeight : this.options.btmAnchor,
                        pts = [top, btm],
                        breaks = {};
                    for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
                        var pt;
                        if (typeof pts[i] === 'number') {
                            pt = pts[i];
                        } else {
                            var place = pts[i].split(':'),
                                anchor = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + place[0]);
                            pt = anchor.offset().top;
                            if (place[1] && place[1].toLowerCase() === 'bottom') {
                                pt += anchor[0].getBoundingClientRect().height;
                            }
                        }
                        breaks[i] = pt;
                    }
                    this.points = breaks;
                    return;
                }
                /**
                 * Adds event handlers for the scrolling element.
                 * @private
                 * @param {String} id - pseudo-random id for unique scroll event listener.
                 */
            }, {
                key: '_events',
                value: function _events(id) {
                    var _this = this,
                        scrollListener = this.scrollListener = 'scroll.zf.' + id;
                    if (this.isOn) {
                        return;
                    }
                    if (this.canStick) {
                        this.isOn = true;
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(scrollListener).on(scrollListener, function(e) {
                            if (_this.scrollCount === 0) {
                                _this.scrollCount = _this.options.checkEvery;
                                _this._setSizes(function() {
                                    _this._calc(false, window.pageYOffset);
                                });
                            } else {
                                _this.scrollCount--;
                                _this._calc(false, window.pageYOffset);
                            }
                        });
                    }
                    this.$element.off('resizeme.zf.trigger').on('resizeme.zf.trigger', function(e, el) {
                        _this._eventsHandler(id);
                    });
                    this.$element.on('mutateme.zf.trigger', function(e, el) {
                        _this._eventsHandler(id);
                    });
                    if (this.$anchor) {
                        this.$anchor.on('mutateme.zf.trigger', function(e, el) {
                            _this._eventsHandler(id);
                        });
                    }
                }
                /**
                 * Handler for events.
                 * @private
                 * @param {String} id - pseudo-random id for unique scroll event listener.
                 */
            }, {
                key: '_eventsHandler',
                value: function _eventsHandler(id) {
                    var _this = this,
                        scrollListener = this.scrollListener = 'scroll.zf.' + id;
                    _this._setSizes(function() {
                        _this._calc(false);
                        if (_this.canStick) {
                            if (!_this.isOn) {
                                _this._events(id);
                            }
                        } else if (_this.isOn) {
                            _this._pauseListeners(scrollListener);
                        }
                    });
                }
                /**
                 * Removes event handlers for scroll and change events on anchor.
                 * @fires Sticky#pause
                 * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
                 */
            }, {
                key: '_pauseListeners',
                value: function _pauseListeners(scrollListener) {
                    this.isOn = false;
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(scrollListener);
                    /**
                     * Fires when the plugin is paused due to resize event shrinking the view.
                     * @event Sticky#pause
                     * @private
                     */
                    this.$element.trigger('pause.zf.sticky');
                }
                /**
                 * Called on every `scroll` event and on `_init`
                 * fires functions based on booleans and cached values
                 * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
                 * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
                 */
            }, {
                key: '_calc',
                value: function _calc(checkSizes, scroll) {
                    if (checkSizes) {
                        this._setSizes();
                    }
                    if (!this.canStick) {
                        if (this.isStuck) {
                            this._removeSticky(true);
                        }
                        return false;
                    }
                    if (!scroll) {
                        scroll = window.pageYOffset;
                    }
                    if (scroll >= this.topPoint) {
                        if (scroll <= this.bottomPoint) {
                            if (!this.isStuck) {
                                this._setSticky();
                            }
                        } else {
                            if (this.isStuck) {
                                this._removeSticky(false);
                            }
                        }
                    } else {
                        if (this.isStuck) {
                            this._removeSticky(true);
                        }
                    }
                }
                /**
                 * Causes the $element to become stuck.
                 * Adds `position: fixed;`, and helper classes.
                 * @fires Sticky#stuckto
                 * @function
                 * @private
                 */
            }, {
                key: '_setSticky',
                value: function _setSticky() {
                    var _this = this,
                        stickTo = this.options.stickTo,
                        mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
                        notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
                        css = {};
                    css[mrgn] = this.options[mrgn] + 'em';
                    css[stickTo] = 0;
                    css[notStuckTo] = 'auto';
                    this.isStuck = true;
                    this.$element.removeClass('is-anchored is-at-' + notStuckTo).addClass('is-stuck is-at-' + stickTo).css(css)
                        /**
                         * Fires when the $element has become `position: fixed;`
                         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
                         * @event Sticky#stuckto
                         */
                        .trigger('sticky.zf.stuckto:' + stickTo);
                    this.$element.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
                        _this._setSizes();
                    });
                }
                /**
                 * Causes the $element to become unstuck.
                 * Removes `position: fixed;`, and helper classes.
                 * Adds other helper classes.
                 * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
                 * @fires Sticky#unstuckfrom
                 * @private
                 */
            }, {
                key: '_removeSticky',
                value: function _removeSticky(isTop) {
                    var stickTo = this.options.stickTo,
                        stickToTop = stickTo === 'top',
                        css = {},
                        anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
                        mrgn = stickToTop ? 'marginTop' : 'marginBottom',
                        notStuckTo = stickToTop ? 'bottom' : 'top',
                        topOrBottom = isTop ? 'top' : 'bottom';
                    css[mrgn] = 0;
                    css['bottom'] = 'auto';
                    if (isTop) {
                        css['top'] = 0;
                    } else {
                        css['top'] = anchorPt;
                    }
                    this.isStuck = false;
                    this.$element.removeClass('is-stuck is-at-' + stickTo).addClass('is-anchored is-at-' + topOrBottom).css(css)
                        /**
                         * Fires when the $element has become anchored.
                         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
                         * @event Sticky#unstuckfrom
                         */
                        .trigger('sticky.zf.unstuckfrom:' + topOrBottom);
                }
                /**
                 * Sets the $element and $container sizes for plugin.
                 * Calls `_setBreakPoints`.
                 * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
                 * @private
                 */
            }, {
                key: '_setSizes',
                value: function _setSizes(cb) {
                    this.canStick = __WEBPACK_IMPORTED_MODULE_2__foundation_util_mediaQuery__["MediaQuery"].is(this.options.stickyOn);
                    if (!this.canStick) {
                        if (cb && typeof cb === 'function') {
                            cb();
                        }
                    }
                    var _this = this,
                        newElemWidth = this.$container[0].getBoundingClientRect().width,
                        comp = window.getComputedStyle(this.$container[0]),
                        pdngl = parseInt(comp['padding-left'], 10),
                        pdngr = parseInt(comp['padding-right'], 10);
                    if (this.$anchor && this.$anchor.length) {
                        this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
                    } else {
                        this._parsePoints();
                    }
                    this.$element.css({
                        'max-width': newElemWidth - pdngl - pdngr + 'px'
                    });
                    var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
                    if (this.$element.css("display") == "none") {
                        newContainerHeight = 0;
                    }
                    this.containerHeight = newContainerHeight;
                    this.$container.css({
                        height: newContainerHeight
                    });
                    this.elemHeight = newContainerHeight;
                    if (!this.isStuck) {
                        if (this.$element.hasClass('is-at-bottom')) {
                            var anchorPt = (this.points ? this.points[1] - this.$container.offset().top : this.anchorHeight) - this.elemHeight;
                            this.$element.css('top', anchorPt);
                        }
                    }
                    this._setBreakPoints(newContainerHeight, function() {
                        if (cb && typeof cb === 'function') {
                            cb();
                        }
                    });
                }
                /**
                 * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
                 * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
                 * @param {Function} cb - optional callback function to be called on completion.
                 * @private
                 */
            }, {
                key: '_setBreakPoints',
                value: function _setBreakPoints(elemHeight, cb) {
                    if (!this.canStick) {
                        if (cb && typeof cb === 'function') {
                            cb();
                        } else {
                            return false;
                        }
                    }
                    var mTop = emCalc(this.options.marginTop),
                        mBtm = emCalc(this.options.marginBottom),
                        topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
                        bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight, // topPoint = this.$anchor.offset().top || this.points[0],
                        // bottomPoint = topPoint + this.anchorHeight || this.points[1],
                        winHeight = window.innerHeight;
                    if (this.options.stickTo === 'top') {
                        topPoint -= mTop;
                        bottomPoint -= elemHeight + mTop;
                    } else if (this.options.stickTo === 'bottom') {
                        topPoint -= winHeight - (elemHeight + mBtm);
                        bottomPoint -= winHeight - mBtm;
                    } else { //this would be the stickTo: both option... tricky
                    }
                    this.topPoint = topPoint;
                    this.bottomPoint = bottomPoint;
                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                }
                /**
                 * Destroys the current sticky element.
                 * Resets the element to the top position first.
                 * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this._removeSticky(true);
                    this.$element.removeClass(this.options.stickyClass + ' is-anchored is-at-top').css({
                        height: '',
                        top: '',
                        bottom: '',
                        'max-width': ''
                    }).off('resizeme.zf.trigger').off('mutateme.zf.trigger');
                    if (this.$anchor && this.$anchor.length) {
                        this.$anchor.off('change.zf.sticky');
                    }
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(this.scrollListener);
                    if (this.wasWrapped) {
                        this.$element.unwrap();
                    } else {
                        this.$container.removeClass(this.options.containerClass).css({
                            height: ''
                        });
                    }
                }
            }]);
            return Sticky;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["Plugin"]);
        Sticky.defaults = {
            /**
             * Customizable container template. Add your own classes for styling and sizing.
             * @option
             * @type {string}
             * @default '&lt;div data-sticky-container&gt;&lt;/div&gt;'
             */
            container: '<div data-sticky-container></div>',
            /**
             * Location in the view the element sticks to. Can be `'top'` or `'bottom'`.
             * @option
             * @type {string}
             * @default 'top'
             */
            stickTo: 'top',
            /**
             * If anchored to a single element, the id of that element.
             * @option
             * @type {string}
             * @default ''
             */
            anchor: '',
            /**
             * If using more than one element as anchor points, the id of the top anchor.
             * @option
             * @type {string}
             * @default ''
             */
            topAnchor: '',
            /**
             * If using more than one element as anchor points, the id of the bottom anchor.
             * @option
             * @type {string}
             * @default ''
             */
            btmAnchor: '',
            /**
             * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
             * @option
             * @type {number}
             * @default 1
             */
            marginTop: 1,
            /**
             * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
             * @option
             * @type {number}
             * @default 1
             */
            marginBottom: 1,
            /**
             * Breakpoint string that is the minimum screen size an element should become sticky.
             * @option
             * @type {string}
             * @default 'medium'
             */
            stickyOn: 'medium',
            /**
             * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
             * @option
             * @type {string}
             * @default 'sticky'
             */
            stickyClass: 'sticky',
            /**
             * Class applied to sticky container. Foundation defaults to `sticky-container`.
             * @option
             * @type {string}
             * @default 'sticky-container'
             */
            containerClass: 'sticky-container',
            /**
             * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
             * @option
             * @type {number}
             * @default -1
             */
            checkEvery: -1
        };
        /**
         * Helper function to calculate em values
         * @param Number {em} - number of em's to calculate into pixels
         */
        function emCalc(em) {
            return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
        } /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    },
    /***/ 96: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(30); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 97); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 10: /***/ function _(module, exports) {
        module.exports = {
            onImagesLoaded: window.Foundation.onImagesLoaded
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 31: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_tabs__ = __webpack_require__(61);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_tabs__["a" /* Tabs */ ], 'Tabs'); /***/
    },
    /***/ 5: /***/ function _(module, exports) {
        module.exports = {
            Keyboard: window.Foundation.Keyboard
        }; /***/
    },
    /***/ 61: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Tabs;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__ = __webpack_require__(5); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader__ = __webpack_require__(10); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Tabs module.
         * @module foundation.tabs
         * @requires foundation.util.keyboard
         * @requires foundation.util.imageLoader if tabs contain images
         */
        var Tabs = function(_Plugin) {
            _inherits(Tabs, _Plugin);

            function Tabs() {
                _classCallCheck(this, Tabs);
                return _possibleConstructorReturn(this, (Tabs.__proto__ || Object.getPrototypeOf(Tabs)).apply(this, arguments));
            }
            _createClass(Tabs, [{
                key: '_setup',
                /**
                 * Creates a new instance of tabs.
                 * @class
                 * @name Tabs
                 * @fires Tabs#init
                 * @param {jQuery} element - jQuery object to make into tabs.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Tabs.defaults, this.$element.data(), options);
                    this.className = 'Tabs'; // ie9 back compat
                    this._init();
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].register('Tabs', {
                        'ENTER': 'open',
                        'SPACE': 'open',
                        'ARROW_RIGHT': 'next',
                        'ARROW_UP': 'previous',
                        'ARROW_DOWN': 'next',
                        'ARROW_LEFT': 'previous' // 'TAB': 'next',
                        // 'SHIFT_TAB': 'previous'
                    });
                }
                /**
                 * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var _this3 = this;
                    var _this = this;
                    this.$element.attr({
                        'role': 'tablist'
                    });
                    this.$tabTitles = this.$element.find('.' + this.options.linkClass);
                    this.$tabContent = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-tabs-content="' + this.$element[0].id + '"]');
                    this.$tabTitles.each(function() {
                        var $elem = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            $link = $elem.find('a'),
                            isActive = $elem.hasClass('' + _this.options.linkActiveClass),
                            hash = $link.attr('data-tabs-target') || $link[0].hash.slice(1),
                            linkId = $link[0].id ? $link[0].id : hash + '-label',
                            $tabContent = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + hash);
                        $elem.attr({
                            'role': 'presentation'
                        });
                        $link.attr({
                            'role': 'tab',
                            'aria-controls': hash,
                            'aria-selected': isActive,
                            'id': linkId,
                            'tabindex': isActive ? '0' : '-1'
                        });
                        $tabContent.attr({
                            'role': 'tabpanel',
                            'aria-labelledby': linkId
                        });
                        if (!isActive) {
                            $tabContent.attr('aria-hidden', 'true');
                        }
                        if (isActive && _this.options.autoFocus) {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).load(function() {
                                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html, body').animate({
                                    scrollTop: $elem.offset().top
                                }, _this.options.deepLinkSmudgeDelay, function() {
                                    $link.focus();
                                });
                            });
                        }
                    });
                    if (this.options.matchHeight) {
                        var $images = this.$tabContent.find('img');
                        if ($images.length) {
                            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__foundation_util_imageLoader__["onImagesLoaded"])($images, this._setHeight.bind(this));
                        } else {
                            this._setHeight();
                        }
                    } //current context-bound function to open tabs on page load or history popstate
                    this._checkDeepLink = function() {
                        var anchor = window.location.hash; //need a hash and a relevant anchor in this tabset
                        if (anchor.length) {
                            var $link = _this3.$element.find('[href$="' + anchor + '"]');
                            if ($link.length) {
                                _this3.selectTab(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(anchor), true); //roll up a little to show the titles
                                if (_this3.options.deepLinkSmudge) {
                                    var offset = _this3.$element.offset();
                                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('html, body').animate({
                                        scrollTop: offset.top
                                    }, _this3.options.deepLinkSmudgeDelay);
                                }
                                /**
                                 * Fires when the zplugin has deeplinked at pageload
                                 * @event Tabs#deeplink
                                 */
                                _this3.$element.trigger('deeplink.zf.tabs', [$link, __WEBPACK_IMPORTED_MODULE_0_jquery___default()(anchor)]);
                            }
                        }
                    }; //use browser to open a tab, if it exists in this tabset
                    if (this.options.deepLink) {
                        this._checkDeepLink();
                    }
                    this._events();
                }
                /**
                 * Adds event handlers for items within the tabs.
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    this._addKeyHandler();
                    this._addClickHandler();
                    this._setHeightMqHandler = null;
                    if (this.options.matchHeight) {
                        this._setHeightMqHandler = this._setHeight.bind(this);
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('changed.zf.mediaquery', this._setHeightMqHandler);
                    }
                    if (this.options.deepLink) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).on('popstate', this._checkDeepLink);
                    }
                }
                /**
                 * Adds click handlers for items within the tabs.
                 * @private
                 */
            }, {
                key: '_addClickHandler',
                value: function _addClickHandler() {
                    var _this = this;
                    this.$element.off('click.zf.tabs').on('click.zf.tabs', '.' + this.options.linkClass, function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        _this._handleTabChange(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this));
                    });
                }
                /**
                 * Adds keyboard event handlers for items within the tabs.
                 * @private
                 */
            }, {
                key: '_addKeyHandler',
                value: function _addKeyHandler() {
                    var _this = this;
                    this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function(e) {
                        if (e.which === 9) return;
                        var $element = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            $elements = $element.parent('ul').children('li'),
                            $prevElement, $nextElement;
                        $elements.each(function(i) {
                            if (__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).is($element)) {
                                if (_this.options.wrapOnKeys) {
                                    $prevElement = i === 0 ? $elements.last() : $elements.eq(i - 1);
                                    $nextElement = i === $elements.length - 1 ? $elements.first() : $elements.eq(i + 1);
                                } else {
                                    $prevElement = $elements.eq(Math.max(0, i - 1));
                                    $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
                                }
                                return;
                            }
                        }); // handle keyboard event with keyboard util
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_keyboard__["Keyboard"].handleKey(e, 'Tabs', {
                            open: function open() {
                                $element.find('[role="tab"]').focus();
                                _this._handleTabChange($element);
                            },
                            previous: function previous() {
                                $prevElement.find('[role="tab"]').focus();
                                _this._handleTabChange($prevElement);
                            },
                            next: function next() {
                                $nextElement.find('[role="tab"]').focus();
                                _this._handleTabChange($nextElement);
                            },
                            handled: function handled() {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        });
                    });
                }
                /**
                 * Opens the tab `$targetContent` defined by `$target`. Collapses active tab.
                 * @param {jQuery} $target - Tab to open.
                 * @param {boolean} historyHandled - browser has already handled a history update
                 * @fires Tabs#change
                 * @function
                 */
            }, {
                key: '_handleTabChange',
                value: function _handleTabChange($target, historyHandled) {
                    /**
                     * Check for active class on target. Collapse if exists.
                     */
                    if ($target.hasClass('' + this.options.linkActiveClass)) {
                        if (this.options.activeCollapse) {
                            this._collapseTab($target);
                            /**
                             * Fires when the zplugin has successfully collapsed tabs.
                             * @event Tabs#collapse
                             */
                            this.$element.trigger('collapse.zf.tabs', [$target]);
                        }
                        return;
                    }
                    var $oldTab = this.$element.find('.' + this.options.linkClass + '.' + this.options.linkActiveClass),
                        $tabLink = $target.find('[role="tab"]'),
                        hash = $tabLink.attr('data-tabs-target') || $tabLink[0].hash.slice(1),
                        $targetContent = this.$tabContent.find('#' + hash); //close old tab
                    this._collapseTab($oldTab); //open new tab
                    this._openTab($target); //either replace or update browser history
                    if (this.options.deepLink && !historyHandled) {
                        var anchor = $target.find('a').attr('href');
                        if (this.options.updateHistory) {
                            history.pushState({}, '', anchor);
                        } else {
                            history.replaceState({}, '', anchor);
                        }
                    }
                    /**
                     * Fires when the plugin has successfully changed tabs.
                     * @event Tabs#change
                     */
                    this.$element.trigger('change.zf.tabs', [$target, $targetContent]); //fire to children a mutation event
                    $targetContent.find("[data-mutate]").trigger("mutateme.zf.trigger");
                }
                /**
                 * Opens the tab `$targetContent` defined by `$target`.
                 * @param {jQuery} $target - Tab to Open.
                 * @function
                 */
            }, {
                key: '_openTab',
                value: function _openTab($target) {
                    var $tabLink = $target.find('[role="tab"]'),
                        hash = $tabLink.attr('data-tabs-target') || $tabLink[0].hash.slice(1),
                        $targetContent = this.$tabContent.find('#' + hash);
                    $target.addClass('' + this.options.linkActiveClass);
                    $tabLink.attr({
                        'aria-selected': 'true',
                        'tabindex': '0'
                    });
                    $targetContent.addClass('' + this.options.panelActiveClass).removeAttr('aria-hidden');
                }
                /**
                 * Collapses `$targetContent` defined by `$target`.
                 * @param {jQuery} $target - Tab to Open.
                 * @function
                 */
            }, {
                key: '_collapseTab',
                value: function _collapseTab($target) {
                    var $target_anchor = $target.removeClass('' + this.options.linkActiveClass).find('[role="tab"]').attr({
                        'aria-selected': 'false',
                        'tabindex': -1
                    });
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + $target_anchor.attr('aria-controls')).removeClass('' + this.options.panelActiveClass).attr({
                        'aria-hidden': 'true'
                    });
                }
                /**
                 * Public method for selecting a content pane to display.
                 * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
                 * @param {boolean} historyHandled - browser has already handled a history update
                 * @function
                 */
            }, {
                key: 'selectTab',
                value: function selectTab(elem, historyHandled) {
                    var idStr;
                    if ((typeof elem === 'undefined' ? 'undefined' : _typeof(elem)) === 'object') {
                        idStr = elem[0].id;
                    } else {
                        idStr = elem;
                    }
                    if (idStr.indexOf('#') < 0) {
                        idStr = '#' + idStr;
                    }
                    var $target = this.$tabTitles.find('[href$="' + idStr + '"]').parent('.' + this.options.linkClass);
                    this._handleTabChange($target, historyHandled);
                }
            }, {
                key: '_setHeight',
                /**
                 * Sets the height of each panel to the height of the tallest panel.
                 * If enabled in options, gets called on media query change.
                 * If loading content via external source, can be called directly or with _reflow.
                 * If enabled with `data-match-height="true"`, tabs sets to equal height
                 * @function
                 * @private
                 */
                value: function _setHeight() {
                    var max = 0,
                        _this = this; // Lock down the `this` value for the root tabs object
                    this.$tabContent.find('.' + this.options.panelClass).css('height', '').each(function() {
                        var panel = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this),
                            isActive = panel.hasClass('' + _this.options.panelActiveClass); // get the options from the parent instead of trying to get them from the child
                        if (!isActive) {
                            panel.css({
                                'visibility': 'hidden',
                                'display': 'block'
                            });
                        }
                        var temp = this.getBoundingClientRect().height;
                        if (!isActive) {
                            panel.css({
                                'visibility': '',
                                'display': ''
                            });
                        }
                        max = temp > max ? temp : max;
                    }).css('height', max + 'px');
                }
                /**
                 * Destroys an instance of an tabs.
                 * @fires Tabs#destroyed
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$element.find('.' + this.options.linkClass).off('.zf.tabs').hide().end().find('.' + this.options.panelClass).hide();
                    if (this.options.matchHeight) {
                        if (this._setHeightMqHandler != null) {
                            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('changed.zf.mediaquery', this._setHeightMqHandler);
                        }
                    }
                    if (this.options.deepLink) {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off('popstate', this._checkDeepLink);
                    }
                }
            }]);
            return Tabs;
        }(__WEBPACK_IMPORTED_MODULE_3__foundation_plugin__["Plugin"]);
        Tabs.defaults = {
            /**
             * Allows the window to scroll to content of pane specified by hash anchor
             * @option
             * @type {boolean}
             * @default false
             */
            deepLink: false,
            /**
             * Adjust the deep link scroll to make sure the top of the tab panel is visible
             * @option
             * @type {boolean}
             * @default false
             */
            deepLinkSmudge: false,
            /**
             * Animation time (ms) for the deep link adjustment
             * @option
             * @type {number}
             * @default 300
             */
            deepLinkSmudgeDelay: 300,
            /**
             * Update the browser history with the open tab
             * @option
             * @type {boolean}
             * @default false
             */
            updateHistory: false,
            /**
             * Allows the window to scroll to content of active pane on load if set to true.
             * Not recommended if more than one tab panel per page.
             * @option
             * @type {boolean}
             * @default false
             */
            autoFocus: false,
            /**
             * Allows keyboard input to 'wrap' around the tab links.
             * @option
             * @type {boolean}
             * @default true
             */
            wrapOnKeys: true,
            /**
             * Allows the tab content panes to match heights if set to true.
             * @option
             * @type {boolean}
             * @default false
             */
            matchHeight: false,
            /**
             * Allows active tabs to collapse when clicked.
             * @option
             * @type {boolean}
             * @default false
             */
            activeCollapse: false,
            /**
             * Class applied to `li`'s in tab link list.
             * @option
             * @type {string}
             * @default 'tabs-title'
             */
            linkClass: 'tabs-title',
            /**
             * Class applied to the active `li` in tab link list.
             * @option
             * @type {string}
             * @default 'is-active'
             */
            linkActiveClass: 'is-active',
            /**
             * Class applied to the content containers.
             * @option
             * @type {string}
             * @default 'tabs-panel'
             */
            panelClass: 'tabs-panel',
            /**
             * Class applied to the active content container.
             * @option
             * @type {string}
             * @default 'is-active'
             */
            panelActiveClass: 'is-active'
        }; /***/
    },
    /***/ 97: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(31); /***/
    } /******/
});
'use strict';
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {}; /******/ /******/ // The require function
    /******/
    function __webpack_require__(moduleId) { /******/ /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId]) { /******/
            return installedModules[moduleId].exports; /******/
        } /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = { /******/
            i: moduleId,
            /******/ l: false,
            /******/ exports: {} /******/
        }; /******/ /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); /******/ /******/ // Flag the module as loaded
        /******/
        module.l = true; /******/ /******/ // Return the exports of the module
        /******/
        return module.exports; /******/
    } /******/ /******/ /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules; /******/ /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules; /******/ /******/ // identity function for calling harmony imports with the correct context
    /******/
    __webpack_require__.i = function(value) {
        return value;
    }; /******/ /******/ // define getter function for harmony exports
    /******/
    __webpack_require__.d = function(exports, name, getter) { /******/
        if (!__webpack_require__.o(exports, name)) { /******/
            Object.defineProperty(exports, name, { /******/
                configurable: false,
                /******/ enumerable: true,
                /******/ get: getter /******/
            }); /******/
        } /******/
    }; /******/ /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/
    __webpack_require__.n = function(module) { /******/
        var getter = module && module.__esModule ? /******/ function getDefault() {
            return module['default'];
        } : /******/ function getModuleExports() {
            return module;
        }; /******/
        __webpack_require__.d(getter, 'a', getter); /******/
        return getter; /******/
    }; /******/ /******/ // Object.prototype.hasOwnProperty.call
    /******/
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }; /******/ /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = ""; /******/ /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(__webpack_require__.s = 98); /******/
})( /************************************************************************/ /******/ { /***/
    0: /***/ function _(module, exports) {
        module.exports = jQuery; /***/
    },
    /***/ 1: /***/ function _(module, exports) {
        module.exports = {
            Foundation: window.Foundation
        }; /***/
    },
    /***/ 2: /***/ function _(module, exports) {
        module.exports = {
            Plugin: window.Foundation.Plugin
        }; /***/
    },
    /***/ 32: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core__ = __webpack_require__(1); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__foundation_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__foundation_core__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_toggler__ = __webpack_require__(62);
        __WEBPACK_IMPORTED_MODULE_0__foundation_core__["Foundation"].plugin(__WEBPACK_IMPORTED_MODULE_1__foundation_toggler__["a" /* Toggler */ ], 'Toggler'); /***/
    },
    /***/ 4: /***/ function _(module, exports) {
        module.exports = {
            Motion: window.Foundation.Motion,
            Move: window.Foundation.Move
        }; /***/
    },
    /***/ 62: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Toggler;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_plugin__ = __webpack_require__(2); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__foundation_plugin___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__foundation_plugin__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_3__foundation_util_triggers__ = __webpack_require__(7);
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        }();

        function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }

        function _possibleConstructorReturn(self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
        }

        function _inherits(subClass, superClass) {
            if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        }
        /**
         * Toggler module.
         * @module foundation.toggler
         * @requires foundation.util.motion
         * @requires foundation.util.triggers
         */
        var Toggler = function(_Plugin) {
            _inherits(Toggler, _Plugin);

            function Toggler() {
                _classCallCheck(this, Toggler);
                return _possibleConstructorReturn(this, (Toggler.__proto__ || Object.getPrototypeOf(Toggler)).apply(this, arguments));
            }
            _createClass(Toggler, [{
                key: '_setup',
                /**
                 * Creates a new instance of Toggler.
                 * @class
                 * @name Toggler
                 * @fires Toggler#init
                 * @param {Object} element - jQuery object to add the trigger to.
                 * @param {Object} options - Overrides to the default plugin settings.
                 */
                value: function _setup(element, options) {
                    this.$element = element;
                    this.options = __WEBPACK_IMPORTED_MODULE_0_jquery___default.a.extend({}, Toggler.defaults, element.data(), options);
                    this.className = '';
                    this.className = 'Toggler'; // ie9 back compat
                    // Triggers init is idempotent, just need to make sure it is initialized
                    __WEBPACK_IMPORTED_MODULE_3__foundation_util_triggers__["a" /* Triggers */ ].init(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
                    this._init();
                    this._events();
                }
                /**
                 * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
                 * @function
                 * @private
                 */
            }, {
                key: '_init',
                value: function _init() {
                    var input; // Parse animation classes if they were set
                    if (this.options.animate) {
                        input = this.options.animate.split(' ');
                        this.animationIn = input[0];
                        this.animationOut = input[1] || null;
                    } // Otherwise, parse toggle class
                    else {
                        input = this.$element.data('toggler'); // Allow for a . at the beginning of the string
                        this.className = input[0] === '.' ? input.slice(1) : input;
                    } // Add ARIA attributes to triggers
                    var id = this.$element[0].id;
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-controls', id); // If the target is hidden, add aria-hidden
                    this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
                }
                /**
                 * Initializes events for the toggle trigger.
                 * @function
                 * @private
                 */
            }, {
                key: '_events',
                value: function _events() {
                    this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
                }
                /**
                 * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
                 * @function
                 * @fires Toggler#on
                 * @fires Toggler#off
                 */
            }, {
                key: 'toggle',
                value: function toggle() {
                    this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
                }
            }, {
                key: '_toggleClass',
                value: function _toggleClass() {
                    this.$element.toggleClass(this.className);
                    var isOn = this.$element.hasClass(this.className);
                    if (isOn) {
                        /**
                         * Fires if the target element has the class after a toggle.
                         * @event Toggler#on
                         */
                        this.$element.trigger('on.zf.toggler');
                    } else {
                        /**
                         * Fires if the target element does not have the class after a toggle.
                         * @event Toggler#off
                         */
                        this.$element.trigger('off.zf.toggler');
                    }
                    this._updateARIA(isOn);
                    this.$element.find('[data-mutate]').trigger('mutateme.zf.trigger');
                }
            }, {
                key: '_toggleAnimate',
                value: function _toggleAnimate() {
                    var _this = this;
                    if (this.$element.is(':hidden')) {
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateIn(this.$element, this.animationIn, function() {
                            _this._updateARIA(true);
                            this.trigger('on.zf.toggler');
                            this.find('[data-mutate]').trigger('mutateme.zf.trigger');
                        });
                    } else {
                        __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(this.$element, this.animationOut, function() {
                            _this._updateARIA(false);
                            this.trigger('off.zf.toggler');
                            this.find('[data-mutate]').trigger('mutateme.zf.trigger');
                        });
                    }
                }
            }, {
                key: '_updateARIA',
                value: function _updateARIA(isOn) {
                    this.$element.attr('aria-expanded', isOn ? true : false);
                }
                /**
                 * Destroys the instance of Toggler on the element.
                 * @function
                 */
            }, {
                key: '_destroy',
                value: function _destroy() {
                    this.$element.off('.zf.toggler');
                }
            }]);
            return Toggler;
        }(__WEBPACK_IMPORTED_MODULE_2__foundation_plugin__["Plugin"]);
        Toggler.defaults = {
            /**
             * Tells the plugin if the element should animated when toggled.
             * @option
             * @type {boolean}
             * @default false
             */
            animate: false
        }; /***/
    },
    /***/ 7: /***/ function _(module, __webpack_exports__, __webpack_require__) {
        "use strict"; /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return Triggers;
        }); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__ = __webpack_require__(4); /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__);
        var MutationObserver = function() {
            var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] + 'MutationObserver' in window) {
                    return window[prefixes[i] + 'MutationObserver'];
                }
            }
            return false;
        }();
        var triggers = function triggers(el, type) {
            el.data(type).split(' ').forEach(function(id) {
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
            });
        };
        var Triggers = {
            Listeners: {
                Basic: {},
                Global: {}
            },
            Initializers: {}
        };
        Triggers.Listeners.Basic = {
            openListener: function openListener() {
                triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'open');
            },
            closeListener: function closeListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('close');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'close');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('close.zf.trigger');
                }
            },
            toggleListener: function toggleListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle');
                if (id) {
                    triggers(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), 'toggle');
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('toggle.zf.trigger');
                }
            },
            closeableListener: function closeableListener(e) {
                e.stopPropagation();
                var animation = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('closable');
                if (animation !== '') {
                    __WEBPACK_IMPORTED_MODULE_1__foundation_util_motion__["Motion"].animateOut(__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this), animation, function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).trigger('closed.zf');
                    });
                } else {
                    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).fadeOut().trigger('closed.zf');
                }
            },
            toggleFocusListener: function toggleFocusListener() {
                var id = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).data('toggle-focus');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()('#' + id).triggerHandler('toggle.zf.trigger', [__WEBPACK_IMPORTED_MODULE_0_jquery___default()(this)]);
            }
        }; // Elements with [data-open] will reveal a plugin that supports it when clicked.
        Triggers.Initializers.addOpenListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.openListener);
            $elem.on('click.zf.trigger', '[data-open]', Triggers.Listeners.Basic.openListener);
        }; // Elements with [data-close] will close a plugin that supports it when clicked.
        // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
        Triggers.Initializers.addCloseListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.closeListener);
            $elem.on('click.zf.trigger', '[data-close]', Triggers.Listeners.Basic.closeListener);
        }; // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
        Triggers.Initializers.addToggleListener = function($elem) {
            $elem.off('click.zf.trigger', Triggers.Listeners.Basic.toggleListener);
            $elem.on('click.zf.trigger', '[data-toggle]', Triggers.Listeners.Basic.toggleListener);
        }; // Elements with [data-closable] will respond to close.zf.trigger events.
        Triggers.Initializers.addCloseableListener = function($elem) {
            $elem.off('close.zf.trigger', Triggers.Listeners.Basic.closeableListener);
            $elem.on('close.zf.trigger', '[data-closeable], [data-closable]', Triggers.Listeners.Basic.closeableListener);
        }; // Elements with [data-toggle-focus] will respond to coming in and out of focus
        Triggers.Initializers.addToggleFocusListener = function($elem) {
            $elem.off('focus.zf.trigger blur.zf.trigger', Triggers.Listeners.Basic.toggleFocusListener);
            $elem.on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', Triggers.Listeners.Basic.toggleFocusListener);
        }; // More Global/complex listeners and triggers
        Triggers.Listeners.Global = {
            resizeListener: function resizeListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('resizeme.zf.trigger');
                    });
                } //trigger all listening elements and signal a resize event
                $nodes.attr('data-events', "resize");
            },
            scrollListener: function scrollListener($nodes) {
                if (!MutationObserver) { //fallback for IE 9
                    $nodes.each(function() {
                        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).triggerHandler('scrollme.zf.trigger');
                    });
                } //trigger all listening elements and signal a scroll event
                $nodes.attr('data-events', "scroll");
            },
            closeMeListener: function closeMeListener(e, pluginId) {
                var plugin = e.namespace.split('.')[0];
                var plugins = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');
                plugins.each(function() {
                    var _this = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this);
                    _this.triggerHandler('close.zf.trigger', [_this]);
                });
            } // Global, parses whole document.
        };
        Triggers.Initializers.addClosemeListener = function(pluginName) {
            var yetiBoxes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-yeti-box]'),
                plugNames = ['dropdown', 'tooltip', 'reveal'];
            if (pluginName) {
                if (typeof pluginName === 'string') {
                    plugNames.push(pluginName);
                } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
                    plugNames.concat(pluginName);
                } else {
                    console.error('Plugin names must be strings');
                }
            }
            if (yetiBoxes.length) {
                var listeners = plugNames.map(function(name) {
                    return 'closeme.zf.' + name;
                }).join(' ');
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(listeners).on(listeners, Triggers.Listeners.Global.closeMeListener);
            }
        };

        function debounceGlobalListener(debounce, trigger, listener) {
            var timer = void 0,
                args = Array.prototype.slice.call(arguments, 3);
            __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).off(trigger).on(trigger, function(e) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function() {
                    listener.apply(null, args);
                }, debounce || 10); //default time to emit scroll event
            });
        }
        Triggers.Initializers.addResizeListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-resize]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'resize.zf.trigger', Triggers.Listeners.Global.resizeListener, $nodes);
            }
        };
        Triggers.Initializers.addScrollListener = function(debounce) {
            var $nodes = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('[data-scroll]');
            if ($nodes.length) {
                debounceGlobalListener(debounce, 'scroll.zf.trigger', Triggers.Listeners.Global.scrollListener, $nodes);
            }
        };
        Triggers.Initializers.addMutationEventsListener = function($elem) {
            if (!MutationObserver) {
                return false;
            }
            var $nodes = $elem.find('[data-resize], [data-scroll], [data-mutate]'); //element callback
            var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
                var $target = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(mutationRecordsList[0].target); //trigger the event handler for the element depending on type
                switch (mutationRecordsList[0].type) {
                    case "attributes":
                        if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
                        }
                        if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
                            $target.triggerHandler('resizeme.zf.trigger', [$target]);
                        }
                        if (mutationRecordsList[0].attributeName === "style") {
                            $target.closest("[data-mutate]").attr("data-events", "mutate");
                            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        }
                        break;
                    case "childList":
                        $target.closest("[data-mutate]").attr("data-events", "mutate");
                        $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
                        break;
                    default:
                        return false; //nothing
                }
            };
            if ($nodes.length) { //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
                for (var i = 0; i <= $nodes.length - 1; i++) {
                    var elementObserver = new MutationObserver(listeningElementsMutation);
                    elementObserver.observe($nodes[i], {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true,
                        attributeFilter: ["data-events", "style"]
                    });
                }
            }
        };
        Triggers.Initializers.addSimpleListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addOpenListener($document);
            Triggers.Initializers.addCloseListener($document);
            Triggers.Initializers.addToggleListener($document);
            Triggers.Initializers.addCloseableListener($document);
            Triggers.Initializers.addToggleFocusListener($document);
        };
        Triggers.Initializers.addGlobalListeners = function() {
            var $document = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(document);
            Triggers.Initializers.addMutationEventsListener($document);
            Triggers.Initializers.addResizeListener();
            Triggers.Initializers.addScrollListener();
            Triggers.Initializers.addClosemeListener();
        };
        Triggers.init = function($, Foundation) {
            if (typeof $.triggersInitialized === 'undefined') {
                var $document = $(document);
                if (document.readyState === "complete") {
                    Triggers.Initializers.addSimpleListeners();
                    Triggers.Initializers.addGlobalListeners();
                } else {
                    $(window).on('load', function() {
                        Triggers.Initializers.addSimpleListeners();
                        Triggers.Initializers.addGlobalListeners();
                    });
                }
                $.triggersInitialized = true;
            }
            if (Foundation) {
                Foundation.Triggers = Triggers; // Legacy included to be backwards compatible for now.
                Foundation.IHearYou = Triggers.Initializers.addGlobalListeners;
            }
        }; /***/
    },
    /***/ 98: /***/ function _(module, exports, __webpack_require__) {
        module.exports = __webpack_require__(32); /***/
    } /******/
});
"use strict";
jQuery(document).foundation();
"use strict";
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
/*!
 * jQuery Cycle2; version: 2.1.6 build: 20141007
 * http://jquery.malsup.com/cycle2/
 * Copyright (c) 2014 M. Alsup; Dual licensed: MIT/GPL
 */
! function(a) {
    "use strict";

    function b(a) {
        return (a || "").toLowerCase();
    }
    var c = "2.1.6";
    a.fn.cycle = function(c) {
        var d;
        return 0 !== this.length || a.isReady ? this.each(function() {
            var d, e, f, g, h = a(this),
                i = a.fn.cycle.log;
            if (!h.data("cycle.opts")) {
                (h.data("cycle-log") === !1 || c && c.log === !1 || e && e.log === !1) && (i = a.noop), i("--c2 init--"), d = h.data();
                for (var j in d) {
                    d.hasOwnProperty(j) && /^cycle[A-Z]+/.test(j) && (g = d[j], f = j.match(/^cycle(.*)/)[1].replace(/^[A-Z]/, b), i(f + ":", g, "(" + (typeof g === "undefined" ? "undefined" : _typeof(g)) + ")"), d[f] = g);
                }
                e = a.extend({}, a.fn.cycle.defaults, d, c || {}), e.timeoutId = 0, e.paused = e.paused || !1, e.container = h, e._maxZ = e.maxZ, e.API = a.extend({
                    _container: h
                }, a.fn.cycle.API), e.API.log = i, e.API.trigger = function(a, b) {
                    return e.container.trigger(a, b), e.API;
                }, h.data("cycle.opts", e), h.data("cycle.API", e.API), e.API.trigger("cycle-bootstrap", [e, e.API]), e.API.addInitialSlides(), e.API.preInitSlideshow(), e.slides.length && e.API.initSlideshow();
            }
        }) : (d = {
            s: this.selector,
            c: this.context
        }, a.fn.cycle.log("requeuing slideshow (dom not ready)"), a(function() {
            a(d.s, d.c).cycle(c);
        }), this);
    }, a.fn.cycle.API = {
        opts: function opts() {
            return this._container.data("cycle.opts");
        },
        addInitialSlides: function addInitialSlides() {
            var b = this.opts(),
                c = b.slides;
            b.slideCount = 0, b.slides = a(), c = c.jquery ? c : b.container.find(c), b.random && c.sort(function() {
                return Math.random() - .5;
            }), b.API.add(c);
        },
        preInitSlideshow: function preInitSlideshow() {
            var b = this.opts();
            b.API.trigger("cycle-pre-initialize", [b]);
            var c = a.fn.cycle.transitions[b.fx];
            c && a.isFunction(c.preInit) && c.preInit(b), b._preInitialized = !0;
        },
        postInitSlideshow: function postInitSlideshow() {
            var b = this.opts();
            b.API.trigger("cycle-post-initialize", [b]);
            var c = a.fn.cycle.transitions[b.fx];
            c && a.isFunction(c.postInit) && c.postInit(b);
        },
        initSlideshow: function initSlideshow() {
            var b, c = this.opts(),
                d = c.container;
            c.API.calcFirstSlide(), "static" == c.container.css("position") && c.container.css("position", "relative"), a(c.slides[c.currSlide]).css({
                opacity: 1,
                display: "block",
                visibility: "visible"
            }), c.API.stackSlides(c.slides[c.currSlide], c.slides[c.nextSlide], !c.reverse), c.pauseOnHover && (c.pauseOnHover !== !0 && (d = a(c.pauseOnHover)), d.hover(function() {
                c.API.pause(!0);
            }, function() {
                c.API.resume(!0);
            })), c.timeout && (b = c.API.getSlideOpts(c.currSlide), c.API.queueTransition(b, b.timeout + c.delay)), c._initialized = !0, c.API.updateView(!0), c.API.trigger("cycle-initialized", [c]), c.API.postInitSlideshow();
        },
        pause: function pause(b) {
            var c = this.opts(),
                d = c.API.getSlideOpts(),
                e = c.hoverPaused || c.paused;
            b ? c.hoverPaused = !0 : c.paused = !0, e || (c.container.addClass("cycle-paused"), c.API.trigger("cycle-paused", [c]).log("cycle-paused"), d.timeout && (clearTimeout(c.timeoutId), c.timeoutId = 0, c._remainingTimeout -= a.now() - c._lastQueue, (c._remainingTimeout < 0 || isNaN(c._remainingTimeout)) && (c._remainingTimeout = void 0)));
        },
        resume: function resume(a) {
            var b = this.opts(),
                c = !b.hoverPaused && !b.paused;
            a ? b.hoverPaused = !1 : b.paused = !1, c || (b.container.removeClass("cycle-paused"), 0 === b.slides.filter(":animated").length && b.API.queueTransition(b.API.getSlideOpts(), b._remainingTimeout), b.API.trigger("cycle-resumed", [b, b._remainingTimeout]).log("cycle-resumed"));
        },
        add: function add(b, c) {
            var d, e = this.opts(),
                f = e.slideCount,
                g = !1;
            "string" == a.type(b) && (b = a.trim(b)), a(b).each(function() {
                var b, d = a(this);
                c ? e.container.prepend(d) : e.container.append(d), e.slideCount++, b = e.API.buildSlideOpts(d), e.slides = c ? a(d).add(e.slides) : e.slides.add(d), e.API.initSlide(b, d, --e._maxZ), d.data("cycle.opts", b), e.API.trigger("cycle-slide-added", [e, b, d]);
            }), e.API.updateView(!0), g = e._preInitialized && 2 > f && e.slideCount >= 1, g && (e._initialized ? e.timeout && (d = e.slides.length, e.nextSlide = e.reverse ? d - 1 : 1, e.timeoutId || e.API.queueTransition(e)) : e.API.initSlideshow());
        },
        calcFirstSlide: function calcFirstSlide() {
            var a, b = this.opts();
            a = parseInt(b.startingSlide || 0, 10), (a >= b.slides.length || 0 > a) && (a = 0), b.currSlide = a, b.reverse ? (b.nextSlide = a - 1, b.nextSlide < 0 && (b.nextSlide = b.slides.length - 1)) : (b.nextSlide = a + 1, b.nextSlide == b.slides.length && (b.nextSlide = 0));
        },
        calcNextSlide: function calcNextSlide() {
            var a, b = this.opts();
            b.reverse ? (a = b.nextSlide - 1 < 0, b.nextSlide = a ? b.slideCount - 1 : b.nextSlide - 1, b.currSlide = a ? 0 : b.nextSlide + 1) : (a = b.nextSlide + 1 == b.slides.length, b.nextSlide = a ? 0 : b.nextSlide + 1, b.currSlide = a ? b.slides.length - 1 : b.nextSlide - 1);
        },
        calcTx: function calcTx(b, c) {
            var d, e = b;
            return e._tempFx ? d = a.fn.cycle.transitions[e._tempFx] : c && e.manualFx && (d = a.fn.cycle.transitions[e.manualFx]), d || (d = a.fn.cycle.transitions[e.fx]), e._tempFx = null, this.opts()._tempFx = null, d || (d = a.fn.cycle.transitions.fade, e.API.log('Transition "' + e.fx + '" not found.  Using fade.')), d;
        },
        prepareTx: function prepareTx(a, b) {
            var c, d, e, f, g, h = this.opts();
            return h.slideCount < 2 ? void(h.timeoutId = 0) : (!a || h.busy && !h.manualTrump || (h.API.stopTransition(), h.busy = !1, clearTimeout(h.timeoutId), h.timeoutId = 0), void(h.busy || (0 !== h.timeoutId || a) && (d = h.slides[h.currSlide], e = h.slides[h.nextSlide], f = h.API.getSlideOpts(h.nextSlide), g = h.API.calcTx(f, a), h._tx = g, a && void 0 !== f.manualSpeed && (f.speed = f.manualSpeed), h.nextSlide != h.currSlide && (a || !h.paused && !h.hoverPaused && h.timeout) ? (h.API.trigger("cycle-before", [f, d, e, b]), g.before && g.before(f, d, e, b), c = function c() {
                h.busy = !1, h.container.data("cycle.opts") && (g.after && g.after(f, d, e, b), h.API.trigger("cycle-after", [f, d, e, b]), h.API.queueTransition(f), h.API.updateView(!0));
            }, h.busy = !0, g.transition ? g.transition(f, d, e, b, c) : h.API.doTransition(f, d, e, b, c), h.API.calcNextSlide(), h.API.updateView()) : h.API.queueTransition(f))));
        },
        doTransition: function doTransition(b, c, d, e, f) {
            var g = b,
                h = a(c),
                i = a(d),
                j = function j() {
                    i.animate(g.animIn || {
                        opacity: 1
                    }, g.speed, g.easeIn || g.easing, f);
                };
            i.css(g.cssBefore || {}), h.animate(g.animOut || {}, g.speed, g.easeOut || g.easing, function() {
                h.css(g.cssAfter || {}), g.sync || j();
            }), g.sync && j();
        },
        queueTransition: function queueTransition(b, c) {
            var d = this.opts(),
                e = void 0 !== c ? c : b.timeout;
            return 0 === d.nextSlide && 0 === --d.loop ? (d.API.log("terminating; loop=0"), d.timeout = 0, e ? setTimeout(function() {
                d.API.trigger("cycle-finished", [d]);
            }, e) : d.API.trigger("cycle-finished", [d]), void(d.nextSlide = d.currSlide)) : void 0 !== d.continueAuto && (d.continueAuto === !1 || a.isFunction(d.continueAuto) && d.continueAuto() === !1) ? (d.API.log("terminating automatic transitions"), d.timeout = 0, void(d.timeoutId && clearTimeout(d.timeoutId))) : void(e && (d._lastQueue = a.now(), void 0 === c && (d._remainingTimeout = b.timeout), d.paused || d.hoverPaused || (d.timeoutId = setTimeout(function() {
                d.API.prepareTx(!1, !d.reverse);
            }, e))));
        },
        stopTransition: function stopTransition() {
            var a = this.opts();
            a.slides.filter(":animated").length && (a.slides.stop(!1, !0), a.API.trigger("cycle-transition-stopped", [a])), a._tx && a._tx.stopTransition && a._tx.stopTransition(a);
        },
        advanceSlide: function advanceSlide(a) {
            var b = this.opts();
            return clearTimeout(b.timeoutId), b.timeoutId = 0, b.nextSlide = b.currSlide + a, b.nextSlide < 0 ? b.nextSlide = b.slides.length - 1 : b.nextSlide >= b.slides.length && (b.nextSlide = 0), b.API.prepareTx(!0, a >= 0), !1;
        },
        buildSlideOpts: function buildSlideOpts(c) {
            var d, e, f = this.opts(),
                g = c.data() || {};
            for (var h in g) {
                g.hasOwnProperty(h) && /^cycle[A-Z]+/.test(h) && (d = g[h], e = h.match(/^cycle(.*)/)[1].replace(/^[A-Z]/, b), f.API.log("[" + (f.slideCount - 1) + "]", e + ":", d, "(" + (typeof d === "undefined" ? "undefined" : _typeof(d)) + ")"), g[e] = d);
            }
            g = a.extend({}, a.fn.cycle.defaults, f, g), g.slideNum = f.slideCount;
            try {
                delete g.API, delete g.slideCount, delete g.currSlide, delete g.nextSlide, delete g.slides;
            } catch (i) {}
            return g;
        },
        getSlideOpts: function getSlideOpts(b) {
            var c = this.opts();
            void 0 === b && (b = c.currSlide);
            var d = c.slides[b],
                e = a(d).data("cycle.opts");
            return a.extend({}, c, e);
        },
        initSlide: function initSlide(b, c, d) {
            var e = this.opts();
            c.css(b.slideCss || {}), d > 0 && c.css("zIndex", d), isNaN(b.speed) && (b.speed = a.fx.speeds[b.speed] || a.fx.speeds._default), b.sync || (b.speed = b.speed / 2), c.addClass(e.slideClass);
        },
        updateView: function updateView(a, b) {
            var c = this.opts();
            if (c._initialized) {
                var d = c.API.getSlideOpts(),
                    e = c.slides[c.currSlide];
                !a && b !== !0 && (c.API.trigger("cycle-update-view-before", [c, d, e]), c.updateView < 0) || (c.slideActiveClass && c.slides.removeClass(c.slideActiveClass).eq(c.currSlide).addClass(c.slideActiveClass), a && c.hideNonActive && c.slides.filter(":not(." + c.slideActiveClass + ")").css("visibility", "hidden"), 0 === c.updateView && setTimeout(function() {
                    c.API.trigger("cycle-update-view", [c, d, e, a]);
                }, d.speed / (c.sync ? 2 : 1)), 0 !== c.updateView && c.API.trigger("cycle-update-view", [c, d, e, a]), a && c.API.trigger("cycle-update-view-after", [c, d, e]));
            }
        },
        getComponent: function getComponent(b) {
            var c = this.opts(),
                d = c[b];
            return "string" == typeof d ? /^\s*[\>|\+|~]/.test(d) ? c.container.find(d) : a(d) : d.jquery ? d : a(d);
        },
        stackSlides: function stackSlides(b, c, d) {
            var e = this.opts();
            b || (b = e.slides[e.currSlide], c = e.slides[e.nextSlide], d = !e.reverse), a(b).css("zIndex", e.maxZ);
            var f, g = e.maxZ - 2,
                h = e.slideCount;
            if (d) {
                for (f = e.currSlide + 1; h > f; f++) {
                    a(e.slides[f]).css("zIndex", g--);
                }
                for (f = 0; f < e.currSlide; f++) {
                    a(e.slides[f]).css("zIndex", g--);
                }
            } else {
                for (f = e.currSlide - 1; f >= 0; f--) {
                    a(e.slides[f]).css("zIndex", g--);
                }
                for (f = h - 1; f > e.currSlide; f--) {
                    a(e.slides[f]).css("zIndex", g--);
                }
            }
            a(c).css("zIndex", e.maxZ - 1);
        },
        getSlideIndex: function getSlideIndex(a) {
            return this.opts().slides.index(a);
        }
    }, a.fn.cycle.log = function() {
        window.console && console.log && console.log("[cycle2] " + Array.prototype.join.call(arguments, " "));
    }, a.fn.cycle.version = function() {
        return "Cycle2: " + c;
    }, a.fn.cycle.transitions = {
        custom: {},
        none: {
            before: function before(a, b, c, d) {
                a.API.stackSlides(c, b, d), a.cssBefore = {
                    opacity: 1,
                    visibility: "visible",
                    display: "block"
                };
            }
        },
        fade: {
            before: function before(b, c, d, e) {
                var f = b.API.getSlideOpts(b.nextSlide).slideCss || {};
                b.API.stackSlides(c, d, e), b.cssBefore = a.extend(f, {
                    opacity: 0,
                    visibility: "visible",
                    display: "block"
                }), b.animIn = {
                    opacity: 1
                }, b.animOut = {
                    opacity: 0
                };
            }
        },
        fadeout: {
            before: function before(b, c, d, e) {
                var f = b.API.getSlideOpts(b.nextSlide).slideCss || {};
                b.API.stackSlides(c, d, e), b.cssBefore = a.extend(f, {
                    opacity: 1,
                    visibility: "visible",
                    display: "block"
                }), b.animOut = {
                    opacity: 0
                };
            }
        },
        scrollHorz: {
            before: function before(a, b, c, d) {
                a.API.stackSlides(b, c, d);
                var e = a.container.css("overflow", "hidden").width();
                a.cssBefore = {
                    left: d ? e : -e,
                    top: 0,
                    opacity: 1,
                    visibility: "visible",
                    display: "block"
                }, a.cssAfter = {
                    zIndex: a._maxZ - 2,
                    left: 0
                }, a.animIn = {
                    left: 0
                }, a.animOut = {
                    left: d ? -e : e
                };
            }
        }
    }, a.fn.cycle.defaults = {
        allowWrap: !0,
        autoSelector: ".cycle-slideshow[data-cycle-auto-init!=false]",
        delay: 0,
        easing: null,
        fx: "fade",
        hideNonActive: !0,
        loop: 0,
        manualFx: void 0,
        manualSpeed: void 0,
        manualTrump: !0,
        maxZ: 100,
        pauseOnHover: !1,
        reverse: !1,
        slideActiveClass: "cycle-slide-active",
        slideClass: "cycle-slide",
        slideCss: {
            position: "absolute",
            top: 0,
            left: 0
        },
        slides: "> img",
        speed: 500,
        startingSlide: 0,
        sync: !0,
        timeout: 4e3,
        updateView: 0
    }, a(document).ready(function() {
        a(a.fn.cycle.defaults.autoSelector).cycle();
    });
}(jQuery), /*! Cycle2 autoheight plugin; Copyright (c) M.Alsup, 2012; version: 20130913 */
function(a) {
    "use strict";

    function b(b, d) {
        var e, f, g, h = d.autoHeight;
        if ("container" == h) f = a(d.slides[d.currSlide]).outerHeight(), d.container.height(f);
        else if (d._autoHeightRatio) d.container.height(d.container.width() / d._autoHeightRatio);
        else if ("calc" === h || "number" == a.type(h) && h >= 0) {
            if (g = "calc" === h ? c(b, d) : h >= d.slides.length ? 0 : h, g == d._sentinelIndex) return;
            d._sentinelIndex = g, d._sentinel && d._sentinel.remove(), e = a(d.slides[g].cloneNode(!0)), e.removeAttr("id name rel").find("[id],[name],[rel]").removeAttr("id name rel"), e.css({
                position: "static",
                visibility: "hidden",
                display: "block"
            }).prependTo(d.container).addClass("cycle-sentinel cycle-slide").removeClass("cycle-slide-active"), e.find("*").css("visibility", "hidden"), d._sentinel = e;
        }
    }

    function c(b, c) {
        var d = 0,
            e = -1;
        return c.slides.each(function(b) {
            var c = a(this).height();
            c > e && (e = c, d = b);
        }), d;
    }

    function d(b, c, d, e) {
        var f = a(e).outerHeight();
        c.container.animate({
            height: f
        }, c.autoHeightSpeed, c.autoHeightEasing);
    }

    function e(c, f) {
        f._autoHeightOnResize && (a(window).off("resize orientationchange", f._autoHeightOnResize), f._autoHeightOnResize = null), f.container.off("cycle-slide-added cycle-slide-removed", b), f.container.off("cycle-destroyed", e), f.container.off("cycle-before", d), f._sentinel && (f._sentinel.remove(), f._sentinel = null);
    }
    a.extend(a.fn.cycle.defaults, {
        autoHeight: 0,
        autoHeightSpeed: 250,
        autoHeightEasing: null
    }), a(document).on("cycle-initialized", function(c, f) {
        function g() {
            b(c, f);
        }
        var h, i = f.autoHeight,
            j = a.type(i),
            k = null;
        ("string" === j || "number" === j) && (f.container.on("cycle-slide-added cycle-slide-removed", b), f.container.on("cycle-destroyed", e), "container" == i ? f.container.on("cycle-before", d) : "string" === j && /\d+\:\d+/.test(i) && (h = i.match(/(\d+)\:(\d+)/), h = h[1] / h[2], f._autoHeightRatio = h), "number" !== j && (f._autoHeightOnResize = function() {
            clearTimeout(k), k = setTimeout(g, 50);
        }, a(window).on("resize orientationchange", f._autoHeightOnResize)), setTimeout(g, 30));
    });
}(jQuery), /*! caption plugin for Cycle2;  version: 20130306 */
function(a) {
    "use strict";
    a.extend(a.fn.cycle.defaults, {
        caption: "> .cycle-caption",
        captionTemplate: "{{slideNum}} / {{slideCount}}",
        overlay: "> .cycle-overlay",
        overlayTemplate: "<div>{{title}}</div><div>{{desc}}</div>",
        captionModule: "caption"
    }), a(document).on("cycle-update-view", function(b, c, d, e) {
        if ("caption" === c.captionModule) {
            a.each(["caption", "overlay"], function() {
                var a = this,
                    b = d[a + "Template"],
                    f = c.API.getComponent(a);
                f.length && b ? (f.html(c.API.tmpl(b, d, c, e)), f.show()) : f.hide();
            });
        }
    }), a(document).on("cycle-destroyed", function(b, c) {
        var d;
        a.each(["caption", "overlay"], function() {
            var a = this,
                b = c[a + "Template"];
            c[a] && b && (d = c.API.getComponent("caption"), d.empty());
        });
    });
}(jQuery), /*! command plugin for Cycle2;  version: 20140415 */
function(a) {
    "use strict";
    var b = a.fn.cycle;
    a.fn.cycle = function(c) {
        var d, e, f, g = a.makeArray(arguments);
        return "number" == a.type(c) ? this.cycle("goto", c) : "string" == a.type(c) ? this.each(function() {
            var h;
            return d = c, f = a(this).data("cycle.opts"), void 0 === f ? void b.log('slideshow must be initialized before sending commands; "' + d + '" ignored') : (d = "goto" == d ? "jump" : d, e = f.API[d], a.isFunction(e) ? (h = a.makeArray(g), h.shift(), e.apply(f.API, h)) : void b.log("unknown command: ", d));
        }) : b.apply(this, arguments);
    }, a.extend(a.fn.cycle, b), a.extend(b.API, {
        next: function next() {
            var a = this.opts();
            if (!a.busy || a.manualTrump) {
                var b = a.reverse ? -1 : 1;
                a.allowWrap === !1 && a.currSlide + b >= a.slideCount || (a.API.advanceSlide(b), a.API.trigger("cycle-next", [a]).log("cycle-next"));
            }
        },
        prev: function prev() {
            var a = this.opts();
            if (!a.busy || a.manualTrump) {
                var b = a.reverse ? 1 : -1;
                a.allowWrap === !1 && a.currSlide + b < 0 || (a.API.advanceSlide(b), a.API.trigger("cycle-prev", [a]).log("cycle-prev"));
            }
        },
        destroy: function destroy() {
            this.stop();
            var b = this.opts(),
                c = a.isFunction(a._data) ? a._data : a.noop;
            clearTimeout(b.timeoutId), b.timeoutId = 0, b.API.stop(), b.API.trigger("cycle-destroyed", [b]).log("cycle-destroyed"), b.container.removeData(), c(b.container[0], "parsedAttrs", !1), b.retainStylesOnDestroy || (b.container.removeAttr("style"), b.slides.removeAttr("style"), b.slides.removeClass(b.slideActiveClass)), b.slides.each(function() {
                var d = a(this);
                d.removeData(), d.removeClass(b.slideClass), c(this, "parsedAttrs", !1);
            });
        },
        jump: function jump(a, b) {
            var c, d = this.opts();
            if (!d.busy || d.manualTrump) {
                var e = parseInt(a, 10);
                if (isNaN(e) || 0 > e || e >= d.slides.length) return void d.API.log("goto: invalid slide index: " + e);
                if (e == d.currSlide) return void d.API.log("goto: skipping, already on slide", e);
                d.nextSlide = e, clearTimeout(d.timeoutId), d.timeoutId = 0, d.API.log("goto: ", e, " (zero-index)"), c = d.currSlide < d.nextSlide, d._tempFx = b, d.API.prepareTx(!0, c);
            }
        },
        stop: function stop() {
            var b = this.opts(),
                c = b.container;
            clearTimeout(b.timeoutId), b.timeoutId = 0, b.API.stopTransition(), b.pauseOnHover && (b.pauseOnHover !== !0 && (c = a(b.pauseOnHover)), c.off("mouseenter mouseleave")), b.API.trigger("cycle-stopped", [b]).log("cycle-stopped");
        },
        reinit: function reinit() {
            var a = this.opts();
            a.API.destroy(), a.container.cycle();
        },
        remove: function remove(b) {
            for (var c, d, e = this.opts(), f = [], g = 1, h = 0; h < e.slides.length; h++) {
                c = e.slides[h], h == b ? d = c : (f.push(c), a(c).data("cycle.opts").slideNum = g, g++);
            }
            d && (e.slides = a(f), e.slideCount--, a(d).remove(), b == e.currSlide ? e.API.advanceSlide(1) : b < e.currSlide ? e.currSlide-- : e.currSlide++, e.API.trigger("cycle-slide-removed", [e, b, d]).log("cycle-slide-removed"), e.API.updateView());
        }
    }), a(document).on("click.cycle", "[data-cycle-cmd]", function(b) {
        b.preventDefault();
        var c = a(this),
            d = c.data("cycle-cmd"),
            e = c.data("cycle-context") || ".cycle-slideshow";
        a(e).cycle(d, c.data("cycle-arg"));
    });
}(jQuery), /*! hash plugin for Cycle2;  version: 20130905 */
function(a) {
    "use strict";

    function b(b, c) {
        var d;
        return b._hashFence ? void(b._hashFence = !1) : (d = window.location.hash.substring(1), void b.slides.each(function(e) {
            if (a(this).data("cycle-hash") == d) {
                if (c === !0) b.startingSlide = e;
                else {
                    var f = b.currSlide < e;
                    b.nextSlide = e, b.API.prepareTx(!0, f);
                }
                return !1;
            }
        }));
    }
    a(document).on("cycle-pre-initialize", function(c, d) {
        b(d, !0), d._onHashChange = function() {
            b(d, !1);
        }, a(window).on("hashchange", d._onHashChange);
    }), a(document).on("cycle-update-view", function(a, b, c) {
        c.hash && "#" + c.hash != window.location.hash && (b._hashFence = !0, window.location.hash = c.hash);
    }), a(document).on("cycle-destroyed", function(b, c) {
        c._onHashChange && a(window).off("hashchange", c._onHashChange);
    });
}(jQuery), /*! loader plugin for Cycle2;  version: 20131121 */
function(a) {
    "use strict";
    a.extend(a.fn.cycle.defaults, {
        loader: !1
    }), a(document).on("cycle-bootstrap", function(b, c) {
        function d(b, d) {
            function f(b) {
                var f;
                "wait" == c.loader ? (h.push(b), 0 === j && (h.sort(g), e.apply(c.API, [h, d]), c.container.removeClass("cycle-loading"))) : (f = a(c.slides[c.currSlide]), e.apply(c.API, [b, d]), f.show(), c.container.removeClass("cycle-loading"));
            }

            function g(a, b) {
                return a.data("index") - b.data("index");
            }
            var h = [];
            if ("string" == a.type(b)) b = a.trim(b);
            else if ("array" === a.type(b))
                for (var i = 0; i < b.length; i++) {
                    b[i] = a(b[i])[0];
                }
            b = a(b);
            var j = b.length;
            j && (b.css("visibility", "hidden").appendTo("body").each(function(b) {
                function g() {
                    0 === --i && (--j, f(k));
                }
                var i = 0,
                    k = a(this),
                    l = k.is("img") ? k : k.find("img");
                return k.data("index", b), l = l.filter(":not(.cycle-loader-ignore)").filter(':not([src=""])'), l.length ? (i = l.length, void l.each(function() {
                    this.complete ? g() : a(this).load(function() {
                        g();
                    }).on("error", function() {
                        0 === --i && (c.API.log("slide skipped; img not loaded:", this.src), 0 === --j && "wait" == c.loader && e.apply(c.API, [h, d]));
                    });
                })) : (--j, void h.push(k));
            }), j && c.container.addClass("cycle-loading"));
        }
        var e;
        c.loader && (e = c.API.add, c.API.add = d);
    });
}(jQuery), /*! pager plugin for Cycle2;  version: 20140415 */
function(a) {
    "use strict";

    function b(b, c, d) {
        var e, f = b.API.getComponent("pager");
        f.each(function() {
            var f = a(this);
            if (c.pagerTemplate) {
                var g = b.API.tmpl(c.pagerTemplate, c, b, d[0]);
                e = a(g).appendTo(f);
            } else e = f.children().eq(b.slideCount - 1);
            e.on(b.pagerEvent, function(a) {
                b.pagerEventBubble || a.preventDefault(), b.API.page(f, a.currentTarget);
            });
        });
    }

    function c(a, b) {
        var c = this.opts();
        if (!c.busy || c.manualTrump) {
            var d = a.children().index(b),
                e = d,
                f = c.currSlide < e;
            c.currSlide != e && (c.nextSlide = e, c._tempFx = c.pagerFx, c.API.prepareTx(!0, f), c.API.trigger("cycle-pager-activated", [c, a, b]));
        }
    }
    a.extend(a.fn.cycle.defaults, {
        pager: "> .cycle-pager",
        pagerActiveClass: "cycle-pager-active",
        pagerEvent: "click.cycle",
        pagerEventBubble: void 0,
        pagerTemplate: "<span>&bull;</span>"
    }), a(document).on("cycle-bootstrap", function(a, c, d) {
        d.buildPagerLink = b;
    }), a(document).on("cycle-slide-added", function(a, b, d, e) {
        b.pager && (b.API.buildPagerLink(b, d, e), b.API.page = c);
    }), a(document).on("cycle-slide-removed", function(b, c, d) {
        if (c.pager) {
            var e = c.API.getComponent("pager");
            e.each(function() {
                var b = a(this);
                a(b.children()[d]).remove();
            });
        }
    }), a(document).on("cycle-update-view", function(b, c) {
        var d;
        c.pager && (d = c.API.getComponent("pager"), d.each(function() {
            a(this).children().removeClass(c.pagerActiveClass).eq(c.currSlide).addClass(c.pagerActiveClass);
        }));
    }), a(document).on("cycle-destroyed", function(a, b) {
        var c = b.API.getComponent("pager");
        c && (c.children().off(b.pagerEvent), b.pagerTemplate && c.empty());
    });
}(jQuery), /*! prevnext plugin for Cycle2;  version: 20140408 */
function(a) {
    "use strict";
    a.extend(a.fn.cycle.defaults, {
        next: "> .cycle-next",
        nextEvent: "click.cycle",
        disabledClass: "disabled",
        prev: "> .cycle-prev",
        prevEvent: "click.cycle",
        swipe: !1
    }), a(document).on("cycle-initialized", function(a, b) {
        if (b.API.getComponent("next").on(b.nextEvent, function(a) {
                a.preventDefault(), b.API.next();
            }), b.API.getComponent("prev").on(b.prevEvent, function(a) {
                a.preventDefault(), b.API.prev();
            }), b.swipe) {
            var c = b.swipeVert ? "swipeUp.cycle" : "swipeLeft.cycle swipeleft.cycle",
                d = b.swipeVert ? "swipeDown.cycle" : "swipeRight.cycle swiperight.cycle";
            b.container.on(c, function() {
                b._tempFx = b.swipeFx, b.API.next();
            }), b.container.on(d, function() {
                b._tempFx = b.swipeFx, b.API.prev();
            });
        }
    }), a(document).on("cycle-update-view", function(a, b) {
        if (!b.allowWrap) {
            var c = b.disabledClass,
                d = b.API.getComponent("next"),
                e = b.API.getComponent("prev"),
                f = b._prevBoundry || 0,
                g = void 0 !== b._nextBoundry ? b._nextBoundry : b.slideCount - 1;
            b.currSlide == g ? d.addClass(c).prop("disabled", !0) : d.removeClass(c).prop("disabled", !1), b.currSlide === f ? e.addClass(c).prop("disabled", !0) : e.removeClass(c).prop("disabled", !1);
        }
    }), a(document).on("cycle-destroyed", function(a, b) {
        b.API.getComponent("prev").off(b.nextEvent), b.API.getComponent("next").off(b.prevEvent), b.container.off("swipeleft.cycle swiperight.cycle swipeLeft.cycle swipeRight.cycle swipeUp.cycle swipeDown.cycle");
    });
}(jQuery), /*! progressive loader plugin for Cycle2;  version: 20130315 */
function(a) {
    "use strict";
    a.extend(a.fn.cycle.defaults, {
        progressive: !1
    }), a(document).on("cycle-pre-initialize", function(b, c) {
        if (c.progressive) {
            var d, e, f = c.API,
                g = f.next,
                h = f.prev,
                i = f.prepareTx,
                j = a.type(c.progressive);
            if ("array" == j) d = c.progressive;
            else if (a.isFunction(c.progressive)) d = c.progressive(c);
            else if ("string" == j) {
                if (e = a(c.progressive), d = a.trim(e.html()), !d) return;
                if (/^(\[)/.test(d)) try {
                    d = a.parseJSON(d);
                } catch (k) {
                    return void f.log("error parsing progressive slides", k);
                } else d = d.split(new RegExp(e.data("cycle-split") || "\n")), d[d.length - 1] || d.pop();
            }
            i && (f.prepareTx = function(a, b) {
                var e, f;
                return a || 0 === d.length ? void i.apply(c.API, [a, b]) : void(b && c.currSlide == c.slideCount - 1 ? (f = d[0], d = d.slice(1), c.container.one("cycle-slide-added", function(a, b) {
                    setTimeout(function() {
                        b.API.advanceSlide(1);
                    }, 50);
                }), c.API.add(f)) : b || 0 !== c.currSlide ? i.apply(c.API, [a, b]) : (e = d.length - 1, f = d[e], d = d.slice(0, e), c.container.one("cycle-slide-added", function(a, b) {
                    setTimeout(function() {
                        b.currSlide = 1, b.API.advanceSlide(-1);
                    }, 50);
                }), c.API.add(f, !0)));
            }), g && (f.next = function() {
                var a = this.opts();
                if (d.length && a.currSlide == a.slideCount - 1) {
                    var b = d[0];
                    d = d.slice(1), a.container.one("cycle-slide-added", function(a, b) {
                        g.apply(b.API), b.container.removeClass("cycle-loading");
                    }), a.container.addClass("cycle-loading"), a.API.add(b);
                } else g.apply(a.API);
            }), h && (f.prev = function() {
                var a = this.opts();
                if (d.length && 0 === a.currSlide) {
                    var b = d.length - 1,
                        c = d[b];
                    d = d.slice(0, b), a.container.one("cycle-slide-added", function(a, b) {
                        b.currSlide = 1, b.API.advanceSlide(-1), b.container.removeClass("cycle-loading");
                    }), a.container.addClass("cycle-loading"), a.API.add(c, !0);
                } else h.apply(a.API);
            });
        }
    });
}(jQuery), /*! tmpl plugin for Cycle2;  version: 20121227 */
function(a) {
    "use strict";
    a.extend(a.fn.cycle.defaults, {
        tmplRegex: "{{((.)?.*?)}}"
    }), a.extend(a.fn.cycle.API, {
        tmpl: function tmpl(b, c) {
            var d = new RegExp(c.tmplRegex || a.fn.cycle.defaults.tmplRegex, "g"),
                e = a.makeArray(arguments);
            return e.shift(), b.replace(d, function(b, c) {
                var d, f, g, h, i = c.split(".");
                for (d = 0; d < e.length; d++) {
                    if (g = e[d]) {
                        if (i.length > 1)
                            for (h = g, f = 0; f < i.length; f++) {
                                g = h, h = h[i[f]] || c;
                            } else h = g[c];
                        if (a.isFunction(h)) return h.apply(g, e);
                        if (void 0 !== h && null !== h && h != c) return h;
                    }
                }
                return c;
            });
        }
    });
}(jQuery);
"use strict"; /* Plugin for Cycle2; Copyright (c) 2012 M. Alsup; v20141007 */
! function(a) {
    "use strict";
    a(document).on("cycle-bootstrap", function(a, b, c) {
        "carousel" === b.fx && (c.getSlideIndex = function(a) {
            var b = this.opts()._carouselWrap.children(),
                c = b.index(a);
            return c % b.length;
        }, c.next = function() {
            var a = b.reverse ? -1 : 1;
            b.allowWrap === !1 && b.currSlide + a > b.slideCount - b.carouselVisible || (b.API.advanceSlide(a), b.API.trigger("cycle-next", [b]).log("cycle-next"));
        });
    }), a.fn.cycle.transitions.carousel = {
        preInit: function preInit(b) {
            b.hideNonActive = !1, b.container.on("cycle-destroyed", a.proxy(this.onDestroy, b.API)), b.API.stopTransition = this.stopTransition;
            for (var c = 0; c < b.startingSlide; c++) {
                b.container.append(b.slides[0]);
            }
        },
        postInit: function postInit(b) {
            var c, d, e, f, g = b.carouselVertical;
            b.carouselVisible && b.carouselVisible > b.slideCount && (b.carouselVisible = b.slideCount - 1);
            var h = b.carouselVisible || b.slides.length,
                i = {
                    display: g ? "block" : "inline-block",
                    position: "static"
                };
            if (b.container.css({
                    position: "relative",
                    overflow: "hidden"
                }), b.slides.css(i), b._currSlide = b.currSlide, f = a('<div class="cycle-carousel-wrap"></div>').prependTo(b.container).css({
                    margin: 0,
                    padding: 0,
                    top: 0,
                    left: 0,
                    position: "absolute"
                }).append(b.slides), b._carouselWrap = f, g || f.css("white-space", "nowrap"), b.allowWrap !== !1) {
                for (d = 0; d < (void 0 === b.carouselVisible ? 2 : 1); d++) {
                    for (c = 0; c < b.slideCount; c++) {
                        f.append(b.slides[c].cloneNode(!0));
                    }
                    for (c = b.slideCount; c--;) {
                        f.prepend(b.slides[c].cloneNode(!0));
                    }
                }
                f.find(".cycle-slide-active").removeClass("cycle-slide-active"), b.slides.eq(b.startingSlide).addClass("cycle-slide-active");
            }
            b.pager && b.allowWrap === !1 && (e = b.slideCount - h, a(b.pager).children().filter(":gt(" + e + ")").hide()), b._nextBoundry = b.slideCount - b.carouselVisible, this.prepareDimensions(b);
        },
        prepareDimensions: function prepareDimensions(b) {
            var c, d, e, f, g = b.carouselVertical,
                h = b.carouselVisible || b.slides.length;
            if (b.carouselFluid && b.carouselVisible ? b._carouselResizeThrottle || this.fluidSlides(b) : b.carouselVisible && b.carouselSlideDimension ? (c = h * b.carouselSlideDimension, b.container[g ? "height" : "width"](c)) : b.carouselVisible && (c = h * a(b.slides[0])[g ? "outerHeight" : "outerWidth"](!0), b.container[g ? "height" : "width"](c)), d = b.carouselOffset || 0, b.allowWrap !== !1)
                if (b.carouselSlideDimension) d -= (b.slideCount + b.currSlide) * b.carouselSlideDimension;
                else
                    for (e = b._carouselWrap.children(), f = 0; f < b.slideCount + b.currSlide; f++) {
                        d -= a(e[f])[g ? "outerHeight" : "outerWidth"](!0);
                    }
            b._carouselWrap.css(g ? "top" : "left", d);
        },
        fluidSlides: function fluidSlides(b) {
            function c() {
                clearTimeout(e), e = setTimeout(d, 20);
            }

            function d() {
                b._carouselWrap.stop(!1, !0);
                var a = b.container.width() / b.carouselVisible;
                a = Math.ceil(a - g), b._carouselWrap.children().width(a), b._sentinel && b._sentinel.width(a), h(b);
            }
            var e, f = b.slides.eq(0),
                g = f.outerWidth() - f.width(),
                h = this.prepareDimensions;
            a(window).on("resize", c), b._carouselResizeThrottle = c, d();
        },
        transition: function transition(b, c, d, e, f) {
            var g, h = {},
                i = b.nextSlide - b.currSlide,
                j = b.carouselVertical,
                k = b.speed;
            if (b.allowWrap === !1) {
                e = i > 0;
                var l = b._currSlide,
                    m = b.slideCount - b.carouselVisible;
                i > 0 && b.nextSlide > m && l == m ? i = 0 : i > 0 && b.nextSlide > m ? i = b.nextSlide - l - (b.nextSlide - m) : 0 > i && b.currSlide > m && b.nextSlide > m ? i = 0 : 0 > i && b.currSlide > m ? i += b.currSlide - m : l = b.currSlide, g = this.getScroll(b, j, l, i), b.API.opts()._currSlide = b.nextSlide > m ? m : b.nextSlide;
            } else e && 0 === b.nextSlide ? (g = this.getDim(b, b.currSlide, j), f = this.genCallback(b, e, j, f)) : e || b.nextSlide != b.slideCount - 1 ? g = this.getScroll(b, j, b.currSlide, i) : (g = this.getDim(b, b.currSlide, j), f = this.genCallback(b, e, j, f));
            h[j ? "top" : "left"] = e ? "-=" + g : "+=" + g, b.throttleSpeed && (k = g / a(b.slides[0])[j ? "height" : "width"]() * b.speed), b._carouselWrap.animate(h, k, b.easing, f);
        },
        getDim: function getDim(b, c, d) {
            var e = a(b.slides[c]);
            return e[d ? "outerHeight" : "outerWidth"](!0);
        },
        getScroll: function getScroll(a, b, c, d) {
            var e, f = 0;
            if (d > 0)
                for (e = c; c + d > e; e++) {
                    f += this.getDim(a, e, b);
                } else
                    for (e = c; e > c + d; e--) {
                        f += this.getDim(a, e, b);
                    }
            return f;
        },
        genCallback: function genCallback(b, c, d, e) {
            return function() {
                var c = a(b.slides[b.nextSlide]).position(),
                    f = 0 - c[d ? "top" : "left"] + (b.carouselOffset || 0);
                b._carouselWrap.css(b.carouselVertical ? "top" : "left", f), e();
            };
        },
        stopTransition: function stopTransition() {
            var a = this.opts();
            a.slides.stop(!1, !0), a._carouselWrap.stop(!1, !0);
        },
        onDestroy: function onDestroy() {
            var b = this.opts();
            b._carouselResizeThrottle && a(window).off("resize", b._carouselResizeThrottle), b.slides.prependTo(b.container), b._carouselWrap.remove();
        }
    };
}(jQuery);
"use strict"; /* Plugin for Cycle2; Copyright (c) 2012 M. Alsup; v20141007 */
! function(a) {
    "use strict";
    a.event.special.swipe = a.event.special.swipe || {
        scrollSupressionThreshold: 10,
        durationThreshold: 1e3,
        horizontalDistanceThreshold: 30,
        verticalDistanceThreshold: 75,
        setup: function setup() {
            var b = a(this);
            b.bind("touchstart", function(c) {
                function d(b) {
                    if (g) {
                        var c = b.originalEvent.touches ? b.originalEvent.touches[0] : b;
                        e = {
                            time: new Date().getTime(),
                            coords: [c.pageX, c.pageY]
                        }, Math.abs(g.coords[0] - e.coords[0]) > a.event.special.swipe.scrollSupressionThreshold && b.preventDefault();
                    }
                }
                var e, f = c.originalEvent.touches ? c.originalEvent.touches[0] : c,
                    g = {
                        time: new Date().getTime(),
                        coords: [f.pageX, f.pageY],
                        origin: a(c.target)
                    };
                b.bind("touchmove", d).one("touchend", function() {
                    b.unbind("touchmove", d), g && e && e.time - g.time < a.event.special.swipe.durationThreshold && Math.abs(g.coords[0] - e.coords[0]) > a.event.special.swipe.horizontalDistanceThreshold && Math.abs(g.coords[1] - e.coords[1]) < a.event.special.swipe.verticalDistanceThreshold && g.origin.trigger("swipe").trigger(g.coords[0] > e.coords[0] ? "swipeleft" : "swiperight"), g = e = void 0;
                });
            });
        }
    }, a.event.special.swipeleft = a.event.special.swipeleft || {
        setup: function setup() {
            a(this).bind("swipe", a.noop);
        }
    }, a.event.special.swiperight = a.event.special.swiperight || a.event.special.swipeleft;
}(jQuery);
"use strict";
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
/*
 * jquery-match-height 0.7.2 by @liabru
 * http://brm.io/jquery-match-height/
 * License MIT
 */
! function(t) {
    "use strict";
    "function" == typeof define && define.amd ? define(["jquery"], t) : "undefined" != typeof module && module.exports ? module.exports = t(require("jquery")) : t(jQuery);
}(function(t) {
    var e = -1,
        o = -1,
        n = function n(t) {
            return parseFloat(t) || 0;
        },
        a = function a(e) {
            var o = 1,
                a = t(e),
                i = null,
                r = [];
            return a.each(function() {
                var e = t(this),
                    a = e.offset().top - n(e.css("margin-top")),
                    s = r.length > 0 ? r[r.length - 1] : null;
                null === s ? r.push(e) : Math.floor(Math.abs(i - a)) <= o ? r[r.length - 1] = s.add(e) : r.push(e), i = a;
            }), r;
        },
        i = function i(e) {
            var o = {
                byRow: !0,
                property: "height",
                target: null,
                remove: !1
            };
            return "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) ? t.extend(o, e) : ("boolean" == typeof e ? o.byRow = e : "remove" === e && (o.remove = !0), o);
        },
        r = t.fn.matchHeight = function(e) {
            var o = i(e);
            if (o.remove) {
                var n = this;
                return this.css(o.property, ""), t.each(r._groups, function(t, e) {
                    e.elements = e.elements.not(n);
                }), this;
            }
            return this.length <= 1 && !o.target ? this : (r._groups.push({
                elements: this,
                options: o
            }), r._apply(this, o), this);
        };
    r.version = "0.7.2", r._groups = [], r._throttle = 80, r._maintainScroll = !1, r._beforeUpdate = null, r._afterUpdate = null, r._rows = a, r._parse = n, r._parseOptions = i, r._apply = function(e, o) {
        var s = i(o),
            h = t(e),
            l = [h],
            c = t(window).scrollTop(),
            p = t("html").outerHeight(!0),
            u = h.parents().filter(":hidden");
        return u.each(function() {
            var e = t(this);
            e.data("style-cache", e.attr("style"));
        }), u.css("display", "block"), s.byRow && !s.target && (h.each(function() {
            var e = t(this),
                o = e.css("display");
            "inline-block" !== o && "flex" !== o && "inline-flex" !== o && (o = "block"), e.data("style-cache", e.attr("style")), e.css({
                display: o,
                "padding-top": "0",
                "padding-bottom": "0",
                "margin-top": "0",
                "margin-bottom": "0",
                "border-top-width": "0",
                "border-bottom-width": "0",
                height: "100px",
                overflow: "hidden"
            });
        }), l = a(h), h.each(function() {
            var e = t(this);
            e.attr("style", e.data("style-cache") || "");
        })), t.each(l, function(e, o) {
            var a = t(o),
                i = 0;
            if (s.target) i = s.target.outerHeight(!1);
            else {
                if (s.byRow && a.length <= 1) return void a.css(s.property, "");
                a.each(function() {
                    var e = t(this),
                        o = e.attr("style"),
                        n = e.css("display");
                    "inline-block" !== n && "flex" !== n && "inline-flex" !== n && (n = "block");
                    var a = {
                        display: n
                    };
                    a[s.property] = "", e.css(a), e.outerHeight(!1) > i && (i = e.outerHeight(!1)), o ? e.attr("style", o) : e.css("display", "");
                });
            }
            a.each(function() {
                var e = t(this),
                    o = 0;
                s.target && e.is(s.target) || ("border-box" !== e.css("box-sizing") && (o += n(e.css("border-top-width")) + n(e.css("border-bottom-width")), o += n(e.css("padding-top")) + n(e.css("padding-bottom"))), e.css(s.property, i - o + "px"));
            });
        }), u.each(function() {
            var e = t(this);
            e.attr("style", e.data("style-cache") || null);
        }), r._maintainScroll && t(window).scrollTop(c / p * t("html").outerHeight(!0)), this;
    }, r._applyDataApi = function() {
        var e = {};
        t("[data-match-height], [data-mh]").each(function() {
            var o = t(this),
                n = o.attr("data-mh") || o.attr("data-match-height");
            n in e ? e[n] = e[n].add(o) : e[n] = o;
        }), t.each(e, function() {
            this.matchHeight(!0);
        });
    };
    var s = function s(e) {
        r._beforeUpdate && r._beforeUpdate(e, r._groups), t.each(r._groups, function() {
            r._apply(this.elements, this.options);
        }), r._afterUpdate && r._afterUpdate(e, r._groups);
    };
    r._update = function(n, a) {
        if (a && "resize" === a.type) {
            var i = t(window).width();
            if (i === e) return;
            e = i;
        }
        n ? o === -1 && (o = setTimeout(function() {
            s(a), o = -1;
        }, r._throttle)) : s(a);
    }, t(r._applyDataApi);
    var h = t.fn.on ? "on" : "bind";
    t(window)[h]("load", function(t) {
        r._update(!1, t);
    }), t(window)[h]("resize orientationchange", function(t) {
        r._update(!0, t);
    });
});
'use strict';
jQuery(document).ready(function($) {
    $('.mega-menu-div').each(function(index) {
        var link_id = $(this).attr('id');
        link_num = link_id.split('-');
        link_num = link_num[link_num.length - 1];
        $(this).appendTo('li.menu-item-' + link_num);
    });
    $('#menu-main-menu-1 li').hover(function(e) {
        $(this).children("div").stop(true, false).fadeToggle(150);
        e.preventDefault();
    });
    $('.mega-menu-div .submenu-1').addClass('active');
    $('.mega-menu-div .submenu a').hover(function(e) {
        $(this).parent().siblings().removeClass('active');
        $(this).parent().toggleClass('active');
    });
    $('.tooltip').tooltipster({
        interactive: true,
        maxWidth: 200,
        contentAsHTML: true,
        theme: ['tooltipster-shadow', 'tooltipster-shadow-customized']
    });
    $(window).load(function() {
        $('#tribe-events').find('.tribe-events-photo-event-wrap').matchHeight();
    });
});
(function($) {
    $(document.body).on('post-load', function() {
        $(document).foundation();
    });
})(jQuery);
"use strict";
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
! function(i) {
    "use strict";
    "function" == typeof define && define.amd ? define(["jquery"], i) : "undefined" != typeof exports ? module.exports = i(require("jquery")) : i(jQuery);
}(function(i) {
    "use strict";
    var e = window.Slick || {};
    (e = function() {
        var e = 0;
        return function(t, o) {
            var s, n = this;
            n.defaults = {
                accessibility: !0,
                adaptiveHeight: !1,
                appendArrows: i(t),
                appendDots: i(t),
                arrows: !0,
                asNavFor: null,
                prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
                nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
                autoplay: !1,
                autoplaySpeed: 3e3,
                centerMode: !1,
                centerPadding: "50px",
                cssEase: "ease",
                customPaging: function customPaging(e, t) {
                    return i('<button type="button" />').text(t + 1);
                },
                dots: !1,
                dotsClass: "slick-dots",
                draggable: !0,
                easing: "linear",
                edgeFriction: .35,
                fade: !1,
                focusOnSelect: !1,
                focusOnChange: !1,
                infinite: !0,
                initialSlide: 0,
                lazyLoad: "ondemand",
                mobileFirst: !1,
                pauseOnHover: !0,
                pauseOnFocus: !0,
                pauseOnDotsHover: !1,
                respondTo: "window",
                responsive: null,
                rows: 1,
                rtl: !1,
                slide: "",
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: !0,
                swipeToSlide: !1,
                touchMove: !0,
                touchThreshold: 5,
                useCSS: !0,
                useTransform: !0,
                variableWidth: !1,
                vertical: !1,
                verticalSwiping: !1,
                waitForAnimate: !0,
                zIndex: 1e3
            }, n.initials = {
                animating: !1,
                dragging: !1,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                scrolling: !1,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: !1,
                slideOffset: 0,
                swipeLeft: null,
                swiping: !1,
                $list: null,
                touchObject: {},
                transformsEnabled: !1,
                unslicked: !1
            }, i.extend(n, n.initials), n.activeBreakpoint = null, n.animType = null, n.animProp = null, n.breakpoints = [], n.breakpointSettings = [], n.cssTransitions = !1, n.focussed = !1, n.interrupted = !1, n.hidden = "hidden", n.paused = !0, n.positionProp = null, n.respondTo = null, n.rowCount = 1, n.shouldClick = !0, n.$slider = i(t), n.$slidesCache = null, n.transformType = null, n.transitionType = null, n.visibilityChange = "visibilitychange", n.windowWidth = 0, n.windowTimer = null, s = i(t).data("slick") || {}, n.options = i.extend({}, n.defaults, o, s), n.currentSlide = n.options.initialSlide, n.originalSettings = n.options, void 0 !== document.mozHidden ? (n.hidden = "mozHidden", n.visibilityChange = "mozvisibilitychange") : void 0 !== document.webkitHidden && (n.hidden = "webkitHidden", n.visibilityChange = "webkitvisibilitychange"), n.autoPlay = i.proxy(n.autoPlay, n), n.autoPlayClear = i.proxy(n.autoPlayClear, n), n.autoPlayIterator = i.proxy(n.autoPlayIterator, n), n.changeSlide = i.proxy(n.changeSlide, n), n.clickHandler = i.proxy(n.clickHandler, n), n.selectHandler = i.proxy(n.selectHandler, n), n.setPosition = i.proxy(n.setPosition, n), n.swipeHandler = i.proxy(n.swipeHandler, n), n.dragHandler = i.proxy(n.dragHandler, n), n.keyHandler = i.proxy(n.keyHandler, n), n.instanceUid = e++, n.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/, n.registerBreakpoints(), n.init(!0);
        };
    }()).prototype.activateADA = function() {
        this.$slideTrack.find(".slick-active").attr({
            "aria-hidden": "false"
        }).find("a, input, button, select").attr({
            tabindex: "0"
        });
    }, e.prototype.addSlide = e.prototype.slickAdd = function(e, t, o) {
        var s = this;
        if ("boolean" == typeof t) o = t, t = null;
        else if (t < 0 || t >= s.slideCount) return !1;
        s.unload(), "number" == typeof t ? 0 === t && 0 === s.$slides.length ? i(e).appendTo(s.$slideTrack) : o ? i(e).insertBefore(s.$slides.eq(t)) : i(e).insertAfter(s.$slides.eq(t)) : !0 === o ? i(e).prependTo(s.$slideTrack) : i(e).appendTo(s.$slideTrack), s.$slides = s.$slideTrack.children(this.options.slide), s.$slideTrack.children(this.options.slide).detach(), s.$slideTrack.append(s.$slides), s.$slides.each(function(e, t) {
            i(t).attr("data-slick-index", e);
        }), s.$slidesCache = s.$slides, s.reinit();
    }, e.prototype.animateHeight = function() {
        var i = this;
        if (1 === i.options.slidesToShow && !0 === i.options.adaptiveHeight && !1 === i.options.vertical) {
            var e = i.$slides.eq(i.currentSlide).outerHeight(!0);
            i.$list.animate({
                height: e
            }, i.options.speed);
        }
    }, e.prototype.animateSlide = function(e, t) {
        var o = {},
            s = this;
        s.animateHeight(), !0 === s.options.rtl && !1 === s.options.vertical && (e = -e), !1 === s.transformsEnabled ? !1 === s.options.vertical ? s.$slideTrack.animate({
            left: e
        }, s.options.speed, s.options.easing, t) : s.$slideTrack.animate({
            top: e
        }, s.options.speed, s.options.easing, t) : !1 === s.cssTransitions ? (!0 === s.options.rtl && (s.currentLeft = -s.currentLeft), i({
            animStart: s.currentLeft
        }).animate({
            animStart: e
        }, {
            duration: s.options.speed,
            easing: s.options.easing,
            step: function step(i) {
                i = Math.ceil(i), !1 === s.options.vertical ? (o[s.animType] = "translate(" + i + "px, 0px)", s.$slideTrack.css(o)) : (o[s.animType] = "translate(0px," + i + "px)", s.$slideTrack.css(o));
            },
            complete: function complete() {
                t && t.call();
            }
        })) : (s.applyTransition(), e = Math.ceil(e), !1 === s.options.vertical ? o[s.animType] = "translate3d(" + e + "px, 0px, 0px)" : o[s.animType] = "translate3d(0px," + e + "px, 0px)", s.$slideTrack.css(o), t && setTimeout(function() {
            s.disableTransition(), t.call();
        }, s.options.speed));
    }, e.prototype.getNavTarget = function() {
        var e = this,
            t = e.options.asNavFor;
        return t && null !== t && (t = i(t).not(e.$slider)), t;
    }, e.prototype.asNavFor = function(e) {
        var t = this.getNavTarget();
        null !== t && "object" == (typeof t === "undefined" ? "undefined" : _typeof(t)) && t.each(function() {
            var t = i(this).slick("getSlick");
            t.unslicked || t.slideHandler(e, !0);
        });
    }, e.prototype.applyTransition = function(i) {
        var e = this,
            t = {};
        !1 === e.options.fade ? t[e.transitionType] = e.transformType + " " + e.options.speed + "ms " + e.options.cssEase : t[e.transitionType] = "opacity " + e.options.speed + "ms " + e.options.cssEase, !1 === e.options.fade ? e.$slideTrack.css(t) : e.$slides.eq(i).css(t);
    }, e.prototype.autoPlay = function() {
        var i = this;
        i.autoPlayClear(), i.slideCount > i.options.slidesToShow && (i.autoPlayTimer = setInterval(i.autoPlayIterator, i.options.autoplaySpeed));
    }, e.prototype.autoPlayClear = function() {
        var i = this;
        i.autoPlayTimer && clearInterval(i.autoPlayTimer);
    }, e.prototype.autoPlayIterator = function() {
        var i = this,
            e = i.currentSlide + i.options.slidesToScroll;
        i.paused || i.interrupted || i.focussed || (!1 === i.options.infinite && (1 === i.direction && i.currentSlide + 1 === i.slideCount - 1 ? i.direction = 0 : 0 === i.direction && (e = i.currentSlide - i.options.slidesToScroll, i.currentSlide - 1 == 0 && (i.direction = 1))), i.slideHandler(e));
    }, e.prototype.buildArrows = function() {
        var e = this;
        !0 === e.options.arrows && (e.$prevArrow = i(e.options.prevArrow).addClass("slick-arrow"), e.$nextArrow = i(e.options.nextArrow).addClass("slick-arrow"), e.slideCount > e.options.slidesToShow ? (e.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"), e.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"), e.htmlExpr.test(e.options.prevArrow) && e.$prevArrow.prependTo(e.options.appendArrows), e.htmlExpr.test(e.options.nextArrow) && e.$nextArrow.appendTo(e.options.appendArrows), !0 !== e.options.infinite && e.$prevArrow.addClass("slick-disabled").attr("aria-disabled", "true")) : e.$prevArrow.add(e.$nextArrow).addClass("slick-hidden").attr({
            "aria-disabled": "true",
            tabindex: "-1"
        }));
    }, e.prototype.buildDots = function() {
        var e, t, o = this;
        if (!0 === o.options.dots) {
            for (o.$slider.addClass("slick-dotted"), t = i("<ul />").addClass(o.options.dotsClass), e = 0; e <= o.getDotCount(); e += 1) {
                t.append(i("<li />").append(o.options.customPaging.call(this, o, e)));
            }
            o.$dots = t.appendTo(o.options.appendDots), o.$dots.find("li").first().addClass("slick-active");
        }
    }, e.prototype.buildOut = function() {
        var e = this;
        e.$slides = e.$slider.children(e.options.slide + ":not(.slick-cloned)").addClass("slick-slide"), e.slideCount = e.$slides.length, e.$slides.each(function(e, t) {
            i(t).attr("data-slick-index", e).data("originalStyling", i(t).attr("style") || "");
        }), e.$slider.addClass("slick-slider"), e.$slideTrack = 0 === e.slideCount ? i('<div class="slick-track"/>').appendTo(e.$slider) : e.$slides.wrapAll('<div class="slick-track"/>').parent(), e.$list = e.$slideTrack.wrap('<div class="slick-list"/>').parent(), e.$slideTrack.css("opacity", 0), !0 !== e.options.centerMode && !0 !== e.options.swipeToSlide || (e.options.slidesToScroll = 1), i("img[data-lazy]", e.$slider).not("[src]").addClass("slick-loading"), e.setupInfinite(), e.buildArrows(), e.buildDots(), e.updateDots(), e.setSlideClasses("number" == typeof e.currentSlide ? e.currentSlide : 0), !0 === e.options.draggable && e.$list.addClass("draggable");
    }, e.prototype.buildRows = function() {
        var i, e, t, o, s, n, r, l = this;
        if (o = document.createDocumentFragment(), n = l.$slider.children(), l.options.rows > 1) {
            for (r = l.options.slidesPerRow * l.options.rows, s = Math.ceil(n.length / r), i = 0; i < s; i++) {
                var d = document.createElement("div");
                for (e = 0; e < l.options.rows; e++) {
                    var a = document.createElement("div");
                    for (t = 0; t < l.options.slidesPerRow; t++) {
                        var c = i * r + (e * l.options.slidesPerRow + t);
                        n.get(c) && a.appendChild(n.get(c));
                    }
                    d.appendChild(a);
                }
                o.appendChild(d);
            }
            l.$slider.empty().append(o), l.$slider.children().children().children().css({
                width: 100 / l.options.slidesPerRow + "%",
                display: "inline-block"
            });
        }
    }, e.prototype.checkResponsive = function(e, t) {
        var o, s, n, r = this,
            l = !1,
            d = r.$slider.width(),
            a = window.innerWidth || i(window).width();
        if ("window" === r.respondTo ? n = a : "slider" === r.respondTo ? n = d : "min" === r.respondTo && (n = Math.min(a, d)), r.options.responsive && r.options.responsive.length && null !== r.options.responsive) {
            s = null;
            for (o in r.breakpoints) {
                r.breakpoints.hasOwnProperty(o) && (!1 === r.originalSettings.mobileFirst ? n < r.breakpoints[o] && (s = r.breakpoints[o]) : n > r.breakpoints[o] && (s = r.breakpoints[o]));
            }
            null !== s ? null !== r.activeBreakpoint ? (s !== r.activeBreakpoint || t) && (r.activeBreakpoint = s, "unslick" === r.breakpointSettings[s] ? r.unslick(s) : (r.options = i.extend({}, r.originalSettings, r.breakpointSettings[s]), !0 === e && (r.currentSlide = r.options.initialSlide), r.refresh(e)), l = s) : (r.activeBreakpoint = s, "unslick" === r.breakpointSettings[s] ? r.unslick(s) : (r.options = i.extend({}, r.originalSettings, r.breakpointSettings[s]), !0 === e && (r.currentSlide = r.options.initialSlide), r.refresh(e)), l = s) : null !== r.activeBreakpoint && (r.activeBreakpoint = null, r.options = r.originalSettings, !0 === e && (r.currentSlide = r.options.initialSlide), r.refresh(e), l = s), e || !1 === l || r.$slider.trigger("breakpoint", [r, l]);
        }
    }, e.prototype.changeSlide = function(e, t) {
        var o, s, n, r = this,
            l = i(e.currentTarget);
        switch (l.is("a") && e.preventDefault(), l.is("li") || (l = l.closest("li")), n = r.slideCount % r.options.slidesToScroll != 0, o = n ? 0 : (r.slideCount - r.currentSlide) % r.options.slidesToScroll, e.data.message) {
            case "previous":
                s = 0 === o ? r.options.slidesToScroll : r.options.slidesToShow - o, r.slideCount > r.options.slidesToShow && r.slideHandler(r.currentSlide - s, !1, t);
                break;
            case "next":
                s = 0 === o ? r.options.slidesToScroll : o, r.slideCount > r.options.slidesToShow && r.slideHandler(r.currentSlide + s, !1, t);
                break;
            case "index":
                var d = 0 === e.data.index ? 0 : e.data.index || l.index() * r.options.slidesToScroll;
                r.slideHandler(r.checkNavigable(d), !1, t), l.children().trigger("focus");
                break;
            default:
                return;
        }
    }, e.prototype.checkNavigable = function(i) {
        var e, t;
        if (e = this.getNavigableIndexes(), t = 0, i > e[e.length - 1]) i = e[e.length - 1];
        else
            for (var o in e) {
                if (i < e[o]) {
                    i = t;
                    break;
                }
                t = e[o];
            }
        return i;
    }, e.prototype.cleanUpEvents = function() {
        var e = this;
        e.options.dots && null !== e.$dots && (i("li", e.$dots).off("click.slick", e.changeSlide).off("mouseenter.slick", i.proxy(e.interrupt, e, !0)).off("mouseleave.slick", i.proxy(e.interrupt, e, !1)), !0 === e.options.accessibility && e.$dots.off("keydown.slick", e.keyHandler)), e.$slider.off("focus.slick blur.slick"), !0 === e.options.arrows && e.slideCount > e.options.slidesToShow && (e.$prevArrow && e.$prevArrow.off("click.slick", e.changeSlide), e.$nextArrow && e.$nextArrow.off("click.slick", e.changeSlide), !0 === e.options.accessibility && (e.$prevArrow && e.$prevArrow.off("keydown.slick", e.keyHandler), e.$nextArrow && e.$nextArrow.off("keydown.slick", e.keyHandler))), e.$list.off("touchstart.slick mousedown.slick", e.swipeHandler), e.$list.off("touchmove.slick mousemove.slick", e.swipeHandler), e.$list.off("touchend.slick mouseup.slick", e.swipeHandler), e.$list.off("touchcancel.slick mouseleave.slick", e.swipeHandler), e.$list.off("click.slick", e.clickHandler), i(document).off(e.visibilityChange, e.visibility), e.cleanUpSlideEvents(), !0 === e.options.accessibility && e.$list.off("keydown.slick", e.keyHandler), !0 === e.options.focusOnSelect && i(e.$slideTrack).children().off("click.slick", e.selectHandler), i(window).off("orientationchange.slick.slick-" + e.instanceUid, e.orientationChange), i(window).off("resize.slick.slick-" + e.instanceUid, e.resize), i("[draggable!=true]", e.$slideTrack).off("dragstart", e.preventDefault), i(window).off("load.slick.slick-" + e.instanceUid, e.setPosition);
    }, e.prototype.cleanUpSlideEvents = function() {
        var e = this;
        e.$list.off("mouseenter.slick", i.proxy(e.interrupt, e, !0)), e.$list.off("mouseleave.slick", i.proxy(e.interrupt, e, !1));
    }, e.prototype.cleanUpRows = function() {
        var i, e = this;
        e.options.rows > 1 && ((i = e.$slides.children().children()).removeAttr("style"), e.$slider.empty().append(i));
    }, e.prototype.clickHandler = function(i) {
        !1 === this.shouldClick && (i.stopImmediatePropagation(), i.stopPropagation(), i.preventDefault());
    }, e.prototype.destroy = function(e) {
        var t = this;
        t.autoPlayClear(), t.touchObject = {}, t.cleanUpEvents(), i(".slick-cloned", t.$slider).detach(), t.$dots && t.$dots.remove(), t.$prevArrow && t.$prevArrow.length && (t.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display", ""), t.htmlExpr.test(t.options.prevArrow) && t.$prevArrow.remove()), t.$nextArrow && t.$nextArrow.length && (t.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display", ""), t.htmlExpr.test(t.options.nextArrow) && t.$nextArrow.remove()), t.$slides && (t.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function() {
            i(this).attr("style", i(this).data("originalStyling"));
        }), t.$slideTrack.children(this.options.slide).detach(), t.$slideTrack.detach(), t.$list.detach(), t.$slider.append(t.$slides)), t.cleanUpRows(), t.$slider.removeClass("slick-slider"), t.$slider.removeClass("slick-initialized"), t.$slider.removeClass("slick-dotted"), t.unslicked = !0, e || t.$slider.trigger("destroy", [t]);
    }, e.prototype.disableTransition = function(i) {
        var e = this,
            t = {};
        t[e.transitionType] = "", !1 === e.options.fade ? e.$slideTrack.css(t) : e.$slides.eq(i).css(t);
    }, e.prototype.fadeSlide = function(i, e) {
        var t = this;
        !1 === t.cssTransitions ? (t.$slides.eq(i).css({
            zIndex: t.options.zIndex
        }), t.$slides.eq(i).animate({
            opacity: 1
        }, t.options.speed, t.options.easing, e)) : (t.applyTransition(i), t.$slides.eq(i).css({
            opacity: 1,
            zIndex: t.options.zIndex
        }), e && setTimeout(function() {
            t.disableTransition(i), e.call();
        }, t.options.speed));
    }, e.prototype.fadeSlideOut = function(i) {
        var e = this;
        !1 === e.cssTransitions ? e.$slides.eq(i).animate({
            opacity: 0,
            zIndex: e.options.zIndex - 2
        }, e.options.speed, e.options.easing) : (e.applyTransition(i), e.$slides.eq(i).css({
            opacity: 0,
            zIndex: e.options.zIndex - 2
        }));
    }, e.prototype.filterSlides = e.prototype.slickFilter = function(i) {
        var e = this;
        null !== i && (e.$slidesCache = e.$slides, e.unload(), e.$slideTrack.children(this.options.slide).detach(), e.$slidesCache.filter(i).appendTo(e.$slideTrack), e.reinit());
    }, e.prototype.focusHandler = function() {
        var e = this;
        e.$slider.off("focus.slick blur.slick").on("focus.slick blur.slick", "*", function(t) {
            t.stopImmediatePropagation();
            var o = i(this);
            setTimeout(function() {
                e.options.pauseOnFocus && (e.focussed = o.is(":focus"), e.autoPlay());
            }, 0);
        });
    }, e.prototype.getCurrent = e.prototype.slickCurrentSlide = function() {
        return this.currentSlide;
    }, e.prototype.getDotCount = function() {
        var i = this,
            e = 0,
            t = 0,
            o = 0;
        if (!0 === i.options.infinite) {
            if (i.slideCount <= i.options.slidesToShow) ++o;
            else
                for (; e < i.slideCount;) {
                    ++o, e = t + i.options.slidesToScroll, t += i.options.slidesToScroll <= i.options.slidesToShow ? i.options.slidesToScroll : i.options.slidesToShow;
                }
        } else if (!0 === i.options.centerMode) o = i.slideCount;
        else if (i.options.asNavFor)
            for (; e < i.slideCount;) {
                ++o, e = t + i.options.slidesToScroll, t += i.options.slidesToScroll <= i.options.slidesToShow ? i.options.slidesToScroll : i.options.slidesToShow;
            } else o = 1 + Math.ceil((i.slideCount - i.options.slidesToShow) / i.options.slidesToScroll);
        return o - 1;
    }, e.prototype.getLeft = function(i) {
        var e, t, o, s, n = this,
            r = 0;
        return n.slideOffset = 0, t = n.$slides.first().outerHeight(!0), !0 === n.options.infinite ? (n.slideCount > n.options.slidesToShow && (n.slideOffset = n.slideWidth * n.options.slidesToShow * -1, s = -1, !0 === n.options.vertical && !0 === n.options.centerMode && (2 === n.options.slidesToShow ? s = -1.5 : 1 === n.options.slidesToShow && (s = -2)), r = t * n.options.slidesToShow * s), n.slideCount % n.options.slidesToScroll != 0 && i + n.options.slidesToScroll > n.slideCount && n.slideCount > n.options.slidesToShow && (i > n.slideCount ? (n.slideOffset = (n.options.slidesToShow - (i - n.slideCount)) * n.slideWidth * -1, r = (n.options.slidesToShow - (i - n.slideCount)) * t * -1) : (n.slideOffset = n.slideCount % n.options.slidesToScroll * n.slideWidth * -1, r = n.slideCount % n.options.slidesToScroll * t * -1))) : i + n.options.slidesToShow > n.slideCount && (n.slideOffset = (i + n.options.slidesToShow - n.slideCount) * n.slideWidth, r = (i + n.options.slidesToShow - n.slideCount) * t), n.slideCount <= n.options.slidesToShow && (n.slideOffset = 0, r = 0), !0 === n.options.centerMode && n.slideCount <= n.options.slidesToShow ? n.slideOffset = n.slideWidth * Math.floor(n.options.slidesToShow) / 2 - n.slideWidth * n.slideCount / 2 : !0 === n.options.centerMode && !0 === n.options.infinite ? n.slideOffset += n.slideWidth * Math.floor(n.options.slidesToShow / 2) - n.slideWidth : !0 === n.options.centerMode && (n.slideOffset = 0, n.slideOffset += n.slideWidth * Math.floor(n.options.slidesToShow / 2)), e = !1 === n.options.vertical ? i * n.slideWidth * -1 + n.slideOffset : i * t * -1 + r, !0 === n.options.variableWidth && (o = n.slideCount <= n.options.slidesToShow || !1 === n.options.infinite ? n.$slideTrack.children(".slick-slide").eq(i) : n.$slideTrack.children(".slick-slide").eq(i + n.options.slidesToShow), e = !0 === n.options.rtl ? o[0] ? -1 * (n.$slideTrack.width() - o[0].offsetLeft - o.width()) : 0 : o[0] ? -1 * o[0].offsetLeft : 0, !0 === n.options.centerMode && (o = n.slideCount <= n.options.slidesToShow || !1 === n.options.infinite ? n.$slideTrack.children(".slick-slide").eq(i) : n.$slideTrack.children(".slick-slide").eq(i + n.options.slidesToShow + 1), e = !0 === n.options.rtl ? o[0] ? -1 * (n.$slideTrack.width() - o[0].offsetLeft - o.width()) : 0 : o[0] ? -1 * o[0].offsetLeft : 0, e += (n.$list.width() - o.outerWidth()) / 2)), e;
    }, e.prototype.getOption = e.prototype.slickGetOption = function(i) {
        return this.options[i];
    }, e.prototype.getNavigableIndexes = function() {
        var i, e = this,
            t = 0,
            o = 0,
            s = [];
        for (!1 === e.options.infinite ? i = e.slideCount : (t = -1 * e.options.slidesToScroll, o = -1 * e.options.slidesToScroll, i = 2 * e.slideCount); t < i;) {
            s.push(t), t = o + e.options.slidesToScroll, o += e.options.slidesToScroll <= e.options.slidesToShow ? e.options.slidesToScroll : e.options.slidesToShow;
        }
        return s;
    }, e.prototype.getSlick = function() {
        return this;
    }, e.prototype.getSlideCount = function() {
        var e, t, o = this;
        return t = !0 === o.options.centerMode ? o.slideWidth * Math.floor(o.options.slidesToShow / 2) : 0, !0 === o.options.swipeToSlide ? (o.$slideTrack.find(".slick-slide").each(function(s, n) {
            if (n.offsetLeft - t + i(n).outerWidth() / 2 > -1 * o.swipeLeft) return e = n, !1;
        }), Math.abs(i(e).attr("data-slick-index") - o.currentSlide) || 1) : o.options.slidesToScroll;
    }, e.prototype.goTo = e.prototype.slickGoTo = function(i, e) {
        this.changeSlide({
            data: {
                message: "index",
                index: parseInt(i)
            }
        }, e);
    }, e.prototype.init = function(e) {
        var t = this;
        i(t.$slider).hasClass("slick-initialized") || (i(t.$slider).addClass("slick-initialized"), t.buildRows(), t.buildOut(), t.setProps(), t.startLoad(), t.loadSlider(), t.initializeEvents(), t.updateArrows(), t.updateDots(), t.checkResponsive(!0), t.focusHandler()), e && t.$slider.trigger("init", [t]), !0 === t.options.accessibility && t.initADA(), t.options.autoplay && (t.paused = !1, t.autoPlay());
    }, e.prototype.initADA = function() {
        var e = this,
            t = Math.ceil(e.slideCount / e.options.slidesToShow),
            o = e.getNavigableIndexes().filter(function(i) {
                return i >= 0 && i < e.slideCount;
            });
        e.$slides.add(e.$slideTrack.find(".slick-cloned")).attr({
            "aria-hidden": "true",
            tabindex: "-1"
        }).find("a, input, button, select").attr({
            tabindex: "-1"
        }), null !== e.$dots && (e.$slides.not(e.$slideTrack.find(".slick-cloned")).each(function(t) {
            var s = o.indexOf(t);
            i(this).attr({
                role: "tabpanel",
                id: "slick-slide" + e.instanceUid + t,
                tabindex: -1
            }), -1 !== s && i(this).attr({
                "aria-describedby": "slick-slide-control" + e.instanceUid + s
            });
        }), e.$dots.attr("role", "tablist").find("li").each(function(s) {
            var n = o[s];
            i(this).attr({
                role: "presentation"
            }), i(this).find("button").first().attr({
                role: "tab",
                id: "slick-slide-control" + e.instanceUid + s,
                "aria-controls": "slick-slide" + e.instanceUid + n,
                "aria-label": s + 1 + " of " + t,
                "aria-selected": null,
                tabindex: "-1"
            });
        }).eq(e.currentSlide).find("button").attr({
            "aria-selected": "true",
            tabindex: "0"
        }).end());
        for (var s = e.currentSlide, n = s + e.options.slidesToShow; s < n; s++) {
            e.$slides.eq(s).attr("tabindex", 0);
        }
        e.activateADA();
    }, e.prototype.initArrowEvents = function() {
        var i = this;
        !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && (i.$prevArrow.off("click.slick").on("click.slick", {
            message: "previous"
        }, i.changeSlide), i.$nextArrow.off("click.slick").on("click.slick", {
            message: "next"
        }, i.changeSlide), !0 === i.options.accessibility && (i.$prevArrow.on("keydown.slick", i.keyHandler), i.$nextArrow.on("keydown.slick", i.keyHandler)));
    }, e.prototype.initDotEvents = function() {
        var e = this;
        !0 === e.options.dots && (i("li", e.$dots).on("click.slick", {
            message: "index"
        }, e.changeSlide), !0 === e.options.accessibility && e.$dots.on("keydown.slick", e.keyHandler)), !0 === e.options.dots && !0 === e.options.pauseOnDotsHover && i("li", e.$dots).on("mouseenter.slick", i.proxy(e.interrupt, e, !0)).on("mouseleave.slick", i.proxy(e.interrupt, e, !1));
    }, e.prototype.initSlideEvents = function() {
        var e = this;
        e.options.pauseOnHover && (e.$list.on("mouseenter.slick", i.proxy(e.interrupt, e, !0)), e.$list.on("mouseleave.slick", i.proxy(e.interrupt, e, !1)));
    }, e.prototype.initializeEvents = function() {
        var e = this;
        e.initArrowEvents(), e.initDotEvents(), e.initSlideEvents(), e.$list.on("touchstart.slick mousedown.slick", {
            action: "start"
        }, e.swipeHandler), e.$list.on("touchmove.slick mousemove.slick", {
            action: "move"
        }, e.swipeHandler), e.$list.on("touchend.slick mouseup.slick", {
            action: "end"
        }, e.swipeHandler), e.$list.on("touchcancel.slick mouseleave.slick", {
            action: "end"
        }, e.swipeHandler), e.$list.on("click.slick", e.clickHandler), i(document).on(e.visibilityChange, i.proxy(e.visibility, e)), !0 === e.options.accessibility && e.$list.on("keydown.slick", e.keyHandler), !0 === e.options.focusOnSelect && i(e.$slideTrack).children().on("click.slick", e.selectHandler), i(window).on("orientationchange.slick.slick-" + e.instanceUid, i.proxy(e.orientationChange, e)), i(window).on("resize.slick.slick-" + e.instanceUid, i.proxy(e.resize, e)), i("[draggable!=true]", e.$slideTrack).on("dragstart", e.preventDefault), i(window).on("load.slick.slick-" + e.instanceUid, e.setPosition), i(e.setPosition);
    }, e.prototype.initUI = function() {
        var i = this;
        !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && (i.$prevArrow.show(), i.$nextArrow.show()), !0 === i.options.dots && i.slideCount > i.options.slidesToShow && i.$dots.show();
    }, e.prototype.keyHandler = function(i) {
        var e = this;
        i.target.tagName.match("TEXTAREA|INPUT|SELECT") || (37 === i.keyCode && !0 === e.options.accessibility ? e.changeSlide({
            data: {
                message: !0 === e.options.rtl ? "next" : "previous"
            }
        }) : 39 === i.keyCode && !0 === e.options.accessibility && e.changeSlide({
            data: {
                message: !0 === e.options.rtl ? "previous" : "next"
            }
        }));
    }, e.prototype.lazyLoad = function() {
        function e(e) {
            i("img[data-lazy]", e).each(function() {
                var e = i(this),
                    t = i(this).attr("data-lazy"),
                    o = i(this).attr("data-srcset"),
                    s = i(this).attr("data-sizes") || n.$slider.attr("data-sizes"),
                    r = document.createElement("img");
                r.onload = function() {
                    e.animate({
                        opacity: 0
                    }, 100, function() {
                        o && (e.attr("srcset", o), s && e.attr("sizes", s)), e.attr("src", t).animate({
                            opacity: 1
                        }, 200, function() {
                            e.removeAttr("data-lazy data-srcset data-sizes").removeClass("slick-loading");
                        }), n.$slider.trigger("lazyLoaded", [n, e, t]);
                    });
                }, r.onerror = function() {
                    e.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"), n.$slider.trigger("lazyLoadError", [n, e, t]);
                }, r.src = t;
            });
        }
        var t, o, s, n = this;
        if (!0 === n.options.centerMode ? !0 === n.options.infinite ? s = (o = n.currentSlide + (n.options.slidesToShow / 2 + 1)) + n.options.slidesToShow + 2 : (o = Math.max(0, n.currentSlide - (n.options.slidesToShow / 2 + 1)), s = n.options.slidesToShow / 2 + 1 + 2 + n.currentSlide) : (o = n.options.infinite ? n.options.slidesToShow + n.currentSlide : n.currentSlide, s = Math.ceil(o + n.options.slidesToShow), !0 === n.options.fade && (o > 0 && o--, s <= n.slideCount && s++)), t = n.$slider.find(".slick-slide").slice(o, s), "anticipated" === n.options.lazyLoad)
            for (var r = o - 1, l = s, d = n.$slider.find(".slick-slide"), a = 0; a < n.options.slidesToScroll; a++) {
                r < 0 && (r = n.slideCount - 1), t = (t = t.add(d.eq(r))).add(d.eq(l)), r--, l++;
            }
        e(t), n.slideCount <= n.options.slidesToShow ? e(n.$slider.find(".slick-slide")) : n.currentSlide >= n.slideCount - n.options.slidesToShow ? e(n.$slider.find(".slick-cloned").slice(0, n.options.slidesToShow)) : 0 === n.currentSlide && e(n.$slider.find(".slick-cloned").slice(-1 * n.options.slidesToShow));
    }, e.prototype.loadSlider = function() {
        var i = this;
        i.setPosition(), i.$slideTrack.css({
            opacity: 1
        }), i.$slider.removeClass("slick-loading"), i.initUI(), "progressive" === i.options.lazyLoad && i.progressiveLazyLoad();
    }, e.prototype.next = e.prototype.slickNext = function() {
        this.changeSlide({
            data: {
                message: "next"
            }
        });
    }, e.prototype.orientationChange = function() {
        var i = this;
        i.checkResponsive(), i.setPosition();
    }, e.prototype.pause = e.prototype.slickPause = function() {
        var i = this;
        i.autoPlayClear(), i.paused = !0;
    }, e.prototype.play = e.prototype.slickPlay = function() {
        var i = this;
        i.autoPlay(), i.options.autoplay = !0, i.paused = !1, i.focussed = !1, i.interrupted = !1;
    }, e.prototype.postSlide = function(e) {
        var t = this;
        t.unslicked || (t.$slider.trigger("afterChange", [t, e]), t.animating = !1, t.slideCount > t.options.slidesToShow && t.setPosition(), t.swipeLeft = null, t.options.autoplay && t.autoPlay(), !0 === t.options.accessibility && (t.initADA(), t.options.focusOnChange && i(t.$slides.get(t.currentSlide)).attr("tabindex", 0).focus()));
    }, e.prototype.prev = e.prototype.slickPrev = function() {
        this.changeSlide({
            data: {
                message: "previous"
            }
        });
    }, e.prototype.preventDefault = function(i) {
        i.preventDefault();
    }, e.prototype.progressiveLazyLoad = function(e) {
        e = e || 1;
        var t, o, s, n, r, l = this,
            d = i("img[data-lazy]", l.$slider);
        d.length ? (t = d.first(), o = t.attr("data-lazy"), s = t.attr("data-srcset"), n = t.attr("data-sizes") || l.$slider.attr("data-sizes"), (r = document.createElement("img")).onload = function() {
            s && (t.attr("srcset", s), n && t.attr("sizes", n)), t.attr("src", o).removeAttr("data-lazy data-srcset data-sizes").removeClass("slick-loading"), !0 === l.options.adaptiveHeight && l.setPosition(), l.$slider.trigger("lazyLoaded", [l, t, o]), l.progressiveLazyLoad();
        }, r.onerror = function() {
            e < 3 ? setTimeout(function() {
                l.progressiveLazyLoad(e + 1);
            }, 500) : (t.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"), l.$slider.trigger("lazyLoadError", [l, t, o]), l.progressiveLazyLoad());
        }, r.src = o) : l.$slider.trigger("allImagesLoaded", [l]);
    }, e.prototype.refresh = function(e) {
        var t, o, s = this;
        o = s.slideCount - s.options.slidesToShow, !s.options.infinite && s.currentSlide > o && (s.currentSlide = o), s.slideCount <= s.options.slidesToShow && (s.currentSlide = 0), t = s.currentSlide, s.destroy(!0), i.extend(s, s.initials, {
            currentSlide: t
        }), s.init(), e || s.changeSlide({
            data: {
                message: "index",
                index: t
            }
        }, !1);
    }, e.prototype.registerBreakpoints = function() {
        var e, t, o, s = this,
            n = s.options.responsive || null;
        if ("array" === i.type(n) && n.length) {
            s.respondTo = s.options.respondTo || "window";
            for (e in n) {
                if (o = s.breakpoints.length - 1, n.hasOwnProperty(e)) {
                    for (t = n[e].breakpoint; o >= 0;) {
                        s.breakpoints[o] && s.breakpoints[o] === t && s.breakpoints.splice(o, 1), o--;
                    }
                    s.breakpoints.push(t), s.breakpointSettings[t] = n[e].settings;
                }
            }
            s.breakpoints.sort(function(i, e) {
                return s.options.mobileFirst ? i - e : e - i;
            });
        }
    }, e.prototype.reinit = function() {
        var e = this;
        e.$slides = e.$slideTrack.children(e.options.slide).addClass("slick-slide"), e.slideCount = e.$slides.length, e.currentSlide >= e.slideCount && 0 !== e.currentSlide && (e.currentSlide = e.currentSlide - e.options.slidesToScroll), e.slideCount <= e.options.slidesToShow && (e.currentSlide = 0), e.registerBreakpoints(), e.setProps(), e.setupInfinite(), e.buildArrows(), e.updateArrows(), e.initArrowEvents(), e.buildDots(), e.updateDots(), e.initDotEvents(), e.cleanUpSlideEvents(), e.initSlideEvents(), e.checkResponsive(!1, !0), !0 === e.options.focusOnSelect && i(e.$slideTrack).children().on("click.slick", e.selectHandler), e.setSlideClasses("number" == typeof e.currentSlide ? e.currentSlide : 0), e.setPosition(), e.focusHandler(), e.paused = !e.options.autoplay, e.autoPlay(), e.$slider.trigger("reInit", [e]);
    }, e.prototype.resize = function() {
        var e = this;
        i(window).width() !== e.windowWidth && (clearTimeout(e.windowDelay), e.windowDelay = window.setTimeout(function() {
            e.windowWidth = i(window).width(), e.checkResponsive(), e.unslicked || e.setPosition();
        }, 50));
    }, e.prototype.removeSlide = e.prototype.slickRemove = function(i, e, t) {
        var o = this;
        if (i = "boolean" == typeof i ? !0 === (e = i) ? 0 : o.slideCount - 1 : !0 === e ? --i : i, o.slideCount < 1 || i < 0 || i > o.slideCount - 1) return !1;
        o.unload(), !0 === t ? o.$slideTrack.children().remove() : o.$slideTrack.children(this.options.slide).eq(i).remove(), o.$slides = o.$slideTrack.children(this.options.slide), o.$slideTrack.children(this.options.slide).detach(), o.$slideTrack.append(o.$slides), o.$slidesCache = o.$slides, o.reinit();
    }, e.prototype.setCSS = function(i) {
        var e, t, o = this,
            s = {};
        !0 === o.options.rtl && (i = -i), e = "left" == o.positionProp ? Math.ceil(i) + "px" : "0px", t = "top" == o.positionProp ? Math.ceil(i) + "px" : "0px", s[o.positionProp] = i, !1 === o.transformsEnabled ? o.$slideTrack.css(s) : (s = {}, !1 === o.cssTransitions ? (s[o.animType] = "translate(" + e + ", " + t + ")", o.$slideTrack.css(s)) : (s[o.animType] = "translate3d(" + e + ", " + t + ", 0px)", o.$slideTrack.css(s)));
    }, e.prototype.setDimensions = function() {
        var i = this;
        !1 === i.options.vertical ? !0 === i.options.centerMode && i.$list.css({
            padding: "0px " + i.options.centerPadding
        }) : (i.$list.height(i.$slides.first().outerHeight(!0) * i.options.slidesToShow), !0 === i.options.centerMode && i.$list.css({
            padding: i.options.centerPadding + " 0px"
        })), i.listWidth = i.$list.width(), i.listHeight = i.$list.height(), !1 === i.options.vertical && !1 === i.options.variableWidth ? (i.slideWidth = Math.ceil(i.listWidth / i.options.slidesToShow), i.$slideTrack.width(Math.ceil(i.slideWidth * i.$slideTrack.children(".slick-slide").length))) : !0 === i.options.variableWidth ? i.$slideTrack.width(5e3 * i.slideCount) : (i.slideWidth = Math.ceil(i.listWidth), i.$slideTrack.height(Math.ceil(i.$slides.first().outerHeight(!0) * i.$slideTrack.children(".slick-slide").length)));
        var e = i.$slides.first().outerWidth(!0) - i.$slides.first().width();
        !1 === i.options.variableWidth && i.$slideTrack.children(".slick-slide").width(i.slideWidth - e);
    }, e.prototype.setFade = function() {
        var e, t = this;
        t.$slides.each(function(o, s) {
            e = t.slideWidth * o * -1, !0 === t.options.rtl ? i(s).css({
                position: "relative",
                right: e,
                top: 0,
                zIndex: t.options.zIndex - 2,
                opacity: 0
            }) : i(s).css({
                position: "relative",
                left: e,
                top: 0,
                zIndex: t.options.zIndex - 2,
                opacity: 0
            });
        }), t.$slides.eq(t.currentSlide).css({
            zIndex: t.options.zIndex - 1,
            opacity: 1
        });
    }, e.prototype.setHeight = function() {
        var i = this;
        if (1 === i.options.slidesToShow && !0 === i.options.adaptiveHeight && !1 === i.options.vertical) {
            var e = i.$slides.eq(i.currentSlide).outerHeight(!0);
            i.$list.css("height", e);
        }
    }, e.prototype.setOption = e.prototype.slickSetOption = function() {
        var e, t, o, s, n, r = this,
            l = !1;
        if ("object" === i.type(arguments[0]) ? (o = arguments[0], l = arguments[1], n = "multiple") : "string" === i.type(arguments[0]) && (o = arguments[0], s = arguments[1], l = arguments[2], "responsive" === arguments[0] && "array" === i.type(arguments[1]) ? n = "responsive" : void 0 !== arguments[1] && (n = "single")), "single" === n) r.options[o] = s;
        else if ("multiple" === n) i.each(o, function(i, e) {
            r.options[i] = e;
        });
        else if ("responsive" === n)
            for (t in s) {
                if ("array" !== i.type(r.options.responsive)) r.options.responsive = [s[t]];
                else {
                    for (e = r.options.responsive.length - 1; e >= 0;) {
                        r.options.responsive[e].breakpoint === s[t].breakpoint && r.options.responsive.splice(e, 1), e--;
                    }
                    r.options.responsive.push(s[t]);
                }
            }
        l && (r.unload(), r.reinit());
    }, e.prototype.setPosition = function() {
        var i = this;
        i.setDimensions(), i.setHeight(), !1 === i.options.fade ? i.setCSS(i.getLeft(i.currentSlide)) : i.setFade(), i.$slider.trigger("setPosition", [i]);
    }, e.prototype.setProps = function() {
        var i = this,
            e = document.body.style;
        i.positionProp = !0 === i.options.vertical ? "top" : "left", "top" === i.positionProp ? i.$slider.addClass("slick-vertical") : i.$slider.removeClass("slick-vertical"), void 0 === e.WebkitTransition && void 0 === e.MozTransition && void 0 === e.msTransition || !0 === i.options.useCSS && (i.cssTransitions = !0), i.options.fade && ("number" == typeof i.options.zIndex ? i.options.zIndex < 3 && (i.options.zIndex = 3) : i.options.zIndex = i.defaults.zIndex), void 0 !== e.OTransform && (i.animType = "OTransform", i.transformType = "-o-transform", i.transitionType = "OTransition", void 0 === e.perspectiveProperty && void 0 === e.webkitPerspective && (i.animType = !1)), void 0 !== e.MozTransform && (i.animType = "MozTransform", i.transformType = "-moz-transform", i.transitionType = "MozTransition", void 0 === e.perspectiveProperty && void 0 === e.MozPerspective && (i.animType = !1)), void 0 !== e.webkitTransform && (i.animType = "webkitTransform", i.transformType = "-webkit-transform", i.transitionType = "webkitTransition", void 0 === e.perspectiveProperty && void 0 === e.webkitPerspective && (i.animType = !1)), void 0 !== e.msTransform && (i.animType = "msTransform", i.transformType = "-ms-transform", i.transitionType = "msTransition", void 0 === e.msTransform && (i.animType = !1)), void 0 !== e.transform && !1 !== i.animType && (i.animType = "transform", i.transformType = "transform", i.transitionType = "transition"), i.transformsEnabled = i.options.useTransform && null !== i.animType && !1 !== i.animType;
    }, e.prototype.setSlideClasses = function(i) {
        var e, t, o, s, n = this;
        if (t = n.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden", "true"), n.$slides.eq(i).addClass("slick-current"), !0 === n.options.centerMode) {
            var r = n.options.slidesToShow % 2 == 0 ? 1 : 0;
            e = Math.floor(n.options.slidesToShow / 2), !0 === n.options.infinite && (i >= e && i <= n.slideCount - 1 - e ? n.$slides.slice(i - e + r, i + e + 1).addClass("slick-active").attr("aria-hidden", "false") : (o = n.options.slidesToShow + i, t.slice(o - e + 1 + r, o + e + 2).addClass("slick-active").attr("aria-hidden", "false")), 0 === i ? t.eq(t.length - 1 - n.options.slidesToShow).addClass("slick-center") : i === n.slideCount - 1 && t.eq(n.options.slidesToShow).addClass("slick-center")), n.$slides.eq(i).addClass("slick-center");
        } else i >= 0 && i <= n.slideCount - n.options.slidesToShow ? n.$slides.slice(i, i + n.options.slidesToShow).addClass("slick-active").attr("aria-hidden", "false") : t.length <= n.options.slidesToShow ? t.addClass("slick-active").attr("aria-hidden", "false") : (s = n.slideCount % n.options.slidesToShow, o = !0 === n.options.infinite ? n.options.slidesToShow + i : i, n.options.slidesToShow == n.options.slidesToScroll && n.slideCount - i < n.options.slidesToShow ? t.slice(o - (n.options.slidesToShow - s), o + s).addClass("slick-active").attr("aria-hidden", "false") : t.slice(o, o + n.options.slidesToShow).addClass("slick-active").attr("aria-hidden", "false"));
        "ondemand" !== n.options.lazyLoad && "anticipated" !== n.options.lazyLoad || n.lazyLoad();
    }, e.prototype.setupInfinite = function() {
        var e, t, o, s = this;
        if (!0 === s.options.fade && (s.options.centerMode = !1), !0 === s.options.infinite && !1 === s.options.fade && (t = null, s.slideCount > s.options.slidesToShow)) {
            for (o = !0 === s.options.centerMode ? s.options.slidesToShow + 1 : s.options.slidesToShow, e = s.slideCount; e > s.slideCount - o; e -= 1) {
                t = e - 1, i(s.$slides[t]).clone(!0).attr("id", "").attr("data-slick-index", t - s.slideCount).prependTo(s.$slideTrack).addClass("slick-cloned");
            }
            for (e = 0; e < o + s.slideCount; e += 1) {
                t = e, i(s.$slides[t]).clone(!0).attr("id", "").attr("data-slick-index", t + s.slideCount).appendTo(s.$slideTrack).addClass("slick-cloned");
            }
            s.$slideTrack.find(".slick-cloned").find("[id]").each(function() {
                i(this).attr("id", "");
            });
        }
    }, e.prototype.interrupt = function(i) {
        var e = this;
        i || e.autoPlay(), e.interrupted = i;
    }, e.prototype.selectHandler = function(e) {
        var t = this,
            o = i(e.target).is(".slick-slide") ? i(e.target) : i(e.target).parents(".slick-slide"),
            s = parseInt(o.attr("data-slick-index"));
        s || (s = 0), t.slideCount <= t.options.slidesToShow ? t.slideHandler(s, !1, !0) : t.slideHandler(s);
    }, e.prototype.slideHandler = function(i, e, t) {
        var o, s, n, r, l, d = null,
            a = this;
        if (e = e || !1, !(!0 === a.animating && !0 === a.options.waitForAnimate || !0 === a.options.fade && a.currentSlide === i))
            if (!1 === e && a.asNavFor(i), o = i, d = a.getLeft(o), r = a.getLeft(a.currentSlide), a.currentLeft = null === a.swipeLeft ? r : a.swipeLeft, !1 === a.options.infinite && !1 === a.options.centerMode && (i < 0 || i > a.getDotCount() * a.options.slidesToScroll)) !1 === a.options.fade && (o = a.currentSlide, !0 !== t ? a.animateSlide(r, function() {
                a.postSlide(o);
            }) : a.postSlide(o));
            else if (!1 === a.options.infinite && !0 === a.options.centerMode && (i < 0 || i > a.slideCount - a.options.slidesToScroll)) !1 === a.options.fade && (o = a.currentSlide, !0 !== t ? a.animateSlide(r, function() {
            a.postSlide(o);
        }) : a.postSlide(o));
        else {
            if (a.options.autoplay && clearInterval(a.autoPlayTimer), s = o < 0 ? a.slideCount % a.options.slidesToScroll != 0 ? a.slideCount - a.slideCount % a.options.slidesToScroll : a.slideCount + o : o >= a.slideCount ? a.slideCount % a.options.slidesToScroll != 0 ? 0 : o - a.slideCount : o, a.animating = !0, a.$slider.trigger("beforeChange", [a, a.currentSlide, s]), n = a.currentSlide, a.currentSlide = s, a.setSlideClasses(a.currentSlide), a.options.asNavFor && (l = (l = a.getNavTarget()).slick("getSlick")).slideCount <= l.options.slidesToShow && l.setSlideClasses(a.currentSlide), a.updateDots(), a.updateArrows(), !0 === a.options.fade) return !0 !== t ? (a.fadeSlideOut(n), a.fadeSlide(s, function() {
                a.postSlide(s);
            })) : a.postSlide(s), void a.animateHeight();
            !0 !== t ? a.animateSlide(d, function() {
                a.postSlide(s);
            }) : a.postSlide(s);
        }
    }, e.prototype.startLoad = function() {
        var i = this;
        !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && (i.$prevArrow.hide(), i.$nextArrow.hide()), !0 === i.options.dots && i.slideCount > i.options.slidesToShow && i.$dots.hide(), i.$slider.addClass("slick-loading");
    }, e.prototype.swipeDirection = function() {
        var i, e, t, o, s = this;
        return i = s.touchObject.startX - s.touchObject.curX, e = s.touchObject.startY - s.touchObject.curY, t = Math.atan2(e, i), (o = Math.round(180 * t / Math.PI)) < 0 && (o = 360 - Math.abs(o)), o <= 45 && o >= 0 ? !1 === s.options.rtl ? "left" : "right" : o <= 360 && o >= 315 ? !1 === s.options.rtl ? "left" : "right" : o >= 135 && o <= 225 ? !1 === s.options.rtl ? "right" : "left" : !0 === s.options.verticalSwiping ? o >= 35 && o <= 135 ? "down" : "up" : "vertical";
    }, e.prototype.swipeEnd = function(i) {
        var e, t, o = this;
        if (o.dragging = !1, o.swiping = !1, o.scrolling) return o.scrolling = !1, !1;
        if (o.interrupted = !1, o.shouldClick = !(o.touchObject.swipeLength > 10), void 0 === o.touchObject.curX) return !1;
        if (!0 === o.touchObject.edgeHit && o.$slider.trigger("edge", [o, o.swipeDirection()]), o.touchObject.swipeLength >= o.touchObject.minSwipe) {
            switch (t = o.swipeDirection()) {
                case "left":
                case "down":
                    e = o.options.swipeToSlide ? o.checkNavigable(o.currentSlide + o.getSlideCount()) : o.currentSlide + o.getSlideCount(), o.currentDirection = 0;
                    break;
                case "right":
                case "up":
                    e = o.options.swipeToSlide ? o.checkNavigable(o.currentSlide - o.getSlideCount()) : o.currentSlide - o.getSlideCount(), o.currentDirection = 1;
            }
            "vertical" != t && (o.slideHandler(e), o.touchObject = {}, o.$slider.trigger("swipe", [o, t]));
        } else o.touchObject.startX !== o.touchObject.curX && (o.slideHandler(o.currentSlide), o.touchObject = {});
    }, e.prototype.swipeHandler = function(i) {
        var e = this;
        if (!(!1 === e.options.swipe || "ontouchend" in document && !1 === e.options.swipe || !1 === e.options.draggable && -1 !== i.type.indexOf("mouse"))) switch (e.touchObject.fingerCount = i.originalEvent && void 0 !== i.originalEvent.touches ? i.originalEvent.touches.length : 1, e.touchObject.minSwipe = e.listWidth / e.options.touchThreshold, !0 === e.options.verticalSwiping && (e.touchObject.minSwipe = e.listHeight / e.options.touchThreshold), i.data.action) {
            case "start":
                e.swipeStart(i);
                break;
            case "move":
                e.swipeMove(i);
                break;
            case "end":
                e.swipeEnd(i);
        }
    }, e.prototype.swipeMove = function(i) {
        var e, t, o, s, n, r, l = this;
        return n = void 0 !== i.originalEvent ? i.originalEvent.touches : null, !(!l.dragging || l.scrolling || n && 1 !== n.length) && (e = l.getLeft(l.currentSlide), l.touchObject.curX = void 0 !== n ? n[0].pageX : i.clientX, l.touchObject.curY = void 0 !== n ? n[0].pageY : i.clientY, l.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(l.touchObject.curX - l.touchObject.startX, 2))), r = Math.round(Math.sqrt(Math.pow(l.touchObject.curY - l.touchObject.startY, 2))), !l.options.verticalSwiping && !l.swiping && r > 4 ? (l.scrolling = !0, !1) : (!0 === l.options.verticalSwiping && (l.touchObject.swipeLength = r), t = l.swipeDirection(), void 0 !== i.originalEvent && l.touchObject.swipeLength > 4 && (l.swiping = !0, i.preventDefault()), s = (!1 === l.options.rtl ? 1 : -1) * (l.touchObject.curX > l.touchObject.startX ? 1 : -1), !0 === l.options.verticalSwiping && (s = l.touchObject.curY > l.touchObject.startY ? 1 : -1), o = l.touchObject.swipeLength, l.touchObject.edgeHit = !1, !1 === l.options.infinite && (0 === l.currentSlide && "right" === t || l.currentSlide >= l.getDotCount() && "left" === t) && (o = l.touchObject.swipeLength * l.options.edgeFriction, l.touchObject.edgeHit = !0), !1 === l.options.vertical ? l.swipeLeft = e + o * s : l.swipeLeft = e + o * (l.$list.height() / l.listWidth) * s, !0 === l.options.verticalSwiping && (l.swipeLeft = e + o * s), !0 !== l.options.fade && !1 !== l.options.touchMove && (!0 === l.animating ? (l.swipeLeft = null, !1) : void l.setCSS(l.swipeLeft))));
    }, e.prototype.swipeStart = function(i) {
        var e, t = this;
        if (t.interrupted = !0, 1 !== t.touchObject.fingerCount || t.slideCount <= t.options.slidesToShow) return t.touchObject = {}, !1;
        void 0 !== i.originalEvent && void 0 !== i.originalEvent.touches && (e = i.originalEvent.touches[0]), t.touchObject.startX = t.touchObject.curX = void 0 !== e ? e.pageX : i.clientX, t.touchObject.startY = t.touchObject.curY = void 0 !== e ? e.pageY : i.clientY, t.dragging = !0;
    }, e.prototype.unfilterSlides = e.prototype.slickUnfilter = function() {
        var i = this;
        null !== i.$slidesCache && (i.unload(), i.$slideTrack.children(this.options.slide).detach(), i.$slidesCache.appendTo(i.$slideTrack), i.reinit());
    }, e.prototype.unload = function() {
        var e = this;
        i(".slick-cloned", e.$slider).remove(), e.$dots && e.$dots.remove(), e.$prevArrow && e.htmlExpr.test(e.options.prevArrow) && e.$prevArrow.remove(), e.$nextArrow && e.htmlExpr.test(e.options.nextArrow) && e.$nextArrow.remove(), e.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden", "true").css("width", "");
    }, e.prototype.unslick = function(i) {
        var e = this;
        e.$slider.trigger("unslick", [e, i]), e.destroy();
    }, e.prototype.updateArrows = function() {
        var i = this;
        Math.floor(i.options.slidesToShow / 2), !0 === i.options.arrows && i.slideCount > i.options.slidesToShow && !i.options.infinite && (i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false"), i.$nextArrow.removeClass("slick-disabled").attr("aria-disabled", "false"), 0 === i.currentSlide ? (i.$prevArrow.addClass("slick-disabled").attr("aria-disabled", "true"), i.$nextArrow.removeClass("slick-disabled").attr("aria-disabled", "false")) : i.currentSlide >= i.slideCount - i.options.slidesToShow && !1 === i.options.centerMode ? (i.$nextArrow.addClass("slick-disabled").attr("aria-disabled", "true"), i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false")) : i.currentSlide >= i.slideCount - 1 && !0 === i.options.centerMode && (i.$nextArrow.addClass("slick-disabled").attr("aria-disabled", "true"), i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false")));
    }, e.prototype.updateDots = function() {
        var i = this;
        null !== i.$dots && (i.$dots.find("li").removeClass("slick-active").end(), i.$dots.find("li").eq(Math.floor(i.currentSlide / i.options.slidesToScroll)).addClass("slick-active"));
    }, e.prototype.visibility = function() {
        var i = this;
        i.options.autoplay && (document[i.hidden] ? i.interrupted = !0 : i.interrupted = !1);
    }, i.fn.slick = function() {
        var i, t, o = this,
            s = arguments[0],
            n = Array.prototype.slice.call(arguments, 1),
            r = o.length;
        for (i = 0; i < r; i++) {
            if ("object" == (typeof s === "undefined" ? "undefined" : _typeof(s)) || void 0 === s ? o[i].slick = new e(o[i], s) : t = o[i].slick[s].apply(o[i].slick, n), void 0 !== t) return t;
        }
        return o;
    };
});
"use strict";
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
}; /*! tooltipster v4.2.6 */
! function(a, b) {
    "function" == typeof define && define.amd ? define(["jquery"], function(a) {
        return b(a);
    }) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = b(require("jquery")) : b(jQuery);
}(undefined, function(a) {
    function b(a) {
        this.$container, this.constraints = null, this.__$tooltip, this.__init(a);
    }

    function c(b, c) {
        var d = !0;
        return a.each(b, function(a, e) {
            return void 0 === c[a] || b[a] !== c[a] ? (d = !1, !1) : void 0;
        }), d;
    }

    function d(b) {
        var c = b.attr("id"),
            d = c ? h.window.document.getElementById(c) : null;
        return d ? d === b[0] : a.contains(h.window.document.body, b[0]);
    }

    function e() {
        if (!g) return !1;
        var a = g.document.body || g.document.documentElement,
            b = a.style,
            c = "transition",
            d = ["Moz", "Webkit", "Khtml", "O", "ms"];
        if ("string" == typeof b[c]) return !0;
        c = c.charAt(0).toUpperCase() + c.substr(1);
        for (var e = 0; e < d.length; e++) {
            if ("string" == typeof b[d[e] + c]) return !0;
        }
        return !1;
    }
    var f = {
            animation: "fade",
            animationDuration: 350,
            content: null,
            contentAsHTML: !1,
            contentCloning: !1,
            debug: !0,
            delay: 300,
            delayTouch: [300, 500],
            functionInit: null,
            functionBefore: null,
            functionReady: null,
            functionAfter: null,
            functionFormat: null,
            IEmin: 6,
            interactive: !1,
            multiple: !1,
            parent: null,
            plugins: ["sideTip"],
            repositionOnScroll: !1,
            restoration: "none",
            selfDestruction: !0,
            theme: [],
            timer: 0,
            trackerInterval: 500,
            trackOrigin: !1,
            trackTooltip: !1,
            trigger: "hover",
            triggerClose: {
                click: !1,
                mouseleave: !1,
                originClick: !1,
                scroll: !1,
                tap: !1,
                touchleave: !1
            },
            triggerOpen: {
                click: !1,
                mouseenter: !1,
                tap: !1,
                touchstart: !1
            },
            updateAnimation: "rotate",
            zIndex: 9999999
        },
        g = "undefined" != typeof window ? window : null,
        h = {
            hasTouchCapability: !(!g || !("ontouchstart" in g || g.DocumentTouch && g.document instanceof g.DocumentTouch || g.navigator.maxTouchPoints)),
            hasTransitions: e(),
            IE: !1,
            semVer: "4.2.6",
            window: g
        },
        i = function i() {
            this.__$emitterPrivate = a({}), this.__$emitterPublic = a({}), this.__instancesLatestArr = [], this.__plugins = {}, this._env = h;
        };
    i.prototype = {
        __bridge: function __bridge(b, c, d) {
            if (!c[d]) {
                var e = function e() {};
                e.prototype = b;
                var g = new e();
                g.__init && g.__init(c), a.each(b, function(a, b) {
                    0 != a.indexOf("__") && (c[a] ? f.debug && console.log("The " + a + " method of the " + d + " plugin conflicts with another plugin or native methods") : (c[a] = function() {
                        return g[a].apply(g, Array.prototype.slice.apply(arguments));
                    }, c[a].bridged = g));
                }), c[d] = g;
            }
            return this;
        },
        __setWindow: function __setWindow(a) {
            return h.window = a, this;
        },
        _getRuler: function _getRuler(a) {
            return new b(a);
        },
        _off: function _off() {
            return this.__$emitterPrivate.off.apply(this.__$emitterPrivate, Array.prototype.slice.apply(arguments)), this;
        },
        _on: function _on() {
            return this.__$emitterPrivate.on.apply(this.__$emitterPrivate, Array.prototype.slice.apply(arguments)), this;
        },
        _one: function _one() {
            return this.__$emitterPrivate.one.apply(this.__$emitterPrivate, Array.prototype.slice.apply(arguments)), this;
        },
        _plugin: function _plugin(b) {
            var c = this;
            if ("string" == typeof b) {
                var d = b,
                    e = null;
                return d.indexOf(".") > 0 ? e = c.__plugins[d] : a.each(c.__plugins, function(a, b) {
                    return b.name.substring(b.name.length - d.length - 1) == "." + d ? (e = b, !1) : void 0;
                }), e;
            }
            if (b.name.indexOf(".") < 0) throw new Error("Plugins must be namespaced");
            return c.__plugins[b.name] = b, b.core && c.__bridge(b.core, c, b.name), this;
        },
        _trigger: function _trigger() {
            var a = Array.prototype.slice.apply(arguments);
            return "string" == typeof a[0] && (a[0] = {
                type: a[0]
            }), this.__$emitterPrivate.trigger.apply(this.__$emitterPrivate, a), this.__$emitterPublic.trigger.apply(this.__$emitterPublic, a), this;
        },
        instances: function instances(b) {
            var c = [],
                d = b || ".tooltipstered";
            return a(d).each(function() {
                var b = a(this),
                    d = b.data("tooltipster-ns");
                d && a.each(d, function(a, d) {
                    c.push(b.data(d));
                });
            }), c;
        },
        instancesLatest: function instancesLatest() {
            return this.__instancesLatestArr;
        },
        off: function off() {
            return this.__$emitterPublic.off.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        },
        on: function on() {
            return this.__$emitterPublic.on.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        },
        one: function one() {
            return this.__$emitterPublic.one.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        },
        origins: function origins(b) {
            var c = b ? b + " " : "";
            return a(c + ".tooltipstered").toArray();
        },
        setDefaults: function setDefaults(b) {
            return a.extend(f, b), this;
        },
        triggerHandler: function triggerHandler() {
            return this.__$emitterPublic.triggerHandler.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        }
    }, a.tooltipster = new i(), a.Tooltipster = function(b, c) {
        this.__callbacks = {
            close: [],
            open: []
        }, this.__closingTime, this.__Content, this.__contentBcr, this.__destroyed = !1, this.__$emitterPrivate = a({}), this.__$emitterPublic = a({}), this.__enabled = !0, this.__garbageCollector, this.__Geometry, this.__lastPosition, this.__namespace = "tooltipster-" + Math.round(1e6 * Math.random()), this.__options, this.__$originParents, this.__pointerIsOverOrigin = !1, this.__previousThemes = [], this.__state = "closed", this.__timeouts = {
            close: [],
            open: null
        }, this.__touchEvents = [], this.__tracker = null, this._$origin, this._$tooltip, this.__init(b, c);
    }, a.Tooltipster.prototype = {
        __init: function __init(b, c) {
            var d = this;
            if (d._$origin = a(b), d.__options = a.extend(!0, {}, f, c), d.__optionsFormat(), !h.IE || h.IE >= d.__options.IEmin) {
                var e = null;
                if (void 0 === d._$origin.data("tooltipster-initialTitle") && (e = d._$origin.attr("title"), void 0 === e && (e = null), d._$origin.data("tooltipster-initialTitle", e)), null !== d.__options.content) d.__contentSet(d.__options.content);
                else {
                    var g, i = d._$origin.attr("data-tooltip-content");
                    i && (g = a(i)), g && g[0] ? d.__contentSet(g.first()) : d.__contentSet(e);
                }
                d._$origin.removeAttr("title").addClass("tooltipstered"), d.__prepareOrigin(), d.__prepareGC(), a.each(d.__options.plugins, function(a, b) {
                    d._plug(b);
                }), h.hasTouchCapability && a(h.window.document.body).on("touchmove." + d.__namespace + "-triggerOpen", function(a) {
                    d._touchRecordEvent(a);
                }), d._on("created", function() {
                    d.__prepareTooltip();
                })._on("repositioned", function(a) {
                    d.__lastPosition = a.position;
                });
            } else d.__options.disabled = !0;
        },
        __contentInsert: function __contentInsert() {
            var a = this,
                b = a._$tooltip.find(".tooltipster-content"),
                c = a.__Content,
                d = function d(a) {
                    c = a;
                };
            return a._trigger({
                type: "format",
                content: a.__Content,
                format: d
            }), a.__options.functionFormat && (c = a.__options.functionFormat.call(a, a, {
                origin: a._$origin[0]
            }, a.__Content)), "string" != typeof c || a.__options.contentAsHTML ? b.empty().append(c) : b.text(c), a;
        },
        __contentSet: function __contentSet(b) {
            return b instanceof a && this.__options.contentCloning && (b = b.clone(!0)), this.__Content = b, this._trigger({
                type: "updated",
                content: b
            }), this;
        },
        __destroyError: function __destroyError() {
            throw new Error("This tooltip has been destroyed and cannot execute your method call.");
        },
        __geometry: function __geometry() {
            var b = this,
                c = b._$origin,
                d = b._$origin.is("area");
            if (d) {
                var e = b._$origin.parent().attr("name");
                c = a('img[usemap="#' + e + '"]');
            }
            var f = c[0].getBoundingClientRect(),
                g = a(h.window.document),
                i = a(h.window),
                j = c,
                k = {
                    available: {
                        document: null,
                        window: null
                    },
                    document: {
                        size: {
                            height: g.height(),
                            width: g.width()
                        }
                    },
                    window: {
                        scroll: {
                            left: h.window.scrollX || h.window.document.documentElement.scrollLeft,
                            top: h.window.scrollY || h.window.document.documentElement.scrollTop
                        },
                        size: {
                            height: i.height(),
                            width: i.width()
                        }
                    },
                    origin: {
                        fixedLineage: !1,
                        offset: {},
                        size: {
                            height: f.bottom - f.top,
                            width: f.right - f.left
                        },
                        usemapImage: d ? c[0] : null,
                        windowOffset: {
                            bottom: f.bottom,
                            left: f.left,
                            right: f.right,
                            top: f.top
                        }
                    }
                };
            if (d) {
                var l = b._$origin.attr("shape"),
                    m = b._$origin.attr("coords");
                if (m && (m = m.split(","), a.map(m, function(a, b) {
                        m[b] = parseInt(a);
                    })), "default" != l) switch (l) {
                    case "circle":
                        var n = m[0],
                            o = m[1],
                            p = m[2],
                            q = o - p,
                            r = n - p;
                        k.origin.size.height = 2 * p, k.origin.size.width = k.origin.size.height, k.origin.windowOffset.left += r, k.origin.windowOffset.top += q;
                        break;
                    case "rect":
                        var s = m[0],
                            t = m[1],
                            u = m[2],
                            v = m[3];
                        k.origin.size.height = v - t, k.origin.size.width = u - s, k.origin.windowOffset.left += s, k.origin.windowOffset.top += t;
                        break;
                    case "poly":
                        for (var w = 0, x = 0, y = 0, z = 0, A = "even", B = 0; B < m.length; B++) {
                            var C = m[B];
                            "even" == A ? (C > y && (y = C, 0 === B && (w = y)), w > C && (w = C), A = "odd") : (C > z && (z = C, 1 == B && (x = z)), x > C && (x = C), A = "even");
                        }
                        k.origin.size.height = z - x, k.origin.size.width = y - w, k.origin.windowOffset.left += w, k.origin.windowOffset.top += x;
                }
            }
            var D = function D(a) {
                k.origin.size.height = a.height, k.origin.windowOffset.left = a.left, k.origin.windowOffset.top = a.top, k.origin.size.width = a.width;
            };
            for (b._trigger({
                    type: "geometry",
                    edit: D,
                    geometry: {
                        height: k.origin.size.height,
                        left: k.origin.windowOffset.left,
                        top: k.origin.windowOffset.top,
                        width: k.origin.size.width
                    }
                }), k.origin.windowOffset.right = k.origin.windowOffset.left + k.origin.size.width, k.origin.windowOffset.bottom = k.origin.windowOffset.top + k.origin.size.height, k.origin.offset.left = k.origin.windowOffset.left + k.window.scroll.left, k.origin.offset.top = k.origin.windowOffset.top + k.window.scroll.top, k.origin.offset.bottom = k.origin.offset.top + k.origin.size.height, k.origin.offset.right = k.origin.offset.left + k.origin.size.width, k.available.document = {
                    bottom: {
                        height: k.document.size.height - k.origin.offset.bottom,
                        width: k.document.size.width
                    },
                    left: {
                        height: k.document.size.height,
                        width: k.origin.offset.left
                    },
                    right: {
                        height: k.document.size.height,
                        width: k.document.size.width - k.origin.offset.right
                    },
                    top: {
                        height: k.origin.offset.top,
                        width: k.document.size.width
                    }
                }, k.available.window = {
                    bottom: {
                        height: Math.max(k.window.size.height - Math.max(k.origin.windowOffset.bottom, 0), 0),
                        width: k.window.size.width
                    },
                    left: {
                        height: k.window.size.height,
                        width: Math.max(k.origin.windowOffset.left, 0)
                    },
                    right: {
                        height: k.window.size.height,
                        width: Math.max(k.window.size.width - Math.max(k.origin.windowOffset.right, 0), 0)
                    },
                    top: {
                        height: Math.max(k.origin.windowOffset.top, 0),
                        width: k.window.size.width
                    }
                };
                "html" != j[0].tagName.toLowerCase();) {
                if ("fixed" == j.css("position")) {
                    k.origin.fixedLineage = !0;
                    break;
                }
                j = j.parent();
            }
            return k;
        },
        __optionsFormat: function __optionsFormat() {
            return "number" == typeof this.__options.animationDuration && (this.__options.animationDuration = [this.__options.animationDuration, this.__options.animationDuration]), "number" == typeof this.__options.delay && (this.__options.delay = [this.__options.delay, this.__options.delay]), "number" == typeof this.__options.delayTouch && (this.__options.delayTouch = [this.__options.delayTouch, this.__options.delayTouch]), "string" == typeof this.__options.theme && (this.__options.theme = [this.__options.theme]), null === this.__options.parent ? this.__options.parent = a(h.window.document.body) : "string" == typeof this.__options.parent && (this.__options.parent = a(this.__options.parent)), "hover" == this.__options.trigger ? (this.__options.triggerOpen = {
                mouseenter: !0,
                touchstart: !0
            }, this.__options.triggerClose = {
                mouseleave: !0,
                originClick: !0,
                touchleave: !0
            }) : "click" == this.__options.trigger && (this.__options.triggerOpen = {
                click: !0,
                tap: !0
            }, this.__options.triggerClose = {
                click: !0,
                tap: !0
            }), this._trigger("options"), this;
        },
        __prepareGC: function __prepareGC() {
            var b = this;
            return b.__options.selfDestruction ? b.__garbageCollector = setInterval(function() {
                var c = new Date().getTime();
                b.__touchEvents = a.grep(b.__touchEvents, function(a, b) {
                    return c - a.time > 6e4;
                }), d(b._$origin) || b.close(function() {
                    b.destroy();
                });
            }, 2e4) : clearInterval(b.__garbageCollector), b;
        },
        __prepareOrigin: function __prepareOrigin() {
            var a = this;
            if (a._$origin.off("." + a.__namespace + "-triggerOpen"), h.hasTouchCapability && a._$origin.on("touchstart." + a.__namespace + "-triggerOpen touchend." + a.__namespace + "-triggerOpen touchcancel." + a.__namespace + "-triggerOpen", function(b) {
                    a._touchRecordEvent(b);
                }), a.__options.triggerOpen.click || a.__options.triggerOpen.tap && h.hasTouchCapability) {
                var b = "";
                a.__options.triggerOpen.click && (b += "click." + a.__namespace + "-triggerOpen "), a.__options.triggerOpen.tap && h.hasTouchCapability && (b += "touchend." + a.__namespace + "-triggerOpen"), a._$origin.on(b, function(b) {
                    a._touchIsMeaningfulEvent(b) && a._open(b);
                });
            }
            if (a.__options.triggerOpen.mouseenter || a.__options.triggerOpen.touchstart && h.hasTouchCapability) {
                var b = "";
                a.__options.triggerOpen.mouseenter && (b += "mouseenter." + a.__namespace + "-triggerOpen "), a.__options.triggerOpen.touchstart && h.hasTouchCapability && (b += "touchstart." + a.__namespace + "-triggerOpen"), a._$origin.on(b, function(b) {
                    !a._touchIsTouchEvent(b) && a._touchIsEmulatedEvent(b) || (a.__pointerIsOverOrigin = !0, a._openShortly(b));
                });
            }
            if (a.__options.triggerClose.mouseleave || a.__options.triggerClose.touchleave && h.hasTouchCapability) {
                var b = "";
                a.__options.triggerClose.mouseleave && (b += "mouseleave." + a.__namespace + "-triggerOpen "), a.__options.triggerClose.touchleave && h.hasTouchCapability && (b += "touchend." + a.__namespace + "-triggerOpen touchcancel." + a.__namespace + "-triggerOpen"), a._$origin.on(b, function(b) {
                    a._touchIsMeaningfulEvent(b) && (a.__pointerIsOverOrigin = !1);
                });
            }
            return a;
        },
        __prepareTooltip: function __prepareTooltip() {
            var b = this,
                c = b.__options.interactive ? "auto" : "";
            return b._$tooltip.attr("id", b.__namespace).css({
                "pointer-events": c,
                zIndex: b.__options.zIndex
            }), a.each(b.__previousThemes, function(a, c) {
                b._$tooltip.removeClass(c);
            }), a.each(b.__options.theme, function(a, c) {
                b._$tooltip.addClass(c);
            }), b.__previousThemes = a.merge([], b.__options.theme), b;
        },
        __scrollHandler: function __scrollHandler(b) {
            var c = this;
            if (c.__options.triggerClose.scroll) c._close(b);
            else if (d(c._$origin) && d(c._$tooltip)) {
                var e = null;
                if (b.target === h.window.document) c.__Geometry.origin.fixedLineage || c.__options.repositionOnScroll && c.reposition(b);
                else {
                    e = c.__geometry();
                    var f = !1;
                    if ("fixed" != c._$origin.css("position") && c.__$originParents.each(function(b, c) {
                            var d = a(c),
                                g = d.css("overflow-x"),
                                h = d.css("overflow-y");
                            if ("visible" != g || "visible" != h) {
                                var i = c.getBoundingClientRect();
                                if ("visible" != g && (e.origin.windowOffset.left < i.left || e.origin.windowOffset.right > i.right)) return f = !0, !1;
                                if ("visible" != h && (e.origin.windowOffset.top < i.top || e.origin.windowOffset.bottom > i.bottom)) return f = !0, !1;
                            }
                            return "fixed" == d.css("position") ? !1 : void 0;
                        }), f) c._$tooltip.css("visibility", "hidden");
                    else if (c._$tooltip.css("visibility", "visible"), c.__options.repositionOnScroll) c.reposition(b);
                    else {
                        var g = e.origin.offset.left - c.__Geometry.origin.offset.left,
                            i = e.origin.offset.top - c.__Geometry.origin.offset.top;
                        c._$tooltip.css({
                            left: c.__lastPosition.coord.left + g,
                            top: c.__lastPosition.coord.top + i
                        });
                    }
                }
                c._trigger({
                    type: "scroll",
                    event: b,
                    geo: e
                });
            }
            return c;
        },
        __stateSet: function __stateSet(a) {
            return this.__state = a, this._trigger({
                type: "state",
                state: a
            }), this;
        },
        __timeoutsClear: function __timeoutsClear() {
            return clearTimeout(this.__timeouts.open), this.__timeouts.open = null, a.each(this.__timeouts.close, function(a, b) {
                clearTimeout(b);
            }), this.__timeouts.close = [], this;
        },
        __trackerStart: function __trackerStart() {
            var a = this,
                b = a._$tooltip.find(".tooltipster-content");
            return a.__options.trackTooltip && (a.__contentBcr = b[0].getBoundingClientRect()), a.__tracker = setInterval(function() {
                if (d(a._$origin) && d(a._$tooltip)) {
                    if (a.__options.trackOrigin) {
                        var e = a.__geometry(),
                            f = !1;
                        c(e.origin.size, a.__Geometry.origin.size) && (a.__Geometry.origin.fixedLineage ? c(e.origin.windowOffset, a.__Geometry.origin.windowOffset) && (f = !0) : c(e.origin.offset, a.__Geometry.origin.offset) && (f = !0)), f || (a.__options.triggerClose.mouseleave ? a._close() : a.reposition());
                    }
                    if (a.__options.trackTooltip) {
                        var g = b[0].getBoundingClientRect();
                        g.height === a.__contentBcr.height && g.width === a.__contentBcr.width || (a.reposition(), a.__contentBcr = g);
                    }
                } else a._close();
            }, a.__options.trackerInterval), a;
        },
        _close: function _close(b, c, d) {
            var e = this,
                f = !0;
            if (e._trigger({
                    type: "close",
                    event: b,
                    stop: function stop() {
                        f = !1;
                    }
                }), f || d) {
                c && e.__callbacks.close.push(c), e.__callbacks.open = [], e.__timeoutsClear();
                var g = function g() {
                    a.each(e.__callbacks.close, function(a, c) {
                        c.call(e, e, {
                            event: b,
                            origin: e._$origin[0]
                        });
                    }), e.__callbacks.close = [];
                };
                if ("closed" != e.__state) {
                    var i = !0,
                        j = new Date(),
                        k = j.getTime(),
                        l = k + e.__options.animationDuration[1];
                    if ("disappearing" == e.__state && l > e.__closingTime && e.__options.animationDuration[1] > 0 && (i = !1), i) {
                        e.__closingTime = l, "disappearing" != e.__state && e.__stateSet("disappearing");
                        var m = function m() {
                            clearInterval(e.__tracker), e._trigger({
                                type: "closing",
                                event: b
                            }), e._$tooltip.off("." + e.__namespace + "-triggerClose").removeClass("tooltipster-dying"), a(h.window).off("." + e.__namespace + "-triggerClose"), e.__$originParents.each(function(b, c) {
                                a(c).off("scroll." + e.__namespace + "-triggerClose");
                            }), e.__$originParents = null, a(h.window.document.body).off("." + e.__namespace + "-triggerClose"), e._$origin.off("." + e.__namespace + "-triggerClose"), e._off("dismissable"), e.__stateSet("closed"), e._trigger({
                                type: "after",
                                event: b
                            }), e.__options.functionAfter && e.__options.functionAfter.call(e, e, {
                                event: b,
                                origin: e._$origin[0]
                            }), g();
                        };
                        h.hasTransitions ? (e._$tooltip.css({
                            "-moz-animation-duration": e.__options.animationDuration[1] + "ms",
                            "-ms-animation-duration": e.__options.animationDuration[1] + "ms",
                            "-o-animation-duration": e.__options.animationDuration[1] + "ms",
                            "-webkit-animation-duration": e.__options.animationDuration[1] + "ms",
                            "animation-duration": e.__options.animationDuration[1] + "ms",
                            "transition-duration": e.__options.animationDuration[1] + "ms"
                        }), e._$tooltip.clearQueue().removeClass("tooltipster-show").addClass("tooltipster-dying"), e.__options.animationDuration[1] > 0 && e._$tooltip.delay(e.__options.animationDuration[1]), e._$tooltip.queue(m)) : e._$tooltip.stop().fadeOut(e.__options.animationDuration[1], m);
                    }
                } else g();
            }
            return e;
        },
        _off: function _off() {
            return this.__$emitterPrivate.off.apply(this.__$emitterPrivate, Array.prototype.slice.apply(arguments)), this;
        },
        _on: function _on() {
            return this.__$emitterPrivate.on.apply(this.__$emitterPrivate, Array.prototype.slice.apply(arguments)), this;
        },
        _one: function _one() {
            return this.__$emitterPrivate.one.apply(this.__$emitterPrivate, Array.prototype.slice.apply(arguments)), this;
        },
        _open: function _open(b, c) {
            var e = this;
            if (!e.__destroying && d(e._$origin) && e.__enabled) {
                var f = !0;
                if ("closed" == e.__state && (e._trigger({
                        type: "before",
                        event: b,
                        stop: function stop() {
                            f = !1;
                        }
                    }), f && e.__options.functionBefore && (f = e.__options.functionBefore.call(e, e, {
                        event: b,
                        origin: e._$origin[0]
                    }))), f !== !1 && null !== e.__Content) {
                    c && e.__callbacks.open.push(c), e.__callbacks.close = [], e.__timeoutsClear();
                    var g, i = function i() {
                        "stable" != e.__state && e.__stateSet("stable"), a.each(e.__callbacks.open, function(a, b) {
                            b.call(e, e, {
                                origin: e._$origin[0],
                                tooltip: e._$tooltip[0]
                            });
                        }), e.__callbacks.open = [];
                    };
                    if ("closed" !== e.__state) g = 0, "disappearing" === e.__state ? (e.__stateSet("appearing"), h.hasTransitions ? (e._$tooltip.clearQueue().removeClass("tooltipster-dying").addClass("tooltipster-show"), e.__options.animationDuration[0] > 0 && e._$tooltip.delay(e.__options.animationDuration[0]), e._$tooltip.queue(i)) : e._$tooltip.stop().fadeIn(i)) : "stable" == e.__state && i();
                    else {
                        if (e.__stateSet("appearing"), g = e.__options.animationDuration[0], e.__contentInsert(), e.reposition(b, !0), h.hasTransitions ? (e._$tooltip.addClass("tooltipster-" + e.__options.animation).addClass("tooltipster-initial").css({
                                "-moz-animation-duration": e.__options.animationDuration[0] + "ms",
                                "-ms-animation-duration": e.__options.animationDuration[0] + "ms",
                                "-o-animation-duration": e.__options.animationDuration[0] + "ms",
                                "-webkit-animation-duration": e.__options.animationDuration[0] + "ms",
                                "animation-duration": e.__options.animationDuration[0] + "ms",
                                "transition-duration": e.__options.animationDuration[0] + "ms"
                            }), setTimeout(function() {
                                "closed" != e.__state && (e._$tooltip.addClass("tooltipster-show").removeClass("tooltipster-initial"), e.__options.animationDuration[0] > 0 && e._$tooltip.delay(e.__options.animationDuration[0]), e._$tooltip.queue(i));
                            }, 0)) : e._$tooltip.css("display", "none").fadeIn(e.__options.animationDuration[0], i), e.__trackerStart(), a(h.window).on("resize." + e.__namespace + "-triggerClose", function(b) {
                                var c = a(document.activeElement);
                                (c.is("input") || c.is("textarea")) && a.contains(e._$tooltip[0], c[0]) || e.reposition(b);
                            }).on("scroll." + e.__namespace + "-triggerClose", function(a) {
                                e.__scrollHandler(a);
                            }), e.__$originParents = e._$origin.parents(), e.__$originParents.each(function(b, c) {
                                a(c).on("scroll." + e.__namespace + "-triggerClose", function(a) {
                                    e.__scrollHandler(a);
                                });
                            }), e.__options.triggerClose.mouseleave || e.__options.triggerClose.touchleave && h.hasTouchCapability) {
                            e._on("dismissable", function(a) {
                                a.dismissable ? a.delay ? (m = setTimeout(function() {
                                    e._close(a.event);
                                }, a.delay), e.__timeouts.close.push(m)) : e._close(a) : clearTimeout(m);
                            });
                            var j = e._$origin,
                                k = "",
                                l = "",
                                m = null;
                            e.__options.interactive && (j = j.add(e._$tooltip)), e.__options.triggerClose.mouseleave && (k += "mouseenter." + e.__namespace + "-triggerClose ", l += "mouseleave." + e.__namespace + "-triggerClose "), e.__options.triggerClose.touchleave && h.hasTouchCapability && (k += "touchstart." + e.__namespace + "-triggerClose", l += "touchend." + e.__namespace + "-triggerClose touchcancel." + e.__namespace + "-triggerClose"), j.on(l, function(a) {
                                if (e._touchIsTouchEvent(a) || !e._touchIsEmulatedEvent(a)) {
                                    var b = "mouseleave" == a.type ? e.__options.delay : e.__options.delayTouch;
                                    e._trigger({
                                        delay: b[1],
                                        dismissable: !0,
                                        event: a,
                                        type: "dismissable"
                                    });
                                }
                            }).on(k, function(a) {
                                !e._touchIsTouchEvent(a) && e._touchIsEmulatedEvent(a) || e._trigger({
                                    dismissable: !1,
                                    event: a,
                                    type: "dismissable"
                                });
                            });
                        }
                        e.__options.triggerClose.originClick && e._$origin.on("click." + e.__namespace + "-triggerClose", function(a) {
                            e._touchIsTouchEvent(a) || e._touchIsEmulatedEvent(a) || e._close(a);
                        }), (e.__options.triggerClose.click || e.__options.triggerClose.tap && h.hasTouchCapability) && setTimeout(function() {
                            if ("closed" != e.__state) {
                                var b = "",
                                    c = a(h.window.document.body);
                                e.__options.triggerClose.click && (b += "click." + e.__namespace + "-triggerClose "), e.__options.triggerClose.tap && h.hasTouchCapability && (b += "touchend." + e.__namespace + "-triggerClose"), c.on(b, function(b) {
                                    e._touchIsMeaningfulEvent(b) && (e._touchRecordEvent(b), e.__options.interactive && a.contains(e._$tooltip[0], b.target) || e._close(b));
                                }), e.__options.triggerClose.tap && h.hasTouchCapability && c.on("touchstart." + e.__namespace + "-triggerClose", function(a) {
                                    e._touchRecordEvent(a);
                                });
                            }
                        }, 0), e._trigger("ready"), e.__options.functionReady && e.__options.functionReady.call(e, e, {
                            origin: e._$origin[0],
                            tooltip: e._$tooltip[0]
                        });
                    }
                    if (e.__options.timer > 0) {
                        var m = setTimeout(function() {
                            e._close();
                        }, e.__options.timer + g);
                        e.__timeouts.close.push(m);
                    }
                }
            }
            return e;
        },
        _openShortly: function _openShortly(a) {
            var b = this,
                c = !0;
            if ("stable" != b.__state && "appearing" != b.__state && !b.__timeouts.open && (b._trigger({
                    type: "start",
                    event: a,
                    stop: function stop() {
                        c = !1;
                    }
                }), c)) {
                var d = 0 == a.type.indexOf("touch") ? b.__options.delayTouch : b.__options.delay;
                d[0] ? b.__timeouts.open = setTimeout(function() {
                    b.__timeouts.open = null, b.__pointerIsOverOrigin && b._touchIsMeaningfulEvent(a) ? (b._trigger("startend"), b._open(a)) : b._trigger("startcancel");
                }, d[0]) : (b._trigger("startend"), b._open(a));
            }
            return b;
        },
        _optionsExtract: function _optionsExtract(b, c) {
            var d = this,
                e = a.extend(!0, {}, c),
                f = d.__options[b];
            return f || (f = {}, a.each(c, function(a, b) {
                var c = d.__options[a];
                void 0 !== c && (f[a] = c);
            })), a.each(e, function(b, c) {
                void 0 !== f[b] && ("object" != (typeof c === "undefined" ? "undefined" : _typeof(c)) || c instanceof Array || null == c || "object" != _typeof(f[b]) || f[b] instanceof Array || null == f[b] ? e[b] = f[b] : a.extend(e[b], f[b]));
            }), e;
        },
        _plug: function _plug(b) {
            var c = a.tooltipster._plugin(b);
            if (!c) throw new Error('The "' + b + '" plugin is not defined');
            return c.instance && a.tooltipster.__bridge(c.instance, this, c.name), this;
        },
        _touchIsEmulatedEvent: function _touchIsEmulatedEvent(a) {
            for (var b = !1, c = new Date().getTime(), d = this.__touchEvents.length - 1; d >= 0; d--) {
                var e = this.__touchEvents[d];
                if (!(c - e.time < 500)) break;
                e.target === a.target && (b = !0);
            }
            return b;
        },
        _touchIsMeaningfulEvent: function _touchIsMeaningfulEvent(a) {
            return this._touchIsTouchEvent(a) && !this._touchSwiped(a.target) || !this._touchIsTouchEvent(a) && !this._touchIsEmulatedEvent(a);
        },
        _touchIsTouchEvent: function _touchIsTouchEvent(a) {
            return 0 == a.type.indexOf("touch");
        },
        _touchRecordEvent: function _touchRecordEvent(a) {
            return this._touchIsTouchEvent(a) && (a.time = new Date().getTime(), this.__touchEvents.push(a)), this;
        },
        _touchSwiped: function _touchSwiped(a) {
            for (var b = !1, c = this.__touchEvents.length - 1; c >= 0; c--) {
                var d = this.__touchEvents[c];
                if ("touchmove" == d.type) {
                    b = !0;
                    break;
                }
                if ("touchstart" == d.type && a === d.target) break;
            }
            return b;
        },
        _trigger: function _trigger() {
            var b = Array.prototype.slice.apply(arguments);
            return "string" == typeof b[0] && (b[0] = {
                type: b[0]
            }), b[0].instance = this, b[0].origin = this._$origin ? this._$origin[0] : null, b[0].tooltip = this._$tooltip ? this._$tooltip[0] : null, this.__$emitterPrivate.trigger.apply(this.__$emitterPrivate, b), a.tooltipster._trigger.apply(a.tooltipster, b), this.__$emitterPublic.trigger.apply(this.__$emitterPublic, b), this;
        },
        _unplug: function _unplug(b) {
            var c = this;
            if (c[b]) {
                var d = a.tooltipster._plugin(b);
                d.instance && a.each(d.instance, function(a, d) {
                    c[a] && c[a].bridged === c[b] && delete c[a];
                }), c[b].__destroy && c[b].__destroy(), delete c[b];
            }
            return c;
        },
        close: function close(a) {
            return this.__destroyed ? this.__destroyError() : this._close(null, a), this;
        },
        content: function content(a) {
            var b = this;
            if (void 0 === a) return b.__Content;
            if (b.__destroyed) b.__destroyError();
            else if (b.__contentSet(a), null !== b.__Content) {
                if ("closed" !== b.__state && (b.__contentInsert(), b.reposition(), b.__options.updateAnimation))
                    if (h.hasTransitions) {
                        var c = b.__options.updateAnimation;
                        b._$tooltip.addClass("tooltipster-update-" + c), setTimeout(function() {
                            "closed" != b.__state && b._$tooltip.removeClass("tooltipster-update-" + c);
                        }, 1e3);
                    } else b._$tooltip.fadeTo(200, .5, function() {
                        "closed" != b.__state && b._$tooltip.fadeTo(200, 1);
                    });
            } else b._close();
            return b;
        },
        destroy: function destroy() {
            var b = this;
            if (b.__destroyed) b.__destroyError();
            else {
                "closed" != b.__state ? b.option("animationDuration", 0)._close(null, null, !0) : b.__timeoutsClear(), b._trigger("destroy"), b.__destroyed = !0, b._$origin.removeData(b.__namespace).off("." + b.__namespace + "-triggerOpen"), a(h.window.document.body).off("." + b.__namespace + "-triggerOpen");
                var c = b._$origin.data("tooltipster-ns");
                if (c)
                    if (1 === c.length) {
                        var d = null;
                        "previous" == b.__options.restoration ? d = b._$origin.data("tooltipster-initialTitle") : "current" == b.__options.restoration && (d = "string" == typeof b.__Content ? b.__Content : a("<div></div>").append(b.__Content).html()), d && b._$origin.attr("title", d), b._$origin.removeClass("tooltipstered"), b._$origin.removeData("tooltipster-ns").removeData("tooltipster-initialTitle");
                    } else c = a.grep(c, function(a, c) {
                        return a !== b.__namespace;
                    }), b._$origin.data("tooltipster-ns", c);
                b._trigger("destroyed"), b._off(), b.off(), b.__Content = null, b.__$emitterPrivate = null, b.__$emitterPublic = null, b.__options.parent = null, b._$origin = null, b._$tooltip = null, a.tooltipster.__instancesLatestArr = a.grep(a.tooltipster.__instancesLatestArr, function(a, c) {
                    return b !== a;
                }), clearInterval(b.__garbageCollector);
            }
            return b;
        },
        disable: function disable() {
            return this.__destroyed ? (this.__destroyError(), this) : (this._close(), this.__enabled = !1, this);
        },
        elementOrigin: function elementOrigin() {
            return this.__destroyed ? void this.__destroyError() : this._$origin[0];
        },
        elementTooltip: function elementTooltip() {
            return this._$tooltip ? this._$tooltip[0] : null;
        },
        enable: function enable() {
            return this.__enabled = !0, this;
        },
        hide: function hide(a) {
            return this.close(a);
        },
        instance: function instance() {
            return this;
        },
        off: function off() {
            return this.__destroyed || this.__$emitterPublic.off.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        },
        on: function on() {
            return this.__destroyed ? this.__destroyError() : this.__$emitterPublic.on.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        },
        one: function one() {
            return this.__destroyed ? this.__destroyError() : this.__$emitterPublic.one.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        },
        open: function open(a) {
            return this.__destroyed ? this.__destroyError() : this._open(null, a), this;
        },
        option: function option(b, c) {
            return void 0 === c ? this.__options[b] : (this.__destroyed ? this.__destroyError() : (this.__options[b] = c, this.__optionsFormat(), a.inArray(b, ["trigger", "triggerClose", "triggerOpen"]) >= 0 && this.__prepareOrigin(), "selfDestruction" === b && this.__prepareGC()), this);
        },
        reposition: function reposition(a, b) {
            var c = this;
            return c.__destroyed ? c.__destroyError() : "closed" != c.__state && d(c._$origin) && (b || d(c._$tooltip)) && (b || c._$tooltip.detach(), c.__Geometry = c.__geometry(), c._trigger({
                type: "reposition",
                event: a,
                helper: {
                    geo: c.__Geometry
                }
            })), c;
        },
        show: function show(a) {
            return this.open(a);
        },
        status: function status() {
            return {
                destroyed: this.__destroyed,
                enabled: this.__enabled,
                open: "closed" !== this.__state,
                state: this.__state
            };
        },
        triggerHandler: function triggerHandler() {
            return this.__destroyed ? this.__destroyError() : this.__$emitterPublic.triggerHandler.apply(this.__$emitterPublic, Array.prototype.slice.apply(arguments)), this;
        }
    }, a.fn.tooltipster = function() {
        var b = Array.prototype.slice.apply(arguments),
            c = "You are using a single HTML element as content for several tooltips. You probably want to set the contentCloning option to TRUE.";
        if (0 === this.length) return this;
        if ("string" == typeof b[0]) {
            var d = "#*$~&";
            return this.each(function() {
                var e = a(this).data("tooltipster-ns"),
                    f = e ? a(this).data(e[0]) : null;
                if (!f) throw new Error("You called Tooltipster's \"" + b[0] + '" method on an uninitialized element');
                if ("function" != typeof f[b[0]]) throw new Error('Unknown method "' + b[0] + '"');
                this.length > 1 && "content" == b[0] && (b[1] instanceof a || "object" == _typeof(b[1]) && null != b[1] && b[1].tagName) && !f.__options.contentCloning && f.__options.debug && console.log(c);
                var g = f[b[0]](b[1], b[2]);
                return g !== f || "instance" === b[0] ? (d = g, !1) : void 0;
            }), "#*$~&" !== d ? d : this;
        }
        a.tooltipster.__instancesLatestArr = [];
        var e = b[0] && void 0 !== b[0].multiple,
            g = e && b[0].multiple || !e && f.multiple,
            h = b[0] && void 0 !== b[0].content,
            i = h && b[0].content || !h && f.content,
            j = b[0] && void 0 !== b[0].contentCloning,
            k = j && b[0].contentCloning || !j && f.contentCloning,
            l = b[0] && void 0 !== b[0].debug,
            m = l && b[0].debug || !l && f.debug;
        return this.length > 1 && (i instanceof a || "object" == (typeof i === "undefined" ? "undefined" : _typeof(i)) && null != i && i.tagName) && !k && m && console.log(c), this.each(function() {
            var c = !1,
                d = a(this),
                e = d.data("tooltipster-ns"),
                f = null;
            e ? g ? c = !0 : m && (console.log("Tooltipster: one or more tooltips are already attached to the element below. Ignoring."), console.log(this)) : c = !0, c && (f = new a.Tooltipster(this, b[0]), e || (e = []), e.push(f.__namespace), d.data("tooltipster-ns", e), d.data(f.__namespace, f), f.__options.functionInit && f.__options.functionInit.call(f, f, {
                origin: this
            }), f._trigger("init")), a.tooltipster.__instancesLatestArr.push(f);
        }), this;
    }, b.prototype = {
        __init: function __init(b) {
            this.__$tooltip = b, this.__$tooltip.css({
                left: 0,
                overflow: "hidden",
                position: "absolute",
                top: 0
            }).find(".tooltipster-content").css("overflow", "auto"), this.$container = a('<div class="tooltipster-ruler"></div>').append(this.__$tooltip).appendTo(h.window.document.body);
        },
        __forceRedraw: function __forceRedraw() {
            var a = this.__$tooltip.parent();
            this.__$tooltip.detach(), this.__$tooltip.appendTo(a);
        },
        constrain: function constrain(a, b) {
            return this.constraints = {
                width: a,
                height: b
            }, this.__$tooltip.css({
                display: "block",
                height: "",
                overflow: "auto",
                width: a
            }), this;
        },
        destroy: function destroy() {
            this.__$tooltip.detach().find(".tooltipster-content").css({
                display: "",
                overflow: ""
            }), this.$container.remove();
        },
        free: function free() {
            return this.constraints = null, this.__$tooltip.css({
                display: "",
                height: "",
                overflow: "visible",
                width: ""
            }), this;
        },
        measure: function measure() {
            this.__forceRedraw();
            var a = this.__$tooltip[0].getBoundingClientRect(),
                b = {
                    size: {
                        height: a.height || a.bottom - a.top,
                        width: a.width || a.right - a.left
                    }
                };
            if (this.constraints) {
                var c = this.__$tooltip.find(".tooltipster-content"),
                    d = this.__$tooltip.outerHeight(),
                    e = c[0].getBoundingClientRect(),
                    f = {
                        height: d <= this.constraints.height,
                        width: a.width <= this.constraints.width && e.width >= c[0].scrollWidth - 1
                    };
                b.fits = f.height && f.width;
            }
            return h.IE && h.IE <= 11 && b.size.width !== h.window.document.documentElement.clientWidth && (b.size.width = Math.ceil(b.size.width) + 1), b;
        }
    };
    var j = navigator.userAgent.toLowerCase(); - 1 != j.indexOf("msie") ? h.IE = parseInt(j.split("msie")[1]) : -1 !== j.toLowerCase().indexOf("trident") && -1 !== j.indexOf(" rv:11") ? h.IE = 11 : -1 != j.toLowerCase().indexOf("edge/") && (h.IE = parseInt(j.toLowerCase().split("edge/")[1]));
    var k = "tooltipster.sideTip";
    return a.tooltipster._plugin({
        name: k,
        instance: {
            __defaults: function __defaults() {
                return {
                    arrow: !0,
                    distance: 6,
                    functionPosition: null,
                    maxWidth: null,
                    minIntersection: 16,
                    minWidth: 0,
                    position: null,
                    side: "top",
                    viewportAware: !0
                };
            },
            __init: function __init(a) {
                var b = this;
                b.__instance = a, b.__namespace = "tooltipster-sideTip-" + Math.round(1e6 * Math.random()), b.__previousState = "closed", b.__options, b.__optionsFormat(), b.__instance._on("state." + b.__namespace, function(a) {
                    "closed" == a.state ? b.__close() : "appearing" == a.state && "closed" == b.__previousState && b.__create(), b.__previousState = a.state;
                }), b.__instance._on("options." + b.__namespace, function() {
                    b.__optionsFormat();
                }), b.__instance._on("reposition." + b.__namespace, function(a) {
                    b.__reposition(a.event, a.helper);
                });
            },
            __close: function __close() {
                this.__instance.content() instanceof a && this.__instance.content().detach(), this.__instance._$tooltip.remove(), this.__instance._$tooltip = null;
            },
            __create: function __create() {
                var b = a('<div class="tooltipster-base tooltipster-sidetip"><div class="tooltipster-box"><div class="tooltipster-content"></div></div><div class="tooltipster-arrow"><div class="tooltipster-arrow-uncropped"><div class="tooltipster-arrow-border"></div><div class="tooltipster-arrow-background"></div></div></div></div>');
                this.__options.arrow || b.find(".tooltipster-box").css("margin", 0).end().find(".tooltipster-arrow").hide(), this.__options.minWidth && b.css("min-width", this.__options.minWidth + "px"), this.__options.maxWidth && b.css("max-width", this.__options.maxWidth + "px"), this.__instance._$tooltip = b, this.__instance._trigger("created");
            },
            __destroy: function __destroy() {
                this.__instance._off("." + self.__namespace);
            },
            __optionsFormat: function __optionsFormat() {
                var b = this;
                if (b.__options = b.__instance._optionsExtract(k, b.__defaults()), b.__options.position && (b.__options.side = b.__options.position), "object" != _typeof(b.__options.distance) && (b.__options.distance = [b.__options.distance]), b.__options.distance.length < 4 && (void 0 === b.__options.distance[1] && (b.__options.distance[1] = b.__options.distance[0]), void 0 === b.__options.distance[2] && (b.__options.distance[2] = b.__options.distance[0]), void 0 === b.__options.distance[3] && (b.__options.distance[3] = b.__options.distance[1]), b.__options.distance = {
                        top: b.__options.distance[0],
                        right: b.__options.distance[1],
                        bottom: b.__options.distance[2],
                        left: b.__options.distance[3]
                    }), "string" == typeof b.__options.side) {
                    var c = {
                        top: "bottom",
                        right: "left",
                        bottom: "top",
                        left: "right"
                    };
                    b.__options.side = [b.__options.side, c[b.__options.side]], "left" == b.__options.side[0] || "right" == b.__options.side[0] ? b.__options.side.push("top", "bottom") : b.__options.side.push("right", "left");
                }
                6 === a.tooltipster._env.IE && b.__options.arrow !== !0 && (b.__options.arrow = !1);
            },
            __reposition: function __reposition(b, c) {
                var d, e = this,
                    f = e.__targetFind(c),
                    g = [];
                e.__instance._$tooltip.detach();
                var h = e.__instance._$tooltip.clone(),
                    i = a.tooltipster._getRuler(h),
                    j = !1,
                    k = e.__instance.option("animation");
                switch (k && h.removeClass("tooltipster-" + k), a.each(["window", "document"], function(d, k) {
                    var l = null;
                    if (e.__instance._trigger({
                            container: k,
                            helper: c,
                            satisfied: j,
                            takeTest: function takeTest(a) {
                                l = a;
                            },
                            results: g,
                            type: "positionTest"
                        }), 1 == l || 0 != l && 0 == j && ("window" != k || e.__options.viewportAware))
                        for (var d = 0; d < e.__options.side.length; d++) {
                            var m = {
                                    horizontal: 0,
                                    vertical: 0
                                },
                                n = e.__options.side[d];
                            "top" == n || "bottom" == n ? m.vertical = e.__options.distance[n] : m.horizontal = e.__options.distance[n], e.__sideChange(h, n), a.each(["natural", "constrained"], function(a, d) {
                                if (l = null, e.__instance._trigger({
                                        container: k,
                                        event: b,
                                        helper: c,
                                        mode: d,
                                        results: g,
                                        satisfied: j,
                                        side: n,
                                        takeTest: function takeTest(a) {
                                            l = a;
                                        },
                                        type: "positionTest"
                                    }), 1 == l || 0 != l && 0 == j) {
                                    var h = {
                                            container: k,
                                            distance: m,
                                            fits: null,
                                            mode: d,
                                            outerSize: null,
                                            side: n,
                                            size: null,
                                            target: f[n],
                                            whole: null
                                        },
                                        o = "natural" == d ? i.free() : i.constrain(c.geo.available[k][n].width - m.horizontal, c.geo.available[k][n].height - m.vertical),
                                        p = o.measure();
                                    if (h.size = p.size, h.outerSize = {
                                            height: p.size.height + m.vertical,
                                            width: p.size.width + m.horizontal
                                        }, "natural" == d ? c.geo.available[k][n].width >= h.outerSize.width && c.geo.available[k][n].height >= h.outerSize.height ? h.fits = !0 : h.fits = !1 : h.fits = p.fits, "window" == k && (h.fits ? "top" == n || "bottom" == n ? h.whole = c.geo.origin.windowOffset.right >= e.__options.minIntersection && c.geo.window.size.width - c.geo.origin.windowOffset.left >= e.__options.minIntersection : h.whole = c.geo.origin.windowOffset.bottom >= e.__options.minIntersection && c.geo.window.size.height - c.geo.origin.windowOffset.top >= e.__options.minIntersection : h.whole = !1), g.push(h), h.whole) j = !0;
                                    else if ("natural" == h.mode && (h.fits || h.size.width <= c.geo.available[k][n].width)) return !1;
                                }
                            });
                        }
                }), e.__instance._trigger({
                    edit: function edit(a) {
                        g = a;
                    },
                    event: b,
                    helper: c,
                    results: g,
                    type: "positionTested"
                }), g.sort(function(a, b) {
                    if (a.whole && !b.whole) return -1;
                    if (!a.whole && b.whole) return 1;
                    if (a.whole && b.whole) {
                        var c = e.__options.side.indexOf(a.side),
                            d = e.__options.side.indexOf(b.side);
                        return d > c ? -1 : c > d ? 1 : "natural" == a.mode ? -1 : 1;
                    }
                    if (a.fits && !b.fits) return -1;
                    if (!a.fits && b.fits) return 1;
                    if (a.fits && b.fits) {
                        var c = e.__options.side.indexOf(a.side),
                            d = e.__options.side.indexOf(b.side);
                        return d > c ? -1 : c > d ? 1 : "natural" == a.mode ? -1 : 1;
                    }
                    return "document" == a.container && "bottom" == a.side && "natural" == a.mode ? -1 : 1;
                }), d = g[0], d.coord = {}, d.side) {
                    case "left":
                    case "right":
                        d.coord.top = Math.floor(d.target - d.size.height / 2);
                        break;
                    case "bottom":
                    case "top":
                        d.coord.left = Math.floor(d.target - d.size.width / 2);
                }
                switch (d.side) {
                    case "left":
                        d.coord.left = c.geo.origin.windowOffset.left - d.outerSize.width;
                        break;
                    case "right":
                        d.coord.left = c.geo.origin.windowOffset.right + d.distance.horizontal;
                        break;
                    case "top":
                        d.coord.top = c.geo.origin.windowOffset.top - d.outerSize.height;
                        break;
                    case "bottom":
                        d.coord.top = c.geo.origin.windowOffset.bottom + d.distance.vertical;
                }
                "window" == d.container ? "top" == d.side || "bottom" == d.side ? d.coord.left < 0 ? c.geo.origin.windowOffset.right - this.__options.minIntersection >= 0 ? d.coord.left = 0 : d.coord.left = c.geo.origin.windowOffset.right - this.__options.minIntersection - 1 : d.coord.left > c.geo.window.size.width - d.size.width && (c.geo.origin.windowOffset.left + this.__options.minIntersection <= c.geo.window.size.width ? d.coord.left = c.geo.window.size.width - d.size.width : d.coord.left = c.geo.origin.windowOffset.left + this.__options.minIntersection + 1 - d.size.width) : d.coord.top < 0 ? c.geo.origin.windowOffset.bottom - this.__options.minIntersection >= 0 ? d.coord.top = 0 : d.coord.top = c.geo.origin.windowOffset.bottom - this.__options.minIntersection - 1 : d.coord.top > c.geo.window.size.height - d.size.height && (c.geo.origin.windowOffset.top + this.__options.minIntersection <= c.geo.window.size.height ? d.coord.top = c.geo.window.size.height - d.size.height : d.coord.top = c.geo.origin.windowOffset.top + this.__options.minIntersection + 1 - d.size.height) : (d.coord.left > c.geo.window.size.width - d.size.width && (d.coord.left = c.geo.window.size.width - d.size.width), d.coord.left < 0 && (d.coord.left = 0)), e.__sideChange(h, d.side), c.tooltipClone = h[0], c.tooltipParent = e.__instance.option("parent").parent[0], c.mode = d.mode, c.whole = d.whole, c.origin = e.__instance._$origin[0], c.tooltip = e.__instance._$tooltip[0], delete d.container, delete d.fits, delete d.mode, delete d.outerSize, delete d.whole, d.distance = d.distance.horizontal || d.distance.vertical;
                var l = a.extend(!0, {}, d);
                if (e.__instance._trigger({
                        edit: function edit(a) {
                            d = a;
                        },
                        event: b,
                        helper: c,
                        position: l,
                        type: "position"
                    }), e.__options.functionPosition) {
                    var m = e.__options.functionPosition.call(e, e.__instance, c, l);
                    m && (d = m);
                }
                i.destroy();
                var n, o;
                "top" == d.side || "bottom" == d.side ? (n = {
                    prop: "left",
                    val: d.target - d.coord.left
                }, o = d.size.width - this.__options.minIntersection) : (n = {
                    prop: "top",
                    val: d.target - d.coord.top
                }, o = d.size.height - this.__options.minIntersection), n.val < this.__options.minIntersection ? n.val = this.__options.minIntersection : n.val > o && (n.val = o);
                var p;
                p = c.geo.origin.fixedLineage ? c.geo.origin.windowOffset : {
                    left: c.geo.origin.windowOffset.left + c.geo.window.scroll.left,
                    top: c.geo.origin.windowOffset.top + c.geo.window.scroll.top
                }, d.coord = {
                    left: p.left + (d.coord.left - c.geo.origin.windowOffset.left),
                    top: p.top + (d.coord.top - c.geo.origin.windowOffset.top)
                }, e.__sideChange(e.__instance._$tooltip, d.side), c.geo.origin.fixedLineage ? e.__instance._$tooltip.css("position", "fixed") : e.__instance._$tooltip.css("position", ""), e.__instance._$tooltip.css({
                    left: d.coord.left,
                    top: d.coord.top,
                    height: d.size.height,
                    width: d.size.width
                }).find(".tooltipster-arrow").css({
                    left: "",
                    top: ""
                }).css(n.prop, n.val), e.__instance._$tooltip.appendTo(e.__instance.option("parent")), e.__instance._trigger({
                    type: "repositioned",
                    event: b,
                    position: d
                });
            },
            __sideChange: function __sideChange(a, b) {
                a.removeClass("tooltipster-bottom").removeClass("tooltipster-left").removeClass("tooltipster-right").removeClass("tooltipster-top").addClass("tooltipster-" + b);
            },
            __targetFind: function __targetFind(a) {
                var b = {},
                    c = this.__instance._$origin[0].getClientRects();
                if (c.length > 1) {
                    var d = this.__instance._$origin.css("opacity");
                    1 == d && (this.__instance._$origin.css("opacity", .99), c = this.__instance._$origin[0].getClientRects(), this.__instance._$origin.css("opacity", 1));
                }
                if (c.length < 2) b.top = Math.floor(a.geo.origin.windowOffset.left + a.geo.origin.size.width / 2), b.bottom = b.top, b.left = Math.floor(a.geo.origin.windowOffset.top + a.geo.origin.size.height / 2), b.right = b.left;
                else {
                    var e = c[0];
                    b.top = Math.floor(e.left + (e.right - e.left) / 2), e = c.length > 2 ? c[Math.ceil(c.length / 2) - 1] : c[0], b.right = Math.floor(e.top + (e.bottom - e.top) / 2), e = c[c.length - 1], b.bottom = Math.floor(e.left + (e.right - e.left) / 2), e = c.length > 2 ? c[Math.ceil((c.length + 1) / 2) - 1] : c[c.length - 1], b.left = Math.floor(e.top + (e.bottom - e.top) / 2);
                }
                return b;
            }
        }
    }), a;
});
'use strict';
/*
These functions make sure WordPress
and Foundation play nice together.
*/
jQuery(document).ready(function() { // Remove empty P tags created by WP inside of Accordion and Orbit
    jQuery('.accordion p:empty, .orbit p:empty').remove(); // Adds Flex Video to YouTube and Vimeo Embeds
    jQuery('iframe[src*="youtube.com"], iframe[src*="vimeo.com"]').each(function() {
        if (jQuery(this).innerWidth() / jQuery(this).innerHeight() > 1.5) {
            jQuery(this).wrap("<div class='widescreen responsive-embed'/>");
        } else {
            jQuery(this).wrap("<div class='responsive-embed'/>");
        }
    });
});