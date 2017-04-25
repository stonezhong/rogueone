'use strict';

import { evaluate } from '../utils';
import Decorator from '../decorator';

export default class ClickDecorator extends Decorator {

    /**
     * Constructor
     * @param {Module} module 
     * @param {Element} element 
     */
    constructor(module, element, contextExpression) {
        super(module, element, contextExpression);
    }

    decorateAfter() {
        const module = this.getModule();
        const element = this.getElement();
        const contextExpression = this.getContextExpression();

        element.addEventListener('click', function() {
            const model = module.getModel(element);
            evaluate(model, contextExpression);
            module.apply();
        }, false);
    }
}

function clickDecoratorFactory(module, element, contextExpression) {
    return new ClickDecorator(module, element, contextExpression);
}
