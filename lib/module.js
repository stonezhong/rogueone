'use strict';

const Scope = require('./scope');
const Directive = require('./directive');
const _ = require('lodash');

const click = require('./directives/click');

class Module {
    constructor(domElement) {
        this.rootDomElement = domElement;
        this.scopeByDomElement = new Map();
        this.directives = {};
        this.controllers = {};
        this.rootScope = new Scope(this);
        this.scopeByDomElement.set(domElement, this.rootScope);

        this.directive(click.name, click);
    }

    getScope(domElement) {
        let currentDomElement = domElement;
        for (;;) {
            const scope = this.scopeByDomElement.get(currentDomElement);
            if (scope) {
                return scope;
            }
            currentDomElement = currentDomElement.parentNode;
        }
        return null;
    }

    controller(name, callback) {
        this.controllers[name] = callback;
        return this;
    }

    directive(name, directive) {
        this.directives[name] = directive;
        return this;
    }

    getController(name) {
        return this.controllers[name];
    }

    forEachDirective(callback) {
        _.forEach(this.directives, (directive, name) => {
            callback(directive);
        });
    }

    bootstrap() {
        this.rootScope.$bind(this.rootDomElement);
    }
}

module.exports = Module;