(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.MomoDebug = {}));
}(this, function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function isPlainObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    function assert(value, message) {
        console.assert(value, message);
    }
    function parsePropsPath(propsPath) {
        return propsPath.replace(/\[(.+?)\]/g, '.$1').split('.');
    }

    var toRaw = new WeakMap();
    var toIntercepter = new WeakMap();
    var knownIntercepter = new WeakSet();
    var CleanConfig = {
        get: false,
        set: false,
        delete: false,
        call: false,
    };
    function inferDefaultConfig(target) {
        if (typeof target === 'function') {
            return {
                call: true,
            };
        }
        else {
            return {
                set: true,
                delete: true,
            };
        }
    }
    function createConfig(keys, value) {
        return keys.reduce(function (acc, key) {
            acc[key] = value;
            return acc;
        }, {});
    }
    var Intercepter = /** @class */ (function () {
        function Intercepter(target) {
            this._propsInterceptionConfig = new Map();
            this._raw = target;
            this.reset();
        }
        Intercepter.prototype.read = function (prop) {
            this.toggleConfigKeys(['get'], true, prop);
            return this;
        };
        Intercepter.prototype.write = function (prop) {
            this.toggleConfigKeys(['set'], true, prop);
            return this;
        };
        Intercepter.prototype.writeDelete = function (prop) {
            this.toggleConfigKeys(['set', 'delete'], true, prop);
            return this;
        };
        Intercepter.prototype.call = function (prop) {
            if (typeof this._raw[prop] === 'function') {
                this.prop(prop);
            }
            return this;
        };
        Intercepter.prototype.enable = function (prop) {
            this.toggleConfigKeys(['disable'], true, prop);
            return this;
        };
        Intercepter.prototype.disable = function (prop) {
            this.toggleConfigKeys(['disable'], false, prop);
            return this;
        };
        Intercepter.prototype.reset = function () {
            this._interceptionConfig = __assign(__assign({}, CleanConfig), inferDefaultConfig(this._raw));
            return this;
        };
        Intercepter.prototype.getProxy = function () {
            if (this._proxied) {
                return this._proxied;
            }
            var self = this;
            this._proxied = new Proxy(this._raw, {
                apply: function (target, thisArg, argumentsList) {
                    var config = self.getConfig();
                    if (!config.disable && config.call) {
                        debugger;
                    }
                    return Reflect.apply(target, thisArg, argumentsList);
                },
                get: function (target, prop, receiver) {
                    var config = self.getConfigForProp(prop);
                    if (!config.disable && config.get) {
                        debugger;
                    }
                    return Reflect.get(target, prop, receiver);
                },
                set: function (target, prop, value) {
                    var config = self.getConfigForProp(prop);
                    if (!config.disable && config.set) {
                        debugger;
                    }
                    return Reflect.set(target, prop, value);
                },
                deleteProperty: function (target, prop) {
                    var config = self.getConfigForProp(prop);
                    if (!config.disable && config.delete) {
                        debugger;
                    }
                    return Reflect.deleteProperty(target, prop);
                },
            });
            return this._proxied;
        };
        Intercepter.prototype.prop = function (prop) {
            var parent;
            var childPropName;
            if (typeof prop !== 'string') {
                parent = this._raw;
                childPropName = prop;
            }
            else {
                var segments = parsePropsPath(prop);
                if (segments.length === 1) {
                    parent = this._raw;
                    childPropName = prop;
                }
                else {
                    childPropName = segments.pop();
                    for (var i = 0; i < segments.length; i++) {
                        parent = this._raw[segments[i]];
                    }
                }
            }
            if (knownIntercepter.has(parent)) {
                parent = toRaw.get(parent);
            }
            var proxied = (parent[childPropName] = new Intercepter(parent[childPropName]).getProxy());
            return proxied;
        };
        Intercepter.prototype.toggleConfigKeys = function (keys, value, prop) {
            var modified = createConfig(keys, value);
            if (prop !== undefined) {
                var config = this._propsInterceptionConfig.get(prop);
                if (config) {
                    Object.assign(config, modified);
                }
                else {
                    this._propsInterceptionConfig.set(prop, modified);
                }
            }
            else {
                Object.assign(this._interceptionConfig, modified);
            }
        };
        Intercepter.prototype.getConfig = function () {
            return this._interceptionConfig;
        };
        Intercepter.prototype.getConfigForProp = function (prop) {
            return __assign(__assign({}, this.getConfig()), this._propsInterceptionConfig.get(prop));
        };
        return Intercepter;
    }());
    function intercept(target) {
        assert(isPlainObject(target), "\"intercept()\" require an \"object\", got " + typeof target);
        if (knownIntercepter.has(target)) {
            return target;
        }
        if (toIntercepter.has(target)) {
            return toIntercepter.get(target);
        }
        var intercepter = new Intercepter(target);
        knownIntercepter.add(intercepter);
        toIntercepter.set(target, intercepter);
        toRaw.set(intercepter, target);
        return intercepter;
    }

    exports.intercept = intercept;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
