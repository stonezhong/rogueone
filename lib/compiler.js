'use strict';

const parseHTML = require('parsehtml');

const compiler = {
    compile: function(template) {
        return parseHTML(template);
    }
};

module.exports = compiler;
