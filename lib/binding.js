'use strict';

class Binding {
    constructor(node, callback) {
        this.node = node;
        this.callback = callback;
    }

    getNode() {
        return this.node;
    }

    apply() {
        this.callback();
    }
}

module.exports = Binding;
