'use babel';
/* jshint esversion: 6 */

import parser from '../src/util/parser';

describe('AutocompleteSolidity Parser', () => {
    let editors;
    
    beforeEach(() => {
        atom.project.setPaths([__dirname]);
        
        waitsForPromise(() => atom.workspace.open('files/ballot.sol'));
        waitsForPromise(() => atom.workspace.open('files/bank.sol'));
        waitsForPromise(() => atom.workspace.open('files/pyramid.sol'));
        waitsForPromise(() => atom.workspace.open('files/StringLib.sol'));
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-solidity'));
        
        runs(() => {
            editors = atom.workspace.getTextEditors();
            
            parser.parse(editors[0]);
            parser.parse(editors[1]);
            parser.parse(editors[2]);
            parser.parse(editors[3]);
        });
    });
        
    it('parses contracts', () => {
        let editor = editors[1];
        let structure = parser.getStructure(editor);
        
        expect(Object.keys(structure.contracts).sort())
        .toEqual([
            'Bank', 'BankDb', 'ContractProvider', 'Doug', 'DougEnabled',
            'FundManager', 'FundManagerEnabled', 'Permissions', 'PermissionsDb'
        ]);
    });
        
    it('parses libraries', () => {
        let editor = editors[3];
        let structure = parser.getStructure(editor);
        
        for (let contract in structure.contracts) {
            let info = structure.contracts[contract];
            
            if (contract == 'StringLib' || contract == 'StringUtils') {
                expect(info.library).toBe(true);
            } else {
                expect(info.library).toBe(false);
            }
        }
    });
    
    it('parses enums', () => {
        let editor = editors[2];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Pyramid.enums.PayoutType.properties)
        .toEqual(['Ether', 'Bitcoin']);
    });
    
    it('parses events', () => {
        let editor = editors[2];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Pyramid.events.NewParticipant.params)
        .toEqual([{name: 'idx', type: 'uint'}]);
    });
    
    it('parses contracts that extend', () => {
        let editor = editors[1];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Bank.extends)
        .toEqual(['FundManagerEnabled']);
    });
    
    it('parses functions', () => {
        let editor = editors[1];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Bank.functions.deposit.params)
        .toEqual([{name: 'userAddr', type: 'address'}]);
        
        expect(structure.contracts.Bank.functions.deposit.returns)
        .toEqual('bool res');
        
        expect(structure.contracts.Bank.functions.deposit.variables)
        .toEqual({bankdb: {type: 'address'}, success: {type: 'bool'}});
    });
    
    it('parses modifiers', () => {
        let editor = editors[2];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Pyramid.modifiers.onlyowner)
        .toEqual({params: [], variables: {}});
    });
    
    it('parses structs', () => {
        let editor = editors[0];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Ballot.structs.Voter.properties)
        .toEqual({
            delegate: {type: 'address'},
            vote: {type: 'uint8'},
            voted: {type: 'bool'},
            weight: {type: 'uint'}
        });
    });
    
    it('parses variables', () => {
        let editor = editors[0];
        let structure = parser.getStructure(editor);
        
        expect(structure.contracts.Ballot.variables)
        .toEqual({
            chairperson: {type: 'address'},
            proposals: {type: 'Proposal[]'},
            voters: {type: 'address=>Voter'}
        });
    });
    
    it('understands global context', () => {
        let editor = editors[0];
        editor.setCursorBufferPosition([1, 0]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        
        
        expect(structure.context)
        .toEqual({
            contract: '',
            level: 'global',
            name: '',
            prev: ''
        });
    });
    
    it('understands contract context', () => {
        let editor = editors[0];
        editor.setCursorBufferPosition([3, 0]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Ballot',
            level: 'contract',
            name: '',
            prev: '{'
        });
    });
    
    it('understands enum context', () => {
        let editor = editors[2];
        editor.setCursorBufferPosition([3, 28]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'enum',
            name: 'PayoutType',
            prev: '{'
        });
    });
    
    it('understands function context', () => {
        let editor = editors[2];
        editor.setCursorBufferPosition([27, 27]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'function',
            name: 'Pyramid',
            prev: 'msg.'
        });
    });
    
    it('understands modifier context', () => {
        let editor = editors[2];
        editor.setCursorBufferPosition([21, 25]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'modifier',
            name: 'onlyowner',
            prev: '{'
        });
    });
    
    it('understands struct context', () => {
        let editor = editors[2];
        editor.setCursorBufferPosition([6, 18]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'struct',
            name: 'Participant',
            prev: ''
        });
    });
    
    it('parses the fallback function too', () => {
        let editor = editors[2];
        editor.setCursorBufferPosition([33, 8]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'function',
            name: '',
            prev: '( )  {'
        });
    });
    
    it('handles brackets just fine', () => {
        let editor = editors[2];
        editor.setCursorBufferPosition([63, 0]);
        parser.parse(editor);
        
        let structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'function',
            name: 'enter',
            prev: ');'
        });
        
        editor.setCursorBufferPosition([65, 40]);
        parser.parse(editor);
        
        structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'function',
            name: 'enter',
            prev: '100'
        });
        
        editor.setCursorBufferPosition([79, 66]);
        parser.parse(editor);
        
        structure = parser.getStructure(editor);
        
        expect(structure.context)
        .toEqual({
            contract: 'Pyramid',
            level: 'function',
            name: 'enter',
            prev: '(amount'
        });
    });
    
    it('fails silently when extra closing brackets are present', () => {
        let editor = editors[0];
        
        // close contract early
        editor.setCursorBufferPosition([2, 17]);
        editor.setTextInBufferRange([[2, 17], [2, 18]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[2, 17], [2, 18]], '');
        
        // close struct early
        editor.setCursorBufferPosition([4, 18]);
        editor.setTextInBufferRange([[4, 18], [4, 19]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[4, 18], [4, 19]], '');
        
        // close function early
        editor.setCursorBufferPosition([19, 42]);
        editor.setTextInBufferRange([[19, 42], [19, 43]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[19, 42], [19, 43]], '');
        
        // close if early
        editor.setCursorBufferPosition([60, 67]);
        editor.setTextInBufferRange([[60, 67], [60, 68]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[60, 67], [60, 68]], '');
        
        editor = editors[2];
        
        // close modifier early
        editor.setCursorBufferPosition([21, 24]);
        editor.setTextInBufferRange([[21, 24], [21, 25]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[21, 24], [21, 25]], '');
        
        editor = editors[3];
        
        // close else early
        editor.setCursorBufferPosition([12, 14]);
        editor.setTextInBufferRange([[12, 14], [12, 15]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[12, 14], [12, 15]], '');
        
        // close while early
        editor.setCursorBufferPosition([13, 27]);
        editor.setTextInBufferRange([[13, 27], [13, 28]], '}');
        expect(parser.parse.bind(parser, editor)).not.toThrow();
        editor.setTextInBufferRange([[13, 27], [13, 28]], '');
    });
});
