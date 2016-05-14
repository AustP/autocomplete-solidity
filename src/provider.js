'use babel';
/* jshint esversion: 6 */

import definitions from '../data/main.json';

export default {
    selector: '.source.solidity',
    disableForSelector: '.source.solidity .comment',
    
    inclusionPriority: 1,
    excludeLowerPriority: true,
    
    getDefinitionsForPrefix(prefix) {
        let suggestions = [];
        for (let suggestion in definitions) {
            if (suggestion.indexOf(prefix) !== 0) {
                continue;
            }
            
            let definition = definitions[suggestion];
            
            definition.replacementPrefix = prefix;
            definition.rightLabel = definition.type;
            
            suggestions.push(definition);
        }
        
        return suggestions;
    },
    
    getPrefix(editor, bufferPosition) {
        let line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
        return line.split(' ').pop();
    },
    
    getSuggestions(options) {
        let prefix = this.getPrefix(options.editor, options.bufferPosition);
        
        if (prefix.length === 0) {
            return [];
        }
        
        let suggestions = this.getDefinitionsForPrefix(prefix);
        
        if (prefix.indexOf('.') !== -1) {
            let split = prefix.split('.');
            let start = split.shift();
            let end = split.pop();
            
            // this. | super.
            if (start === 'this' || start == 'super') {
                let text = options.editor.getText();
                let matches = text.match(/function\s+[^\(]+\([^\)]*.+/g);
                if (matches) {
                    for (let match of matches) {
                        let split = match.split(/\s+/);
                        split.shift();
                        
                        let fn = split.join(' ');
                        let info = fn.split(/[\(\)]/);
                        let name = info[0].trim();
                        let params = info[1];
                        
                        if (name.indexOf(end) === 0) {
                            let snippet = '';
                            if (params.length) {
                                let count = 1;
                                snippet = '(';
                                
                                params = params.split(',');
                                for (let param of params) {
                                    if (count > 1) {
                                        snippet += ', ';
                                    }
                                    
                                    count++;
                                    snippet += '${' + count + ':' + param + '}';
                                }
                                
                                count++;
                                
                                snippet += ')${' + count + '}';
                            } else {
                                snippet = '(${1})${2}';
                            }
                            
                            let leftLabel = 'void';
                            for (let [index, str] of info.entries()) {
                                if (str.indexOf('returns') !== -1) {
                                    leftLabel = info[index + 1];
                                    break;
                                }
                            }
                            
                            suggestions.push({
                                leftLabel: leftLabel,
                                rightLabel: 'method',
                                snippet: name + snippet,
                                type: 'method'
                            });
                        }
                    }
                }
            } else if (start != 'block' && start != 'msg' && start != 'tx') {
                // address properties / methods | array properties / methods
                prefix = '.' + end;
                
                suggestions = suggestions.concat(
                    this.getDefinitionsForPrefix(prefix)
                );
            }
        } else {
            // contract, struct, enum, modifier
            let text = options.editor.getText();
            let matches = text.match(/(contract|struct|enum|modifier)\s+[^\{]+/g);
            if (matches) {
                for (let match of matches) {
                    let split = match.split(/\s+/);
                    let name = split[1].trim();
                    
                    if (name.indexOf(prefix) === 0) {
                        let type = split[0];
                        
                        suggestions.push({
                            leftLabel: name,
                            rightLabel: type,
                            snippet: name,
                            type: type
                        });
                    }
                }
            }
            
            // events
            matches = text.match(/event\s+[^\(]+\([^\)]*.+/g);
            if (matches) {
                for (let match of matches) {
                    let split = match.split(/\s+/);
                    split.shift();
                    
                    let fn = split.join(' ');
                    let info = fn.split(/[\(\)]/);
                    let name = info[0].trim();
                    let params = info[1];
                    
                    if (name.indexOf(prefix) === 0) {
                        let snippet = '';
                        if (params.length) {
                            let count = 1;
                            snippet = '(';
                            
                            params = params.split(',');
                            for (let param of params) {
                                param = param.split(' ').pop();
                                
                                if (count > 1) {
                                    snippet += ', ';
                                }
                                
                                count++;
                                snippet += '${' + count + ':' + param + '}';
                            }
                            
                            count++;
                            
                            snippet += ')${' + count + '}';
                        } else {
                            snippet = '(${1})${2}';
                        }
                        
                        suggestions.push({
                            leftLabel: 'void',
                            rightLabel: 'event',
                            snippet: name + snippet,
                            type: 'event'
                        });
                    }
                }
            }
            
            // variables
            matches = text.match(/[_\w\d]+(?:(?:\[[^\]]*\])|(?:\s*\(\s*[_\w\d]+\s*=>\s*[_\w\d]+\s*\)))?[\t ]+[_\w\d]+[\t ]*(?==|;)/g);
            if (matches) {
                for (let match of matches) {
                    let split = match.trim().split(/\s+/);
                    let name = split.pop();
                    
                    if (name.indexOf(prefix) === 0) {
                        suggestions.push({
                            leftLabel: split.join(' '),
                            rightLabel: 'variable',
                            text: name,
                            type: 'variable'
                        });
                    }
                }
            }
        }
        
        return suggestions;
    }
};
