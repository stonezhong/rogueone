'use strict';

/**
 * Parse an expression and return segments
 * @param {string} expression - The expression to parse
 * @param {string} start - this symbol starts an expression, such as '}}'
 * @param {string} end   - this symbol ends a expression, such as '}}'
 * @return {array} The segments for the expression.
 * @example
 * parseExpression('foo') returns [{isExpression: false, value: 'foo'}]
 * parseExpression('a{{foo}}b') returns [
 *     {isExpression: false, value: 'a'},
 *     {isExpression: true,  value: 'foo'},
 *     {isExpression: false, value: 'b'}
 * ]
 */
export function parseExpression(expression, start, end) {
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
export function segmentsHasExpression(segments) {
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
 * @param {Component} component - the component in which this expression will be assessed
 * @param {array} segments - array of segment
 * @return {string} expression value.
 * 
 */
export function getSegmentsValue(component, segments) {
    let value = '';
    for (let i = 0; i < segments.length; i ++) {
        const segment = segments[i];
        if (!segment.isExpression) {
            value += segment.value;
        } else {
            // evaulate the expression
            value += evaluate(component, segment.value);
        }
    }
    return value;
}

/**
 * Evaluate an expression within the component
 * @param {Component} component - the component wich the expresion will be accessed
 * @param {string} expression - the expression to evaluate
 * @return {*} the value of the expression
 * 
 * Note: in expression, 
 * - 'model' refere to the model associate with the component
 * - 'this' refer to the component itself
 */
export function evaluate(component, expression) {
    const model = component.getModel();
    const statements = `
        (function(model) { 
            return (${expression});
        }).call(component, model)
    `;
    return eval(statements);
}

/**
 * Visit the dom tree, root is element, call callback for each element
 * @param {Element} element 
 * @param {function} callback 
 */
export function forEachChildElement(element, callback) {
    let currentChildElement = element.firstElementChild;
    while (currentChildElement !== null) {
        const nextChildElement = currentChildElement.nextElementSibling;
        callback(currentChildElement);
        currentChildElement = nextChildElement;
    }
}
