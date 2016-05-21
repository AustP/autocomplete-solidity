'use babel';
/* jshint esversion: 6 */

import definitions from '../../definitions/base.json';

import Provider from './Provider';

class BaseProvider extends Provider {
    getDefinitions() {
        let level = this.context.level;
        
        // modifiers have the same context level as functions
        if (level == 'modifier') {
            level = 'function';
        }
        
        return definitions[level] ? definitions[level] : {};
    }
}

export default new BaseProvider();
