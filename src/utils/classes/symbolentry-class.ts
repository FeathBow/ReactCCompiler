import TypeDefinition from './typedef-class';

/**
 * 符号表条目选项接口。
 * Symbol entry options interface.
 * @interface
 * @property {string} name - 条目名。Entry name.
 * @property {TypeDefinition} type - 条目类型。Entry type.
 * @property {SymbolEntry} nextEntry - 下一个条目。Next entry.
 */
export interface SymbolEntryOptions {
    name: string;
    type?: TypeDefinition;
    nextEntry?: SymbolEntry;
}

/**
 * 代表符号表条目的基类。
 * Base class representing a symbol entry.
 */
class SymbolEntry {
    /** 条目名。Entry name. */
    name: string;
    /** 条目类型。Entry type. */
    type?: TypeDefinition;
    /** 下一个条目。Next entry. */
    nextEntry?: SymbolEntry;

    /**
     * 类构造函数。
     * Class constructor
     * @param {string} name - 条目名。Entry name.
     * @param {TypeDefinition} type - 条目类型。Entry type.
     * @param {SymbolEntry} nextEntry - 下一个条目。Next entry.
     * @returns {SymbolEntry} 类实例（Class instance）。
     * @class
     */
    constructor(options: SymbolEntryOptions) {
        this.name = options.name;
        this.type = options.type;
        this.nextEntry = options.nextEntry;
    }
}

export default SymbolEntry;
