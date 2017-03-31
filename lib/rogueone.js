'use strict';

const Module = require('./module');

const roguleone = {
    module: function(domElement) {
        return new Module(domElement);
    }
};

module.exports = roguleone;
