'use strict';

const dependencies = require('./dependencies');
const _ = function() { return dependencies._; };
const ValueNodeBinding = require('./value-node-binding');

class Component {
    /**
     * 
     * @param {Module} module 
     * @param {*} model 
     * @param {Component} parent
     */
    constructor(module, model, parent) {
        /**
         * Note: User is not suppose to change module and model during the lifecycle
         *       of this object.
         */
        this.module = module;
        this.model = model;
        this.children = [];
        this.parent = parent;
        this.bindings = [];
        if (parent) {
            parent.appendChild(this);
        }
    }

    /**
     * Bind callback to node, calling the callback will bring node in sync with model.
     * @param {Attribute | TextNode} node 
     * @param {string} initValue
     * @param {function} callback 
     * @return {Component} this component
     */
    addValueNodeBinding(node, initValue, callback) {
        const binding = new ValueNodeBinding(node, initValue, callback);
        this.bindings.push(binding);
        return this;
    }

    /**
     * Add a component as last child.
     * @param {Component} childComponent 
     * @return {Component} this component
     */
    appendChild(childComponent) {
        this.children.push(childrenComponent);
        return this;
    }

    /**
     * Get array of direct child components
     * @return {Component[]}
     */
    getChildren() {
        return this.children;
    }

    /**
     * Get the model for this component
     * @return {*}
     */
    getModel() {
        return this.model;
    }

    /**
     * This method could be called when model is updated
     */
    apply() {
        _().forEach(this.getChildren(), (childComponent) => {
            childComponent.update();
        });
        _().forEach(this.bindings, (binding) => {
            binding.apply();
        });
    }

    /**
     * render a component specified by element. 
     * @param {Element} element 
     */
    render(element) {
        throw new Error('Component.render is abstract method');
    }
}

module.exports = Component;
