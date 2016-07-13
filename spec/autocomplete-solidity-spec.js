'use babel';
/* jshint esversion: 6 */

import AutocompleteSolidity from '../src/autocomplete-solidity';
import parser from '../src/util/parser';

describe('AutocompleteSolidity', () => {
    let editor, lib_editor, providers;
    
    let getSuggestions = (_editor = editor) => {
        let cursor = _editor.getLastCursor();
        let start = cursor.getBeginningOfCurrentWordBufferPosition();
        let end = cursor.getBufferPosition();
        let prefix = _editor.getTextInRange([start, end]);
            
        return providers[0].getSuggestions({
                editor: _editor,
                bufferPosition: end,
                prefix: prefix
            })
            .concat(
                providers[1].getSuggestions({
                    editor: _editor,
                    bufferPosition: end,
                    prefix: prefix
                })
            );
    };
    
    let setText = (x, y, text, _editor = editor) => {
        _editor.setTextInBufferRange([[x, y], [x, Infinity]], text);
        _editor.setCursorBufferPosition([x, y + text.length]);
        parser.parse(_editor);
    };
    
    beforeEach(() => {
        atom.project.setPaths([__dirname]);
        
        waitsForPromise(() => atom.workspace.open('files/test.sol'));
        waitsForPromise(() => atom.workspace.open('files/StringLib.sol'));
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-solidity'));
        
        runs(() => {
            providers = AutocompleteSolidity.provide();
            
            let editors = atom.workspace.getTextEditors();
            editor = editors[0];
            lib_editor = editors[1];
        });
    });
    
    it('autocompletes contracts', () => {
        setText(1, 0, 'cont');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'contract',
            snippet: 'contract ${1:SomeContract} {\n\t${2}\n}',
            type: 'keyword',
            replacementPrefix: 'cont',
            rightLabel: 'keyword'
        });
        
        setText(53, 8, 'TestContract(0x0).o');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'address',
            replacementPrefix: 'o',
            rightLabel: 'variable',
            text: 'owner',
            type: 'variable'
        });
        
        setText(53, 8, 'TestContract(0x0).T');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Calls the TestContract function',
            leftLabel: 'void',
            replacementPrefix: 'T',
            rightLabel: 'function',
            snippet: 'TestContract${1}(${2:_owner}, ${3:_amount})${4}',
            type: 'function'
        });
    });
    
    it('autocompletes imports', () => {
        setText(1, 0, 'impo');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Imports a Solidity file',
            snippet: 'import "${1}"${2}',
            type: 'import',
            replacementPrefix: 'impo',
            rightLabel: 'import'
        });
    });
    
    it('autocompletes libraries', () => {
        setText(1, 0, 'libr');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'library',
            replacementPrefix: 'libr',
            rightLabel: 'keyword',
            snippet: 'library ${1:SomeLibrary} {\n\t${2}\n}',
            type: 'keyword'
        });
        
        setText(67, 8, 'StringUt', lib_editor);
        
        suggestion = getSuggestions(lib_editor)[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'library',
            functions: {
                uintToBytes: {
                    description: 'Calls the uintToBytes function',
                    leftLabel: 'bytes32 ret',
                    snippet: 'uintToBytes(${1:v})${2}',
                    type: 'function'
                },
                bytesToUInt: {
                    description: 'Calls the bytesToUInt function',
                    leftLabel: 'uint ret',
                    snippet: 'bytesToUInt(${1:v})${2}',
                    type: 'function'
                }
            },
            text: 'StringUtils',
            type: 'type',
            replacementPrefix: 'StringUt',
            rightLabel: 'type'
        });
        
        setText(67, 8, 'StringUtils.u', lib_editor);
        
        suggestion = getSuggestions(lib_editor)[0];
        expect(suggestion)
        .toEqual({
            description: 'Calls the uintToBytes function',
            leftLabel: 'bytes32 ret',
            snippet: 'uintToBytes(${1:v})${2}',
            replacementPrefix: 'u',
            rightLabel: 'function',
            type: 'function'
        });
    });
    
    it('autocompletes types', () => {
        setText(5, 4, 'add');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Address',
            leftLabel: 'address',
            replacementPrefix: 'add',
            rightLabel: 'type',
            text: 'address',
            type: 'type'
        });
        
        setText(5, 4, 'bo');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Boolean',
            leftLabel: 'bool',
            replacementPrefix: 'bo',
            rightLabel: 'type',
            text: 'bool',
            type: 'type'
        });
        
        setText(5, 4, 'by');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: '1 byte',
            leftLabel: 'byte',
            replacementPrefix: 'by',
            rightLabel: 'type',
            text: 'byte',
            type: 'type'
        });
        
        setText(5, 4, 'by');
        
        suggestion = getSuggestions()[1];
        expect(suggestion)
        .toEqual({
            description: 'Dynamically-sized byte array',
            leftLabel: 'bytes',
            replacementPrefix: 'by',
            rightLabel: 'type',
            text: 'bytes',
            type: 'type'
        });
    });
    
    it('autocompletes variables and parameters', () => {
        setText(33, 8, 'ow');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'address',
            text: 'owner',
            type: 'variable',
            replacementPrefix: 'ow',
            rightLabel: 'variable'
        });
        
        setText(33, 8, 'owner = _o');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'address',
            text: '_owner',
            type: 'parameter',
            replacementPrefix: '_o',
            rightLabel: 'parameter'
        });
        
        setText(33, 8, 'am');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'uint',
            text: 'amount',
            type: 'variable',
            replacementPrefix: 'am',
            rightLabel: 'variable'
        });
        
        setText(33, 8, 'amount = _a');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'uint',
            text: '_amount',
            type: 'parameter',
            replacementPrefix: '_a',
            rightLabel: 'parameter'
        });
    });
    
    it('autocompletes functions / events', () => {
        setText(36, 8, 'an');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Calls the anotherFunction function',
            leftLabel: 'void',
            replacementPrefix: 'an',
            rightLabel: 'function',
            snippet: 'anotherFunction()${1}',
            type: 'function'
        });
        
        setText(36, 8, 'this.');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Calls the anotherFunction function',
            leftLabel: 'void',
            replacementPrefix: '',
            rightLabel: 'function',
            snippet: 'anotherFunction${1}()${2}',
            type: 'function'
        });
        
        setText(36, 8, 'So');
        
        suggestion = getSuggestions()[3];
        expect(suggestion)
        .toEqual({
            description: 'Emits the SomeEvent event',
            leftLabel: 'void',
            replacementPrefix: 'So',
            rightLabel: 'event',
            snippet: 'SomeEvent(${1:addr})${2}',
            type: 'event'
        });
    });
    
    it('autocompletes structs / enums', () => {
        setText(39, 8, 'myStruct.a');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'address',
            text: 'addr',
            type: 'struct',
            replacementPrefix: 'a',
            rightLabel: 'struct'
        });
        
        setText(39, 8, 'myStruct.s');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'SomeEnum',
            text: 'someEnum',
            type: 'struct',
            replacementPrefix: 's',
            rightLabel: 'struct'
        });
        
        setText(39, 8, 'myStruct.someEnum = SomeEnum.O');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            text: 'One',
            type: 'enum',
            replacementPrefix: 'O',
            rightLabel: 'enum'
        });
        
        setText(39, 8, 'myStruct.someEnum = SomeEnum.T');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            text: 'Two',
            type: 'enum',
            replacementPrefix: 'T',
            rightLabel: 'enum'
        });
        
        setText(39, 8, 'SomeStruct.');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual(undefined);
    });
    
    it('autocompletes enums / events / functions / modifiers', () => {
        setText(47, 4, 'en');
        
        let suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'enum',
            snippet: 'enum ${1:SomeEnum} {\n\t${2}\n}',
            type: 'type',
            replacementPrefix: 'en',
            rightLabel: 'type'
        });
        
        setText(47, 4, 'ev');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'event',
            snippet: 'event ${1:SomeEvent}(${2})${3}',
            type: 'type',
            replacementPrefix: 'ev',
            rightLabel: 'type'
        });
        
        setText(47, 4, 'fu');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            snippet: 'function ${1:someFunction}(${2}) ${3}{\n\t${4}\n}',
            type: 'keyword',
            replacementPrefix: 'fu',
            rightLabel: 'keyword'
        });
        
        setText(47, 4, 'function testFunction() on');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Applies the onlyowner modifier',
            snippet: 'onlyowner()${1}',
            type: 'modifier',
            replacementPrefix: 'on',
            rightLabel: 'modifier'
        });
        
        setText(47, 4, 'function testFunction() pu');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Sets the visibility to anywhere (default)',
            descriptionMoreURL: 'https://github.com/ethereum/wiki/wiki/Solidity-Features#visibility-specifiers-1',
            replacementPrefix: 'pu',
            rightLabel: 'keyword',
            text: 'public',
            type: 'keyword'
        });
        
        setText(47, 4, 'function testFunction() ex');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Sets the visibility to contracts only',
            descriptionMoreURL: 'https://github.com/ethereum/wiki/wiki/Solidity-Features#visibility-specifiers-1',
            replacementPrefix: 'ex',
            rightLabel: 'keyword',
            text: 'external',
            type: 'keyword'
        });
        
        setText(47, 4, 'function testFunction() int');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Sets visibility so it can only be accessed from internally',
            text: 'internal',
            type: 'keyword',
            replacementPrefix: 'int',
            rightLabel: 'keyword'
        });
        
        setText(47, 4, 'function testFunction() pr');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            description: 'Sets the visibility to this contract',
            descriptionMoreURL: 'https://github.com/ethereum/wiki/wiki/Solidity-Features#visibility-specifiers-1',
            replacementPrefix: 'pr',
            rightLabel: 'keyword',
            text: 'private',
            type: 'keyword'
        });
        
        setText(47, 4, 'function testFunction() re');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            snippet: 'returns (${1}) ',
            type: 'keyword',
            replacementPrefix: 're',
            rightLabel: 'keyword'
        });
        
        setText(47, 4, 'mo');
        
        suggestion = getSuggestions()[0];
        expect(suggestion)
        .toEqual({
            leftLabel: 'modifier',
            snippet: 'modifier ${1:someModifier}(${2}) {\n\t${3}\n}',
            type: 'type',
            replacementPrefix: 'mo',
            rightLabel: 'type'
        });
    });
    
    it('understands global context', () => {
        setText(1, 0, 'funct');
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(0);
    });
    
    it('understands contract context', () => {
        setText(5, 4, 'cont');
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(0);
    });
    
    it('understands function context', () => {
        setText(33, 8, 'enu');
        
        let suggestions = getSuggestions();
        expect(suggestions.length).toBe(0);
        
        setText(33, 8, 'even');
        
        suggestions = getSuggestions();
        expect(suggestions.length).toBe(0);
        
        setText(33, 8, 'modifi');
        
        suggestions = getSuggestions();
        expect(suggestions.length).toBe(0);
        
        setText(33, 8, 'struc');
        
        suggestions = getSuggestions();
        expect(suggestions.length).toBe(0);
    });
});
