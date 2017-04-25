'use strict';

/**
 * Parse an expression and return segments
 * @param {string} expression - The expression to parse
 * @param {string} start - this symbol starts an expression, such as '}}'
 * @param {string} end   - this symbol ends a expression, such as '}}'
 * @return {array} The segments for the expression.
 * @example
 * parse('foo') returns [{isExpression: false, value: 'foo'}]
 * parse('a{{foo}}b') returns [
 *     {isExpression: false, value: 'a'},
 *     {isExpression: true, value: 'foo'},
 *     {isExpression: false, value: 'b'}
 * ]
 */
function parseExpression(expression, start, end) {
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

            if (expression.substr(i, end.length) !== end) {
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
            // skip the rest part of end, -1 since the for loop already have i ++
            i += (start.length - 1); 
            currentSegment = {isExpression: false, value: ''};
            continue;
        }

        // not expression case
        if (expression.substr(i, start.length) !== start) {
            currentSegment.value += char;
            continue;
        }

        if (currentSegment.value.length > 0) {
            segments.push(currentSegment);
        }

        // skip the rest part of start, -1 since the for loop already have i ++
        i += (start.length - 1); 
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
 * @param {array} segments - array of segment
 * @return {boolean} true if there is an expression segment, otherwise false.
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
 * @param {*} context - the conext when evaluating the expression
 * @param {array} segments - array of segment
 * @return {string} expression value.
 * 
 */
function getSegmentsValue(context, segments) {
    let value = '';
    for (let i = 0; i < segments.length; i ++) {
        const segment = segments[i];
        if (!segment.isExpression) {
            value += segment.value;
        } else {
            // evaulate the expression
            value += evaluate(context, segment.value);
        }
    }
    return value;
}

/**
 * Evaluate an expression within the context
 * @param {*} context - the context where we evaluate the expression. it is referenced by 'this' in
 *                      expression
 * @param {string} expression - the expression to evaluate
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

/**
 * Visit the dom tree, root is element, call callback for each element
 * @param {Element} element 
 * @param {function} callback 
 */
function forEachChildElement(element, callback) {
    let currentChildElement = element.firstElementChild;
    while (currentChildElement !== null) {
        const nextChildElement = currentChildElement.nextElementSibling;
        callback(currentChildElement);
        currentChildElement = nextChildElement;
    }
}


module.exports = {
    parseExpression,
    segmentsHasExpression,
    getSegmentsValue,
    evaluate,
    forEachChildElement,
};
