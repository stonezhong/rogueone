'use strict';

export default class Decorator {
    /**
     * 
     * @param {Module} module 
     * @param {Element} element
     */
    constructor(module, element, contextExpression) {
        /**
         * Note: User is not suppose to change module and element during the lifecycle
         *       of this object.
         */
        this.module = module;
        this.element = element;
        this.contextExpression = contextExpression;
    }

    /**
     * Get DOM element we are decorating
     * @return {Element} The dom element this decorator attached to.
     */
    getElement() {
        return this.element;
    }

    /**
     * Get module for this decorator.
     * @return {Module} The module for this decotator
     */
    getModule() {
        return this.module;
    }

    /**
     * Get context expression for this decorator
     * @return {string} The context expression for this decorator.
     */
    getContextExpression() {
        return this.contextExpression;
    }

    /**
     * decorate before children are rendered
     */
    decorateBefore() {
    }

    /**
     * decorate after children are rendered
     */
    decorateAfter() {
    }

}
