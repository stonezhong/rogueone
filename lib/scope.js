'use strict';

const _ = require('lodash');

function parse(expression) {
    let index = 0;
    let segments = [];
    let inQuotes = false;   // only needed when isExpression is true
    let quote = '';         // only needed when isExpression is true
    let lastChar = '';      // only needed when isExpression is true

    let currentSegment = {isExpression: false, value: ''};

    for (let i = 0; i < expression.length; i ++) {
        let char = expression[i];

        if (currentSegment.isExpression) {
            if (inQuotes) {
                currentSegment.value += char;
                if (((char === '\"')|| (char === '\'')) && (char === quote) && (lastChar != '\\')) {
                    lastChar = char;
                    inQuotes = false;
                    continue;
                }
                lastChar = char;
                continue;
            }

            if ((char !== '}') || (expression[i + 1] !== '}')) {
                if ((char === '\'' || char === '\"') && lastChar !== '\\') {
                    quote = char;
                    inQuotes = true;
                }
                currentSegment.value += char;
                lastChar = char;
                continue;
            }

            if (currentSegment.value.length > 0) {
                segments.push(currentSegment);
            }
            i ++; // skip the next '}' which we already know
            currentSegment = {isExpression: false, value: ''};
            continue;
        } 

        // not expression case
        if ((char !== '{') || (expression[i + 1] !== '{')) {
            currentSegment.value += char;
            continue;
        }

        if (currentSegment.value.length > 0) {
            segments.push(currentSegment);
        }

        i ++; // skip the next '{' which we already know
        currentSegment = {isExpression: true, value: ''};
        inQuotes = false;
        lastChar = '';
        quote = '';
        continue;
    }

    if (currentSegment.value.length > 0) {
        segments.push(currentSegment);
    }
    return segments;
}

function linkAttribute(scope, domElement) {
    const attributes = domElement.attributes;
    for (let i = 0; i < attributes.length; i ++) {
        const attribute = attributes[i];

        const segments = parse(attribute.value);
        if (!segmentsHasExpression(segments)) {
            continue;
        }

        attribute.value = getSegmentsValue(scope, segments);
        scope.$applyCallbacks.set(attribute, () => {
            attribute.value = getSegmentsValue(scope, segments);
        });
    }

    for (
        let childEle = domElement.firstElementChild; 
        childEle !== null; 
        childEle = childEle.nextElementSibling
    ) {
        linkAttribute(scope, childEle);
    }
}

function linkTextNode(scope, domElement) {
    const children = [];

    let child = domElement.firstChild;

    for (;;) {
        if (child === null) {
            break;
        }
        if (child.nodeType !== Node.TEXT_NODE) {
            child = child.nextSibling;
            continue;
        }

        const segments = parse(child.nodeValue);
        for (let textSegment = 0; textSegment < segments.length; textSegment ++) {
            const segment = segments[textSegment];
            if (!segment.isExpression) {
                const textNode = document.createTextNode(segment.value);
                domElement.insertBefore(textNode, child);
            } else {
                // evaulate the expression
                const textNode = document.createTextNode(evulate(scope, segment.value));
                domElement.insertBefore(textNode, child);

                scope.$applyCallbacks.set(textNode, () => {
                    textNode.nodeValue = evulate(scope, segment.value);
                });
            }
        }
        const nextNode = child.nextSibling;
        domElement.removeChild(child);
        child = nextNode;
    }

    for (
        let childEle = domElement.firstElementChild; 
        childEle !== null; 
        childEle = childEle.nextElementSibling
    ) {
        linkTextNode(scope, childEle);
    }
}

function segmentsHasExpression(segments) {
    for (let i = 0; i < segments.length; i ++) {
        const segment = segments[i];
        if (segment.isExpression) {
            return true;
        }
    }
    return false;
}

function getSegmentsValue(scope, segments) {
    let value = '';
    for (let i = 0; i < segments.length; i ++) {
        const segment = segments[i];
        if (!segment.isExpression) {
            value += segment.value;
        } else {
            // evaulate the expression
            value += evulate(scope, segment.value);
        }
    }
    return value;
}

function evulate($scope, expression) {
    let args1 = "$scope";
    let args2 = "$scope";
    let copy = "";

    for (var key in $scope) {
        // skip internal member
        if (key.startsWith('$')) {
            continue;
        }
        if (args1.length > 0) {
            args1 += ',';
        }
        args1 += key;

        if (args2.length > 0) {
            args2 += ',';
        }
        args2 += `$scope.${key}`;

        copy += `$scope.${key} = ${key};\n`;
    }
    const statements = `
        (function(${args1}) { 
            var $_return = (${expression});
            ${copy}
            return $_return;
        })(${args2})
    `;
    return eval(statements);
}

function processController(scope, domElement) {
    const controllerName = domElement.getAttribute('data-ro-controller');
    if (!controllerName) {
        return;
    }

    const controller = scope.$module.getController(controllerName);
    if (!controller) {
        return;
    }

    controller(scope);
}

function processDirectives(scope, domElement) {
    scope.$module.forEachDirective((directive) => {
        directive.process(scope.$module, domElement);
    });

    for (
        let childEle = domElement.firstElementChild; 
        childEle !== null; 
        childEle = childEle.nextElementSibling
    ) {
        processDirectives(scope, childEle);
    }
}

// member start with $ is reserved for system usage, user shuold not
// try to set variable start with $
class Scope {
    constructor($module) {
        this.$module = $module;
        this.$applyCallbacks = new Map();
    }

    $apply() {
        for (let applyCallback of this.$applyCallbacks.values()) {
            applyCallback();
        }
    }

    $evulate(expression) {
        return evulate(this, expression);
    }

    $bind(domElement) {
        processController(this, domElement);
        linkAttribute(this, domElement);
        linkTextNode(this, domElement);

        processDirectives(this, domElement);
    }
}

module.exports = Scope;
