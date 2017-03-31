'use strict';

const $ = require('jquery');

const roClick = {
    name: 'roClick',
    process: function(module, domElement) {
        const expression = domElement.getAttribute('data-ro-click');
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
