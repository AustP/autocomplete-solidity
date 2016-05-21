'use babel';
/* jshint esversion: 6 */

// we can't cache the contracts because their structure can change at any time
let load = (structure, contract_name) => {
    return new Contract(structure, contract_name);
};

class Contract {
    constructor(structure, contract_name) {
        this.context = structure.context;
        this.contracts = structure.contracts;
        this.name = contract_name;
        
        for (let name in this.contracts[this.name]) {
            this[name] = this.contracts[this.name][name];
        }
        
        if (this.extends && this.extends.length) {
            for (let name of this.extends.reverse()) {
                let contract = load(structure, name);
                
                for (let property in contract) {
                    if (['context', 'contracts', 'extends', 'name'].indexOf(property) !== -1) {
                        continue;
                    }
                    
                    this[property] = Object.assign({}, contract[property], this[property]);
                }
            }
        }
    }
    
    createFunctionSnippet(name, params, inline) {
        let snippet = name;
        
        let count = 1;
        if (inline) {
            count ++;
            snippet += '${1}';
        }
        
        snippet += '(';
        
        if (params.length) {
            for (let param of params) {
                if (count > (1 + (inline ? 1 : 0))) {
                    snippet += ', ';
                }
                
                snippet += `\${${count}:${param.name}}`;
                
                count++;
            }
        }
        
        snippet += `)\${${count}}`;
        
        return snippet;
    }
    
    getFunctionDefinitions(inline = false) {
        let definitions = {};
        
        if (this.context.level == 'function' || this.context.level == 'modifier') {
            if (!inline) {
                for (let name in this.events) {
                    definitions[name] = {
                        description: `Emits the ${name} event`,
                        leftLabel: 'void',
                        snippet: this.createFunctionSnippet(name, this.events[name].params),
                        type: 'event'
                    };
                }
            }
            
            for (let name in this.functions) {
                if (name === '' || (this.context.level == 'function' && name == this.context.name && this.context.contract == this.name)) {
                    continue;
                }
                
                definitions[name] = {
                    description: `Calls the ${name} function`,
                    leftLabel: this.functions[name].returns,
                    snippet: this.createFunctionSnippet(name, this.functions[name].params, inline),
                    type: 'function'
                };
            }
        }
        
        return definitions;
    }
    
    getModifierDefinitions() {
        let definitions = {};
        
        
        if (this.context.level == 'contract') {
            for (let name in this.modifiers) {
                definitions[name] = {
                    description: `Applies the ${name} modifier`,
                    snippet: this.createFunctionSnippet(name, this.modifiers[name].params),
                    type: 'modifier'
                };
            }
        }
        
        return definitions;
    }
    
    getTypeDefinitions() {
        let definitions = {};
        
        for (let name in this.enums) {
            definitions[name] = {
                description: this.enums[name].properties.join(', '),
                leftLabel: 'enum',
                properties: this.enums[name].properties, // for us to use
                text: name,
                type: 'type'
            };
        }
        
        for (let name in this.structs) {
            definitions[name] = {
                description: Object.keys(this.structs[name].properties).join(', '),
                leftLabel: 'struct',
                properties: this.structs[name].properties, // for us to use
                text: name,
                type: 'type'
            };
        }
        
        for (let contract in this.contracts) {
            if (contract == this.name) {
                continue;
            }
            
            definitions[contract] = {
                leftLabel: 'contract',
                text: contract,
                type: 'type'
            };
        }
        
        return definitions;
    }
    
    getVariableDefinitions() {
        let definitions = {};
        
        for (let name in this.variables) {
            definitions[name] = {
                leftLabel: this.variables[name].type,
                text: name,
                type: 'variable'
            };
        }
        
        if (this.context.level == 'function' || this.context.level == 'modifier') {
            let type = this.context.level == 'function' ? 'functions' : 'modifiers';
            let obj = this[type][this.context.name];
            
            if (obj) {
                for (let param of obj.params) {
                    definitions[param.name] = {
                        leftLabel: param.type,
                        text: param.name,
                        type: 'parameter'
                    };
                }
                
                for (let name in obj.variables) {
                    definitions[name] = {
                        leftLabel: obj.variables[name].type,
                        text: name,
                        type: 'variable'
                    };
                }
            }
        }
        
        return definitions;
    }
}

export default {load};
