/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

/**
 * Element.matches()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Element.closest()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        "use strict";
        var el = this;
        if (!document.documentElement.contains(el)) {
            return null;
        }
        do {
            if (el.matches(s)) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "tabs";

    var keyCodes = {
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" +  NS + '-is="' + IS + '"]',
        active: {
            tab: "cmp-tabs__tab--active",
            tabpanel: "cmp-tabs__tabpanel--active"
        }
    };

    /**
     * Tabs Configuration
     *
     * @typedef {Object} TabsConfig Represents a Tabs configuration
     * @property {HTMLElement} element The HTMLElement representing the Tabs
     * @property {Object} options The Tabs options
     */

    /**
     * Tabs
     *
     * @class Tabs
     * @classdesc An interactive Tabs component for navigating a list of tabs
     * @param {TabsConfig} config The Tabs configuration
     */
    function Tabs(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Tabs
         *
         * @private
         * @param {TabsConfig} config The Tabs configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            cacheElements(config.element);
            that._active = getActiveIndex(that._elements["tab"]);

            if (that._elements.tabpanel) {
                refreshActive();
                bindEvents();
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Tabs component
                 * - if so, route the "navigate" operation to enact a navigation of the Tabs based on index data
                 */
                new window.Granite.author.MessageChannel("cqauthor", window).subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-tabs" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Returns the index of the active tab, if no tab is active returns 0
         *
         * @param {Array} tabs Tab elements
         * @returns {Number} Index of the active tab, 0 if none is active
         */
        function getActiveIndex(tabs) {
            if (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].classList.contains(selectors.active.tab)) {
                        return i;
                    }
                }
            }
            return 0;
        }

        /**
         * Caches the Tabs elements as defined via the {@code data-tabs-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Tabs wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                if (hook.closest("." + NS + "-" + IS) === that._elements.self) { // only process own tab elements
                    var capitalized = IS;
                    capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                    var key = hook.dataset[NS + "Hook" + capitalized];
                    if (that._elements[key]) {
                        if (!Array.isArray(that._elements[key])) {
                            var tmp = that._elements[key];
                            that._elements[key] = [tmp];
                        }
                        that._elements[key].push(hook);
                    } else {
                        that._elements[key] = hook;
                    }
                }
            }
        }

        /**
         * Binds Tabs event handling
         *
         * @private
         */
        function bindEvents() {
            var tabs = that._elements["tab"];
            if (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    (function(index) {
                        tabs[i].addEventListener("click", function(event) {
                            navigateAndFocusTab(index);
                        });
                        tabs[i].addEventListener("keydown", function(event) {
                            onKeyDown(event);
                        });
                    })(i);
                }
            }
        }

        /**
         * Handles tab keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["tab"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusTab(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusTab(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusTab(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusTab(lastIndex);
                    break;
                default:
                    return;
            }
        }

        /**
         * Refreshes the tab markup based on the current {@code Tabs#_active} index
         *
         * @private
         */
        function refreshActive() {
            var tabpanels = that._elements["tabpanel"];
            var tabs = that._elements["tab"];

            if (tabpanels) {
                if (Array.isArray(tabpanels)) {
                    for (var i = 0; i < tabpanels.length; i++) {
                        if (i === parseInt(that._active)) {
                            tabpanels[i].classList.add(selectors.active.tabpanel);
                            tabpanels[i].removeAttribute("aria-hidden");
                            tabs[i].classList.add(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", true);
                            tabs[i].setAttribute("tabindex", "0");
                        } else {
                            tabpanels[i].classList.remove(selectors.active.tabpanel);
                            tabpanels[i].setAttribute("aria-hidden", true);
                            tabs[i].classList.remove(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", false);
                            tabs[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one tab
                    tabpanels.classList.add(selectors.active.tabpanel);
                    tabs.classList.add(selectors.active.tab);
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Navigates to the tab at the provided index
         *
         * @private
         * @param {Number} index The index of the tab to navigate to
         */
        function navigate(index) {
            that._active = index;
            refreshActive();
        }

        /**
         * Navigates to the item at the provided index and ensures the active tab gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusTab(index) {
            navigate(index);
            focusWithoutScroll(that._elements["tab"][index]);
        }
    }

    /**
     * Reads options data from the Tabs wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Tabs element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Tabs components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Tabs({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Tabs({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

}());

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "carousel";

    var keyCodes = {
        SPACE: 32,
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" +  NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * Determines whether the Carousel will automatically transition between slides
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autoplay": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Duration (in milliseconds) before automatically transitioning to the next slide
         *
         * @memberof Carousel
         * @type {Number}
         * @default 5000
         */
        "delay": {
            "default": 5000,
            "transform": function(value) {
                value = parseFloat(value);
                return !isNaN(value) ? value : null;
            }
        },
        /**
         * Determines whether automatic pause on hovering the carousel is disabled
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autopauseDisabled": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        }
    };

    /**
     * Carousel Configuration
     *
     * @typedef {Object} CarouselConfig Represents a Carousel configuration
     * @property {HTMLElement} element The HTMLElement representing the Carousel
     * @property {Object} options The Carousel options
     */

    /**
     * Carousel
     *
     * @class Carousel
     * @classdesc An interactive Carousel component for navigating a list of generic items
     * @param {CarouselConfig} config The Carousel configuration
     */
    function Carousel(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Carousel
         *
         * @private
         * @param {CarouselConfig} config The Carousel configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            that._active = 0;
            that._paused = false;

            if (that._elements.item) {
                refreshActive();
                bindEvents();
                resetAutoplayInterval();
                refreshPlayPauseActions();
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Carousel component
                 * - if so, route the "navigate" operation to enact a navigation of the Carousel based on index data
                 */
                new window.Granite.author.MessageChannel("cqauthor", window).subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-carousel" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Caches the Carousel elements as defined via the {@code data-carousel-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Carousel wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                if (that._elements[key]) {
                    if (!Array.isArray(that._elements[key])) {
                        var tmp = that._elements[key];
                        that._elements[key] = [tmp];
                    }
                    that._elements[key].push(hook);
                } else {
                    that._elements[key] = hook;
                }
            }
        }

        /**
         * Sets up properties for the Carousel based on the passed options.
         *
         * @private
         * @param {Object} options The Carousel options
         */
        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    var value = null;

                    if (options && options[key] != null) {
                        value = options[key];

                        // transform the provided option
                        if (property && typeof property.transform === "function") {
                            value = property.transform(value);
                        }
                    }

                    if (value === null) {
                        // value still null, take the property default
                        value = properties[key]["default"];
                    }

                    that._properties[key] = value;
                }
            }
        }

        /**
         * Binds Carousel event handling
         *
         * @private
         */
        function bindEvents() {
            if (that._elements["previous"]) {
                that._elements["previous"].addEventListener("click", function() {
                    navigate(getPreviousIndex());
                });
            }

            if (that._elements["next"]) {
                that._elements["next"].addEventListener("click", function() {
                    navigate(getNextIndex());
                });
            }

            var indicators = that._elements["indicator"];
            if (indicators) {
                for (var i = 0; i < indicators.length; i++) {
                    (function(index) {
                        indicators[i].addEventListener("click", function(event) {
                            navigateAndFocusIndicator(index);
                        });
                    })(i);
                }
            }

            if (that._elements["pause"]) {
                if (that._properties.autoplay) {
                    that._elements["pause"].addEventListener("click", onPauseClick);
                }
            }

            if (that._elements["play"]) {
                if (that._properties.autoplay) {
                    that._elements["play"].addEventListener("click", onPlayClick);
                }
            }

            that._elements.self.addEventListener("keydown", onKeyDown);

            if (!that._properties.autopauseDisabled) {
                that._elements.self.addEventListener("mouseenter", onMouseEnter);
                that._elements.self.addEventListener("mouseleave", onMouseLeave);
            }
        }

        /**
         * Handles carousel keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["indicator"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusIndicator(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusIndicator(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusIndicator(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusIndicator(lastIndex);
                    break;
                case keyCodes.SPACE:
                    if (that._properties.autoplay && (event.target !== that._elements["previous"] && event.target !== that._elements["next"])) {
                        event.preventDefault();
                        if (!that._paused) {
                            pause();
                        } else {
                            play();
                        }
                    }
                    if (event.target === that._elements["pause"]) {
                        that._elements["play"].focus();
                    }
                    if (event.target === that._elements["play"]) {
                        that._elements["pause"].focus();
                    }
                    break;
                default:
                    return;
            }
        }

        /**
         * Handles carousel mouseenter events
         *
         * @private
         * @param {Object} event The mouseenter event
         */
        function onMouseEnter(event) {
            clearAutoplayInterval();
        }

        /**
         * Handles carousel mouseleave events
         *
         * @private
         * @param {Object} event The mouseleave event
         */
        function onMouseLeave(event) {
            resetAutoplayInterval();
        }

        /**
         * Handles pause element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPauseClick(event) {
            pause();
            that._elements["play"].focus();
        }

        /**
         * Handles play element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPlayClick() {
            play();
            that._elements["pause"].focus();
        }

        /**
         * Pauses the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function pause() {
            that._paused = true;
            clearAutoplayInterval();
            refreshPlayPauseActions();
        }

        /**
         * Enables the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function play() {
            that._paused = false;

            // If the Carousel is hovered, don't begin auto transitioning until the next mouse leave event
            var hovered = false;
            if (that._elements.self.parentElement) {
                hovered = that._elements.self.parentElement.querySelector(":hover") === that._elements.self;
            }
            if (that._properties.autopauseDisabled || !hovered) {
                resetAutoplayInterval();
            }

            refreshPlayPauseActions();
        }

        /**
         * Refreshes the play/pause action markup based on the {@code Carousel#_paused} state
         *
         * @private
         */
        function refreshPlayPauseActions() {
            setActionDisabled(that._elements["pause"], that._paused);
            setActionDisabled(that._elements["play"], !that._paused);
        }

        /**
         * Refreshes the item markup based on the current {@code Carousel#_active} index
         *
         * @private
         */
        function refreshActive() {
            var items = that._elements["item"];
            var indicators = that._elements["indicator"];

            if (items) {
                if (Array.isArray(items)) {
                    for (var i = 0; i < items.length; i++) {
                        if (i === parseInt(that._active)) {
                            items[i].classList.add("cmp-carousel__item--active");
                            items[i].removeAttribute("aria-hidden");
                            indicators[i].classList.add("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", true);
                            indicators[i].setAttribute("tabindex", "0");
                        } else {
                            items[i].classList.remove("cmp-carousel__item--active");
                            items[i].setAttribute("aria-hidden", true);
                            indicators[i].classList.remove("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", false);
                            indicators[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one item
                    items.classList.add("cmp-carousel__item--active");
                    indicators.classList.add("cmp-carousel__indicator--active");
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Retrieves the next active index, with looping
         *
         * @private
         * @returns {Number} Index of the next carousel item
         */
        function getNextIndex() {
            return that._active === (that._elements["item"].length - 1) ? 0 : that._active + 1;
        }

        /**
         * Retrieves the previous active index, with looping
         *
         * @private
         * @returns {Number} Index of the previous carousel item
         */
        function getPreviousIndex() {
            return that._active === 0 ? (that._elements["item"].length - 1) : that._active - 1;
        }

        /**
         * Navigates to the item at the provided index
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigate(index) {
            if (index < 0 || index > (that._elements["item"].length - 1)) {
                return;
            }

            that._active = index;
            refreshActive();

            // reset the autoplay transition interval following navigation, if not already hovering the carousel
            if (that._elements.self.parentElement) {
                if (that._elements.self.parentElement.querySelector(":hover") !== that._elements.self) {
                    resetAutoplayInterval();
                }
            }
        }

        /**
         * Navigates to the item at the provided index and ensures the active indicator gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusIndicator(index) {
            navigate(index);
            focusWithoutScroll(that._elements["indicator"][index]);
        }

        /**
         * Starts/resets automatic slide transition interval
         *
         * @private
         */
        function resetAutoplayInterval() {
            if (that._paused || !that._properties.autoplay) {
                return;
            }
            clearAutoplayInterval();
            that._autoplayIntervalId = window.setInterval(function() {
                if (document.visibilityState && document.hidden) {
                    return;
                }
                var indicators = that._elements["indicators"];
                if (indicators !== document.activeElement && indicators.contains(document.activeElement)) {
                    // if an indicator has focus, ensure we switch focus following navigation
                    navigateAndFocusIndicator(getNextIndex());
                } else {
                    navigate(getNextIndex());
                }
            }, that._properties.delay);
        }

        /**
         * Clears/pauses automatic slide transition interval
         *
         * @private
         */
        function clearAutoplayInterval() {
            window.clearInterval(that._autoplayIntervalId);
            that._autoplayIntervalId = null;
        }

        /**
         * Sets the disabled state for an action and toggles the appropriate CSS classes
         *
         * @private
         * @param {HTMLElement} action Action to disable
         * @param {Boolean} [disable] {@code true} to disable, {@code false} to enable
         */
        function setActionDisabled(action, disable) {
            if (!action) {
                return;
            }
            if (disable !== false) {
                action.disabled = true;
                action.classList.add("cmp-carousel__action--disabled");
            } else {
                action.disabled = false;
                action.classList.remove("cmp-carousel__action--disabled");
            }
        }
    }

    /**
     * Reads options data from the Carousel wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Carousel element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Carousel components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Carousel({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Carousel({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

}());

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "carousel";

    var keyCodes = {
        SPACE: 32,
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" +  NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * Determines whether the Carousel will automatically transition between slides
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autoplay": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Duration (in milliseconds) before automatically transitioning to the next slide
         *
         * @memberof Carousel
         * @type {Number}
         * @default 5000
         */
        "delay": {
            "default": 5000,
            "transform": function(value) {
                value = parseFloat(value);
                return !isNaN(value) ? value : null;
            }
        },
        /**
         * Determines whether automatic pause on hovering the carousel is disabled
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autopauseDisabled": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        }
    };

    /**
     * Carousel Configuration
     *
     * @typedef {Object} CarouselConfig Represents a Carousel configuration
     * @property {HTMLElement} element The HTMLElement representing the Carousel
     * @property {Object} options The Carousel options
     */

    /**
     * Carousel
     *
     * @class Carousel
     * @classdesc An interactive Carousel component for navigating a list of generic items
     * @param {CarouselConfig} config The Carousel configuration
     */
    function Carousel(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Carousel
         *
         * @private
         * @param {CarouselConfig} config The Carousel configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            that._active = 0;
            that._paused = false;

            if (that._elements.item) {
                refreshActive();
                bindEvents();
                resetAutoplayInterval();
                refreshPlayPauseActions();
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Carousel component
                 * - if so, route the "navigate" operation to enact a navigation of the Carousel based on index data
                 */
                new window.Granite.author.MessageChannel("cqauthor", window).subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-carousel" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Caches the Carousel elements as defined via the {@code data-carousel-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Carousel wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                if (that._elements[key]) {
                    if (!Array.isArray(that._elements[key])) {
                        var tmp = that._elements[key];
                        that._elements[key] = [tmp];
                    }
                    that._elements[key].push(hook);
                } else {
                    that._elements[key] = hook;
                }
            }
        }

        /**
         * Sets up properties for the Carousel based on the passed options.
         *
         * @private
         * @param {Object} options The Carousel options
         */
        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    var value = null;

                    if (options && options[key] != null) {
                        value = options[key];

                        // transform the provided option
                        if (property && typeof property.transform === "function") {
                            value = property.transform(value);
                        }
                    }

                    if (value === null) {
                        // value still null, take the property default
                        value = properties[key]["default"];
                    }

                    that._properties[key] = value;
                }
            }
        }

        /**
         * Binds Carousel event handling
         *
         * @private
         */
        function bindEvents() {
            if (that._elements["previous"]) {
                that._elements["previous"].addEventListener("click", function() {
                    navigate(getPreviousIndex());
                });
            }

            if (that._elements["next"]) {
                that._elements["next"].addEventListener("click", function() {
                    navigate(getNextIndex());
                });
            }

            var indicators = that._elements["indicator"];
            if (indicators) {
                for (var i = 0; i < indicators.length; i++) {
                    (function(index) {
                        indicators[i].addEventListener("click", function(event) {
                            navigateAndFocusIndicator(index);
                        });
                    })(i);
                }
            }

            if (that._elements["pause"]) {
                if (that._properties.autoplay) {
                    that._elements["pause"].addEventListener("click", onPauseClick);
                }
            }

            if (that._elements["play"]) {
                if (that._properties.autoplay) {
                    that._elements["play"].addEventListener("click", onPlayClick);
                }
            }

            that._elements.self.addEventListener("keydown", onKeyDown);

            if (!that._properties.autopauseDisabled) {
                that._elements.self.addEventListener("mouseenter", onMouseEnter);
                that._elements.self.addEventListener("mouseleave", onMouseLeave);
            }
        }

        /**
         * Handles carousel keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["indicator"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusIndicator(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusIndicator(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusIndicator(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusIndicator(lastIndex);
                    break;
                case keyCodes.SPACE:
                    if (that._properties.autoplay && (event.target !== that._elements["previous"] && event.target !== that._elements["next"])) {
                        event.preventDefault();
                        if (!that._paused) {
                            pause();
                        } else {
                            play();
                        }
                    }
                    if (event.target === that._elements["pause"]) {
                        that._elements["play"].focus();
                    }
                    if (event.target === that._elements["play"]) {
                        that._elements["pause"].focus();
                    }
                    break;
                default:
                    return;
            }
        }

        /**
         * Handles carousel mouseenter events
         *
         * @private
         * @param {Object} event The mouseenter event
         */
        function onMouseEnter(event) {
            clearAutoplayInterval();
        }

        /**
         * Handles carousel mouseleave events
         *
         * @private
         * @param {Object} event The mouseleave event
         */
        function onMouseLeave(event) {
            resetAutoplayInterval();
        }

        /**
         * Handles pause element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPauseClick(event) {
            pause();
            that._elements["play"].focus();
        }

        /**
         * Handles play element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPlayClick() {
            play();
            that._elements["pause"].focus();
        }

        /**
         * Pauses the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function pause() {
            that._paused = true;
            clearAutoplayInterval();
            refreshPlayPauseActions();
        }

        /**
         * Enables the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function play() {
            that._paused = false;

            // If the Carousel is hovered, don't begin auto transitioning until the next mouse leave event
            var hovered = false;
            if (that._elements.self.parentElement) {
                hovered = that._elements.self.parentElement.querySelector(":hover") === that._elements.self;
            }
            if (that._properties.autopauseDisabled || !hovered) {
                resetAutoplayInterval();
            }

            refreshPlayPauseActions();
        }

        /**
         * Refreshes the play/pause action markup based on the {@code Carousel#_paused} state
         *
         * @private
         */
        function refreshPlayPauseActions() {
            setActionDisabled(that._elements["pause"], that._paused);
            setActionDisabled(that._elements["play"], !that._paused);
        }

        /**
         * Refreshes the item markup based on the current {@code Carousel#_active} index
         *
         * @private
         */
        function refreshActive() {
            var items = that._elements["item"];
            var indicators = that._elements["indicator"];

            if (items) {
                if (Array.isArray(items)) {
                    for (var i = 0; i < items.length; i++) {
                        if (i === parseInt(that._active)) {
                            items[i].classList.add("cmp-carousel__item--active");
                            items[i].removeAttribute("aria-hidden");
                            indicators[i].classList.add("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", true);
                            indicators[i].setAttribute("tabindex", "0");
                        } else {
                            items[i].classList.remove("cmp-carousel__item--active");
                            items[i].setAttribute("aria-hidden", true);
                            indicators[i].classList.remove("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", false);
                            indicators[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one item
                    items.classList.add("cmp-carousel__item--active");
                    indicators.classList.add("cmp-carousel__indicator--active");
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Retrieves the next active index, with looping
         *
         * @private
         * @returns {Number} Index of the next carousel item
         */
        function getNextIndex() {
            return that._active === (that._elements["item"].length - 1) ? 0 : that._active + 1;
        }

        /**
         * Retrieves the previous active index, with looping
         *
         * @private
         * @returns {Number} Index of the previous carousel item
         */
        function getPreviousIndex() {
            return that._active === 0 ? (that._elements["item"].length - 1) : that._active - 1;
        }

        /**
         * Navigates to the item at the provided index
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigate(index) {
            if (index < 0 || index > (that._elements["item"].length - 1)) {
                return;
            }

            that._active = index;
            refreshActive();

            // reset the autoplay transition interval following navigation, if not already hovering the carousel
            if (that._elements.self.parentElement) {
                if (that._elements.self.parentElement.querySelector(":hover") !== that._elements.self) {
                    resetAutoplayInterval();
                }
            }
        }

        /**
         * Navigates to the item at the provided index and ensures the active indicator gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusIndicator(index) {
            navigate(index);
            focusWithoutScroll(that._elements["indicator"][index]);
        }

        /**
         * Starts/resets automatic slide transition interval
         *
         * @private
         */
        function resetAutoplayInterval() {
            if (that._paused || !that._properties.autoplay) {
                return;
            }
            clearAutoplayInterval();
            that._autoplayIntervalId = window.setInterval(function() {
                if (document.visibilityState && document.hidden) {
                    return;
                }
                var indicators = that._elements["indicators"];
                if (indicators !== document.activeElement && indicators.contains(document.activeElement)) {
                    // if an indicator has focus, ensure we switch focus following navigation
                    navigateAndFocusIndicator(getNextIndex());
                } else {
                    navigate(getNextIndex());
                }
            }, that._properties.delay);
        }

        /**
         * Clears/pauses automatic slide transition interval
         *
         * @private
         */
        function clearAutoplayInterval() {
            window.clearInterval(that._autoplayIntervalId);
            that._autoplayIntervalId = null;
        }

        /**
         * Sets the disabled state for an action and toggles the appropriate CSS classes
         *
         * @private
         * @param {HTMLElement} action Action to disable
         * @param {Boolean} [disable] {@code true} to disable, {@code false} to enable
         */
        function setActionDisabled(action, disable) {
            if (!action) {
                return;
            }
            if (disable !== false) {
                action.disabled = true;
                action.classList.add("cmp-carousel__action--disabled");
            } else {
                action.disabled = false;
                action.classList.remove("cmp-carousel__action--disabled");
            }
        }
    }

    /**
     * Reads options data from the Carousel wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Carousel element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Carousel components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Carousel({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Carousel({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

}());

/*******************************************************************************
 * Copyright 2017 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
if (window.Element && !Element.prototype.closest) {
    // eslint valid-jsdoc: "off"
    Element.prototype.closest =
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var el      = this;
            var i;
            do {
                i = matches.length;
                while (--i >= 0 && matches.item(i) !== el) {
                    // continue
                }
            } while ((i < 0) && (el = el.parentElement));
            return el;
        };
}

if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var i       = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
                // continue
            }
            return i > -1;
        };
}

if (!Object.assign) {
    Object.assign = function(target, varArgs) { // .length of function is 2
        "use strict";
        if (target === null) {
            throw new TypeError("Cannot convert undefined or null to object");
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

(function(arr) {
    "use strict";
    arr.forEach(function(item) {
        if (item.hasOwnProperty("remove")) {
            return;
        }
        Object.defineProperty(item, "remove", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "image";

    var EMPTY_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    var LAZY_THRESHOLD = 0;
    var SRC_URI_TEMPLATE_WIDTH_VAR = "{.width}";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        image: '[data-cmp-hook-image="image"]',
        map: '[data-cmp-hook-image="map"]',
        area: '[data-cmp-hook-image="area"]'
    };

    var lazyLoader = {
        "cssClass": "cmp-image__image--is-loading",
        "style": {
            "height": 0,
            "padding-bottom": "" // will be replaced with % ratio
        }
    };

    var properties = {
        /**
         * An array of alternative image widths (in pixels).
         * Used to replace a {.width} variable in the src property with an optimal width if a URI template is provided.
         *
         * @memberof Image
         * @type {Number[]}
         * @default []
         */
        "widths": {
            "default": [],
            "transform": function(value) {
                var widths = [];
                value.split(",").forEach(function(item) {
                    item = parseFloat(item);
                    if (!isNaN(item)) {
                        widths.push(item);
                    }
                });
                return widths;
            }
        },
        /**
         * Indicates whether the image should be rendered lazily.
         *
         * @memberof Image
         * @type {Boolean}
         * @default false
         */
        "lazy": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * The image source.
         *
         * Can be a simple image source, or a URI template representation that
         * can be variable expanded - useful for building an image configuration with an alternative width.
         * e.g. '/path/image.coreimg{.width}.jpeg/1506620954214.jpeg'
         *
         * @memberof Image
         * @type {String}
         */
        "src": {
        }
    };

    var devicePixelRatio = window.devicePixelRatio || 1;

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function Image(config) {
        var that = this;

        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            if (!that._elements.noscript) {
                return;
            }

            that._elements.container = that._elements.link ? that._elements.link : that._elements.self;

            unwrapNoScript();

            if (that._properties.lazy) {
                addLazyLoader();
            }

            if (that._elements.map) {
                that._elements.image.addEventListener("load", onLoad);
            }

            window.addEventListener("scroll", that.update);
            window.addEventListener("resize", onWindowResize);
            window.addEventListener("update", that.update);
            that._elements.image.addEventListener("cmp-image-redraw", that.update);
            that.update();
        }

        function loadImage() {
            var hasWidths = that._properties.widths && that._properties.widths.length > 0;
            var replacement = hasWidths ? "." + getOptimalWidth() : "";
            var url = that._properties.src.replace(SRC_URI_TEMPLATE_WIDTH_VAR, replacement);

            if (that._elements.image.getAttribute("src") !== url) {
                that._elements.image.setAttribute("src", url);
                if (!hasWidths) {
                    window.removeEventListener("scroll", that.update);
                }
            }

            if (that._lazyLoaderShowing) {
                that._elements.image.addEventListener("load", removeLazyLoader);
            }
        }

        function getOptimalWidth() {
            var container = that._elements.self;
            var containerWidth = container.clientWidth;
            while (containerWidth === 0 && container.parentNode) {
                container = container.parentNode;
                containerWidth = container.clientWidth;
            }
            var optimalWidth = containerWidth * devicePixelRatio;
            var len = that._properties.widths.length;
            var key = 0;

            while ((key < len - 1) && (that._properties.widths[key] < optimalWidth)) {
                key++;
            }

            return that._properties.widths[key].toString();
        }

        function addLazyLoader() {
            var width = that._elements.image.getAttribute("width");
            var height = that._elements.image.getAttribute("height");

            if (width && height) {
                var ratio = (height / width) * 100;
                var styles = lazyLoader.style;

                styles["padding-bottom"] = ratio + "%";

                for (var s in styles) {
                    if (styles.hasOwnProperty(s)) {
                        that._elements.image.style[s] = styles[s];
                    }
                }
            }
            that._elements.image.setAttribute("src", EMPTY_PIXEL);
            that._elements.image.classList.add(lazyLoader.cssClass);
            that._lazyLoaderShowing = true;
        }

        function unwrapNoScript() {
            var markup = decodeNoscript(that._elements.noscript.textContent.trim());
            var parser = new DOMParser();

            // temporary document avoids requesting the image before removing its src
            var temporaryDocument = parser.parseFromString(markup, "text/html");
            var imageElement = temporaryDocument.querySelector(selectors.image);
            imageElement.removeAttribute("src");
            that._elements.container.insertBefore(imageElement, that._elements.noscript);

            var mapElement = temporaryDocument.querySelector(selectors.map);
            if (mapElement) {
                that._elements.container.insertBefore(mapElement, that._elements.noscript);
            }

            that._elements.noscript.parentNode.removeChild(that._elements.noscript);
            if (that._elements.container.matches(selectors.image)) {
                that._elements.image = that._elements.container;
            } else {
                that._elements.image = that._elements.container.querySelector(selectors.image);
            }

            that._elements.map = that._elements.container.querySelector(selectors.map);
            that._elements.areas = that._elements.container.querySelectorAll(selectors.area);
        }

        function removeLazyLoader() {
            that._elements.image.classList.remove(lazyLoader.cssClass);
            for (var property in lazyLoader.style) {
                if (lazyLoader.style.hasOwnProperty(property)) {
                    that._elements.image.style[property] = "";
                }
            }
            that._elements.image.removeEventListener("load", removeLazyLoader);
            that._lazyLoaderShowing = false;
        }

        function isLazyVisible() {
            if (that._elements.container.offsetParent === null) {
                return false;
            }

            var wt = window.pageYOffset;
            var wb = wt + document.documentElement.clientHeight;
            var et = that._elements.container.getBoundingClientRect().top + wt;
            var eb = et + that._elements.container.clientHeight;

            return eb >= wt - LAZY_THRESHOLD && et <= wb + LAZY_THRESHOLD;
        }

        function resizeAreas() {
            if (that._elements.areas && that._elements.areas.length > 0) {
                for (var i = 0; i < that._elements.areas.length; i++) {
                    var width = that._elements.image.width;
                    var height = that._elements.image.height;

                    if (width && height) {
                        var relcoords = that._elements.areas[i].dataset.cmpRelcoords;
                        if (relcoords) {
                            var relativeCoordinates = relcoords.split(",");
                            var coordinates = new Array(relativeCoordinates.length);

                            for (var j = 0; j < coordinates.length; j++) {
                                if (j % 2 === 0) {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * width);
                                } else {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * height);
                                }
                            }

                            that._elements.areas[i].coords = coordinates;
                        }
                    }
                }
            }
        }

        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                that._elements[key] = hook;
            }
        }

        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    if (options && options[key] != null) {
                        if (property && typeof property.transform === "function") {
                            that._properties[key] = property.transform(options[key]);
                        } else {
                            that._properties[key] = options[key];
                        }
                    } else {
                        that._properties[key] = properties[key]["default"];
                    }
                }
            }
        }

        function onWindowResize() {
            that.update();
            resizeAreas();
        }

        function onLoad() {
            resizeAreas();
        }

        that.update = function() {
            if (that._properties.lazy) {
                if (isLazyVisible()) {
                    loadImage();
                }
            } else {
                loadImage();
            }
        };

        if (config && config.element) {
            init(config);
        }
    }

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Image({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Image({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    /*
        on drag & drop of the component into a parsys, noscript's content will be escaped multiple times by the editor which creates
        the DOM for editing; the HTML parser cannot be used here due to the multiple escaping
     */
    function decodeNoscript(text) {
        text = text.replace(/&(amp;)*lt;/g, "<");
        text = text.replace(/&(amp;)*gt;/g, ">");
        return text;
    }

})();

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "formText";
    var IS_DASH = "form-text";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * A validation message to display if there is a type mismatch between the user input and expected input.
         *
         * @type {String}
         */
        constraintMessage: {
        },
        /**
         * A validation message to display if no input is supplied, but input is expected for the field.
         *
         * @type {String}
         */
        requiredMessage: {
        }
    };

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function FormText(config) {
        if (config.element) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");
        }

        this._cacheElements(config.element);
        this._setupProperties(config.options);

        this._elements.input.addEventListener("invalid", this._onInvalid.bind(this));
        this._elements.input.addEventListener("input", this._onInput.bind(this));
    }

    FormText.prototype._onInvalid = function(event) {
        event.target.setCustomValidity("");
        if (event.target.validity.typeMismatch) {
            if (this._properties.constraintMessage) {
                event.target.setCustomValidity(this._properties.constraintMessage);
            }
        } else if (event.target.validity.valueMissing) {
            if (this._properties.requiredMessage) {
                event.target.setCustomValidity(this._properties.requiredMessage);
            }
        }
    };

    FormText.prototype._onInput = function(event) {
        event.target.setCustomValidity("");
    };

    FormText.prototype._cacheElements = function(wrapper) {
        this._elements = {};
        this._elements.self = wrapper;
        var hooks = this._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS_DASH + "]");
        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            var capitalized = IS;
            capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
            var key = hook.dataset[NS + "Hook" + capitalized];
            this._elements[key] = hook;
        }
    };

    FormText.prototype._setupProperties = function(options) {
        this._properties = {};

        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                var property = properties[key];
                if (options && options[key] != null) {
                    if (property && typeof property.transform === "function") {
                        this._properties[key] = property.transform(options[key]);
                    } else {
                        this._properties[key] = options[key];
                    }
                } else {
                    this._properties[key] = properties[key]["default"];
                }
            }
        }
    };

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new FormText({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new FormText({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

})();

/*
 *  Copyright 2018 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/* modified from html5up.net thanks @ajlkn */
(function($) {

    /**
     * Panel-ify an element.
     * @param {object} userConfig User config.
     * @return {jQuery} jQuery object.
     */
    $.fn.panel = function(userConfig) {

        // No elements?
            if (this.length == 0)
                return $this;

        // Multiple elements?
            if (this.length > 1) {

                for (var i=0; i < this.length; i++)
                    $(this[i]).panel(userConfig);

                return $this;
            }

        // Vars.
            var $this = $(this),
                $body = $('body'),
                $window = $(window),
                id = $this.attr('id'),
                config;

        // Config.
            config = $.extend({

                // Delay.
                    delay: 0,

                // Hide panel on link click.
                    hideOnClick: false,

                // Hide panel on escape keypress.
                    hideOnEscape: false,

                // Hide panel on swipe.
                    hideOnSwipe: false,

                // Reset scroll position on hide.
                    resetScroll: false,

                // Reset forms on hide.
                    resetForms: false,

                // Side of viewport the panel will appear.
                    side: null,

                // Target element for "class".
                    target: $this,

                // Class to toggle.
                    visibleClass: 'visible'

            }, userConfig);

            // Expand "target" if it's not a jQuery object already.
                if (typeof config.target != 'jQuery')
                    config.target = $(config.target);

        // PANEL.

            // Methods.
                $this._hide = function(event) {

                    // Already hidden? Bail.
                        if (!config.target.hasClass(config.visibleClass))
                            return;

                    // If an event was provided, cancel it.
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }

                    // Hide.
                        config.target.removeClass(config.visibleClass);
/**
* Flip the icon from hamburger to cross icon
*/
                        config.target.find('#toggleNav i').toggleClass('hamburger-close');

                    // Post-hide stuff.
                        window.setTimeout(function() {

                            // Reset scroll position.
                                if (config.resetScroll)
                                    $this.scrollTop(0);

                            // Reset forms.
                                if (config.resetForms)
                                    $this.find('form').each(function() {
                                        this.reset();
                                    });

                        }, config.delay);

                };

            // Vendor fixes.
                $this
                    .css('-ms-overflow-style', '-ms-autohiding-scrollbar')
                    .css('-webkit-overflow-scrolling', 'touch');

            // Hide on click.
                if (config.hideOnClick) {

                    $this.find('a').css('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');

/*********************************************
*  Dealing with menu item link clicks
*
*********************************************/
                    $this.on('click', 'a', function(event) {

                            var $a = $(this),
                                href = $a.attr('href'),
                                target = $a.attr('target');

                            if (!href || href == '#' || href == '' || href == '#' + id)
                                return;

                            // Cancel original event.
                                event.preventDefault();
                                event.stopPropagation();

                            // Hide panel.
                                $this._hide();

                            // Redirect to href.
                                window.setTimeout(function() {

                                    if (target == '_blank')
                                        window.open(href);
                                    else
                                        window.location.href = href;

                                }, config.delay + 10);

                        });
                }

            // Event: Touch stuff.
                $this.on('touchstart', function(event) {

                    $this.touchPosX = event.originalEvent.touches[0].pageX;
                    $this.touchPosY = event.originalEvent.touches[0].pageY;

                })

                $this.on('touchmove', function(event) {

                    if ($this.touchPosX === null
                    ||  $this.touchPosY === null)
                        return;

                    var diffX = $this.touchPosX - event.originalEvent.touches[0].pageX,
                        diffY = $this.touchPosY - event.originalEvent.touches[0].pageY,
                        th = $this.outerHeight(),
                        ts = ($this.get(0).scrollHeight - $this.scrollTop());

                    // Hide on swipe?
                        if (config.hideOnSwipe) {

                            var result = false,
                                boundary = 20,
                                delta = 50;

                            switch (config.side) {

                                case 'left':
                                    result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta);
                                    break;

                                case 'right':
                                    result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta));
                                    break;

                                case 'top':
                                    result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY > delta);
                                    break;

                                case 'bottom':
                                    result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY < (-1 * delta));
                                    break;

                                default:
                                    break;
                            }

                            if (result) {
                                $this.touchPosX = null;
                                $this.touchPosY = null;
                                $this._hide();

                                return false;
                            }
                        }

                    // Prevent vertical scrolling past the top or bottom.
                        if (($this.scrollTop() < 0 && diffY < 0)
                        || (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                });

            // Event: Prevent certain events inside the panel from bubbling.
                $this.on('click touchend touchstart touchmove', function(event) {
                    event.stopPropagation();
                });

            // Event: Hide panel if a child anchor tag pointing to its ID is clicked.
                $this.on('click', 'a[href="#' + id + '"]', function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    config.target.removeClass(config.visibleClass);
/**
* Flip the icon from hamburger to cross icon
*/
                    config.target.find('#toggleNav i').toggleClass('hamburger-close');

                });

/************************************************
*  Body: Events happen on html body
*
************************************************/

            // Event: Hide panel on body click/tap.
                $body.on('click touchend', function(event) {
                    $this._hide(event);

                });

            // Event: Toggle.
                $body.on('click', 'a[href="#' + id + '"]', function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    config.target.toggleClass(config.visibleClass);

/**
* Flip the icon from hamburger to cross icon
* when the Icon itself is clicked
*/
                    config.target.find('#toggleNav i').toggleClass('hamburger-close');

                });

        // Window.

            // Event: Hide on ESC.
                if (config.hideOnEscape)
                    $window.on('keydown', function(event) {
                        if (event.keyCode == 27)
                            $this._hide(event);
                    });

        return $this;
    };

})(jQuery);
/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.8.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
    'use strict';
    var Slick = window.Slick || {};

    Slick = (function() {

        var instanceUid = 0;

        function Slick(element, settings) {

            var _ = this, dataSettings;

            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
                nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3000,
                centerMode: false,
                centerPadding: '50px',
                cssEase: 'ease',
                customPaging: function(slider, i) {
                    return $('<button type="button" />').text(i + 1);
                },
                dots: false,
                dotsClass: 'slick-dots',
                draggable: true,
                easing: 'linear',
                edgeFriction: 0.35,
                fade: false,
                focusOnSelect: false,
                focusOnChange: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: 'ondemand',
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnFocus: true,
                pauseOnDotsHover: false,
                respondTo: 'window',
                responsive: null,
                rows: 1,
                rtl: false,
                slide: '',
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                useTransform: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1000
            };

            _.initials = {
                animating: false,
                dragging: false,
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
                scrolling: false,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                swiping: false,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };

            $.extend(_, _.initials);

            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.focussed = false;
            _.interrupted = false;
            _.hidden = 'hidden';
            _.paused = true;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = 'visibilitychange';
            _.windowWidth = 0;
            _.windowTimer = null;

            dataSettings = $(element).data('slick') || {};

            _.options = $.extend({}, _.defaults, settings, dataSettings);

            _.currentSlide = _.options.initialSlide;

            _.originalSettings = _.options;

            if (typeof document.mozHidden !== 'undefined') {
                _.hidden = 'mozHidden';
                _.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                _.hidden = 'webkitHidden';
                _.visibilityChange = 'webkitvisibilitychange';
            }

            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);

            _.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;


            _.registerBreakpoints();
            _.init(true);

        }

        return Slick;

    }());

    Slick.prototype.activateADA = function() {
        var _ = this;

        _.$slideTrack.find('.slick-active').attr({
            'aria-hidden': 'false'
        }).find('a, input, button, select').attr({
            'tabindex': '0'
        });

    };

    Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            addBefore = index;
            index = null;
        } else if (index < 0 || (index >= _.slideCount)) {
            return false;
        }

        _.unload();

        if (typeof(index) === 'number') {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slides.each(function(index, element) {
            $(element).attr('data-slick-index', index);
        });

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.animateHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };

    Slick.prototype.animateSlide = function(targetLeft, callback) {

        var animProps = {},
            _ = this;

        _.animateHeight();

        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }

        } else {

            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -(_.currentLeft);
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = 'translate(' +
                                now + 'px, 0px)';
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = 'translate(0px,' +
                                now + 'px)';
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });

            } else {

                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);

                if (_.options.vertical === false) {
                    animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                } else {
                    animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                }
                _.$slideTrack.css(animProps);

                if (callback) {
                    setTimeout(function() {

                        _.disableTransition();

                        callback.call();
                    }, _.options.speed);
                }

            }

        }

    };

    Slick.prototype.getNavTarget = function() {

        var _ = this,
            asNavFor = _.options.asNavFor;

        if ( asNavFor && asNavFor !== null ) {
            asNavFor = $(asNavFor).not(_.$slider);
        }

        return asNavFor;

    };

    Slick.prototype.asNavFor = function(index) {

        var _ = this,
            asNavFor = _.getNavTarget();

        if ( asNavFor !== null && typeof asNavFor === 'object' ) {
            asNavFor.each(function() {
                var target = $(this).slick('getSlick');
                if(!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }

    };

    Slick.prototype.applyTransition = function(slide) {

        var _ = this,
            transition = {};

        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
        } else {
            transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
        }

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.autoPlay = function() {

        var _ = this;

        _.autoPlayClear();

        if ( _.slideCount > _.options.slidesToShow ) {
            _.autoPlayTimer = setInterval( _.autoPlayIterator, _.options.autoplaySpeed );
        }

    };

    Slick.prototype.autoPlayClear = function() {

        var _ = this;

        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }

    };

    Slick.prototype.autoPlayIterator = function() {

        var _ = this,
            slideTo = _.currentSlide + _.options.slidesToScroll;

        if ( !_.paused && !_.interrupted && !_.focussed ) {

            if ( _.options.infinite === false ) {

                if ( _.direction === 1 && ( _.currentSlide + 1 ) === ( _.slideCount - 1 )) {
                    _.direction = 0;
                }

                else if ( _.direction === 0 ) {

                    slideTo = _.currentSlide - _.options.slidesToScroll;

                    if ( _.currentSlide - 1 === 0 ) {
                        _.direction = 1;
                    }

                }

            }

            _.slideHandler( slideTo );

        }

    };

    Slick.prototype.buildArrows = function() {

        var _ = this;

        if (_.options.arrows === true ) {

            _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
            _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

            if( _.slideCount > _.options.slidesToShow ) {

                _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
                _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }

                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }

                if (_.options.infinite !== true) {
                    _.$prevArrow
                        .addClass('slick-disabled')
                        .attr('aria-disabled', 'true');
                }

            } else {

                _.$prevArrow.add( _.$nextArrow )

                    .addClass('slick-hidden')
                    .attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });

            }

        }

    };

    Slick.prototype.buildDots = function() {

        var _ = this,
            i, dot;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$slider.addClass('slick-dotted');

            dot = $('<ul />').addClass(_.options.dotsClass);

            for (i = 0; i <= _.getDotCount(); i += 1) {
                dot.append($('<li />').append(_.options.customPaging.call(this, _, i)));
            }

            _.$dots = dot.appendTo(_.options.appendDots);

            _.$dots.find('li').first().addClass('slick-active');

        }

    };

    Slick.prototype.buildOut = function() {

        var _ = this;

        _.$slides =
            _.$slider
                .children( _.options.slide + ':not(.slick-cloned)')
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        _.$slides.each(function(index, element) {
            $(element)
                .attr('data-slick-index', index)
                .data('originalStyling', $(element).attr('style') || '');
        });

        _.$slider.addClass('slick-slider');

        _.$slideTrack = (_.slideCount === 0) ?
            $('<div class="slick-track"/>').appendTo(_.$slider) :
            _.$slides.wrapAll('<div class="slick-track"/>').parent();

        _.$list = _.$slideTrack.wrap(
            '<div class="slick-list"/>').parent();
        _.$slideTrack.css('opacity', 0);

        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }

        $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

        _.setupInfinite();

        _.buildArrows();

        _.buildDots();

        _.updateDots();


        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        if (_.options.draggable === true) {
            _.$list.addClass('draggable');
        }

    };

    Slick.prototype.buildRows = function() {

        var _ = this, a, b, c, newSlides, numOfSlides, originalSlides,slidesPerSection;

        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();

        if(_.options.rows > 0) {

            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(
                originalSlides.length / slidesPerSection
            );

            for(a = 0; a < numOfSlides; a++){
                var slide = document.createElement('div');
                for(b = 0; b < _.options.rows; b++) {
                    var row = document.createElement('div');
                    for(c = 0; c < _.options.slidesPerRow; c++) {
                        var target = (a * slidesPerSection + ((b * _.options.slidesPerRow) + c));
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }

            _.$slider.empty().append(newSlides);
            _.$slider.children().children().children()
                .css({
                    'width':(100 / _.options.slidesPerRow) + '%',
                    'display': 'inline-block'
                });

        }

    };

    Slick.prototype.checkResponsive = function(initial, forceUpdate) {

        var _ = this,
            breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();

        if (_.respondTo === 'window') {
            respondToWidth = windowWidth;
        } else if (_.respondTo === 'slider') {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === 'min') {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }

        if ( _.options.responsive &&
            _.options.responsive.length &&
            _.options.responsive !== null) {

            targetBreakpoint = null;

            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }

            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint =
                            targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings,
                                _.breakpointSettings[
                                    targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings,
                            _.breakpointSettings[
                                targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }

            // only trigger breakpoints during an actual break. not on initialize.
            if( !initial && triggerBreakpoint !== false ) {
                _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
            }
        }

    };

    Slick.prototype.changeSlide = function(event, dontAnimate) {

        var _ = this,
            $target = $(event.currentTarget),
            indexOffset, slideOffset, unevenOffset;

        // If target is a link, prevent default action.
        if($target.is('a')) {
            event.preventDefault();
        }

        // If target is not the <li> element (ie: a child), find the <li>.
        if(!$target.is('li')) {
            $target = $target.closest('li');
        }

        unevenOffset = (_.slideCount % _.options.slidesToScroll !== 0);
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

        switch (event.data.message) {

            case 'previous':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
                }
                break;

            case 'next':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
                }
                break;

            case 'index':
                var index = event.data.index === 0 ? 0 :
                    event.data.index || $target.index() * _.options.slidesToScroll;

                _.slideHandler(_.checkNavigable(index), false, dontAnimate);
                $target.children().trigger('focus');
                break;

            default:
                return;
        }

    };

    Slick.prototype.checkNavigable = function(index) {

        var _ = this,
            navigables, prevNavigable;

        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }

        return index;
    };

    Slick.prototype.cleanUpEvents = function() {

        var _ = this;

        if (_.options.dots && _.$dots !== null) {

            $('li', _.$dots)
                .off('click.slick', _.changeSlide)
                .off('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .off('mouseleave.slick', $.proxy(_.interrupt, _, false));

            if (_.options.accessibility === true) {
                _.$dots.off('keydown.slick', _.keyHandler);
            }
        }

        _.$slider.off('focus.slick blur.slick');

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
            _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow && _.$prevArrow.off('keydown.slick', _.keyHandler);
                _.$nextArrow && _.$nextArrow.off('keydown.slick', _.keyHandler);
            }
        }

        _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
        _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
        _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
        _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

        _.$list.off('click.slick', _.clickHandler);

        $(document).off(_.visibilityChange, _.visibility);

        _.cleanUpSlideEvents();

        if (_.options.accessibility === true) {
            _.$list.off('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off('click.slick', _.selectHandler);
        }

        $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

        $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

        $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

        $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);

    };

    Slick.prototype.cleanUpSlideEvents = function() {

        var _ = this;

        _.$list.off('mouseenter.slick', $.proxy(_.interrupt, _, true));
        _.$list.off('mouseleave.slick', $.proxy(_.interrupt, _, false));

    };

    Slick.prototype.cleanUpRows = function() {

        var _ = this, originalSlides;

        if(_.options.rows > 0) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr('style');
            _.$slider.empty().append(originalSlides);
        }

    };

    Slick.prototype.clickHandler = function(event) {

        var _ = this;

        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }

    };

    Slick.prototype.destroy = function(refresh) {

        var _ = this;

        _.autoPlayClear();

        _.touchObject = {};

        _.cleanUpEvents();

        $('.slick-cloned', _.$slider).detach();

        if (_.$dots) {
            _.$dots.remove();
        }

        if ( _.$prevArrow && _.$prevArrow.length ) {

            _.$prevArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display','');

            if ( _.htmlExpr.test( _.options.prevArrow )) {
                _.$prevArrow.remove();
            }
        }

        if ( _.$nextArrow && _.$nextArrow.length ) {

            _.$nextArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display','');

            if ( _.htmlExpr.test( _.options.nextArrow )) {
                _.$nextArrow.remove();
            }
        }


        if (_.$slides) {

            _.$slides
                .removeClass('slick-slide slick-active slick-center slick-visible slick-current')
                .removeAttr('aria-hidden')
                .removeAttr('data-slick-index')
                .each(function(){
                    $(this).attr('style', $(this).data('originalStyling'));
                });

            _.$slideTrack.children(this.options.slide).detach();

            _.$slideTrack.detach();

            _.$list.detach();

            _.$slider.append(_.$slides);
        }

        _.cleanUpRows();

        _.$slider.removeClass('slick-slider');
        _.$slider.removeClass('slick-initialized');
        _.$slider.removeClass('slick-dotted');

        _.unslicked = true;

        if(!refresh) {
            _.$slider.trigger('destroy', [_]);
        }

    };

    Slick.prototype.disableTransition = function(slide) {

        var _ = this,
            transition = {};

        transition[_.transitionType] = '';

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.fadeSlide = function(slideIndex, callback) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });

            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });

            if (callback) {
                setTimeout(function() {

                    _.disableTransition(slideIndex);

                    callback.call();
                }, _.options.speed);
            }

        }

    };

    Slick.prototype.fadeSlideOut = function(slideIndex) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });

        }

    };

    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {

        var _ = this;

        if (filter !== null) {

            _.$slidesCache = _.$slides;

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.focusHandler = function() {

        var _ = this;

        _.$slider
            .off('focus.slick blur.slick')
            .on('focus.slick blur.slick', '*', function(event) {

            event.stopImmediatePropagation();
            var $sf = $(this);

            setTimeout(function() {

                if( _.options.pauseOnFocus ) {
                    _.focussed = $sf.is(':focus');
                    _.autoPlay();
                }

            }, 0);

        });
    };

    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

        var _ = this;
        return _.currentSlide;

    };

    Slick.prototype.getDotCount = function() {

        var _ = this;

        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;

        if (_.options.infinite === true) {
            if (_.slideCount <= _.options.slidesToShow) {
                 ++pagerQty;
            } else {
                while (breakPoint < _.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + _.options.slidesToScroll;
                    counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
                }
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else if(!_.options.asNavFor) {
            pagerQty = 1 + Math.ceil((_.slideCount - _.options.slidesToShow) / _.options.slidesToScroll);
        }else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToScroll;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }

        return pagerQty - 1;

    };

    Slick.prototype.getLeft = function(slideIndex) {

        var _ = this,
            targetLeft,
            verticalHeight,
            verticalOffset = 0,
            targetSlide,
            coef;

        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);

        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = (_.slideWidth * _.options.slidesToShow) * -1;
                coef = -1

                if (_.options.vertical === true && _.options.centerMode === true) {
                    if (_.options.slidesToShow === 2) {
                        coef = -1.5;
                    } else if (_.options.slidesToShow === 1) {
                        coef = -2
                    }
                }
                verticalOffset = (verticalHeight * _.options.slidesToShow) * coef;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth) * -1;
                        verticalOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight) * -1;
                    } else {
                        _.slideOffset = ((_.slideCount % _.options.slidesToScroll) * _.slideWidth) * -1;
                        verticalOffset = ((_.slideCount % _.options.slidesToScroll) * verticalHeight) * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * _.slideWidth;
                verticalOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * verticalHeight;
            }
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }

        if (_.options.centerMode === true && _.slideCount <= _.options.slidesToShow) {
            _.slideOffset = ((_.slideWidth * Math.floor(_.options.slidesToShow)) / 2) - ((_.slideWidth * _.slideCount) / 2);
        } else if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }

        if (_.options.vertical === false) {
            targetLeft = ((slideIndex * _.slideWidth) * -1) + _.slideOffset;
        } else {
            targetLeft = ((slideIndex * verticalHeight) * -1) + verticalOffset;
        }

        if (_.options.variableWidth === true) {

            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
            }

            if (_.options.rtl === true) {
                if (targetSlide[0]) {
                    targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                } else {
                    targetLeft =  0;
                }
            } else {
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
            }

            if (_.options.centerMode === true) {
                if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
                }

                if (_.options.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft =  0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }

        return targetLeft;

    };

    Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {

        var _ = this;

        return _.options[option];

    };

    Slick.prototype.getNavigableIndexes = function() {

        var _ = this,
            breakPoint = 0,
            counter = 0,
            indexes = [],
            max;

        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }

        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }

        return indexes;

    };

    Slick.prototype.getSlick = function() {

        return this;

    };

    Slick.prototype.getSlideCount = function() {

        var _ = this,
            slidesTraversed, swipedSlide, centerOffset;

        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find('.slick-slide').each(function(index, slide) {
                if (slide.offsetLeft - centerOffset + ($(slide).outerWidth() / 2) > (_.swipeLeft * -1)) {
                    swipedSlide = slide;
                    return false;
                }
            });

            slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

            return slidesTraversed;

        } else {
            return _.options.slidesToScroll;
        }

    };

    Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'index',
                index: parseInt(slide)
            }
        }, dontAnimate);

    };

    Slick.prototype.init = function(creation) {

        var _ = this;

        if (!$(_.$slider).hasClass('slick-initialized')) {

            $(_.$slider).addClass('slick-initialized');

            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();
            _.checkResponsive(true);
            _.focusHandler();

        }

        if (creation) {
            _.$slider.trigger('init', [_]);
        }

        if (_.options.accessibility === true) {
            _.initADA();
        }

        if ( _.options.autoplay ) {

            _.paused = false;
            _.autoPlay();

        }

    };

    Slick.prototype.initADA = function() {
        var _ = this,
                numDotGroups = Math.ceil(_.slideCount / _.options.slidesToShow),
                tabControlIndexes = _.getNavigableIndexes().filter(function(val) {
                    return (val >= 0) && (val < _.slideCount);
                });

        _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
            'aria-hidden': 'true',
            'tabindex': '-1'
        }).find('a, input, button, select').attr({
            'tabindex': '-1'
        });

        if (_.$dots !== null) {
            _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function(i) {
                var slideControlIndex = tabControlIndexes.indexOf(i);

                $(this).attr({
                    'role': 'tabpanel',
                    'id': 'slick-slide' + _.instanceUid + i,
                    'tabindex': -1
                });

                if (slideControlIndex !== -1) {
                   var ariaButtonControl = 'slick-slide-control' + _.instanceUid + slideControlIndex
                   if ($('#' + ariaButtonControl).length) {
                     $(this).attr({
                         'aria-describedby': ariaButtonControl
                     });
                   }
                }
            });

            _.$dots.attr('role', 'tablist').find('li').each(function(i) {
                var mappedSlideIndex = tabControlIndexes[i];

                $(this).attr({
                    'role': 'presentation'
                });

                $(this).find('button').first().attr({
                    'role': 'tab',
                    'id': 'slick-slide-control' + _.instanceUid + i,
                    'aria-controls': 'slick-slide' + _.instanceUid + mappedSlideIndex,
                    'aria-label': (i + 1) + ' of ' + numDotGroups,
                    'aria-selected': null,
                    'tabindex': '-1'
                });

            }).eq(_.currentSlide).find('button').attr({
                'aria-selected': 'true',
                'tabindex': '0'
            }).end();
        }

        for (var i=_.currentSlide, max=i+_.options.slidesToShow; i < max; i++) {
          if (_.options.focusOnChange) {
            _.$slides.eq(i).attr({'tabindex': '0'});
          } else {
            _.$slides.eq(i).removeAttr('tabindex');
          }
        }

        _.activateADA();

    };

    Slick.prototype.initArrowEvents = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow
               .off('click.slick')
               .on('click.slick', {
                    message: 'previous'
               }, _.changeSlide);
            _.$nextArrow
               .off('click.slick')
               .on('click.slick', {
                    message: 'next'
               }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow.on('keydown.slick', _.keyHandler);
                _.$nextArrow.on('keydown.slick', _.keyHandler);
            }
        }

    };

    Slick.prototype.initDotEvents = function() {

        var _ = this;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            $('li', _.$dots).on('click.slick', {
                message: 'index'
            }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$dots.on('keydown.slick', _.keyHandler);
            }
        }

        if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.slideCount > _.options.slidesToShow) {

            $('li', _.$dots)
                .on('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initSlideEvents = function() {

        var _ = this;

        if ( _.options.pauseOnHover ) {

            _.$list.on('mouseenter.slick', $.proxy(_.interrupt, _, true));
            _.$list.on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initializeEvents = function() {

        var _ = this;

        _.initArrowEvents();

        _.initDotEvents();
        _.initSlideEvents();

        _.$list.on('touchstart.slick mousedown.slick', {
            action: 'start'
        }, _.swipeHandler);
        _.$list.on('touchmove.slick mousemove.slick', {
            action: 'move'
        }, _.swipeHandler);
        _.$list.on('touchend.slick mouseup.slick', {
            action: 'end'
        }, _.swipeHandler);
        _.$list.on('touchcancel.slick mouseleave.slick', {
            action: 'end'
        }, _.swipeHandler);

        _.$list.on('click.slick', _.clickHandler);

        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

        if (_.options.accessibility === true) {
            _.$list.on('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

        $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

        $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

        $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(_.setPosition);

    };

    Slick.prototype.initUI = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.show();
            _.$nextArrow.show();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.show();

        }

    };

    Slick.prototype.keyHandler = function(event) {

        var _ = this;
         //Dont slide if the cursor is inside the form fields and arrow keys are pressed
        if(!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'next' :  'previous'
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'previous' : 'next'
                    }
                });
            }
        }

    };

    Slick.prototype.lazyLoad = function() {

        var _ = this,
            loadRange, cloneRange, rangeStart, rangeEnd;

        function loadImages(imagesScope) {

            $('img[data-lazy]', imagesScope).each(function() {

                var image = $(this),
                    imageSource = $(this).attr('data-lazy'),
                    imageSrcSet = $(this).attr('data-srcset'),
                    imageSizes  = $(this).attr('data-sizes') || _.$slider.attr('data-sizes'),
                    imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {

                    image
                        .animate({ opacity: 0 }, 100, function() {

                            if (imageSrcSet) {
                                image
                                    .attr('srcset', imageSrcSet );

                                if (imageSizes) {
                                    image
                                        .attr('sizes', imageSizes );
                                }
                            }

                            image
                                .attr('src', imageSource)
                                .animate({ opacity: 1 }, 200, function() {
                                    image
                                        .removeAttr('data-lazy data-srcset data-sizes')
                                        .removeClass('slick-loading');
                                });
                            _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                        });

                };

                imageToLoad.onerror = function() {

                    image
                        .removeAttr( 'data-lazy' )
                        .removeClass( 'slick-loading' )
                        .addClass( 'slick-lazyload-error' );

                    _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

                };

                imageToLoad.src = imageSource;

            });

        }

        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = Math.ceil(rangeStart + _.options.slidesToShow);
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }

        loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);

        if (_.options.lazyLoad === 'anticipated') {
            var prevSlide = rangeStart - 1,
                nextSlide = rangeEnd,
                $slides = _.$slider.find('.slick-slide');

            for (var i = 0; i < _.options.slidesToScroll; i++) {
                if (prevSlide < 0) prevSlide = _.slideCount - 1;
                loadRange = loadRange.add($slides.eq(prevSlide));
                loadRange = loadRange.add($slides.eq(nextSlide));
                prevSlide--;
                nextSlide++;
            }
        }

        loadImages(loadRange);

        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-slide');
            loadImages(cloneRange);
        } else
        if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }

    };

    Slick.prototype.loadSlider = function() {

        var _ = this;

        _.setPosition();

        _.$slideTrack.css({
            opacity: 1
        });

        _.$slider.removeClass('slick-loading');

        _.initUI();

        if (_.options.lazyLoad === 'progressive') {
            _.progressiveLazyLoad();
        }

    };

    Slick.prototype.next = Slick.prototype.slickNext = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'next'
            }
        });

    };

    Slick.prototype.orientationChange = function() {

        var _ = this;

        _.checkResponsive();
        _.setPosition();

    };

    Slick.prototype.pause = Slick.prototype.slickPause = function() {

        var _ = this;

        _.autoPlayClear();
        _.paused = true;

    };

    Slick.prototype.play = Slick.prototype.slickPlay = function() {

        var _ = this;

        _.autoPlay();
        _.options.autoplay = true;
        _.paused = false;
        _.focussed = false;
        _.interrupted = false;

    };

    Slick.prototype.postSlide = function(index) {

        var _ = this;

        if( !_.unslicked ) {

            _.$slider.trigger('afterChange', [_, index]);

            _.animating = false;

            if (_.slideCount > _.options.slidesToShow) {
                _.setPosition();
            }

            _.swipeLeft = null;

            if ( _.options.autoplay ) {
                _.autoPlay();
            }

            if (_.options.accessibility === true) {
                _.initADA();

                if (_.options.focusOnChange) {
                    var $currentSlide = $(_.$slides.get(_.currentSlide));
                    $currentSlide.attr('tabindex', 0).focus();
                }
            }

        }

    };

    Slick.prototype.prev = Slick.prototype.slickPrev = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'previous'
            }
        });

    };

    Slick.prototype.preventDefault = function(event) {

        event.preventDefault();

    };

    Slick.prototype.progressiveLazyLoad = function( tryCount ) {

        tryCount = tryCount || 1;

        var _ = this,
            $imgsToLoad = $( 'img[data-lazy]', _.$slider ),
            image,
            imageSource,
            imageSrcSet,
            imageSizes,
            imageToLoad;

        if ( $imgsToLoad.length ) {

            image = $imgsToLoad.first();
            imageSource = image.attr('data-lazy');
            imageSrcSet = image.attr('data-srcset');
            imageSizes  = image.attr('data-sizes') || _.$slider.attr('data-sizes');
            imageToLoad = document.createElement('img');

            imageToLoad.onload = function() {

                if (imageSrcSet) {
                    image
                        .attr('srcset', imageSrcSet );

                    if (imageSizes) {
                        image
                            .attr('sizes', imageSizes );
                    }
                }

                image
                    .attr( 'src', imageSource )
                    .removeAttr('data-lazy data-srcset data-sizes')
                    .removeClass('slick-loading');

                if ( _.options.adaptiveHeight === true ) {
                    _.setPosition();
                }

                _.$slider.trigger('lazyLoaded', [ _, image, imageSource ]);
                _.progressiveLazyLoad();

            };

            imageToLoad.onerror = function() {

                if ( tryCount < 3 ) {

                    /**
                     * try to load the image 3 times,
                     * leave a slight delay so we don't get
                     * servers blocking the request.
                     */
                    setTimeout( function() {
                        _.progressiveLazyLoad( tryCount + 1 );
                    }, 500 );

                } else {

                    image
                        .removeAttr( 'data-lazy' )
                        .removeClass( 'slick-loading' )
                        .addClass( 'slick-lazyload-error' );

                    _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

                    _.progressiveLazyLoad();

                }

            };

            imageToLoad.src = imageSource;

        } else {

            _.$slider.trigger('allImagesLoaded', [ _ ]);

        }

    };

    Slick.prototype.refresh = function( initializing ) {

        var _ = this, currentSlide, lastVisibleIndex;

        lastVisibleIndex = _.slideCount - _.options.slidesToShow;

        // in non-infinite sliders, we don't want to go past the
        // last visible index.
        if( !_.options.infinite && ( _.currentSlide > lastVisibleIndex )) {
            _.currentSlide = lastVisibleIndex;
        }

        // if less slides than to show, go to start.
        if ( _.slideCount <= _.options.slidesToShow ) {
            _.currentSlide = 0;

        }

        currentSlide = _.currentSlide;

        _.destroy(true);

        $.extend(_, _.initials, { currentSlide: currentSlide });

        _.init();

        if( !initializing ) {

            _.changeSlide({
                data: {
                    message: 'index',
                    index: currentSlide
                }
            }, false);

        }

    };

    Slick.prototype.registerBreakpoints = function() {

        var _ = this, breakpoint, currentBreakpoint, l,
            responsiveSettings = _.options.responsive || null;

        if ( $.type(responsiveSettings) === 'array' && responsiveSettings.length ) {

            _.respondTo = _.options.respondTo || 'window';

            for ( breakpoint in responsiveSettings ) {

                l = _.breakpoints.length-1;

                if (responsiveSettings.hasOwnProperty(breakpoint)) {
                    currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                    // loop through the breakpoints and cut out any existing
                    // ones with the same breakpoint number, we don't want dupes.
                    while( l >= 0 ) {
                        if( _.breakpoints[l] && _.breakpoints[l] === currentBreakpoint ) {
                            _.breakpoints.splice(l,1);
                        }
                        l--;
                    }

                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;

                }

            }

            _.breakpoints.sort(function(a, b) {
                return ( _.options.mobileFirst ) ? a-b : b-a;
            });

        }

    };

    Slick.prototype.reinit = function() {

        var _ = this;

        _.$slides =
            _.$slideTrack
                .children(_.options.slide)
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        _.registerBreakpoints();

        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();
        _.cleanUpSlideEvents();
        _.initSlideEvents();

        _.checkResponsive(false, true);

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        _.setPosition();
        _.focusHandler();

        _.paused = !_.options.autoplay;
        _.autoPlay();

        _.$slider.trigger('reInit', [_]);

    };

    Slick.prototype.resize = function() {

        var _ = this;

        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function() {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if( !_.unslicked ) { _.setPosition(); }
            }, 50);
        }
    };

    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }

        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }

        _.unload();

        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.setCSS = function(position) {

        var _ = this,
            positionProps = {},
            x, y;

        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
        y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

        positionProps[_.positionProp] = position;

        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                _.$slideTrack.css(positionProps);
            }
        }

    };

    Slick.prototype.setDimensions = function() {

        var _ = this;

        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: ('0px ' + _.options.centerPadding)
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: (_.options.centerPadding + ' 0px')
                });
            }
        }

        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();


        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil((_.slideWidth * _.$slideTrack.children('.slick-slide').length)));

        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5000 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil((_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length)));
        }

        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);

    };

    Slick.prototype.setFade = function() {

        var _ = this,
            targetLeft;

        _.$slides.each(function(index, element) {
            targetLeft = (_.slideWidth * index) * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: 'relative',
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: 'relative',
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });

        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });

    };

    Slick.prototype.setHeight = function() {

        var _ = this;

        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css('height', targetHeight);
        }

    };

    Slick.prototype.setOption =
    Slick.prototype.slickSetOption = function() {

        /**
         * accepts arguments in format of:
         *
         *  - for changing a single option's value:
         *     .slick("setOption", option, value, refresh )
         *
         *  - for changing a set of responsive options:
         *     .slick("setOption", 'responsive', [{}, ...], refresh )
         *
         *  - for updating multiple values at once (not responsive)
         *     .slick("setOption", { 'option': value, ... }, refresh )
         */

        var _ = this, l, item, option, value, refresh = false, type;

        if( $.type( arguments[0] ) === 'object' ) {

            option =  arguments[0];
            refresh = arguments[1];
            type = 'multiple';

        } else if ( $.type( arguments[0] ) === 'string' ) {

            option =  arguments[0];
            value = arguments[1];
            refresh = arguments[2];

            if ( arguments[0] === 'responsive' && $.type( arguments[1] ) === 'array' ) {

                type = 'responsive';

            } else if ( typeof arguments[1] !== 'undefined' ) {

                type = 'single';

            }

        }

        if ( type === 'single' ) {

            _.options[option] = value;


        } else if ( type === 'multiple' ) {

            $.each( option , function( opt, val ) {

                _.options[opt] = val;

            });


        } else if ( type === 'responsive' ) {

            for ( item in value ) {

                if( $.type( _.options.responsive ) !== 'array' ) {

                    _.options.responsive = [ value[item] ];

                } else {

                    l = _.options.responsive.length-1;

                    // loop through the responsive object and splice out duplicates.
                    while( l >= 0 ) {

                        if( _.options.responsive[l].breakpoint === value[item].breakpoint ) {

                            _.options.responsive.splice(l,1);

                        }

                        l--;

                    }

                    _.options.responsive.push( value[item] );

                }

            }

        }

        if ( refresh ) {

            _.unload();
            _.reinit();

        }

    };

    Slick.prototype.setPosition = function() {

        var _ = this;

        _.setDimensions();

        _.setHeight();

        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }

        _.$slider.trigger('setPosition', [_]);

    };

    Slick.prototype.setProps = function() {

        var _ = this,
            bodyStyle = document.body.style;

        _.positionProp = _.options.vertical === true ? 'top' : 'left';

        if (_.positionProp === 'top') {
            _.$slider.addClass('slick-vertical');
        } else {
            _.$slider.removeClass('slick-vertical');
        }

        if (bodyStyle.WebkitTransition !== undefined ||
            bodyStyle.MozTransition !== undefined ||
            bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }

        if ( _.options.fade ) {
            if ( typeof _.options.zIndex === 'number' ) {
                if( _.options.zIndex < 3 ) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }

        if (bodyStyle.OTransform !== undefined) {
            _.animType = 'OTransform';
            _.transformType = '-o-transform';
            _.transitionType = 'OTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = 'MozTransform';
            _.transformType = '-moz-transform';
            _.transitionType = 'MozTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = 'webkitTransform';
            _.transformType = '-webkit-transform';
            _.transitionType = 'webkitTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = 'msTransform';
            _.transformType = '-ms-transform';
            _.transitionType = 'msTransition';
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = 'transform';
            _.transformType = 'transform';
            _.transitionType = 'transition';
        }
        _.transformsEnabled = _.options.useTransform && (_.animType !== null && _.animType !== false);
    };


    Slick.prototype.setSlideClasses = function(index) {

        var _ = this,
            centerOffset, allSlides, indexOffset, remainder;

        allSlides = _.$slider
            .find('.slick-slide')
            .removeClass('slick-active slick-center slick-current')
            .attr('aria-hidden', 'true');

        _.$slides
            .eq(index)
            .addClass('slick-current');

        if (_.options.centerMode === true) {

            var evenCoef = _.options.slidesToShow % 2 === 0 ? 1 : 0;

            centerOffset = Math.floor(_.options.slidesToShow / 2);

            if (_.options.infinite === true) {

                if (index >= centerOffset && index <= (_.slideCount - 1) - centerOffset) {
                    _.$slides
                        .slice(index - centerOffset + evenCoef, index + centerOffset + 1)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    indexOffset = _.options.slidesToShow + index;
                    allSlides
                        .slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

                if (index === 0) {

                    allSlides
                        .eq(allSlides.length - 1 - _.options.slidesToShow)
                        .addClass('slick-center');

                } else if (index === _.slideCount - 1) {

                    allSlides
                        .eq(_.options.slidesToShow)
                        .addClass('slick-center');

                }

            }

            _.$slides
                .eq(index)
                .addClass('slick-center');

        } else {

            if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {

                _.$slides
                    .slice(index, index + _.options.slidesToShow)
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else if (allSlides.length <= _.options.slidesToShow) {

                allSlides
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else {

                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

                if (_.options.slidesToShow == _.options.slidesToScroll && (_.slideCount - index) < _.options.slidesToShow) {

                    allSlides
                        .slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    allSlides
                        .slice(indexOffset, indexOffset + _.options.slidesToShow)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

            }

        }

        if (_.options.lazyLoad === 'ondemand' || _.options.lazyLoad === 'anticipated') {
            _.lazyLoad();
        }
    };

    Slick.prototype.setupInfinite = function() {

        var _ = this,
            i, slideIndex, infiniteCount;

        if (_.options.fade === true) {
            _.options.centerMode = false;
        }

        if (_.options.infinite === true && _.options.fade === false) {

            slideIndex = null;

            if (_.slideCount > _.options.slidesToShow) {

                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }

                for (i = _.slideCount; i > (_.slideCount -
                        infiniteCount); i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex - _.slideCount)
                        .prependTo(_.$slideTrack).addClass('slick-cloned');
                }
                for (i = 0; i < infiniteCount  + _.slideCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex + _.slideCount)
                        .appendTo(_.$slideTrack).addClass('slick-cloned');
                }
                _.$slideTrack.find('.slick-cloned').find('[id]').each(function() {
                    $(this).attr('id', '');
                });

            }

        }

    };

    Slick.prototype.interrupt = function( toggle ) {

        var _ = this;

        if( !toggle ) {
            _.autoPlay();
        }
        _.interrupted = toggle;

    };

    Slick.prototype.selectHandler = function(event) {

        var _ = this;

        var targetElement =
            $(event.target).is('.slick-slide') ?
                $(event.target) :
                $(event.target).parents('.slick-slide');

        var index = parseInt(targetElement.attr('data-slick-index'));

        if (!index) index = 0;

        if (_.slideCount <= _.options.slidesToShow) {

            _.slideHandler(index, false, true);
            return;

        }

        _.slideHandler(index);

    };

    Slick.prototype.slideHandler = function(index, sync, dontAnimate) {

        var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null,
            _ = this, navTarget;

        sync = sync || false;

        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }

        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }

        if (sync === false) {
            _.asNavFor(index);
        }

        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);

        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > (_.slideCount - _.options.slidesToScroll))) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }

        if ( _.options.autoplay ) {
            clearInterval(_.autoPlayTimer);
        }

        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - (_.slideCount % _.options.slidesToScroll);
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }

        _.animating = true;

        _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;

        _.setSlideClasses(_.currentSlide);

        if ( _.options.asNavFor ) {

            navTarget = _.getNavTarget();
            navTarget = navTarget.slick('getSlick');

            if ( navTarget.slideCount <= navTarget.options.slidesToShow ) {
                navTarget.setSlideClasses(_.currentSlide);
            }

        }

        _.updateDots();
        _.updateArrows();

        if (_.options.fade === true) {
            if (dontAnimate !== true) {

                _.fadeSlideOut(oldSlide);

                _.fadeSlide(animSlide, function() {
                    _.postSlide(animSlide);
                });

            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }

        if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
            _.animateSlide(targetLeft, function() {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }

    };

    Slick.prototype.startLoad = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.hide();
            _.$nextArrow.hide();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.hide();

        }

        _.$slider.addClass('slick-loading');

    };

    Slick.prototype.swipeDirection = function() {

        var xDist, yDist, r, swipeAngle, _ = this;

        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);

        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
            return (_.options.rtl === false ? 'right' : 'left');
        }
        if (_.options.verticalSwiping === true) {
            if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
                return 'down';
            } else {
                return 'up';
            }
        }

        return 'vertical';

    };

    Slick.prototype.swipeEnd = function(event) {

        var _ = this,
            slideCount,
            direction;

        _.dragging = false;
        _.swiping = false;

        if (_.scrolling) {
            _.scrolling = false;
            return false;
        }

        _.interrupted = false;
        _.shouldClick = ( _.touchObject.swipeLength > 10 ) ? false : true;

        if ( _.touchObject.curX === undefined ) {
            return false;
        }

        if ( _.touchObject.edgeHit === true ) {
            _.$slider.trigger('edge', [_, _.swipeDirection() ]);
        }

        if ( _.touchObject.swipeLength >= _.touchObject.minSwipe ) {

            direction = _.swipeDirection();

            switch ( direction ) {

                case 'left':
                case 'down':

                    slideCount =
                        _.options.swipeToSlide ?
                            _.checkNavigable( _.currentSlide + _.getSlideCount() ) :
                            _.currentSlide + _.getSlideCount();

                    _.currentDirection = 0;

                    break;

                case 'right':
                case 'up':

                    slideCount =
                        _.options.swipeToSlide ?
                            _.checkNavigable( _.currentSlide - _.getSlideCount() ) :
                            _.currentSlide - _.getSlideCount();

                    _.currentDirection = 1;

                    break;

                default:


            }

            if( direction != 'vertical' ) {

                _.slideHandler( slideCount );
                _.touchObject = {};
                _.$slider.trigger('swipe', [_, direction ]);

            }

        } else {

            if ( _.touchObject.startX !== _.touchObject.curX ) {

                _.slideHandler( _.currentSlide );
                _.touchObject = {};

            }

        }

    };

    Slick.prototype.swipeHandler = function(event) {

        var _ = this;

        if ((_.options.swipe === false) || ('ontouchend' in document && _.options.swipe === false)) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
            return;
        }

        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
            event.originalEvent.touches.length : 1;

        _.touchObject.minSwipe = _.listWidth / _.options
            .touchThreshold;

        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options
                .touchThreshold;
        }

        switch (event.data.action) {

            case 'start':
                _.swipeStart(event);
                break;

            case 'move':
                _.swipeMove(event);
                break;

            case 'end':
                _.swipeEnd(event);
                break;

        }

    };

    Slick.prototype.swipeMove = function(event) {

        var _ = this,
            edgeWasHit = false,
            curLeft, swipeDirection, swipeLength, positionOffset, touches, verticalSwipeLength;

        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        if (!_.dragging || _.scrolling || touches && touches.length !== 1) {
            return false;
        }

        curLeft = _.getLeft(_.currentSlide);

        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

        _.touchObject.swipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

        verticalSwipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));

        if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
            _.scrolling = true;
            return false;
        }

        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = verticalSwipeLength;
        }

        swipeDirection = _.swipeDirection();

        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            _.swiping = true;
            event.preventDefault();
        }

        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }


        swipeLength = _.touchObject.swipeLength;

        _.touchObject.edgeHit = false;

        if (_.options.infinite === false) {
            if ((_.currentSlide === 0 && swipeDirection === 'right') || (_.currentSlide >= _.getDotCount() && swipeDirection === 'left')) {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }

        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + (swipeLength * (_.$list.height() / _.listWidth)) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }

        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }

        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }

        _.setCSS(_.swipeLeft);

    };

    Slick.prototype.swipeStart = function(event) {

        var _ = this,
            touches;

        _.interrupted = true;

        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }

        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }

        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

        _.dragging = true;

    };

    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

        var _ = this;

        if (_.$slidesCache !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.unload = function() {

        var _ = this;

        $('.slick-cloned', _.$slider).remove();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }

        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }

        _.$slides
            .removeClass('slick-slide slick-active slick-visible slick-current')
            .attr('aria-hidden', 'true')
            .css('width', '');

    };

    Slick.prototype.unslick = function(fromBreakpoint) {

        var _ = this;
        _.$slider.trigger('unslick', [_, fromBreakpoint]);
        _.destroy();

    };

    Slick.prototype.updateArrows = function() {

        var _ = this,
            centerOffset;

        centerOffset = Math.floor(_.options.slidesToShow / 2);

        if ( _.options.arrows === true &&
            _.slideCount > _.options.slidesToShow &&
            !_.options.infinite ) {

            _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            if (_.currentSlide === 0) {

                _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            }

        }

    };

    Slick.prototype.updateDots = function() {

        var _ = this;

        if (_.$dots !== null) {

            _.$dots
                .find('li')
                    .removeClass('slick-active')
                    .end();

            _.$dots
                .find('li')
                .eq(Math.floor(_.currentSlide / _.options.slidesToScroll))
                .addClass('slick-active');

        }

    };

    Slick.prototype.visibility = function() {

        var _ = this;

        if ( _.options.autoplay ) {

            if ( document[_.hidden] ) {

                _.interrupted = true;

            } else {

                _.interrupted = false;

            }

        }

    };

    $.fn.slick = function() {
        var _ = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = _.length,
            i,
            ret;
        for (i = 0; i < l; i++) {
            if (typeof opt == 'object' || typeof opt == 'undefined')
                _[i].slick = new Slick(_[i], opt);
            else
                ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != 'undefined') return ret;
        }
        return _;
    };

}));

/*
 *  Copyright 2018 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

   (function (element, $) {
       'use strict';
       var target = $(element),
           className = "scrolly",
           scroll,
           mobileBreakpoint = 992;

       if($(window).scrollTop() > 0) {
           target.addClass(className);
       }

       $(window).scroll(function(){

            scroll = $(window).scrollTop();
       if(scroll > 0 ) {
           target.addClass(className);
       } else {
           target.removeClass(className);
       }
    });
   }('body',jQuery));
$(function(){
'use strict';

  var contentdiv=$('div.globalheader').next().attr('id','maincontent');

  // bind a click event to the 'skip' link
  $(".skip").click(function(event){
    
    // strip the leading hash and declare
    // the content we're skipping to
    var skipTo="#"+this.href.split('#')[1];
    
   // Setting 'tabindex' to -1 takes an element out of normal 
   // tab flow but allows it to be focused via javascript
    $(skipTo).attr('tabindex', -1).on('blur focusout', function () {
    
    // when focus leaves this element, 
    // remove the tabindex attribute
     $(this).removeAttr('tabindex');
    
     }).focus(); // focus on the content container
  });  

  $('#maincontent').wrap("<main></main>");

});

// Wrap bindings in anonymous namespace to prevent collisions
   jQuery(function($) {
       "use strict";

    function applyComponentStyles() {


     let navhtml="";

        $("#header-navbarbtm .cmp-navigation").not("[data-top-nav-processed='true']").each(function() {
            var nav =$(this).attr("data-top-nav-processed", true);
            navhtml+=$(this).html();

        });

        $("#header-navbartop .cmp-navigation").not("[data-top-nav-processed='true']").each(function() {
            var nav =$(this).attr("data-top-nav-processed", true);
            navhtml+=$(this).html();

        });


       let $body = $('body');

               // Toggle Nav
               $('<div id="toggleNav">' +
                    '<a href="#mobileNav" class="toggle" aria-label="mobile navigation"><i class="fa fa-bars" aria-hidden="true"></i></a>' +
                   '</div>'
               ).appendTo($body);

            // Navigation Panel.
               $(
                   '<div id="mobileNav" class="cmp-navigation--mobile">' +
                       '<nav class="cmp-navigation">' +
                           navhtml +
                       '</nav>' +
                   '</div>'
               )   .appendTo($body)
                   .panel({
                       delay: 500,
                       hideOnClick: true,
                       hideOnSwipe: true,
                       resetScroll: true,
                       resetForms: true,
                       side: 'left',
                       target: $body,
                       visibleClass: 'navPanel-visible'
                   });
       }

     applyComponentStyles();
     
   });
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
    	$('.cmp-promobreaker__video .toggle-video__bottom').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.promobreakerPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Promo Breaker | Looping Video | Pause");
                videoPlayed = true;
            } else {
                videojs.players.promobreakerPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                videoPlayed = false;
                $(this).attr("data-analytics-button", "Promo Breaker | Looping Video | Play");
                videoPlayed = false;
            }
		});        
    });
})(jQuery, jQuery(document));
(function ($, $document) {
    $document.ready( function() {
     $('.cmp-conversionbreaker__phonenumber a').attr("tabindex", "-1");
     if (screen.width > 767) {
         $('.cmp-conversionbreaker__phonenumber a').on('click', function (event) {
             event.preventDefault();
         });
     }
 });
})(jQuery, jQuery(document));
var TAB_KEY = 9,
    SPACE_BAR = 32,
    ENTER = 13,
    ESC = 27;

var PRIMARY_NAV_CLASS = "cmp-navigation__item cmp-navigation__item--level-0",
    TOP_NAV_ACTIVE_CLASS = PRIMARY_NAV_CLASS + " openDropDownMenu",
    BOTTOM_NAV_ACTIVE_CLASS = PRIMARY_NAV_CLASS + " active",
    LIST_PARENT_CLASS_SELECTOR = ".cmp-navigation__group",
    SECONDARY_POPUP_CLOSE_BUTTON_SELECTOR = ".msdotcomr4-header--btmnav .secondary-popup .secondary-popup-close",
    FEATURED_SECTION_SELECTOR = ".secondary-popup__related",
    SECONDARY_POP_UP_SELECTOR = ".secondary-popup",
    SECONDARY_POP_UP_GRAND_CHILD_ANCHORS = ".msdotcomr4-header--btmnav .cmp-navigation__item .cmp-navigation__item--level-2 > a",
    SECONDARY_POP_UP_CHILD_SUMMARY = ".msdotcomr4-header--btmnav .secondary-popup__summary li",
    topnvMenuItems = document.querySelectorAll('.msdotcomr4-header--topnav .cmp-navigation__item--level-0'),
    bottomNavMenuItems = document.querySelectorAll('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0'),
    bottomNavSecondaryItems = document.querySelectorAll('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0 .secondary-popup__links .secondary-popup__links li'),
    $body = $('body'),
    $searchInputBox = $(".cmp-search__input"),
    $clearSearchText = $(".cmp-search-clear-text"),
    $searchControlButton = $(".search-control"),
    $searchHeader = $(".cmp-search--header"),
    $menuModalContent = $(".menu-modal-content"),
    timer1, timer2, anchorElement;


var mainNavMenu = (function () {

    var $menuItems = $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0 > a'),
        $topNavMenuItems = $(".msdotcomr4-header--topnav .cmp-navigation__item--level-0 > a"),
        $popupLinksList = $('.msdotcomr4-header--btmnav .secondary-popup__links .cmp-navigation__group li'),
        current = -1,
        lastScrollTop = -1,
        lastHeaderScrollTop = 0,
        headerTranslate = 0,
        $window = $(window),
        header = $(".header"),
        scrollTimeOut = 0;

    /* Initializes */
    function init() {
        Array.prototype.forEach.call(topnvMenuItems, function (el, i) {
            if (hasSecondaryPopup(el)) {
                el.querySelector("a").setAttribute("aria-expanded", "false");
            }
        });

        Array.prototype.forEach.call(bottomNavMenuItems, function (el, i) {
            if (hasSecondaryPopup(el)) {
                el.querySelector("a").setAttribute("aria-expanded", "false");
            }
        });

        $menuItems.click(function (event) {
            openMainMenu(event, this);
            this.setAttribute("aria-expanded", "true");
            focusFirstItem(this.parentElement);
        });

        $topNavMenuItems.click(function (event) {
            if (this.parentNode.className === PRIMARY_NAV_CLASS &&
                hasSecondaryPopup(this.parentElement)) {
                this.parentNode.className = TOP_NAV_ACTIVE_CLASS;
                this.setAttribute("aria-expanded", "true");
                var secondaryPopupChildList = this.parentElement.querySelectorAll(".secondary-popup .cmp-navigation__group li");
                if (secondaryPopupChildList.length > 0) {
                    anchorElement = secondaryPopupChildList[0].querySelector("a");
                    if (anchorElement) anchorElement.focus();
                }
            }
        });

        $popupLinksList.on('mouseover', openPopupMenu);
    }

    /* Opens Bottom Nav Secondary Popup */
    function openMainMenu(e, eventData) {
        e.preventDefault();
        let currentNode;
        e && e.data && e.data.param ? currentNode = this : currentNode = eventData;
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        window.scrollTo(0, 0);
        $(currentNode).parent().addClass('active');
        $(".msdotcomr4-header--btmnav .secondary-popup__summary li").removeClass('active');
        $(".msdotcomr4-header--btmnav .cmp-navigation__group li.cmp-navigation__item--level-1").removeClass('active');
        $(".msdotcomr4-header--btmnav .cmp-navigation__group li.cmp-navigation__item--level-1:first-child").addClass('active');

        $(".msdotcomr4-header--btmnav .secondary-popup__summary li:first-child").addClass('active');
        $menuModalContent.show();
        $searchHeader.hide();

        if ($searchControlButton.find(".fa-times").length >= 1) {
            $searchControlButton.find('i').removeClass('fa-times').addClass('fa-search');
        }

        var $getRelatedCard = $(".msdotcomr4-header--btmnav .active .secondary-popup");
        if (($getRelatedCard.children().length == 4 && !$($getRelatedCard.children()[2]).is(":visible")) || $getRelatedCard.children().length == 3) {
            $getRelatedCard.addClass('related-close');
        }

        if (!eventData) return;
        var parentListEl = eventData.parentElement,
            closeButton = parentListEl.querySelector(SECONDARY_POPUP_CLOSE_BUTTON_SELECTOR);
        if (!closeButton) return;
        closeButton.addEventListener("keydown", function (event) {
            if (event.keyCode === TAB_KEY) {
                event.preventDefault();
                if (event.shiftKey) {
                    var featuredSection = parentListEl.querySelector(FEATURED_SECTION_SELECTOR);
                    if (featuredSection) {
                        var anchorList = featuredSection.querySelectorAll("a");
                        if (anchorList.length < 1) return;
                        anchorList[anchorList.length - 1].focus();
                    } else focusElement("previous");
                } else {
                    closeSecondaryPopup(parentListEl);
                    eventData.setAttribute("aria-expanded", "false");
                    hideModal();
                    focusNextItem(parentListEl);
                    window.scrollTo(0, 0);
                }
            }
        });
    }

    /* Opens Top Nav Secondary Popup */
    function openPopupMenu(e) {
        e.preventDefault();
        $(this).siblings().removeClass("active");
        $(this).addClass('active');
        let listIndex = $(this).index();
        $('.msdotcomr4-header--btmnav .secondary-popup__summary li').removeClass('active');
        $($(this).parents('.secondary-popup').find(".secondary-popup__summary li")[listIndex]).addClass('active');
    }

    function scrollEvents() {
        if (lastScrollTop == window.pageYOffset) {
            window.requestAnimationFrame(scrollEvents);
            return false;
        } else {
            lastScrollTop = window.pageYOffset;
            stickyHeader();
        }
        window.requestAnimationFrame(scrollEvents);
    }

    function stickyHeader() {
        clearTimeout(scrollTimeOut);
        var headerHeight = header.outerHeight() + 5,
            headerScrollTop = $window.scrollTop(),
            amountScrolled = lastHeaderScrollTop - headerScrollTop,
            scrollAmount;

        headerScrollTop > 0 ? header.addClass('header-scrolling') : header.removeClass('header-scrolling');

        // Define header Y limits
        if (headerTranslate + amountScrolled < -headerHeight) {
            scrollAmount = -headerHeight;
        } else if (headerTranslate + amountScrolled > 0) {
            scrollAmount = 0;
        } else {
            scrollAmount = headerTranslate + amountScrolled;
        }

        // Animate header with scroll
        header.css('transform', 'translate3d(0,' + scrollAmount + 'px,0)');
        $("#toggleNav").css('transform', 'translate3d(0,' + scrollAmount + 'px,0)');
        header.attr('data-translated', scrollAmount);

        // Detect scroll end
        clearTimeout($.data(this, 'scrollTimer'));
        $.data(this, 'scrollTimer', setTimeout(function () {
            lastHeaderScrollTop = headerScrollTop;
            headerTranslate = parseFloat(header.attr('data-translated'));
        }, 250));

        if (headerScrollTop > 0) {
            scrollTimeOut = setTimeout(function () {
                header.css('transform', 'translate3d(0,-120px,0)').css('transition', '0.5s');
                $("#toggleNav").css('transform', 'translate3d(0,-100px,0)').css('transition', '0.5s');
            }, 2500);
        } else {
            header.css('transform', 'translate3d(0,0px,0)').css('transition', '0.5s');
            $("#toggleNav").css('transform', 'translate3d(0,0px,0)').css('transition', '0.5s');
        }
    }

    return {
        init: init,
        openMainMenu: openMainMenu,
        scrollEvents: scrollEvents()
    };
})();

/**
 * On Page load
 */
$(document).ready(function () {
    mainNavMenu.init();

    $searchControlButton.on("click", function () {
        $searchHeader.toggle();
        $searchInputBox.focus();
        $searchControlButton.attr("aria-expanded") === "false" ? 
            $searchControlButton.attr("aria-expanded", "true") : $searchControlButton.attr("aria-expanded", "false");
        $(this).find('i').toggleClass('fa-times');
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        window.scrollTo(0, 0);
        $searchControlButton.find(".fa-times").length >= 1 ? $menuModalContent.show() : $menuModalContent.hide();
    });

    $($(".stay-upto-date")[1]).text($($(".stay-upto-date")[1]).text().toLowerCase());

    /**
     *  Triggers on Click on Bottom Nav Secondary Popup close button
     */
    $(".msdotcomr4-header--btmnav .secondary-popup-close").on("click", function (e) {
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0.active > a').attr("aria-expanded", "false");
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        window.scrollTo(0, 0);
        hideModal();
        resetSearchBox();
        focusElement("previous");
    });

    $body.click(function () {
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0.active > a').attr("aria-expanded", "false");
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        hideModal();
        resetSearchBox();
        var $topNavActiveItem = $(".openDropDownMenu"),
            $topNavActiveItemLink = $(".openDropDownMenu > a");
        if (!$topNavActiveItemLink.is($(event.target))) {
            $topNavActiveItemLink.attr("aria-expanded", "false");
            $topNavActiveItem.removeClass("openDropDownMenu");
        }
    });

    $(".msdotcomr4-header--btmnav, .cmp-search--header").click(function (e) {
        e.stopPropagation();
    });

    var $moreInsightsItem = $(".composite-container.more-insights__section .composite-container__section");
    $($moreInsightsItem[$moreInsightsItem.length - 1]).css("margin-bottom", "0px");

    $searchInputBox.on('keydown', function (e) {
        $(this).val().length > 0 ? $clearSearchText.show() : $clearSearchText.hide();
        if (e.keyCode === ESC) {
            e.preventDefault();
            hideModal();
            resetSearchBox();
            $searchControlButton.focus();
        } else if (e.keyCode === TAB_KEY) {
            e.preventDefault();
            if(event.shiftKey) {
                hideModal();
                resetSearchBox();
                $searchControlButton.focus();
            } else focusElement("next");
        }
    });

    $clearSearchText.on("click", function () {
        $searchInputBox.val('').focus();
        $(this).hide();
    });

    $clearSearchText.on('keyup', function (e) {
        if (e.which == ENTER) { //Enter key 
            $clearSearchText.click(); //Trigger click event
        }
    });

    $(".cmp-navigation--mobile .cmp-navigation__item.cmp-navigation__item--level-0").on("click", function (event) {

        var sibling;
        if (this.nextElementSibling) {
            sibling = this.nextElementSibling;
        } else {
            sibling = this.previousElementSibling;
        }
        if ($(sibling).is(':visible')) {
            event.stopPropagation();
            $(this).find(".secondary-popup").show();
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").parent().not($(this)).addClass('inactive');
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").addClass('inactive');
            $(".cmp-navigation__item--level-0 > .fa-angle-down").addClass('inactive');
        }

    });

    $(".cmp-navigation--mobile .mobile-goback-arrow").on("click", function (event) {
        event.stopPropagation();
        event.preventDefault();
        $(".cmp-navigation--mobile .secondary-popup").hide();
        $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").parent().removeClass('inactive')
        $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").removeClass('inactive');
        $(".cmp-navigation__item--level-0 > .fa-angle-down").removeClass('inactive');

    });

    $(".msdotcomr4-header--btmnav .cmp-navigation__item--level-0 > .fa-angle-down").css('display', 'none');

    $("#toggleNav").on("click", function (e) {
        e.preventDefault();
        hideModal();
        resetSearchBox();
    });
    /**
     *  Triggers on Bottom Nav Secondary Popup on Escape 
     */
    $(document).on('keydown', function (e) {
        if (e.keyCode === ESC) { // ESC
            $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0.active > a').attr("aria-expanded", "false").focus();
            $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
            // window.scrollTo(0, 0);
            hideModal();
            resetSearchBox();
            var $topMenuDropDownActiveItemLink = $(".openDropDownMenu > a");
            if ($topMenuDropDownActiveItemLink.length > 0 && !$topMenuDropDownActiveItemLink.is($(e.target))) {
                $topMenuDropDownActiveItemLink.attr("aria-expanded", "false");
                $topMenuDropDownActiveItemLink.parent().removeClass("openDropDownMenu");
            }
        }
    });

    /**
     *  Listens event on Top Nav Menubar and handles accessibility
     */
    Array.prototype.forEach.call(topnvMenuItems, function (el, i) {
        /**
         * Listens event on Top Nav Secondary Popup and handles accessibility
         */
        Array.prototype.forEach.call(el.querySelectorAll(".secondary-popup li"), function (element, i) {
            if (element.querySelector("a")) {
                element.querySelector("a").addEventListener("keydown", function (event) {
                    if (event.keyCode === TAB_KEY) {
                        event.preventDefault();
                        if (event.shiftKey) {
                            if (this.parentElement === this.parentElement.parentElement.firstElementChild) {
                                el.className = PRIMARY_NAV_CLASS;
                                resetAriaExpanded(el);
                            }
                            focusElement("previous");
                        } else {
                            if (this.parentElement === this.parentElement.parentElement.lastElementChild) {
                                el.className = PRIMARY_NAV_CLASS;
                                resetAriaExpanded(el);
                            }
                            focusElement("next");
                        }
                    } else if (event.keyCode === ESC) {
                        event.preventDefault();
                        el.className = PRIMARY_NAV_CLASS;
                        resetAriaExpanded(el);
                        focusElement("previous");
                    }
                });
            }
        });
    });

    /**
     * Listens event on Bottom Nav Menubar and handles accessibility
     */
    Array.prototype.forEach.call(bottomNavMenuItems, function (el, i) {
        el.querySelector('a').addEventListener("keydown", function (event) {
            bottomNavHeaderLinkListener(el);
            if (event.keyCode === TAB_KEY) {
                event.preventDefault();
                closeSecondaryPopup(el);
                hideModal();
                if (event.shiftKey) {
                    resetAriaExpanded(el);
                    focusPreviousItem(el);                    
                } else {
                    resetAriaExpanded(el);
                    focusNextItem(el);
                }
            }
        });
    });
});

/**
 * Sets the listener for Bottom Nav Secondary Popup Header Link
 * @param {*} currentNavElement 
 */
function bottomNavHeaderLinkListener(currentNavElement) {
    bottomNavHeaderLink = $(currentNavElement).find(".secondary-popup__links a") [0];
    if(!bottomNavHeaderLink) return;
    bottomNavHeaderLink.addEventListener("keydown", bottomNavHeaderLinkKeyDownListener);

}

/**
 * Listens on the Tab press on Bottom Nav Secondary Popup Header Link
 * @param {*} event 
 */
function bottomNavHeaderLinkKeyDownListener(event) {
    var key = event.keyCode;
        parentBottomNavElement = findAncestor(this, "cmp-navigation__item--level-0");
    switch (key) {
        case TAB_KEY:
            event.preventDefault();            
            if(event.shiftKey) {
                closeSecondaryPopup(parentBottomNavElement);
                hideModal();
                resetAriaExpanded(parentBottomNavElement);
                focusElement("previous");
            } else {
                focusElement("next");
            }
    }
}

/**
 * Listens tab event on Bottom Nav Secondary Popup and handles accessibility
 */
$.each($('.msdotcomr4-header--btmnav .cmp-navigation__item.cmp-navigation__item--level-1 > a'), function (key, val) {
    $(this).on("keyup", function (e) {
        e.preventDefault();

        $(this).parent().siblings().removeClass("active");
        window.scrollTo(0, 0);
        $(this).parent().addClass('active');
        let listIndex = $(this).parent().index();
        $(SECONDARY_POP_UP_CHILD_SUMMARY).removeClass('active');
        $($(this).parents('.secondary-popup').find(".secondary-popup__summary li")[listIndex]).addClass('active');

        var popupHeight = $(".cmp-navigation__item.cmp-navigation__item--level-0.active .secondary-popup");
        var itemsPosition = $(document.activeElement).position().top;

        var itemCurrentPosition = popupHeight.height() - itemsPosition;
        if (popupHeight.height() > 555) {
            var itemCurrentPosition = popupHeight.height() - itemsPosition;
            if (itemCurrentPosition < 250) {
                window.scrollTo(0, 60);
            }
        }

    });
});

/**
 * Added listeners on focus on the Secondary Popup Grand Children
 */
$.each($(SECONDARY_POP_UP_GRAND_CHILD_ANCHORS), function () {
    this.addEventListener("focus", handleFocusOnSecondaryPopupGrandChildren, true);
});

function resetSearchBox() {
    $searchHeader.hide();
    $searchControlButton.find('i').removeClass('fa-times').addClass('fa-search');
    $searchControlButton.attr("aria-expanded", "false");
    $searchInputBox.val('');
}

/**
 * Checks if element has secondary popup
 * @param {*currentListElement} currentListElement 
 */
function hasSecondaryPopup(currentListElement) {
    return currentListElement.querySelector(SECONDARY_POP_UP_SELECTOR) != undefined || null ? true : false;
}
/**
 * Handles the on focus functionality on Secondary Popup Grand Children
 */
function handleFocusOnSecondaryPopupGrandChildren() {
    let secondaryPopUpChild = findAncestor(this, "cmp-navigation__item--level-1"),
        $secondaryPopUpChild;
    if (!secondaryPopUpChild) return;
    $secondaryPopUpChild = $(secondaryPopUpChild);
    if ($secondaryPopUpChild.hasClass("active")) return;
    $secondaryPopUpChild.siblings().removeClass("active");
    $secondaryPopUpChild.addClass("active");
    let listIndex = $secondaryPopUpChild.index(),
        secondaryPopup = findAncestor(this, "secondary-popup"),
        $summaryList = $(secondaryPopup).find(".secondary-popup__summary li");
    if (!$summaryList.length || listIndex > $summaryList.length - 1) return;
    $summaryList.removeClass("active");
    $($summaryList[listIndex]).addClass("active");
}

/**
 * Finds out the ancestor of the current element based on the class name
 * @param {*Current element} el 
 * @param {*Ancestor className} cls 
 */
function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}

/**
 * Focuses the target position of the current active element
 * @param {*Focus Position, expected values are 'previous' or 'next'} position 
 */
function focusElement(position) {
    //add all elements we want to include in our selection
    var focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
    if (document.activeElement) {
        var focussable = Array.prototype.filter.call(document.querySelectorAll(focussableElements),
            function (element) {
                //check for visibility while always include the current activeElement 
                return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
            });
        var index = focussable.indexOf(document.activeElement);
        if (index > -1) {
            var targetElement;
            if (position === "next" && index < focussable.length) {
                targetElement = focussable[index + 1] || focussable[0];
            }
            if (position === "previous" && index > 0) {
                targetElement = focussable[index - 1] || focussable[0];
            }
            if (targetElement) targetElement.focus();
        }
    }
}

/**
 * Focuses the next focussable element
 * @param {*currentElement - Current Element} el 
 */
function focusNextItem(el) {
    el === el.parentElement.lastElementChild ? focusElement("next") : focusAnchorElement(el.nextElementSibling);
}

/**
 * Focuses the previous focussable element
 * @param {*currentElement - Curren Element} el 
 */

function focusPreviousItem(el) {
    el === el.parentElement.firstElementChild ? focusElement("previous") : focusAnchorElement(el.previousElementSibling);
}

/**
 * Focuses the first item of the parent UL class
 * @param {*currentListElement - Current List Element} currentListElement 
 */
function focusFirstItem(currentListElement) {
    var listParent = currentListElement.querySelector(LIST_PARENT_CLASS_SELECTOR);
    if (listParent && listParent.childElementCount > 0) {
        focusAnchorElement(listParent.firstElementChild);
    }
}

/**
 * Focuses the underlying anchor under the target element
 * @param {*targetElement - Target Element} activeElement 
 */
function focusAnchorElement(activeElement) {
    anchorElement = activeElement.querySelector("a");
    if (anchorElement) anchorElement.focus();
}

/**
 * Closes teh active secondary popup of the activeElement
 * @param {*currentActiveElement - Current Active Element} activeElement 
 */
function closeSecondaryPopup(activeElement) {
    if (activeElement.classList.contains("active")) {
        activeElement.className = PRIMARY_NAV_CLASS;
    }
}

/**
 * Resets the aria-expanded attribute of the activeElement
 * @param {*currentActiveElement - Current Active Element} activeElement 
 */
function resetAriaExpanded(currentListElement) {
    anchorElement = currentListElement.querySelector("a");
	if (anchorElement && anchorElement.getAttribute("aria-expanded") === "true") anchorElement.setAttribute("aria-expanded", "false");
}

/**
 * Hides the secondary popup modal
 */
function hideModal() {
    $menuModalContent.hide();
}
jQuery(function ($) {
    "use strict";
    $(".cmp-search__clear").hide();
    var count = 0;
    $(".cmp-search__input").keypress(function () {
        count = count + 1;
        if (count > 0)
            $(".cmp-search__clear").show();
        else
            $(".cmp-search__clear").hide();

    });

    $(".cmp-search__clear").click(function () {
        $(".cmp-search__input").val("");
    });


});
(function ($, $document) {

    "use strict";

	var cardSelectors = [".cmp-jobcard", ".cmp-programcard", ".cmp-storycard", ".cmp-practicecard",
                         ".cmp-themecard", ".cmp-bizofferingcard", ".cmp-personcard", ".cmp-videocard", ".cmp-pressreleasecard"],
        GRID_CLASSES = "gridclasses";

	/* Adds the Grid Classes to the Parent Div on page refresh */
    $document.ready(function() {
		$.each(cardSelectors, function(index, selector) {
			var cardsList = $document.find(selector);
            if(!cardsList || cardsList.length === 0) return;
			$.each(cardsList, function(index, card) {
                var gridClasses = $(card).data(GRID_CLASSES);
                var $parent = $(card).parent();
                $parent = removeGridClasses($parent);
				$parent.addClass(gridClasses);
            });
        });
    });

    /* Add Remove existing Grid Classes if any */
    function removeGridClasses($element) {
        $element.removeClass(function(index, className) {
            return (className.match(/(^|\s)aem-\S+/g) || []).join(' ');
        });
        return $element;
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
  "use strict";

  var x = window.matchMedia("(max-width: 767px)");//small screen
  x.addListener(wwdConfig); 
  wwdConfig(x); //initial call once

  function wwdConfig(x) {

    var i, tabcontents, tablinks, wcmmode;
      tablinks = $(".cmp-whatwedolist-left :button.whatwedo__button");
      tabcontents =$(".cmp-whatwedolist--content-section");
      wcmmode=getCookie('wcmmode');  

    if (x.matches) {
      $(".cmp-whatwedolist-left").css('min-height','0px');	
      //in mobile view port
      tabcontents.css("display","none");
      tablinks.removeClass("active");
      tablinks.blur();

      tablinks.off('click').on('click', function(event){
          event.stopPropagation();
          tablinks.removeClass("active");


          var sid =event.currentTarget.id;
          $(event.currentTarget).addClass("active");
          $('div[data-id="' + sid + '-content"] > .cmp-whatwedolist__link a.cmp-list__item-link')[0].click();
      });
    } else {
    	/*var height = $(".whatwedoteaser img").height();
        $(".cmp-whatwedolist-left").css('min-height',height);*/
      //in non-mobile view
        if(!wcmmode||(wcmmode&&wcmmode!=='edit')){  
          tabcontents.css("display","none");
        //tabcontents.slice(1).css("display","none");
          tablinks.removeClass("active");
          tablinks.attr("tabindex", "-1");
          tablinks.attr("aria-selected", "false");
          //if no active item
          if(tablinks.find('.active').length == 0){
              tabcontents.first().css("display","grid").css("display", "-ms-grid");

              tablinks.first().addClass("active");
              tablinks.first().attr("tabindex", "0");
            tablinks.first().attr("aria-selected", "true");
          //  tablinks.first().focus();
          }//endif
        }//endif

      tablinks.off('click').on('click', function(event){
          event.stopPropagation();
          tablinks.removeClass("active");
          tablinks.attr("tabindex", "-1");
          tablinks.attr("aria-selected", "false");
          tabcontents.css("display","none");

          var sid =event.currentTarget.id;
          $(this).addClass("active");
          $(this).attr("tabindex", "0");
          $(this).attr("aria-selected", "true");
          $('div[data-id="' + sid + '-content"]').css("display","grid").css("display", "-ms-grid");
		 /*if (detectIEEdge()) {		        
		    let maxheight = $("div.cmp-whatwedolist-right").height();		           
		    $(".cmp-whatwedolist-left").css('height',maxheight);		      
		  }//IE*/
      });

    }//end else

  }//end function

 /*$(window).resize(function () {
      // alert('resize');
   var width = $(".whatwedoteaser img").width();
       if(width && width > 767)   { 
           var height = $(".whatwedoteaser img").height();
           $(".cmp-whatwedolist-left").css('min-height',height);

           if (detectIEEdge()) {
                let maxheight = $("div.cmp-whatwedolist-right").height();                
                $(".cmp-whatwedolist-left").css('height',maxheight);
           }//IE
       }
 });*/

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }


  /**
 * detect IEEdge
 * returns version of IE/Edge or false, if browser is not a Microsoft browser
 */
	function detectIEEdge() {
	    var ua = window.navigator.userAgent;

	    var msie = ua.indexOf('MSIE ');
	    if (msie > 0) {
	        // IE 10 or older => return version number
	        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	    }
	
	    var trident = ua.indexOf('Trident/');
	    if (trident > 0) {
	        // IE 11 => return version number
	        var rv = ua.indexOf('rv:');
	        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	    }

	    var edge = ua.indexOf('Edge/');
	    if (edge > 0) {
	       // Edge => return version number
	       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
	    }
	
	    // other browser
	    return false;
	 } 

});
(function ($, $document) {

    var WHAT_WE_DO_LIST_SELECTOR = ".cmp-whatwedolist",
        WHAT_WE_DO_TAB_BUTTONS_SELECTOR = ".cmp-whatwedolist-left :button.whatwedo__button",
        WHAT_WE_DO_TAB_CONTENTS_SELECTOR = ".cmp-whatwedolist--content-section",
        WHAT_WE_DO_TAB_BUTTON_LIST_ITEM_CLASS = "cmp-list__item",
        WHAT_WE_DO_LIST_PARENT_CLASS = "cmp-whatwedolist-left",
        ACTIVE_CLASS = "active",
        ARIA_SELECTED_ATTR = "aria-selected",
        TAB_INDEX = "tabindex",
        WCMMODE = "wcmmode",
        WCMMODE_EDIT = "edit",
        $tabButtons, $tabContents, $targetButton, wcmmode;

    var keys = {
        end: 35,
        home: 36,
        up: 38,
        down: 40
    };

    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        wcmmode = getWcmmode($(WHAT_WE_DO_LIST_SELECTOR));
        /* Accessibility enabled only for disabled or preview mode */
        if (!wcmmode || wcmmode === WCMMODE_EDIT) return;
        var mobileViewPort = window.matchMedia("(max-width: 767px)");
        /* Applies only for non-mobile device */
        if (mobileViewPort.matches) return;
        $tabButtons = $(WHAT_WE_DO_TAB_BUTTONS_SELECTOR);
        $tabContents = $(WHAT_WE_DO_TAB_CONTENTS_SELECTOR);
        if (!$tabButtons.length || !$tabContents.length) return;
        focusTargetTab($tabButtons.first(), false);
        if ($tabButtons.length < 2) return;
        $tabButtons.each(function (index) {
            addListeners(this);
        });
    });

    /* Enables Event Listener for all the tabs */
    function addListeners(tab) {
        tab.addEventListener("keydown", keydownEventListener);
    }

    /* Keydown Event Listener */
    function keydownEventListener(event) {        
        var key = event.keyCode,
            tabListParent = findAncestor(this, WHAT_WE_DO_LIST_PARENT_CLASS),
            currentListElement = findAncestor(this, WHAT_WE_DO_TAB_BUTTON_LIST_ITEM_CLASS);

        switch (key) {
            case keys.down:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                if (tabListParent.lastElementChild === currentListElement) {
                    focusTargetTab($tabButtons.first(), true);
                } else {
                    var currentButtonIndex = $tabButtons.index(this);
                    focusTargetTab($($tabButtons[currentButtonIndex + 1]), true);
                }
                break;
            case keys.up:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                if (tabListParent.firstElementChild === currentListElement) {
                    focusTargetTab($($tabButtons[$tabButtons.length - 1]), true);
                } else {
                    var currentButtonIndex = $tabButtons.index(this);
                    focusTargetTab($($tabButtons[currentButtonIndex - 1]), true);
                }
                break;
            case keys.home:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                focusTargetTab($tabButtons.first(), true);
                break;
            case keys.end:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                focusTargetTab($tabButtons.last(), true);
                break;
        }
    }

    /* Sets the aria attributes */
    function setAriaAttribute(targetElement, attribute, attributeValue) {
        if (!targetElement) return;
        targetElement.attr(attribute, attributeValue);
    }

    /* Activates the tab by adding active class */
    function activateTab($targetItem) {
        if (!$targetItem) return;
        $tabButtons.removeClass(ACTIVE_CLASS);
        $targetItem.addClass(ACTIVE_CLASS);
    }

    /* Shows the mapped tab content as per the tab id */
    function activateTabContent(targetId) {
        $tabContents.css("display", "none");
        $tabContents.filter('div[data-id="' + targetId + '-content"]').css("display", "grid").css("display", "-ms-grid");
    }

    /* Sets the tabindex to the target element */
    function setTabIndex($targetItem) {
        $tabButtons.attr(TAB_INDEX, "-1");
        $targetItem.attr(TAB_INDEX, "0");
    }

    /* Finds the ancestor of a particular class */
    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    /* Focuses the target tab and displays the target tab content */
    function focusTargetTab($targetButtonElement, focusTargetButtonElement) {
        activateTab($targetButtonElement);
        $tabButtons.attr(ARIA_SELECTED_ATTR, "false");
        setAriaAttribute($targetButtonElement, ARIA_SELECTED_ATTR, "true");
        setTabIndex($targetButtonElement);
        activateTabContent($targetButtonElement.attr("id"));
        if (focusTargetButtonElement) $targetButtonElement.focus();
    }

    /* Gets the Wcmmode of the page */
    function getWcmmode($targetElement) {
        if (!$targetElement) return;
        return $targetElement.data(WCMMODE);
    }

})(jQuery, jQuery(document));
$(document).ready(function() {

    var $slideCount = $('.slideCountInfo');
    var $imagesSlider = $('.images-slider, .mobile-insights-carousel');

    $imagesSlider.on('init reInit afterChange', function(event, slick, currentSlide, nextSlide) {
        var i = (currentSlide ? currentSlide : 0) + 1;
        $slideCount.text(('0' + i).slice(-2) + ' / ' + ('0' + slick.slideCount).slice(-2));

        /* prev/next button accessibility fix starts */
        $(".insights-carousel-images .images-slider .slick-prev").attr("aria-label", "Previous Article");
        $(".insights-carousel-images .images-slider .slick-next").attr("aria-label", "Next Article");

		if($(".insights-carousel-images .images-slider .slick-next").hasClass('slick-disabled')) {
             $(".insights-carousel-images .images-slider .slick-next").attr('tabindex', '-1');
        } else {
            $(".insights-carousel-images .images-slider .slick-next").attr('tabindex', '0');
        }

        if($(".insights-carousel-images .images-slider .slick-prev").hasClass('slick-disabled')) {
            $(".insights-carousel-images .images-slider .slick-prev").attr('tabindex', '-1');
        } else {
            $(".insights-carousel-images .images-slider .slick-prev").attr('tabindex', '0');
        }
		/* prev/next button accessibility fix ends */

        /* content slider accessibility fix starts */
		if($(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").hasClass('slick-current')) {
			$(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").find('a').attr('tabindex', '0');
        }
        $(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").not('.slick-current').find('a').attr('tabindex', -1);
		/* content slider accessibility fix ends */

    });

	/* auto focusing prev/next button after reaching last/first slide */
    $imagesSlider.on('afterChange', function(event, slick, currentSlide, nextSlide) {
        var i = (currentSlide ? currentSlide : 0) + 1;
		if(i === slick.slideCount) {
			$(".insights-carousel-images .images-slider .slick-prev").focus();
        }
        if(i === 1) {
			$(".insights-carousel-images .images-slider .slick-next").focus();
        }
    });


    $('.images-slider').slick({
        arrows: true,
        slidesToScroll: 1,
        infinite: false,
        // fade: true,
        cssEase: 'ease-out',
        useTransform: true,
        draggable: false,
        accessibility: false,
        asNavFor: '.content-slider'
    });

    $('.content-slider').slick({
        slidesToShow: 3,
        arrows: false,
        slidesToScroll: 1,
        asNavFor: '.images-slider',
        centerMode: false,
        centerPadding: '40px',
        infinite: false,
        draggable: false,
        accessibility: false,
        focusOnSelect: false,
        variableWidth: true
    });

    $('.mobile-insights-carousel').slick({
        slidesToShow: 1,
        arrows: true,
        slidesToScroll: 1,
        centerMode: false,
        centerPadding: '40px',
        infinite: false,
        focusOnSelect: false,
        variableWidth: true
    });

    $('.latestinsight .slick-prev').attr({'data-analytics-button':$('.latest-insights-carousel').attr('data-analytics-val')+' | Carousel Left'});
	$('.latestinsight .slick-next').attr({'data-analytics-button':$('.latest-insights-carousel').attr('data-analytics-val')+' | Carousel Right'});

	$(".insights-carousel-images .images-slider .slick-next").blur();
	$(".insights-carousel-images .images-slider .slick-list .slick-track .slick-slide").find('a').attr('tabindex', '-1');
	$(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").not('.slick-current').find('a').attr('tabindex', -1);

});

$(document).ready(function () {

  var $heroSliderCount = $('.hero-slider-count');
  var $slickElement = $('.hero-slider-content');
  var sliderItemCount = $(".hero-content-piece").length + $(".hero-content-explore").length;
  var currentSlideItem = 0;



  $slickElement.on('init reInit afterChange', function (event, slick, currentSlide, nextSlide) {

    currentSlideItem = currentSlide;
    var i = (currentSlide ? currentSlide : 0) + 1;
    $heroSliderCount.text(('0' + i).slice(-2) + ' / ' + ('0' + slick.slideCount).slice(-2));
  });

  function heroCarouselInit(){

   var screenWidth = 0;
      screenWidth = window.innerWidth;

  $('.slider-hero').slick({
    arrows: false,
    slidesToScroll: 1,
    infinite: false,
    fade: true,
    cssEase: 'ease-out',
    useTransform: true,
    asNavFor: '.hero-slider-content'
  });

  if( screenWidth >= 1025){

  $('.hero-slider-content').slick({
        slidesToShow: sliderItemCount,
        slidesToScroll: 1,
        arrows: true,
        fade: false,
        asNavFor: '.slider-hero',
        centerMode: false,
        centerPadding: '40px',
        infinite: false,
        draggable: false,
        focusOnSelect: true
    }); 
  }
  else {
  $('.hero-slider-content').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      fade: false,
      asNavFor: '.slider-hero',
      centerMode: false,
      centerPadding: '40px',
      infinite: false,
      draggable: false,
      focusOnSelect: false,
      variableWidth: true

    });

}
	$('.herocarousel .slick-prev').attr("data-analytics-button","Homepage Hero | Carousel Left");
    $('.herocarousel .slick-next').attr("data-analytics-button","Homepage Hero | Carousel Right");


    $(this).on('load', function(){     
		onKeyUpClickItems();
     });//end of onload event 

 }

 heroCarouselInit();

    function onKeyUpClickItems() {
        var $heroContentPiece = $('.hero-slider-content .hero-content-piece');
        $.each($heroContentPiece, function (key, val) {
            $(this).on("keyup mouseover", function (e) {
                e.preventDefault();
                $(this).click();        
                if ($heroContentPiece.hasClass("hero-content-piece--active")) {
                    $heroContentPiece.removeClass('hero-content-piece--active');
                    $(this).addClass('hero-content-piece--active');
                }    
            }); //end of register keyup and mouse over evernt
        });
    }


    $(window).resize(resizeHeroCarousel);

    function resizeHeroCarousel() {
        $('.slider-hero').slick('unslick');
        $('.hero-slider-content').slick('unslick');
        onKeyUpClickItems();
        var currentActiveItemBeforeInit = currentSlideItem;
        heroCarouselInit();
        $('.slider-hero').slick('slickGoTo', currentActiveItemBeforeInit);
    }

});
$(document).ready(function() {
    "use strict";

    function updateAnalytics(){

       // var carlistcont = $('.cmp-container.whatwedolist-cardlist-container');
         var carlistcont = $('[data-comp-name]');

        /*loop each container*/
        carlistcont.each(function(){
            var size=$(this).find('.r4card').length;

            var comp_name=$(this).attr('data-comp-name');
            var ctn_name=$(this).attr('data-ctn-name');

             /*loop each card*/
            $(this).find('.r4card a').each(function(index){
                var analytic_link_tag = $(this).attr('data-analytics-link');
                var analytic_module_tag = $(this).attr('data-analytics-module');

                if(typeof analytic_module_tag !== "undefined"){
                    analytic_module_tag+= ' | Position '+(index+1)+' Of '+size; 
                    $(this).attr('data-analytics-module', analytic_module_tag);
                }else{
                     //do nothing
                    //$(this).attr('data-analytics-module', 'Card | Position '+(index+1)+' Of '+size );

                }

                if(typeof analytic_link_tag !== "undefined"){
                    analytic_link_tag = comp_name + ' | Selection Module | '+ ctn_name + ' | '+ analytic_link_tag; 
                    $(this).attr('data-analytics-link', analytic_link_tag);
                }else{
                     //do nothing
                    //$(this).attr('data-analytics-link',comp_name+' | '+ctn_name+ ' | ');

                }
    
            });
         });
    }

    updateAnalytics();
});
/**
 * This file will add data analytics attributes to all the cards, based on Two Up, Three Up, and Four Up Section.
**/

(function ($, $document) {

    "use strict";

    var sectionSelectors = [".two-up__style", ".three-up__style", ".four-up__style"],
        CARD_SELECTOR = ".r4card",
        SECTION_TITLE_SELECTOR = ".cmp-title__text",
        BAR_SEPARATOR = " | ",
        DATA_ANALYTICS_LINK = "data-analytics-link",
        DATA_ANALYTICS_MODULE = "data-analytics-module",
        PRESS_RELEASE_CARD_IDENTIFIER = "cmp-pressreleasecard",
        PRESS_RELEASE_CARD_COLORBOX_SELECTOR = ".cmp-pressreleasecard__colorbox";


    $document.ready(function () {
        $.each(sectionSelectors, function (index, sectionSelector) {
            var $sections = $document.find(sectionSelector);
            if (!$sections) return;
			$.each($sections, function (index, section) {
                var $section = $(section),
                	sectionTitle = getSectionTitle($section),
                    cardList = $section.find(CARD_SELECTOR);
                if (!cardList) return;
                addCardPositionClass(cardList);

                sectionTitle = sectionTitle ? sectionTitle : "NA";
                addAnalyticsAttributes(cardList, sectionTitle);
            });
        });
    });

    /* Get the title of the Two Up or Three Up or Four Up section */
    function getSectionTitle($section) {
        var $titleElem = $section.find(SECTION_TITLE_SELECTOR);
        if (!$titleElem) return;
        return $titleElem.text();
    }

    /* Adds the required Analytics Attributes */
    function addAnalyticsAttributes(cardList, sectionTitle) {
        var count = 0;
        $.each(cardList, function (index, card) {
            count++;
            var $card = $(card), $cardLink;
            if ($card.hasClass(PRESS_RELEASE_CARD_IDENTIFIER)) {
                $cardLink = $card.find(PRESS_RELEASE_CARD_COLORBOX_SELECTOR);
            } else $cardLink = $card.find("a");
            if (!$cardLink) return;
            var analyticsLinkValue = $cardLink.attr(DATA_ANALYTICS_LINK),
                totalCards = cardList.length, column;
            column = totalCards >= 4 ? 4 : totalCards;
            if (analyticsLinkValue) {
                setAnalyticsAttribute($cardLink, DATA_ANALYTICS_LINK, sectionTitle + BAR_SEPARATOR + 
                                      column + "-Card Module" + BAR_SEPARATOR + analyticsLinkValue);
            }
            var analyticsModuleValue = $cardLink.attr(DATA_ANALYTICS_MODULE);

            if (analyticsModuleValue) {
                setAnalyticsAttribute($cardLink, DATA_ANALYTICS_MODULE, analyticsModuleValue + BAR_SEPARATOR
                    + "Position " + count + " of " + totalCards);
            }
        });
    }

    /* Sets the attribute */
    function setAnalyticsAttribute($cardLink, attributeKey, attributeValue) {
        $cardLink.each(function (index, element) {
            if (index === 0) $(element).attr(attributeKey, attributeValue);
        });
    }

    /* Sets position class to the card */
    function addCardPositionClass(cardList) {
        $.each(cardList, function (index, card) {
            index ++;
            $(card).addClass("card-position-" + index);
        });
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
    $('#NewsletterSubmit').click(function() {
        validate_ideas_email();
    });

    $('#NewsletterSurveySubmit').click(function() {
        submit_survey();
    });

    $('.btn-subscribe-CTA, .email-subscribe-CTA').keypress(function(e) {
        if (e.which == "13") {
            if ($(".subscribe-content-wrapper").is(':visible')) {
                validate_ideas_email();
            } else if ($(".thankyou-wrapper").is(':visible')) {
                submit_survey();
            }
        }
    });


  var show = 'show';

  $('input').on('checkval', function () {
    var labelText = $(this).next('label');
    if(this.value !== '') {
      labelText.addClass(show);
    } else {
      labelText.removeClass(show);
    }
  }).on('keyup', function (e) {
		var inputVal = $.trim($(this).val());
		if($(this).val().length > 0 && $("*[class^='email-subscribe']").hasClass("error-highlight") && e.which !== 13) {
            $("*[class^='email-subscribe']").removeClass("error-highlight");
            $(".email-subscribe-error-message").attr("aria-hidden", "true");
            $("*[class^='email-subscribe-CTA']").attr("aria-invalid", "false");
            $("*[class^='email-subscribe-CTA']").removeAttr("aria-describedby");
        }
		$(this).trigger('checkval');
  });

});

stringToAscii = function (s) {
    var ascii="";
    if(s.length>0)
        for(i=0; i<s.length; i++) {
            var c = ""+s.charCodeAt(i);
            while(c.length < 3)
                c = "0"+c;
            ascii += c;
        }
    return(ascii);
};

getQueryParams = function (qs) {
    qs = qs.split('+').join(' ');
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
};

notificationService = function(url) {
    notificationSrvcURL = url;
    try {
        var notificationcount = $.getJSON(notificationSrvcURL, function(data) {})
            .done(function(data) {});
        $.when(notificationcount).fail(function(jqXHR, textStatus, errorThrown) {});
    } catch(err) {
    }
};

validate_ideas_email = function() {
    var mid = "7275232";
    var lid = "63766";
    var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    var entry_email = $('input[name=email-subscribe-CTA-address]').val();
    var validEmail = emailReg.test(entry_email);

    if (!validEmail) {
        $("*[class^='email-subscribe']").addClass("error-highlight");
		$("*[class^='email-subscribe-CTA']").attr("aria-invalid", "true");
        $(".email-subscribe-error-message").attr("aria-hidden", "false");
        var errorMsgId = $(".email-subscribe-error-message").attr("id");
        $("*[class^='email-subscribe-CTA']").attr("aria-describedby", errorMsgId);
        $("*[class^='email-subscribe-CTA']").focus();
    } else {
        $(".congrats-wrapper").addClass("visible");
        $(".subscribe-content-wrapper").addClass("hidden");
        $(".thankyou-wrapper").hide();
		$("*[class^='email-subscribe-CTA']").attr("aria-invalid", "false");
        $(".email-subscribe-error-message").attr("aria-hidden", "true");
        var qr = getQueryParams(document.location.search);
        var et_cid = (/^em_[0-9]{1,9}$/.test(qr.et_cid))?qr.et_cid:'';
        var formName = $(".subscribe-eFormName").attr("data-eformname");
        var strEmail = "https://cl.s7.exct.net/subscribe.aspx?" +
                       "MID=" + mid +
                       "&lid=" + lid +
                       "&Email%20Type=" + "HTML" +
                       "&Email%20Address=" + entry_email +
                       "&et_cid=" + et_cid +
                       "&referrer=" + window.location.href;
        var hashedEmail = stringToAscii(entry_email);

        digitalData.contact = hashedEmail;
        notificationService(strEmail);
    }
};

submit_survey = function() {

    var EmailAddress = $('input[name=email-subscribe-CTA-address]').val();
    var IdeasInterests = $('input[name="IdeasInterests"]:checked').map(function () {
        return this.value;
        }).get().join(", ");
    var DescribeYourself = $('input[name="DescribeYourself"]:checked').map(function () {
        return this.value;
        }).get().join(", ");
    $(".congrats-wrapper").hide();
    $(".thankyou-wrapper").show();
    $.ajax({
        url: 'https://cl.s7.exct.net/DEManager.aspx',
        type: 'post',
        data: "_clientID=" + "7275232" +
            "&_deExternalKey=" + "3CD19151-F46C-4595-84CF-8EEC3E05FD19" +
            "&_action=" + "add" +
            "&_returnXML=" + "0" +
            "&_successURL=" + "https://www.morganstanley.com/newsletter/newsletter-signup-success.html" +
            "&_errorURL=" + "https://www.morganstanley.com/newsletter/newsletter-signup-error.html" +
            "&EmailAddress=" + encodeURIComponent(EmailAddress) +
            "&IdeasInterests=" + encodeURIComponent(IdeasInterests) +
            "&DescribeYourself=" + encodeURIComponent(DescribeYourself),
        success: function(data) {
            console.log('survey submitted.');
        }
    });
};

/*
$(".congrats-wrapper").addClass("visible");
$(".subscribe-content-wrapper").addClass("hidden");
$(".thankyou-wrapper").hide();
*/
$(document).ready(function() {
    var myPlayers = [];
	var myPlayer;
	var activeVideoID;
		$( "video-js" ).each(function( index ) {
			myPlayers.push(this.id);
			var _videoObject = fetchVideoMetadata(this);
		});
        $(".cmp-videocard__link").click(function() {
          for(var i=0; i<myPlayers.length; i++){
          var name = myPlayers[i];
                if(name == $(this).attr('data-videoId')){
                  $('.lightBox' + name +', .lightboxInner' + name).css({"display" : "block"});
				  $('.playerClose').focus();
                    videojs.getPlayer(name).ready(function() {
                        myPlayer = this;
                        myPlayer.on('loadstart',function(){
                        });
                        myPlayer.play();
                    });
                   activeVideoID = $(this).attr("data-videoId");
                   break;
                }
            }
			/**Modal window keyboard Accessibility**/
			$(".vjs-fullscreen-control, .lightBox").on('keydown', function(e) {
			var keyCode = e.keyCode || e.which;
			if (keyCode == 9 && (!e.shiftKey)) {
				e.preventDefault();
				$('.playerClose').focus();
				}
			});

			$(".playerClose, .lightBox").on('keydown', function(e) {
			var keyCode = e.keyCode || e.which;
			if (keyCode == 9 && e.shiftKey) {
				e.preventDefault();
				$('.vjs-fullscreen-control').focus();
				}
			});

			$(".playerClose, .lightBox").on("click", function() {
			  $(".lightboxInner, .lightBox").css({"display" : "none"});
			  myPlayer.pause();
			});

			$(".lightboxInner" + name).on("keydown", function(e) {
				var keyCode = e.keyCode || e.which;
				if (keyCode == 27) {
					$(".lightboxInner, .lightBox").css({"display" : "none"});
					myPlayer.pause();
				}
			});
        });
    });
    
    /** Function to fetch the VideoJS object of the Video cards added on the Page. **/
    function fetchVideoMetadata(video) {
        var videoData;
        var videoId = video.id;
        var url = window.location.href;
		var arr = url.split("/");
		var contextPath = '/'+arr[3];
		var origin = window.location.origin;
		var vidUrl = '';
		if(arr[3] === 'auth' || arr[3] === 'pub') {
			vidUrl = origin+contextPath+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;  
		} else {
			vidUrl = origin+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;
		}
        $.ajax({
            headers: {          
                Accept: pk="BCpkADawqM3r0KvGIw4rs9HAekOj_Tbekd80mVyJKY1Nb33Wv6n1XYYlJNx5yPbqm2VOS41Tu0RcWm1YgQ-VoqHH0b4OWjGYlOOhm7-uJVDx79VGDBYlWGcsjbs"
            }, 
            contentType: "application/json",
            url: vidUrl,
            async: false,
            dataType: "json",
            success: function (result) {
                videoData = result;
                appendVideoObject(videoData,videoId);
            },
        });
    }
    
	/** Function to append the VideoJS Object to corresponding VideoCard on the Page **/
    function appendVideoObject(videoData,videoId) {
		var obj = JSON.parse(JSON.stringify(videoData));
		if (obj.description == null || obj.description == 'undefined') {
        obj.description = "";
		}
		if (obj.name == null || obj.name == 'undefined') {
			obj.name = "";
		}
		if (obj.thumbnail == null || obj.thumbnail == 'undefined') {
			obj.thumbnail = "";
		}
		if (obj.published_at == null || obj.published_at == 'undefined') {
			obj.published_at = "";
		}
		if (obj.length == null || obj.length == 'undefined') {
			obj.length = "";
		}
		var _videoObject = "\"@context\": \"https://schema.org\",\n\"@type\": \"VideoObject\",\n\"name\": \""  + obj.name + "\",\n\"description\": \""  + obj.description + "\",\n\"thumbnailUrl\": \""  + obj.thumbnail + "\",\n\"uploadDate\": \""  + obj.published_at + "\",\n\"duration\": \""  + obj.length + "\",\n\"publisher\"\n \t{\n\t\"@type\": \"Organization\",\n\t\"name\": \"Morgan Stanley\",\n\t\"logo\" \n\t\t{ \n\t\t\"@type\": \"ImageObject\",\n\t\t\"@url\": \"https://www.morganstanley.com/etc/designs/msdotcom/image/mstile-310x310.png\",\n\t\t\"width\": 310,\n\t\t\"height\": 310 \n \t\t}\n\t},\n\"embedUrl\": \"http://players.brightcove.net/644391012001/5xC7AvkxM_default/index.html?videoId="+videoId+"\",";
		
		$(".seo"+videoId).text("{ \n"  + _videoObject + " \n }");
		if (obj.length) {
        var _duration = millisToMinutesAndSeconds(obj.length);
			if (!_duration.indexOf('NaN') !== -1) {
				$(".cmp-videocard__duration" + videoId).text(_duration);
			}
		}
	}
	
	/**milliseconds to seconds***/
	function millisToMinutesAndSeconds(millis) {
		
		var minutes = Math.floor(millis / 60000);
		var seconds = ((millis % 60000) / 1000).toFixed(0);
		return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
	}
$(document).ready(function () {

    $.each($(".cmp-pullquote"), function (key, val) {
        if ($(this).find(".cmp-pullquote__image").length == 0) {
            $(this).addClass("no-image");
        }
    });

});
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
		var heroTitle = $(".cmp-practicehero .practiceherotitle").text().trim();
		console.log("heroTitle : "+heroTitle);
		var heroTitlePause = heroTitle+" | Hero | Looping Video | Pause";
		var heroTitlePlay = heroTitle+" | Hero | Looping Video | Play";
    	$('#practicehero_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.heroPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
				$(this).attr("data-analytics-button", heroTitlePause);
                videoPlayed = true;
            } else {
                videojs.players.heroPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                videoPlayed = false;
				$(this).attr("data-analytics-button", heroTitlePlay);
                videoPlayed = false;
            }
		});

        if($('.composite-container').find('.practicehero').length !== 0) {
            $('.practicehero').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
        
    });
})(jQuery, jQuery(document));
$(document).ready(function() {
	var height = 160;
    $(".disclosures-content").each(function() {
        if ($(this).height() < height) {
            var disclosureWrap = $(this).closest(".disclosures-content-wrapper");
            disclosureWrap.removeClass("collapsible");
            disclosureWrap.parent().find(".disclosure__toggle-container").remove();
        }
    });

	$(".disclosure-expand").click(function(e) {
		showDisclosures($(this).parents('.disclosures-legal-container'));
		e.preventDefault();
	});

	$(".disclosures-content a").each(function(index) {
        $(this).attr("data-analytics-link","Disclosures | " + $(this).text().trim());
    });
});

function showDisclosures(container) {
	var headerHeight = $('.main-nav').outerHeight() + 7; // Add nav shadow height.
	var $disclosuresWrapper = container.find('.disclosures-content-wrapper');
	var $disclosuresArrow = container.find('.disclosures-arrow');
	var $disclosuresToggleView = container.find('.disclosure-toggle-view');
	var $disclosuresToggleClose = container.find('.disclosure-toggle-close');
    var $disclosureExpand = container.find('.disclosure-expand');

	if ($disclosuresWrapper.hasClass('disclosure-content-expanded')) {
        $disclosuresToggleView.removeClass("hideView").addClass("showView");
        $disclosuresToggleClose.removeClass("showClose").addClass("hideClose");
        $disclosureExpand.attr("data-analytics-link",$('.disclosure__toggle-container').attr('data-analytics-val-view'));
		$(window).scrollTop(container.offset().top - headerHeight);
	} else {
		$disclosuresToggleView.removeClass("showView").addClass("hideView");
		$disclosuresToggleClose.removeClass("hideClose").addClass("showClose");
        $disclosureExpand.attr("data-analytics-link",$('.disclosure__toggle-container').attr('data-analytics-val-close'));
	}
	$disclosuresWrapper.toggleClass('disclosure-content-expanded');
	$disclosuresArrow.toggleClass('icon-arrow-up-blue');
	$disclosuresArrow.toggleClass('icon-arrow-down-blue');
}
$(document).ready(function () {

    var $status = $('.slideInfo');  
    var $slickElement = $('.videoPlaylist-carousel');
	var videoPlayListTitle = $(".videoplaylist.carousel .videoplaylist__sectiontitle").text();

    $slickElement.on('init reInit afterChange', function(event, slick, currentSlide, nextSlide){
        var i = (currentSlide ? currentSlide : 0) + 1;
        $status.text(('0'+i).slice(-2)  + ' / ' + ('0'+slick.slideCount).slice(-2) );

        if($(".videoPlaylist-carousel .slick-next").hasClass('slick-disabled')) {
             $(".videoPlaylist-carousel .slick-next").attr('tabindex', '-1');
        } else {
            $(".videoPlaylist-carousel .slick-next").attr('tabindex', '0');
        }

        if($(".videoPlaylist-carousel .slick-prev").hasClass('slick-disabled')) {
            $(".videoPlaylist-carousel .slick-prev").attr('tabindex', '-1');
        } else {
            $(".videoPlaylist-carousel .slick-prev").attr('tabindex', '0');
        }

    	if($(".videoPlaylist-carousel .slick-list .slick-track .slick-slide").hasClass('slick-current')) {
			$(".videoPlaylist-carousel .slick-list .slick-track .slick-slide").find('a').attr('tabindex', '0');
        }
        $(".videoPlaylist-carousel .slick-list .slick-track .slick-slide").not('.slick-current').find('a').attr('tabindex', -1);

    });  


    $slickElement.on('afterChange', function(event, slick, currentSlide, nextSlide) {
        var i = (currentSlide ? currentSlide : 0) + 1;
		if(i === slick.slideCount) {
			$(".videoPlaylist-carousel .slick-prev").focus();
        }
        if(i === 1) {
			$(".videoPlaylist-carousel .slick-next").focus();
        }
    });



  $slickElement.slick({
    vertical: true,
    arrows: true,
    infinite: false,
    focusOnSelect: false
  });
  
  var $firstCarouselItem = $(".videoPlaylist-carousel .slick-slide.slick-current.slick-active a");
  $firstCarouselItem.find(".cmp-videoplay__carousel--now-playing").show();
  $firstCarouselItem.find(".cmp-videoplay__carousel--restartbutton").show();
  $firstCarouselItem.find(".cmp-videoplay__carousel--playbutton").hide();


  $(".video-share").click(function (e) {
    e.stopPropagation();
    $(".video-share-social").toggle();
    if ($(".video-share-social").is(':visible')) {
      $(".video-share").attr("aria-expanded", "true");
    }
    else {
      $(".video-share").attr("aria-expanded", "false");
    }
  });

  $(document).click(function (e) {
    if ($(e.target).parents(".video-share-social").length === 0) {
      $(".video-share-social").hide();
      $(".video-share").attr("aria-expanded", "false");
    }
  });


    $(".video-share .video-share-social .share-email").focusout(function() { 
      $(".video-share-social").hide();
      $(".video-share").attr("aria-expanded", "false");
	});

    $(document).on('keydown', function (event) {
      if( event.keyCode == 27 ) { 
      $(".video-share-social").hide();
      $(".video-share").attr("aria-expanded", "false");
	  }
  })


function fetchVideoMetadataDuration(video) {
  var videoData;
  var videoId = video;
  var url = window.location.href;
  var arr = url.split("/");
  var contextPath = '/'+arr[3];
  var origin = window.location.origin;
  var vidUrl = '';
  if(arr[3] === 'auth' || arr[3] === 'pub'){
	vidUrl = origin+contextPath+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;  
  }else{
	vidUrl = origin+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;
  }

  $.ajax({
    headers: {
      Accept: pk = "BCpkADawqM3r0KvGIw4rs9HAekOj_Tbekd80mVyJKY1Nb33Wv6n1XYYlJNx5yPbqm2VOS41Tu0RcWm1YgQ-VoqHH0b4OWjGYlOOhm7-uJVDx79VGDBYlWGcsjbs"
    },
    contentType: "application/json",
    crossDomain: true,
    url: vidUrl,
    async: false,
    dataType: "json",
    success: function (result) {
      videoData = result;
      appendVideoObjectDuration(videoData, video);
    },
  });
}

/** Function to append the VideoJS Object to corresponding VideoCard on the Page **/
function appendVideoObjectDuration(videoData, video) {
  var obj = JSON.parse(JSON.stringify(videoData));

	$that.attr("data-video-name", obj.name);

	if (obj.length) {
		var _duration = millisToMinutesAndSeconds(obj.length);
	 }
	if (!_duration.indexOf('NaN') !== -1) {
		$that.find(".cmp-videoplay__carousel--duration").html(_duration);
	  }
}

 if($('.videoPlaylist-carousel').length > 0) {
  	videojs.getPlayer('videoPlayListID').ready(function() {
    var $carouselFirstItem = $(".videoPlaylist-carousel .slick-slide.slick-current.slick-active a");
    var activeVideoId = $carouselFirstItem.attr('data-videoId');
	var activeVideo = this;
    activeVideo.catalog.getVideo(activeVideoId, function(error, video){
    activeVideo.catalog.load(video);


  var eyebrow =  $carouselFirstItem.find(".cmp-videoplay__carousel--eyebrow").text();
  var title =  $carouselFirstItem.find(".cmp-videoplay__carousel--title").text();
  var description =  $carouselFirstItem.attr('data-video-description');
  var sourcetext =  $carouselFirstItem.attr('data-video-sourcetext');
  var videoName =  $carouselFirstItem.attr('data-video-name');
  var analyticsLinkValue = videoPlayListTitle+" | Video Playlist | "+title+" | Share Module | Social |";
  var emailanalyticsLinkValue = videoPlayListTitle+" | Video Playlist | "+title+" | Share Module |";
  
  

  $(".cmp-videoplay__carousel .slick-prev.slick-arrow").attr("data-analytics-button", videoPlayListTitle+" | Video Playlist | Carousel Left");
  $(".cmp-videoplay__carousel .slick-next.slick-arrow").attr("data-analytics-button", videoPlayListTitle+" | Video Playlist | Carousel Right");
  $(".cmp-videoplay__container .video-share-social .share-twitter").attr("data-analytics-link",analyticsLinkValue+" Twitter");
  $(".cmp-videoplay__container .video-share-social .share-linkedin").attr("data-analytics-link",analyticsLinkValue+" LinkedIn");
  $(".cmp-videoplay__container .video-share-social .share-facebook").attr("data-analytics-link",analyticsLinkValue+" Facebook");
  $(".cmp-videoplay__container .video-share-social .share-email").attr("data-analytics-link",emailanalyticsLinkValue+" Email");
  $(".video-eyebrow").html("<p>"+eyebrow+"</p>");
  $(".video-title").html("<p>"+title+"</p>");
  if(description)
  $(".video-description").html("<p>"+description+"</p>");
  if (sourcetext != null) {
    $(".video-sourcetext").show();
    $(".video-sourcetext").html("<p>" + sourcetext + "</p>");
  }
  else {
    $(".video-sourcetext").hide();
  }



setTimeout(function(){

   	$.each($(".videoPlaylist-carousel .slick-slide .video-grid a"), function(key,val) {
        $that = $(this);
        var videoID = $(this).attr('data-videoid');
        fetchVideoMetadataDuration(videoID);
	})    

    var $carouselFirstItemName = $(".videoPlaylist-carousel .slick-slide.slick-current.slick-active a");
    var activeVideoName = $carouselFirstItemName.attr('data-video-name');
	$(".current-video-name").text(activeVideoName);
    $(".cmp-videoplay__container .vjs-control-bar .vjs-play-control").attr("data-analytics-button",videoPlayListTitle+" | Video Playlist | "+ activeVideoName +" ");
    $(".cmp-videoplay__container .cmp-videoplay__image .video-js .vjs-big-play-button").attr("data-analytics-button",videoPlayListTitle+" | Video Playlist | "+ activeVideoName +" | Play ");


}, 1500);

  });


});

}



$(".cmp-videoplay__carousel--link").click(function() {

  var playlistId =  $(this).attr('data-videoId');

  var eyebrow =  $(this).find(".cmp-videoplay__carousel--eyebrow").text();
  var title =  $(this).find(".cmp-videoplay__carousel--title").text();
  var description =  $(this).attr('data-video-description');
  var sourcetext =  $(this).attr('data-video-sourcetext');
  var videoName =  $(this).attr('data-video-name');  
 
  $(".cmp-videoplay__container .vjs-control-bar .vjs-play-control").attr("data-analytics-button",videoPlayListTitle+" | Video Playlist | "+ videoName+" ");

  $(".video-eyebrow").html("<p>"+eyebrow+"</p>");
  $(".video-title").html("<p>"+title+"</p>");
    if(description)
  $(".video-description").html("<p>"+description+"</p>");
  if(sourcetext != null){
    $(".video-sourcetext").show();
    $(".video-sourcetext").html("<p>"+sourcetext+"</p>");
 }
 else{
    $(".video-sourcetext").hide();
 }
  $(".current-video-name").html(videoName);
	
  $(".cmp-videoplay__container .video-share-social .share-twitter").attr("data-analytics-link",videoPlayListTitle+" | Video Playlist | "+title+"| Share Module | Social | Twitter");
  $(".cmp-videoplay__container .video-share-social .share-linkedin").attr("data-analytics-link",videoPlayListTitle+" | Video Playlist | "+title+"| Share Module | Social | Linkedin");
  $(".cmp-videoplay__container .video-share-social .share-facebook").attr("data-analytics-link",videoPlayListTitle+" | Video Playlist | "+title+"| Share Module | Social | Facebook");
  $(".cmp-videoplay__container .video-share-social .share-email").attr("data-analytics-link",videoPlayListTitle+" | Video Playlist | "+title+"| Share Module | Social | Email");

    $(".cmp-videoplay__carousel--now-playing").hide();
    $(".cmp-videoplay__carousel--restartbutton").hide();
    $(".cmp-videoplay__carousel--playbutton").show();

    $(this).find(".cmp-videoplay__carousel--now-playing").show();
    $(this).find(".cmp-videoplay__carousel--restartbutton").show();
    $(this).find(".cmp-videoplay__carousel--playbutton").hide();



  videojs.getPlayer('videoPlayListID').ready(function() {
    var myPlayer = this;
    myPlayer.catalog.getVideo(playlistId, function(error, video){
    myPlayer.catalog.load(video);
    myPlayer.play();
  });
});

});


});
$(document).ready(function () {
	var imagesrc = $(".cmp-inlinevideo__image").attr("src");
	var imgPath = "background-image: url(" + imagesrc + ")";
	var inlineVideoHeadline = $('.inline-video-style .cmp-title__text').text();
	var na="NA";
	var analyticsVideoTitle = $(".inlinevideo-title p").text();
	var analyticsLinkValue = (inlineVideoHeadline ||na)+" | In-Line Video | "+analyticsVideoTitle+" | Share Module | Social | ";
	var emailanalyticsLinkValue = (inlineVideoHeadline ||na)+" | In-Line Video | "+analyticsVideoTitle+" | Share Module | ";

	if (imgPath) {
		setTimeout(function () {
			$("#inlinevideoID .vjs-poster").attr("style", imgPath);
		}, 1500);
	}
	
	$(".inlinevideo-share-social .share-twitter").attr("data-analytics-link",analyticsLinkValue+"Twitter");
	$(".inlinevideo-share-social .share-linkedin").attr("data-analytics-link",analyticsLinkValue+"LinkedIn");
	$(".inlinevideo-share-social .share-facebook").attr("data-analytics-link",analyticsLinkValue+"Facebook");
	$(".inlinevideo-share-social .share-email").attr("data-analytics-link",emailanalyticsLinkValue+"Email");


	/* Inline social share */

	$(".inlinevideo-share").click(function (e) {
		e.stopPropagation();
		$(".inlinevideo-share-social ").toggle();
		if($(".inlinevideo-share-social").is(':visible')){
			$(".inlinevideo-share").attr("aria-expanded", "true");
		}
		else{
			$(".inlinevideo-share").attr("aria-expanded", "false");
		}
	});

	$(document).click(function (e) {
		if ($(e.target).parents(".inlinevideo-share-social ").length === 0) {
			$(".inlinevideo-share-social ").hide();
			$(".inlinevideo-share").attr("aria-expanded", "false");
		}
	});


	$(".inlinevideo-share .inlinevideo-share-social .share-email").focusout(function () {
		$(".inlinevideo-share-social ").hide();
		$(".inlinevideo-share").attr("aria-expanded", "false");
	});

	$(document).on('keydown', function (event) {
		if (event.keyCode == 27) {
			$(".inlinevideo-share-social ").hide();
			$(".inlinevideo-share").attr("aria-expanded", "false");
		}
	})


	var inlineVideoId = $("#inlinevideoID").attr('data-video-id');

	$(".cmp-inlinevideo__playbutton").click(function (e) {
		$(this).hide();
		$(".cmp-inlinevideo__duration").hide();

		videojs.getPlayer('inlinevideoID').ready(function () {
			var myPlayer = this;
				myPlayer.catalog.getVideo(inlineVideoId, function (error, video) {
				myPlayer.catalog.load(video);
				myPlayer.play();
				setTimeout(function(){
					$("#inlinevideoID .vjs-play-control").focus().attr("tabindex","0");
				}, 1500);
			});
		});

	});

	$("#inlinevideoID").click(function (e) {
		$(".cmp-inlinevideo__playbutton").hide();
        $(".cmp-inlinevideo__duration").hide();
        setTimeout(function(){
            $("#inlinevideoID .vjs-play-control").focus().attr("tabindex","0");
        }, 1500);
	 });
	 
	$('.cmp-inlinevideo__playbutton').keypress(function (e) {
		var key = e.which;
		if (key == 13 || key == 32) {
			$(".cmp-inlinevideo__playbutton").click();
			return false;
		}
	});  

	if ($(".cmp-inlinevideo__image").length > 1) {
		fetchinlineVideoDuration(inlineVideoId);
	}

	function fetchinlineVideoDuration(video) {
		var videoData;
		var videoId = video;
		var url = window.location.href;
		var arr = url.split("/");
		var contextPath = '/' + arr[3];
		var origin = window.location.origin;
		var vidUrl = '';
		if (arr[3] === 'auth' || arr[3] === 'pub') {
			vidUrl = origin + contextPath + '/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;
		} else {
			vidUrl = origin + '/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;
		}

		$.ajax({
			headers: {
				Accept: pk = "BCpkADawqM3r0KvGIw4rs9HAekOj_Tbekd80mVyJKY1Nb33Wv6n1XYYlJNx5yPbqm2VOS41Tu0RcWm1YgQ-VoqHH0b4OWjGYlOOhm7-uJVDx79VGDBYlWGcsjbs"
			},
			contentType: "application/json",
			crossDomain: true,
			url: vidUrl,
			async: false,
			dataType: "json",
			success: function (result) {
				videoData = result;
				appendInlineVideoDuration(videoData, video);
			},
		});
	}

	/** Function to append the VideoJS Object to corresponding VideoCard on the Page **/
	function appendInlineVideoDuration(videoData, video) {
		var obj = JSON.parse(JSON.stringify(videoData));
		var analyticsVideoButtonValuePlay = inlineVideoHeadline+" | In-Line Video | "+obj.name+" | Play";
		var analyticsVideoButtonValue = inlineVideoHeadline+" | In-Line Video | "+obj.name;
		//	$that.attr("data-video-name", obj.name);
		
		if(obj.name){
			$(".cmp-inlinevideo__playbutton").attr("data-analytics-button",analyticsVideoButtonValuePlay);
			$(".cmp-inlinevideo__image .vjs-play-control").attr("data-analytics-button",analyticsVideoButtonValue);
		}

		if (obj.length) {
			var _duration = millisToMinutesAndSeconds(obj.length);
		}
		if (!_duration.indexOf('NaN') !== -1) {
			$(".cmp-inlinevideo__duration").html(_duration);
		}
	}
});
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
    	$('#subcategoryhero_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.subcategoryheroPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Play");
                videoPlayed = true;
            } else {
                videojs.players.subcategoryheroPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                videoPlayed = false;
                $(this).attr("data-analytics-button", "Hero | Looping Video | Pause");
                videoPlayed = false;
            }
		});

		if($('.composite-container').find('.subcategoryhero').length !== 0) {
            $('.subcategoryhero').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
        
    });
})(jQuery, jQuery(document));
$(document).ready(function() {
    var myPlayers = [];
	var myPlayer;
	var activeVideoID;

    $(".cmp-4Up__container .four-up__video").each(function(index) {
        myPlayers.push($(this).attr('data-videoId'));
        fetchVideoMeta($(this));
    });

    $(".slot-one__video, .slot-two__video").click(function() {
        var currentObj = $(this);
        for(var i=0; i<myPlayers.length; i++) {
            var name = myPlayers[i];
            if(name == $(this).attr('data-videoId')) {
              $('.cmp-4Up .lightBox' + name +',.cmp-4Up .lightboxInner' + name).css({"display" : "block"});
              $('.cmp-4Up .lightBox' + name +',.cmp-4Up .lightboxInner' + name).focus();
              $('.cmp-4Up .playerClose').focus();
                videojs.getPlayer(name).ready(function() {
                    myPlayer = this;
                    myPlayer.on('loadstart',function() {
                    });
                    myPlayer.play();
                });
               activeVideoID = $(this).attr("data-videoId");
               break;
            }
        }

        $(".cmp-4Up .vjs-fullscreen-control,.cmp-4Up .lightBox").on('keydown', function(e) {
			var keyCode = e.keyCode || e.which;
			if (keyCode == 9 && (!e.shiftKey)) {
				e.preventDefault();
				$('.cmp-4Up .playerClose').focus();
			}
        });
        $(".cmp-4Up .playerClose,.cmp-4Up .lightBox").on('keydown', function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9 && e.shiftKey) {
                e.preventDefault();
                $('.cmp-4Up .vjs-fullscreen-control').focus();
            }
        });
        $(".cmp-4Up .playerClose, .cmp-4Up .lightBox").on("click", function(e) {
            $(".lightboxInner, .lightBox").css({"display" : "none"});
            myPlayer.pause();
            currentObj.focus();
        });
        $(".cmp-4Up .lightboxInner" + name).on("keydown", function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                e.preventDefault();
                $(".cmp-4Up .lightboxInner, .cmp-4Up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });
        $(".cmp-4Up .playerClose").on('keydown', function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 27) {
                event.preventDefault();
                $(".cmp-4Up .lightboxInner, .cmp-4Up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });
        $(".cmp-4Up .vjs-play-control,.cmp-4Up .vjs-mute-control,.cmp-4Up .vjs-volume-bar,.cmp-4Up .vjs-progress-holder,.cmp-4Up .vjs-share-control,.cmp-4Up .vjs-subs-caps-button,.cmp-4Up .vjs-picture-in-picture-control,.cmp-4Up .vjs-fullscreen-control").on('keydown', function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 27) {
                event.preventDefault();
                $(".cmp-4Up .lightboxInner,.cmp-4Up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });

    });
});

function fetchVideoMeta(video) {
    var videoData;
    var videoId = video.attr('data-videoid');
    var url = window.location.href;
    var arr = url.split("/");
    var contextPath = '/'+arr[3];
    var origin = window.location.origin;
    var vidUrl = '';
    if(arr[3] === 'auth' || arr[3] === 'pub') {
        vidUrl = origin+contextPath+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;  
    } else {
        vidUrl = origin+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;
    }
    $.ajax({
        headers: {          
            Accept: pk="BCpkADawqM3r0KvGIw4rs9HAekOj_Tbekd80mVyJKY1Nb33Wv6n1XYYlJNx5yPbqm2VOS41Tu0RcWm1YgQ-VoqHH0b4OWjGYlOOhm7-uJVDx79VGDBYlWGcsjbs"
        }, 
        contentType: "application/json",
        url: vidUrl,
        async: false,
        dataType: "json",
        success: function (result) {
            videoData = result;
            getVideoDuration(videoData,video);
        },
    });
}

function getVideoDuration(videoData,video) {
    var videoObj = JSON.parse(JSON.stringify(videoData));
    if(videoObj.length) {
        var _duration = millisToMinsAndSec(videoObj.length);
        if(_duration.indexOf('NaN') == -1) {
            video.find('.four-up__video__duration').text(_duration);
        }
    }
}

function millisToMinsAndSec(millis) {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
/*
 * Listicle Analytics Implementation
 */
(function ($, $document) {

    var LISTICLE_LANDING_DESCRIPTION_ANCHOR_SELECTOR = ".cmp-listicle__landingDescription a",
        LISTICLE_LANDING_TITLE_SELECTOR = ".cmp-listicle__landingTitle",
        LISTICLE_INLINE_TITLE_SELECTOR = ".cmp-listicle__inlineTitle",
        ITEM_TEXT_ANCHOR_SELECTOR = "div[class^='cmp-listicle__card_itemText_'] a",
        ITEM_SUB_TITLE_SELECTOR = ".cmp-listicle__card_itemSubtitle",
        ITEM_NUMBER_SELECTOR = ".cmp-listicle__card_itemNumber",
        LISTICLE_CARD_CLASS = "cmp-listicle__card",
        $parent, landingTitle, sectionTitle, cardTitle, cardNumber, descAnchorAnalyticsLinkTxt, linkText;

    /* Trigger on page load */
    $(document).ready(function () {
        $(LISTICLE_LANDING_DESCRIPTION_ANCHOR_SELECTOR).each(function(index) {
			landingTitle = $(LISTICLE_LANDING_TITLE_SELECTOR).text();
            linkText = $(this).text();
            if(!landingTitle || !linkText) return;
			descAnchorAnalyticsLinkTxt = landingTitle.trim() + " | Teaser Text | " + $(this).text().trim();
			$(this).attr("data-analytics-link", descAnchorAnalyticsLinkTxt);
        });

		$(ITEM_TEXT_ANCHOR_SELECTOR).each(function(index) {
            landingTitle = $(LISTICLE_LANDING_TITLE_SELECTOR).text();
            sectionTitle = landingTitle ? landingTitle : $(LISTICLE_INLINE_TITLE_SELECTOR).text();
            linkText = $(this).text();
            if(!sectionTitle || !linkText) return;
			$parent = $(findAncestor(this, LISTICLE_CARD_CLASS));
            cardTitle = $parent.find(ITEM_SUB_TITLE_SELECTOR).text();
            cardNumber = $parent.find(ITEM_NUMBER_SELECTOR).text();
            totalCards = $("." + LISTICLE_CARD_CLASS).length;
            $(this).attr("data-analytics-link", sectionTitle.trim() + " | Listicle | " + cardNumber.trim() + " " + cardTitle.trim() + " | " + linkText.trim());
			$(this).attr("data-analytics-list", "Listicle | " + cardTitle.trim() + " | " + "Position " + parseInt(cardNumber) + " of " + totalCards);
        });
    });

    /**
     * Finds out the ancestor of the current element based on the class name
     * @param {*Current element} el 
     * @param {*Ancestor className} cls 
     */
    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
    $(".cmp-body__desc a").each(function(index) {
        var sectionTitle;
        if($(this).closest('.bodytext').prev('.sectiontitle').length !== 0) {
            sectionTitle = $(this).closest('.bodytext').prev('.sectiontitle').find('.section_title').text();
        } else {
			sectionTitle = "NA";
        }
        $(this).attr("data-analytics-link",sectionTitle.trim() + " | In-line Body Text Link | " + $(this).text().trim());
    });
});

$(document).ready(function() {
    var $factsCarousel = $('.facts-carousel__container');
    var title_facts = $(this).find(".cmp__facts-carousel .facts__title-container .facts__title").text();
	
    $factsCarousel.slick({
        arrows: true,
        slidesToShow: 1,
        infinite: true,
        dots: true,
        accessibility: false
    });
	
     $(".cmp__facts-carousel .slick-prev").attr("data-analytics-button", title_facts+" | Carousel Left");
     $(".cmp__facts-carousel .slick-next").attr("data-analytics-button", title_facts+" | Carousel Right");

});
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
    	$('#detailshero_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.detailsheroPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Play");
                videoPlayed = true;
            } else {
                videojs.players.detailsheroPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Pause");
                videoPlayed = false;
            }
		});

		if($('.composite-container').find('.detailsHero').length !== 0) {
            $('.detailsHero').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
		/* Color bar default styling */
        if( $('.detailsHero').find('.detailshero_image').length !== 0 || $('.detailsHero').find('.detailshero_video').length !== 0 ) {
            $('.detailsHero').css('border-left', '0px');
        } 
    });
})(jQuery, jQuery(document));
$(document).ready(function() {
    var myPlayers = [];
	var myPlayer;
	var activeVideoID;

    $(".cmp__one-up__container .one-up__video").each(function(index) {
        myPlayers.push($(this).attr('data-videoId'));
        fetchOneUpVideoMeta($(this));
    });

    $(".one-up__video").click(function() {
        var currentObj = $(this);
        for(var i=0; i<myPlayers.length; i++) {
            var name = myPlayers[i];
            if(name == $(this).attr('data-videoId')) {
              $('.cmp__one-up .lightBox' + name +',.cmp__one-up .lightboxInner' + name).css({"display" : "block"});
              $('.cmp__one-up .lightBox' + name +',.cmp__one-up .lightboxInner' + name).focus();
              $('.cmp__one-up .playerClose').focus();
                videojs.getPlayer(name).ready(function() {
                    myPlayer = this;
                    myPlayer.on('loadstart',function() {
                    });
                    myPlayer.play();
                });
               activeVideoID = $(this).attr("data-videoId");
               break;
            }
        }

        $(".cmp__one-up .vjs-fullscreen-control,.cmp__one-up .lightBox").on('keydown', function(e) {
			var keyCode = e.keyCode || e.which;
			if (keyCode == 9 && (!e.shiftKey)) {
				e.preventDefault();
				$('.cmp__one-up .playerClose').focus();
			}
        });
        $(".cmp__one-up .playerClose,.cmp__one-up .lightBox").on('keydown', function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9 && e.shiftKey) {
                e.preventDefault();
                $('.cmp__one-up .vjs-fullscreen-control').focus();
            }
        });
        $(".cmp__one-up .playerClose,.cmp__one-up .lightBox").on("click", function(e) {
            $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
            myPlayer.pause();
            currentObj.focus();
        });
        $(".cmp__one-up .lightboxInner" + name).on("keydown", function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                e.preventDefault();
                $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });
        $(".cmp__one-up .playerClose").on('keydown', function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 27) {
                event.preventDefault();
                $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });
        $(".cmp__one-up .vjs-play-control,.cmp__one-up .vjs-mute-control,.cmp__one-up .vjs-volume-bar,.cmp__one-up .vjs-progress-holder,.cmp__one-up .vjs-share-control,.cmp__one-up .vjs-subs-caps-button,.cmp__one-up .vjs-picture-in-picture-control,.cmp__one-up .vjs-fullscreen-control").on('keydown', function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 27) {
                event.preventDefault();
                $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });

    });
});

function fetchOneUpVideoMeta(video) {
    var videoData;
    var videoId = video.attr('data-videoid');
    var url = window.location.href;
    var arr = url.split("/");
    var contextPath = '/'+arr[3];
    var origin = window.location.origin;
    var vidUrl = '';
    if(arr[3] === 'auth' || arr[3] === 'pub') {
        vidUrl = origin+contextPath+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;  
    } else {
        vidUrl = origin+'/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId;
    }
    $.ajax({
        headers: {          
            Accept: pk="BCpkADawqM3r0KvGIw4rs9HAekOj_Tbekd80mVyJKY1Nb33Wv6n1XYYlJNx5yPbqm2VOS41Tu0RcWm1YgQ-VoqHH0b4OWjGYlOOhm7-uJVDx79VGDBYlWGcsjbs"
        }, 
        contentType: "application/json",
        url: vidUrl,
        async: false,
        dataType: "json",
        success: function (result) {
            videoData = result;
            getOneUpVideoDuration(videoData,video);
        },
    });
}

function getOneUpVideoDuration(videoData,video) {
    var videoObj = JSON.parse(JSON.stringify(videoData));
    if(videoObj.length) {
        var _duration = oneUpMillisToMinsAndSec(videoObj.length);
        if(_duration.indexOf('NaN') == -1) {
            video.find('.one-up__video__duration').text(_duration);
        }
    }
}

function oneUpMillisToMinsAndSec(millis) {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
$(document).ready(function() {
    var $stats = $('.stats-carousel__container');
    var title =  $(this).find(".cmp__stats-carousel .stats__title-container .stats__title").text();

    $stats.slick({
        arrows: true,
        slidesToShow: 4,
        infinite: true,
        dots: true,
        centerMode: false,
        accessibility: false,
        responsive: [
    {
      breakpoint: 767,
      settings: {
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode:false,
      }
    }
	 ]

    });

    $(".cmp__stats-carousel .slick-prev.slick-arrow").attr("data-analytics-button", title+" | Carousel Left");
    $(".cmp__stats-carousel .slick-next.slick-arrow").attr("data-analytics-button", title+" | Carousel Right");

});
