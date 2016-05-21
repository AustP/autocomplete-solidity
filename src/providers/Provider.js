'use babel';
/* jshint esversion: 6 */

import parser from '../util/parser';

export default class Provider {
    constructor() {
        // Provider properties
        this.context = {};
        this.minimumWordLength = atom.config.get('autocomplete-plus.minimumWordLength');
        this.prefix = '';
        this.structure = {};
        
        // Autocomplete+ properties
        this.disableForSelector = '.source.solidity .comment';
        this.excludeLowerPriority = true;
        this.inclusionPriority = 2;
        this.selector = '.source.solidity';
        
        atom.config.onDidChange('autocomplete-plus.minimumWordLength', () => {
            this.minimumWordLength = atom.config.get('autocomplete-plus.minimumWordLength');
        });
    }
    
    getStructure(editor) {
        this.structure = parser.getStructure(editor);
        this.context = this.structure.context;
    }
    
    getPrefix(editor) {
        let bufferPosition = editor.getLastCursor().getBufferPosition();
        let line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
        
        let old_prefix = this.prefix;
        
        let split = line.split(/\s+/g);
        this.prefix = split.pop();
        
        if (this.prefix.lastIndexOf('(') > this.prefix.lastIndexOf(')')) {
            let split = this.prefix.split(/[\(\)]/);
            this.prefix = split[split.length - 1];
        }
        
        if (this.prefix.lastIndexOf('[') > this.prefix.lastIndexOf(']')) {
            let split = this.prefix.split(/[\[\]]/);
            this.prefix = split[split.length - 1];
        }
    }
    
    getSuggestions(options) {
        this.getPrefix(options.editor);
        
        if (this.prefix.length < this.minimumWordLength) {
            return [];
        }
        
        this.getStructure(options.editor);
        
        // Providers need to define getDefinitions
        let definitions = [];
        let allDefinitions = this.getDefinitions();
        for (let suggestion in allDefinitions) {
            if (suggestion.indexOf(this.prefix) === 0) {
                let definition = allDefinitions[suggestion];
                
                definition.replacementPrefix = this.prefix;
                definition.rightLabel = definition.type;
                
                definitions.push(definition);
            }
        }
        
        return definitions;
    }
}
