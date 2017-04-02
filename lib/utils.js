'use strict';

/**
 * Parse an expression and return segments
 * @param {string} expression
 * @return {array} The segments for the expression.
 * @example
 * parse('foo') returns [{isExpression: false, value: 'foo'}]
 * parse('a{{foo}}b') returns [
 *     {isExpression: false, value: 'a'},
 *     {isExpression: true, value: 'foo'},
 *     {isExpression: false, value: 'b'}
 * ]
 */
function parseExpression(expression) {
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

/**
 * Is there any expression in the segments?
 * @param {*} segments 
 * @return true if there is an expression segment, false if non of these segments are expression.
 */
function segmentsHasExpression(segments) {
    for (let i = 0; i < segments.length; i ++) {
        const segment = segments[i];
        if (segment.isExpression) {
            return true;
        }
    }
    return false;
}

/**
 * Get the value of segments as parseExpression result of expression
 * @param {*} scope 
 * @param {*} segments 
 * @return {string} expression value.
 */
function getSegmentsValue(scope, segments) {
    let value = '';
    for (let i = 0; i < segments.length; i ++) {
        const segment = segments[i];
        if (!segment.isExpression) {
            value += segment.value;
        } else {
            // evaulate the expression
            value += evaluate(scope, segment.value);
        }
    }
    return value;
}

/**
 * Evaluate an expression within the context
 * @param {*} context 
 * @param {string} expression 
 * @return {*} the value of the expression
 */
function evaluate(context, expression) {
    const statements = `
        (function() { 
            return (${expression});
        }).apply(context)
    `;
    return eval(statements);
}

function forEachChildElement(domElement, callback) {
    for (
        let childEle = domElement.firstElementChild; 
        childEle !== null; 
        childEle = childEle.nextElementSibling
    ) {
        callback(childEle);
    }
}


module.exports = {
    parseExpression,
    segmentsHasExpression,
    getSegmentsValue,
    evaluate,
    forEachChildElement,
};
