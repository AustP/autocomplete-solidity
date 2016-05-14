'use babel';
/* jshint esversion: 6 */

import AutocompleteSolidity from '../src/autocomplete-solidity';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('AutocompleteSolidity', () => {
    let editor, provider;
    
    let getSuggestions = () => {
        let cursor = editor.getLastCursor();
        let start = cursor.getBeginningOfCurrentWordBufferPosition();
        let end = cursor.getBufferPosition();
        let prefix = editor.getTextInRange([start, end]);
            
        return provider.getSuggestions({
            editor: editor,
            bufferPosition: end,
            prefix: prefix
        });
    };
    
    beforeEach(() => {
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-solidity'));
        waitsForPromise(() => atom.workspace.open('test.sol'));
        
        runs(() => {
            provider = AutocompleteSolidity.provide();
            editor = atom.workspace.getActiveTextEditor();
        });
    });
    
    it('autocompletes contracts', () => {
        editor.setText(`cont`);
        editor.setCursorBufferPosition([0, 4]);
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(1);
        
        let suggestion = suggestions[0];
        expect(suggestion.type).toBe('keyword');
        expect(suggestion.snippet).toBe('contract ${1:contractName} {\n\t${2}\n}');
    });
    
    it('autocompletes functions', () => {
        editor.setText(`func`);
        editor.setCursorBufferPosition([0, 4]);
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(1);
        
        let suggestion = suggestions[0];
        expect(suggestion.type).toBe('keyword');
        expect(suggestion.snippet).toBe('function ${1:functionName}(${2}) ${3}{\n\t${4}\n}');
    });
    
    it('autocompletes structs', () => {
        editor.setText(`stru`);
        editor.setCursorBufferPosition([0, 4]);
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(1);
        
        let suggestion = suggestions[0];
        expect(suggestion.type).toBe('type');
        expect(suggestion.text).toBe('struct');
    });
    
    it('autocompletes enums', () => {
        editor.setText(`en`);
        editor.setCursorBufferPosition([0, 2]);
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(1);
        
        let suggestion = suggestions[0];
        expect(suggestion.type).toBe('type');
        expect(suggestion.text).toBe('enum');
    });
    
    it('autocompletes modifiers', () => {
        editor.setText(`mod`);
        editor.setCursorBufferPosition([0, 2]);
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(1);
        
        let suggestion = suggestions[0];
        expect(suggestion.type).toBe('type');
        expect(suggestion.text).toBe('modifier');
    });
    
    describe('file parsing', () => {
        let editor, provider;
    
        let getSuggestions = () => {
            let cursor = editor.getLastCursor();
            let start = cursor.getBeginningOfCurrentWordBufferPosition();
            let end = cursor.getBufferPosition();
            let prefix = editor.getTextInRange([start, end]);
                
            return provider.getSuggestions({
                editor: editor,
                bufferPosition: end,
                prefix: prefix
            });
        };
        
        beforeEach(() => {
            atom.project.setPaths([__dirname]);
            
            waitsForPromise(() => atom.workspace.open('test.sol'));
            waitsForPromise(() => atom.packages.activatePackage('autocomplete-solidity'));
            
            runs(() => {
                provider = AutocompleteSolidity.provide();
                editor = atom.workspace.getActiveTextEditor();
            });
        });
        
        it('reads contracts', () => {
            editor.setText(editor.getText() + 'Bal');
            editor.setCursorBufferPosition([66, 3]);
            
            let suggestions = getSuggestions();
            expect(suggestions.length).toBe(1);
            
            let suggestion = suggestions[0];
            expect(suggestion.type).toBe('contract');
            expect(suggestion.snippet).toBe('Ballot');
        });
        
        it('reads functions', () => {
            editor.setText(editor.getText() + 'this.w');
            editor.setCursorBufferPosition([66, 6]);
            
            let suggestions = getSuggestions();
            expect(suggestions.length).toBe(1);
            
            let suggestion = suggestions[0];
            expect(suggestion.type).toBe('method');
            expect(suggestion.snippet).toBe('winningProposal(${1})${2}');
        });
        
        it('reads structs', () => {
            editor.setText(editor.getText() + 'Vo');
            editor.setCursorBufferPosition([66, 2]);
            
            let suggestions = getSuggestions();
            expect(suggestions.length).toBe(1);
            
            let suggestion = suggestions[0];
            expect(suggestion.type).toBe('struct');
            expect(suggestion.snippet).toBe('Voter');
        });
        
        it('reads variables', () => {
            editor.setText(editor.getText() + 'se');
            editor.setCursorBufferPosition([66, 2]);
            
            let suggestions = getSuggestions();
            // sender gets set twice, so it gets suggested twice
            expect(suggestions.length).toBe(2);
            
            let suggestion = suggestions[0];
            expect(suggestion.leftLabel).toBe('Voter');
            expect(suggestion.text).toBe('sender');
        });
    });
});
