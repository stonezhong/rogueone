'use strict';

const Scope = require('./scope');
const Directive = require('./directive');
const _ = require('lodash');

const utils = require('./utils');
const click = require('./directives/click');

function renderTextNode(module, domElement, scope) {
    let child = domElement.firstChild;

    for (;;) {
        if (child === null) {
            break;
        }
        if (child.nodeType !== Node.TEXT_NODE) {
            child = child.nextSibling;
            continue;
        }

        const segments = utils.parseExpression(child.nodeValue);
        if (!utils.segmentsHasExpression(segments)) {
            // optimize: do not update DOM when unnecessary
            child = child.nextSibling;
            continue;
        }
        for (let textSegment = 0; textSegment < segments.length; textSegment ++) {
            const segment = segments[textSegment];
            if (!segment.isExpression) {
                const textNode = document.createTextNode(segment.value);
                domElement.insertBefore(textNode, child);
            } else {
                // evaulate the expression
                const textNode = document.createTextNode(utils.evaluate(scope, segment.value));
                domElement.insertBefore(textNode, child);
            }
        }
        const nextNode = child.nextSibling;
        domElement.removeChild(child);
        child = nextNode;
    }
}

function render(module, domElement) {
    let currentDomElement = domElement;

    // compute all attributes value
    const model = module.getModel(domElement);
    const attributes = domElement.attributes;
    for (let i = 0; i < attributes.length; i ++) {
        const attribute = attributes[i];

        const customerAttribute = module.getAttribute(attribute.name);
        if (customerAttribute) {
            customerAttribute.render(module, domElement, attribute.value);
        } else {
            const segments = utils.parseExpression(attribute.value);
            if (!utils.segmentsHasExpression(segments)) {
                continue;
            }

            attribute.value = utils.getSegmentsValue(model, segments);
        }

    }

    const component = module.getComponent(domElement.tagName);
    if (component) {
        let componentModel = model;
        const modelAttrValue = domElement.getAttribute('data-model');
        if (modelAttrValue) {
            componentModel = utils.evaluate(model, modelAttrValue)
        }
        const newDomElement = component.render(module, componentModel, domElement);
        module.setModel(newDomElement, componentModel);
        domElement.parentElement.replaceChild(newDomElement, domElement);
        render(module, newDomElement);
        return;
    }

    utils.forEachChildElement(domElement, (childElement) => {
        render(module, childElement);
    });

    renderTextNode(module, domElement, model);
}

class Module {
    constructor(domElement) {
        this.modelByDomElement = new Map();
        this.linksByDomElement = new Map();

        this.components = {};   // user defined components (tags)
        this.attributes = {};   // user defined attributes

        this.rootDomElement = domElement;

        this.attribute('ro-click', click);
    }

    getModel(domElement) {
        let currentDomElement = domElement;
        for (;;) {
            const model = this.modelByDomElement.get(currentDomElement);
            if (model) {
                return model;
            }
            currentDomElement = currentDomElement.parentElement;
        }
        return null;
    }

    setModel(domElement, model) {
        this.modelByDomElement.set(domElement, model);
        return this;
    }

    getComponent(tag) {
        return this.components[tag.toLowerCase()];
    }

    component(name, component) {
        this.components[name] = component;
        return this;
    }

    /**
     * Get attribute definition
     * @param {string} attributeName
     * @return attribute definition
     */
    getAttribute(name) {
        if (name.startsWith('data-')) {
            name = name.substr(5);
        }
        return this.attributes[name];
    }

    attribute(name, attribute) {
        this.attributes[name] = attribute;
        return this;
    }

    forEachDirective(callback) {
        _.forEach(this.directives, (directive, name) => {
            callback(directive);
        });
    }

    bootstrap(callback) {
        const rootModel = callback();
        this.setModel(this.rootDomElement, rootModel);
        render(this, this.rootDomElement);
    }
}

module.exports = Module;