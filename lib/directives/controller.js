'use strict';

const $ = require('jquery');

const roClick = {
    name: 'roController',
    process: function(module, domElement) {
        const expression = domElement.getAttribute('data-ro-controller');
        if (!expression) {
            return null;
        }

        const scope = module.getScope(domElement);
        $(domElement).click(function() {
            scope.$evulate(expression);
            scope.$apply();
        });
        return null;
    },
};

module.exports = roClick;
