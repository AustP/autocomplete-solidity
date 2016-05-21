'use babel';
/* jshint esversion: 6 */

import parser from './util/parser';

import baseProvider from './providers/base-provider';
import contextProvider from './providers/context-provider';

let attachConfig = function(obj, prop) {
    let config = `autocomplete-solidity.${prop}`;
    
    obj[prop] = atom.config.get(config);
    atom.config.onDidChange(config, () => {
        obj[prop] = atom.config.get(config);
    });
};

let providers = [];

export default {
    config: {
        shorthandOnly: {
            title: 'Shorthand Only',
            description: 'Only show shorthand types (uint)',
            type: 'boolean',
            default: true
        }
    },
    
    activate() {
        atom.workspace.observeTextEditors((editor) => {
            let parse = () => {
                let grammar = editor.getGrammar();
                
                if (grammar.name == 'Solidity') {
                    parser.parse(editor);
                }
            };
            
            parse();
            
            let disposable = editor.onDidStopChanging(() => parse());
            editor.onDidDestroy(() => disposable.dispose());
        });
        
        attachConfig(contextProvider, 'shorthandOnly');
    },
    
    provide() {
        return [baseProvider, contextProvider];
    }
};
