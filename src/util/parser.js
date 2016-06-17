'use babel';
/* jshint esversion: 6 */

let structures = {};

let parse = (editor) => {
    let cursor = editor.getLastCursor();
    let bufferPosition = cursor.getBufferPosition();
    
    let text = editor.getTextInRange([[0, 0], bufferPosition]);
    text += '__as-cursor__';
    text += editor.getTextInRange([bufferPosition, [Infinity, Infinity]]);
    
    text = text.replace(/([\(\)\{\}])/g, ' $1');
    
    let characters = text.split('');
    
    let buffer = '';
    let char = null;
    let context = 'global';
    let context_name = '';
    let contract = '';
    let contracts = [];
    let contract_types = {};
    let level = 0;
    let modifiers = {
        comment: false,
        contract: false,
        contract_extends: false,
        enum: false,
        enum_properties: false,
        event: false,
        event_params: false,
        function: false,
        function_params: false,
        library: false,
        mapping: false,
        modifier: false,
        modifier_params: false,
        string: false,
        struct: false,
        struct_properties: false,
        type: false
    };
    let next_context = '';
    let prev = '';
    let structure = {
        context: {},
        contracts: {}
    };
    let types = [
        'address', 'bool', 'byte', 'bytes', 'int', 'string', 'uint'
    ];
    
    while ((char = characters.shift())) {
        /*
         * whitespace
         */
        if (!modifiers.contract_extends && !modifiers.event_params &&
        !modifiers.function_params && !modifiers.modifier_params &&
        !modifiers.struct_properties && !modifiers.mapping) {
            if (char == ' ' || char == '\t') {
                prev = buffer ? buffer : prev;
                buffer = '';
                continue;
            }
            
            if (char == '\n' || char == '\r') {
                if (modifiers.comment == 'line') {
                    modifiers.comment = false;
                }
                
                prev = buffer ? buffer : prev;
                buffer = '';
                continue;
            }
        }
        
        // we don't want comments / strings to add to the buffer
        if (!modifiers.comment && !modifiers.string) {
            buffer += char;
        }
        
        // treat periods specially
        if (char == '.' && !modifiers.comment && !modifiers.string) {
            prev = buffer;
            buffer = '';
            continue;
        }
        
        /*
         * comments
         */
        if (char == '/' && !modifiers.string && !modifiers.comment) {
            char = characters.shift();
            if (char == '/') {
                modifiers.comment = 'line';
                buffer = buffer.substr(0, buffer.length - 1);
            } else if (char == '*') {
                modifiers.comment = 'block';
                buffer = buffer.substr(0, buffer.length - 1);
            }
            
            characters.unshift(char);
        }
        
        if (char == '*' && modifiers.comment == 'block') {
            char = characters.shift();
            if (char == '/') {
                modifiers.comment = false;
                continue;
            }
        }
        
        /*
         * strings
         */
        if (char == '\\' && modifiers.string) {
            // \ means escape the next character, so just skip past it
            characters.shift();
            continue;
        }
        
        if ((char == '"' || char == '"') && !modifiers.comment) {
            modifiers.string = modifiers.string == char ? false : char;
            if (!modifiers.string) {
                prev = buffer = '';
            }
        }
        
        /*
         * cursor
         */
        if (char == '_' && buffer.substr(-13) == '__as-cursor__') {
            // skip over the cursor
            buffer = buffer.substr(0, buffer.length - 13);
        
            structure.context = {
                contract: contract,
                level: context,
                name: context_name,
                prev: prev
            };
            continue;
        }
        
        /*
         * context / structure
         */
        if (!modifiers.comment && !modifiers.string) {
            if (prev == 'contract') {
                next_context = 'contract';
                modifiers.contract = true;
            } else if (prev == 'library') {
                next_context = 'contract';
                modifiers.contract = true;
                modifiers.library = true;
            } else if (modifiers.contract) {
                modifiers.contract = false;
                
                contract = prev;
                prev = '';
                structure.contracts[contract] = {
                    enums: {},
                    events: {},
                    extends: [],
                    functions: {},
                    library: modifiers.library,
                    modifiers: {},
                    structs: {},
                    variables: {}
                };
                
                modifiers.library = false;
                
                contracts.push(contract);
                contract_types[contract] = [];
                
                modifiers.contract_extends = char;
            } else if (modifiers.contract_extends) {
                modifiers.contract_extends += char;
            }
            
            if (prev == 'enum') {
                next_context = 'enum';
                modifiers.enum = true;
            } else if (modifiers.enum) {
                modifiers.enum = false;
                
                context_name = prev;
                prev = '';
                structure.contracts[contract].enums[context_name] = {
                    properties: []
                };
                
                contract_types[contract].push(context_name);
                
                modifiers.enum_properties = char;
            } else if (modifiers.enum_properties) {
                modifiers.enum_properties += char;
            }
            
            if (prev == 'event') {
                modifiers.event = true;
            } else if (modifiers.event) {
                modifiers.event = false;
                
                context_name = prev;
                prev = '';
                structure.contracts[contract].events[context_name] = {
                    params: []
                };
                
                modifiers.event_params = char;
            } else if (modifiers.event_params) {
                modifiers.event_params += char;
            }
            
            if (prev == 'function' && char != '(') {
                next_context = 'function';
                modifiers.function = true;
            } else if (modifiers.function || prev == 'function') {
                modifiers.function = false;
                
                // fallback function
                if (prev == 'function' && char == '(') {
                    next_context = 'function';
                    prev = '';
                }
                
                context_name = prev;
                prev = '';
                structure.contracts[contract].functions[context_name] = {
                    returns: 'void',
                    params: [],
                    variables: {}
                };
                
                modifiers.function_params = char;
            } else if (modifiers.function_params) {
                modifiers.function_params += char;
            }
            
            if (prev == 'modifier') {
                next_context = 'modifier';
                modifiers.modifier = true;
            } else if (modifiers.modifier) {
                modifiers.modifier = false;
                
                context_name = prev;
                prev = '';
                structure.contracts[contract].modifiers[context_name] = {
                    params: [],
                    variables: {}
                };
                
                modifiers.modifier_params = char;
            } else if (modifiers.modifier_params) {
                modifiers.modifier_params += char;
            }
            
            if (prev == 'struct') {
                next_context = 'struct';
                modifiers.struct = true;
            } else if (modifiers.struct) {
                modifiers.struct = false;
                
                context_name = prev;
                prev = '';
                structure.contracts[contract].structs[context_name] = {
                    properties: {}
                };
                
                contract_types[contract].push(context_name);
                
                modifiers.struct_properties = char;
            } else if (modifiers.struct_properties) {
                modifiers.struct_properties += char;
            }
            
            if (char == ')' && modifiers.event_params) {
                let event_params = modifiers.event_params.replace(/[\(\)\s]+/g, ' ').trim().split(',');
                for (let definition of event_params) {
                    let info = definition.trim().split(' ');
                    let type = info[0];
                    let name = info.length == 3 ? info[2] : info[1];
                    
                    if (name && context_name && context == 'contract') {
                        structure.contracts[contract].events[context_name].params.push({
                            name: name,
                            type: type
                        });
                    }
                }
                
                // we can't actually go inside an event, so clear out the ontext_name
                context_name = '';
                modifiers.event_params = false;
            }
            
            // handle abstract functions as well
            if (char == '{' || (char == ';' && modifiers.function_params)) {
                if (char == '{') {
                    level++;
                    context = next_context ? next_context : context;
                    next_context = '';
                }
                
                if (modifiers.contract_extends) {
                    let contract_extends = modifiers.contract_extends.replace('{', '').trim().split(/\s+/);
                    if (contract_extends[0] == 'is') {
                        contract_extends.shift();
                        contract_extends = contract_extends.join(' ').split(',');
                        
                        structure.contracts[contract].extends = contract_extends;
                    }
                    
                    modifiers.contract_extends = false;
                }
                
                if (modifiers.function_params) {
                    let function_params = modifiers.function_params.replace(/\s+/g, ' ').split(/[\(\)]/);
                    function_params.shift();
                    
                    let params = function_params.shift().split(',');
                    for (let param of params) {
                        let info = param.trim().split(' ');
                        let type = info[0];
                        let name = info[1];
                        
                        if (name && context_name && context == 'function') {
                            structure.contracts[contract].functions[context_name].params.push({
                                name: name,
                                type: type
                            });
                        }
                    }
                    
                    if (function_params.length == 3) {
                        function_params.shift();
                        
                        if (context_name && context == 'function') {
                            structure.contracts[contract].functions[context_name].returns = function_params.shift().trim();
                        }
                    }
                    
                    modifiers.function_params = false;
                }
                
                if (modifiers.modifier_params) {
                    let modifier_params = modifiers.modifier_params.replace(/\s+/g, ' ').split(/[\(\)]/);
                    modifier_params.shift();
                    
                    if (modifier_params.length) {
                        let params = modifier_params.shift().split(',');
                        for (let param of params) {
                            let info = param.trim().split(' ');
                            let type = info[0];
                            let name = info[1];
                            
                            if (name && context_name && context == 'modifier') {
                                structure.contracts[contract].modifiers[context_name].params.push({
                                    name: name,
                                    type: type
                                });
                            }
                        }
                    }
                    
                    modifiers.modifier_params = false;
                }
            }
            
            if (char == '}') {
                level--;
                
                if (modifiers.enum_properties) {
                    let enum_properties = modifiers.enum_properties.replace(/[\{\}\s]/g, '').split(',');
                    for (let property of enum_properties) {
                        if (property && context_name && context == 'enum') {
                            structure.contracts[contract].enums[context_name].properties.push(property);
                        }
                    }
                    
                    modifiers.enum_properties = false;
                }
                
                if (modifiers.struct_properties) {
                    let struct_properties = modifiers.struct_properties.replace(/[\{\}\s]+/g, ' ').split(';');
                    for (let property of struct_properties) {
                        let info = property.trim().split(' ');
                        let name = info.pop();
                        let type = info.join(' ');
                        
                        if (name && context_name && context == 'struct') {
                            structure.contracts[contract].structs[context_name].properties[name] = {
                                type: type
                            };
                        }
                    }
                    
                    modifiers.struct_properties = false;
                }
                
                if (level == 1) {
                    context = 'contract';
                    context_name = '';
                } else if (level === 0) {
                    context = 'global';
                    context_name = '';
                    contract = '';
                }
            }
            
            /*
             * variables
             */
            let is_type = false;
            for (let type of types) {
                if (prev.indexOf(type) === 0) {
                    let check = prev.replace('[]', '');
                    
                    if (check == type) {
                        is_type = true;
                        break;
                    }
                    
                    if (type == 'bytes') {
                        for (let i = 1; i <= 32; i++) {
                            if (check == type + i) {
                                is_type = true;
                                break;
                            }
                        }
                    }
                    
                    if (type == 'int' || type == 'uint') {
                        for (let i = 8; i <= 256; i += 8) {
                            if (check == type + i) {
                                is_type = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (!is_type && contract) {
                for (let type of contract_types[contract]) {
                    let check = prev.replace('[]', '');
                    
                    if (check == type) {
                        is_type = true;
                        break;
                    }
                }
                
                for (let contract of contracts) {
                    let check = prev.replace('[]', '');
                    
                    if (check == contract && buffer[0] != '(') {
                        is_type = true;
                        break;
                    }
                }
            }
            
            if (is_type) {
                modifiers.type = prev;
            } else if (modifiers.type) {
                let type = modifiers.type;
                let name = prev.replace(';', '');
                
                if (prev == 'public' || prev == 'private' || prev == 'internal') {
                    // skip this word
                    prev = modifiers.type;
                    continue;
                }
                
                if (context == 'contract') {
                    structure.contracts[contract].variables[name] = {
                        type: type
                    };
                } else if (context == 'function') {
                    structure.contracts[contract].functions[context_name].variables[name] = {
                        type: type
                    };
                } else if (context == 'modifier') {
                    structure.contracts[contract].modifiers[context_name].variables[name] = {
                        type: type
                    };
                }
                
                modifiers.type = false;
            }
            
            // mapping is too complicated to be with the other types
            if (prev == 'mapping') {
                modifiers.mapping = true;
                if (char == ';') {
                    modifiers.mapping = false;
                    
                    buffer = buffer.replace(/\b(public|private|internal)\b/g, '');
                    buffer = buffer.replace(/[\(\);]/g, '');
                    buffer = buffer.replace(/\s+/g, ' ');
                    
                    buffer = buffer.split(' ');
                    
                    let name = buffer.pop();
                    let type = buffer.join('');
                    
                    if (context == 'contract') {
                        structure.contracts[contract].variables[name] = {
                            type: type
                        };
                    } else if (context == 'function') {
                        structure.contracts[contract].functions[context_name].variables[name] = {
                            type: type
                        };
                    } else if (context == 'modifier') {
                        structure.contracts[contract].modifiers[context_name].variables[name] = {
                            type: type
                        };
                    }
                    
                    prev = buffer = '';
                    continue;
                }
            }
        }
    }
    
    return structure;
};

export default {
    getStructure(editor) {
        return structures[editor.id];
    },
    
    parse(editor) {
        structures[editor.id] = parse(editor);
    }
};
