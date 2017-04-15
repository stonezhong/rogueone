'use strict';

class Binding {
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
        throw 'calling abstract method';
    }
}

module.exports = Binding;
