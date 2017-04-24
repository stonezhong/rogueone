'use strict';

const _ = require('lodash');
const Binding = require('./binding');

class ValueNodeBinding extends Binding {
    /**
     * 
     * @param {TextNode | Attribute} node 
     * @param {string} initValue 
     * @param {function} callback 
     */
    constructor(node, initValue, callback) {
        super(node, callback);
        if (!_.isString(initValue) && !_.isNumber(initValue)) {
            throw "text node or attribute's initial value must be string or number";
        }
        // toString() will normalize it, so this.currentValue is always string
        // remember _.isString(new String('abc')) is true
        // it is important this.currentValue is a string, since we are using ===
        // to compare string latter
        this.currentValue = initValue.toString();
    }

    apply() {
        let newValue = this.callback();
        if (!_.isString(newValue) && !_.isNumber(newValue)) {
            throw new "text node or attribute's value MUST be string or number";
        }
        // normalize it, since it could be new String('abc')
        // toString will convert it to string
        newValue = newValue.toString();
        
        if (newValue === this.currentValue) {
            // do nothing, no need to update attribute
            return;
        }
        this.currentValue = newValue;
        this.getNode().nodeValue = newValue;
    }
}

module.exports = ValueNodeBinding;
