'use strict';

const $ = require('jquery');
const utils = require('../utils');

const roClick = {
    process: function(module, domElement, attributeValue) {
        $(domElement).click(function() {
            const model = module.getModel(domElement);
            utils.evaluate(model, attributeValue);
        });
        return null;
    },
};

module.exports = roClick;
