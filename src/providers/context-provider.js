'use babel';
/* jshint esversion: 6 */

import descriptor_definitions from '../../definitions/descriptors.json';
import object_definitions from '../../definitions/objects.json';
import type_definitions from '../../definitions/types.json';

import contracts from '../util/contracts';
import Provider from './Provider';

class TypeProvider extends Provider {
    constructor() {
        super();
        
        this.shorthandOnly = true;
    }
    
    getDefinitions() {
        let definitions = {};
        
        if (this.context.level == 'global' || this.context.level == 'enum') {
            return definitions;
        }
        
        // return descriptors (if applicable)
        if (this.context.prev && Number.isInteger(+this.context.prev)) {
            return descriptor_definitions;
        }
        
        if (this.context.level == 'function' || this.context.level == 'modifier') {
            let period_index = this.prefix.lastIndexOf('.');
            if (period_index !== -1) {
                if (period_index > 4 && this.prefix.indexOf('block.') == period_index - 5) {
                    this.prefix = this.prefix.split('.').pop();
                    
                    return object_definitions.block;
                }
                
                if (period_index > 2 && this.prefix.indexOf('msg.') == period_index - 3) {
                    this.prefix = this.prefix.split('.').pop();
                    
                    return object_definitions.msg;
                }
                
                if (period_index > 1 && this.prefix.indexOf('tx.') == period_index - 2) {
                    this.prefix = this.prefix.split('.').pop();
                    
                    return object_definitions.tx;
                }
            }
        }
        
        // add types (they can be in any context)
        let types = {};
        Object.assign(types, type_definitions);
        
        if (!this.shorthandOnly) {
            for (let i = 1; i <= 32; i++) {
                types['bytes' + i] = {
                    description: i + ' byte' + (i > 1 ? 's' : ''),
                    leftLabel: 'bytes' + i,
                    text: 'bytes' + i,
                    type: 'type'
                };
            }
            
            for (let i = 8; i <= 256; i += 8) {
                types['int' + i] = {
                    description: `Integer (${i} bits)`,
                    leftLabel: 'int' + i,
                    text: 'int' + i,
                    type: 'type'
                };
                
                types['uint' + i] = {
                    description: `Unsigned integer (${i} bits)`,
                    leftLabel: 'uint' + i,
                    text: 'uint' + i,
                    type: 'type'
                };
            }
        }
        
        if (this.context.level == 'function' || this.context.level == 'modifier') {
            types.var = {
                description: 'Type determined at run-time',
                leftLabel: 'var',
                text: 'var',
                type: 'type'
            };
        }
        
        if (this.context.level != 'contract') {
            delete types.enum;
            delete types.event;
            delete types.modifier;
            delete types.struct;
        }
        
        // add user-defined definitions
        let contract = this.loadContract();
        Object.assign(types, contract.getTypeDefinitions());
        
        // add types to definitions
        Object.assign(definitions, types);
        
        if (this.context.level == 'function' || this.context.level == 'modifier') {
            let variables = contract.getVariableDefinitions();
        
            // add variables to definitions
            Object.assign(definitions, variables);
        
            // possible short-circuit with 'new'
            if (this.context.prev == 'new') {
                delete types.var;
                return types;
            }
            
            let period_index = this.prefix.lastIndexOf('.');
            if (period_index !== -1) {
                let split = this.prefix.split('.');
                
                if (period_index > 3 && this.prefix.lastIndexOf('this.') == period_index - 4) {
                    this.prefix = split.pop();
                    
                    return contract.getFunctionDefinitions(true);
                }
                
                if (period_index > 0 && this.prefix.lastIndexOf(').') == period_index - 1) {
                    this.prefix = split.pop();
                    
                    let contract_name = split.pop().split('(')[0];
                    let contract = contracts.load(this.structure, contract_name);
                    
                    return Object.assign({}, contract.getFunctionDefinitions(true), contract.getVariableDefinitions());
                }
                
                let name = split.splice(-2, 1)[0];
                
                let type = types[name];
                if (type) {
                    this.prefix = split.pop();
                    
                    let property_definitions = {};
                    for (let property of type.properties) {
                        property_definitions[property] = {
                            text: property,
                            type: 'enum'
                        };
                    }
                    
                    return property_definitions;
                }
                
                if (name == 'coinbase' && split.splice(-2, 1)[0] == 'block') {
                    this.prefix = split.pop();
                    return object_definitions.address;
                }
                
                if (name == 'sender' && split.splice(-2, 1)[0] == 'msg') {
                    this.prefix = split.pop();
                    return object_definitions.address;
                }
                
                if (name == 'origin' && split.splice(-2, 1)[0] == 'tx') {
                    this.prefix = split.pop();
                    return object_definitions.address;
                }
                
                let variable = variables[name];
                if (variable) {
                    if (variable.leftLabel == 'address') {
                        this.prefix = split.pop();
                        return object_definitions.address;
                    }
                    
                    if (variable.leftLabel.substr(-2) == '[]' || variable.leftLabel == 'bytes') {
                        this.prefix = split.pop();
                        
                        let definitions = Object.assign({}, object_definitions.array);
                        
                        if (variable.leftLabel.indexOf('=>') !== -1) {
                            delete definitions.push;
                        }
                        
                        return definitions;
                    }
                    
                    if (types[variable.leftLabel]) {
                        this.prefix = split.pop();
                        
                        let type = types[variable.leftLabel];
                        
                        let property_definitions = {};
                        for (let property in type.properties) {
                            property_definitions[property] = {
                                leftLabel: type.properties[property].type,
                                text: property,
                                type: type.leftLabel
                            };
                        }
                        
                        return property_definitions;
                    }
                } else if (name.indexOf('[')) {
                    variable = variables[name.split('[')[0]];
                    if (variable) {
                        let leftLabel = variable.leftLabel.replace('[]', '');
                        let type = types[leftLabel];
                        
                        if (!type && leftLabel.indexOf('=>') !== -1) {
                            type = types[leftLabel.split('=>')[1].trim()];
                        }
                        
                        if (type && type.leftLabel != 'enum') {
                            this.prefix = split.pop();
                            
                            let property_definitions = {};
                            for (let property in type.properties) {
                                property_definitions[property] = {
                                    leftLabel: type.properties[property].type,
                                    text: property,
                                    type: type.leftLabel
                                };
                            }
                            
                            return property_definitions;
                        }
                    }
                }
            }
        }
        
        // add functions / events to definitions
        Object.assign(definitions, contract.getFunctionDefinitions());
        
        // add modifiers to definitions
        Object.assign(definitions, contract.getModifierDefinitions());
        
        return definitions;
    }
    
    loadContract() {
        return contracts.load(this.structure, this.context.contract);
    }
}

export default new TypeProvider();
