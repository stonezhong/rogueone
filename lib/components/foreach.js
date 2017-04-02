'use strict';

const _ = require('lodash');

/**
 * <forEach data-model="{collection: this.stocks, containerTag: 'div'}">...</forEach>
 */
const forEach = {
    render(module, model, domElement) {
        const containerTag = model.containerTag || 'div';
        const container = document.createElement(containerTag);
        const nodeToClone = domElement.firstElementChild;
        _.forEach(model.collection, (value, key) => {
            const childDomElement = nodeToClone.cloneNode(true);
            let childModel;
            if (_.isNumber(key)) {
                childModel = `this.collection[${key}]`;
            } else {
                childModel = `this.collection.${key}`;
            }
            childDomElement.setAttribute('data-model', childModel);
            container.appendChild(childDomElement);
        });
        return container;
    }
}

module.exports = forEach;
