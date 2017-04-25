'use strict';

/**
 * It binds an expression to a DOM node.
 * 
 * via the callback function, it can access the expression value.
 * via the apply function, it can apply the expression value to the node
 * 
 */
export default class Binding {
    constructor(node, callback) {
        this.node = node;
        this.callback = callback;
    }

    /**
     * Get the node
     * @return {Node}
     */
    getNode() {
        return this.node;
    }

    /**
     * @abstract
     */
    apply() {
        throw new Error('Binding.apply is abstract method');
    }
}
