'use strict';

const _rogueone = require('./lib/rogueone');

const dependencies = require('./lib/dependencies');

function rogueone({$, _}) {
    dependencies.$ = $;
    dependencies._ = _;
    return _rogueone;
};

module.exports = rogueone;
