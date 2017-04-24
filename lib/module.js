'use strict';

const _ = require('lodash');
const utils = require('./utils');
const click = require('./decorators/click');
// const forEach = require('./components/foreach');
const Component = require('./component');
const Decorator = require('./decorator');

/**
 * 
 * @param {Module} module 
 * @param {Element} element 
 * @param {Component} component
 */
function renderTextNode(module, element, component) {
    const model = component.getModel();

    let childNode = element.firstChild;
    while (childNode !== null) {
        if (childNode.nodeType !== 3 /* Node.TEXT_NODE */) {
            childNode = childNode.nextSibling;
            continue;
        }

        const segments = utils.parseExpression(
            childNode.nodeValue, module.expressionStart, module.expressionEnd);
        if (!utils.segmentsHasExpression(segments)) {
            // optimize: do not update DOM when unnecessary
            childNode = childNode.nextSibling;
            continue;
        }

        for (let textSegment = 0; textSegment < segments.length; textSegment ++) {
            const segment = segments[textSegment];
            if (!segment.isExpression) {
                const textNode = module.document.createTextNode(segment.value);
                element.insertBefore(textNode, childNode);
            } else {
                // evaulate the expression

                // use empty string, it is ugly to allow user to see the expression
                const textNode = module.document.createTextNode(''); 
                element.insertBefore(textNode, childNode);
                component.addValueNodeBinding(textNode, '', () => {
                    return utils.evaluate(model, segment.value);
                });
            }
        }
        const nextNode = childNode.nextSibling;
        element.removeChild(childNode);
        childNode = nextNode;
    }
}

/**
 * 
 * @param {Module} module 
 * @param {Element} element
 * @param {Component} component
 */
function render(module, element, component) {
    let currentElement = element;
    const model = component.getModel();

    const componentFactory = module.getComponentFactory(element.tagName);
    if (componentFactory) {
        // we are creating new component
        // A component can specify a model using data-model attribute
        // If a component does not specify a model, it uses is parent component's model
        let childModel = model;
        const childModelExpression = element.getAttribute('data-model');
        if (childModelExpression) {
            childModel = utils.evaluate(model, childModelExpression);
        }

        const childComponent = componentFactory(module, childModel, component);
        const childElement = childComponent.render(element);

        module.setComponent(childElement, childComponent);
        element.parentElement.replaceChild(childElement, element);
        render(module, childElement, childComponent);
        return;
    }

    const decorators = [];
    // compute all attributes value
    const attributes = element.attributes;
    for (let i = 0; i < attributes.length; i ++) {
        const attribute = attributes[i];

        const decoratorFactory = module.getDecoratorFactory(attribute.name);
        if (decoratorFactory) {
            const decorator = decoratorFactory(module, element, attribute.value);
            decorators.push(decorator);
            decorator.decorateBefore();
        } else {
            const segments = utils.parseExpression(
                attribute.value, module.expressionStart, module.expressionEnd);
            if (!utils.segmentsHasExpression(segments)) {
                continue;
            }

            component.addValueNodeBinding(attribute, attribute.value, () => {
                return utils.getSegmentsValue(model, segments);
            });
        }
    }

    utils.forEachChildElement(element, (childElement) => {
        render(module, childElement, component);
    });

    renderTextNode(module, element, component);
    _.forEach(decorators, (decorator) => {
        decorator.decorateAfter();
    });
}

class Module {
    /**
     * constructs a module
     * @param {*} config 
     * 
     * config.runAt: either Module.RUN_AT_SERVER or Module.RUN_AT_CLIENT (default).
     */
    constructor(config = {}) {
        this.runAt = config.runAt || Module.RUN_AT_CLIENT;
        if (this.runAt === Module.RUN_AT_SERVER) {
            this.expressionStart = '{[{';
            this.expressionEnd = '}]}';
        } else {
            this.expressionStart = '{{';
            this.expressionEnd = '}}';
        }
        /**
         * Track component by element
         * Note:
         *     If an element that is the root of a component is removed
         *     then the component is removed.
         */
        this.componentByElement = new Map();

        // the callback will be called when model is updated
        this.updateCallbackByDomElement = new Map();

        this.componentFactories = {};
        this.decoratorFactories = {};

        // this.component('forEach', forEach);
        this.setDecoratorFactory('ro-click', click);
    }

    /**
     * Get model from element
     * @param {Element} element 
     * @return {*} return the model associated with the element
     */
    getModel(element) {
        return this.getComponent(element).getModel();
    }

    /**
     * Get the component associated with the element
     * @param {Element} element
     * @return {Component} return the component associated with the element
     */
    getComponent(element) {
        let currentElement = element;
        for (;;) {
            const component = this.componentByElement.get(currentElement);
            if (component) {
                return component;
            }
            currentElement = currentElement.parentElement;
        }
        return null;
    }

    /**
     * Associate a element to a component
     * @param {Element} element 
     * @param {Component} component 
     * @return {Module} this module
     */
    setComponent(element, component) {
        this.componentByElement.set(element, component);
        return this;
    }

    /**
     * Get component factory based on name
     * @param {string} name 
     * @return {function} a component factory for the name
     */
    getComponentFactory(name) {
        return this.componentFactories[name.toLowerCase()];
    }

    /**
     * Set component factory
     * @param {string} name 
     * @param {function} componentFactory 
     * @return {Module} this module
     */
    setComponentFactory(name, componentFactory) {
        this.componentFactories[name.toLowerCase()] = componentFactory;
        return this;
    }

    /**
     * Get decorator based on name
     * @param {string} name 
     * @return {function} the decorator for the name
     */
    getDecoratorFactory(name) {
        let normalizedName = name.toLowerCase();
        if (normalizedName.startsWith('data-')) {
            normalizedName = normalizedName.substr(5);
        }
        
        return this.decoratorFactories[normalizedName];
    }

    /**
     * Set decorator factory for the name
     * @param {string} name 
     * @param {function} decoratorFactory
     * @return {Module} this module 
     */
    setDecoratorFactory(name, decoratorFactory) {
        this.decoratorFactories[name.toLowerCase()] = decoratorFactory;
        return this;
    }

    /**
     * Bootstrap a Rogue One Application.
     * @param {Element} rootElement 
     * @param {*} rootModel 
     */
    bootstrap(window, rootElement, rootModel) {
        this.window = window;
        this.document = window.document;

        const rootComponent = new Component(this, rootModel, null);
        this.setComponent(rootElement, rootComponent);
        
        this.rootElement = rootElement;
        this.rootComponent = rootComponent;

        render(this, rootElement, rootComponent);
        this.apply();
    }

    /**
     * This method is called to apply update to the DOM tree since model is likely changed
     */
    apply() {
        this.rootComponent.apply();
    }
}

Module.RUN_AT_SERVER = Symbol('RUN_AT_SERVER');
Module.RUN_AT_CLIENT = Symbol('RUN_AT_CLIENT');

module.exports = Module;
