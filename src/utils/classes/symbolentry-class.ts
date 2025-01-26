import TypeDefinition from './typedef-class';

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
    constructor(name: string, type?: TypeDefinition, nextEntry?: SymbolEntry) {
        this.name = name;
        this.type = type;
        this.nextEntry = nextEntry;
    }
}

export default SymbolEntry;
