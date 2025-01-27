import SymbolEntry from './symbolentry-class';
import TypeDefinition from './typedef-class';

/**
 * 变量选项接口。
 * Variable options interface.
 * @interface
 * @property {string} name - 变量名。Variable name.
 * @property {TypeDefinition} type - 变量类型。Variable type.
 * @property {SymbolEntry} nextEntry - 下一个变量。Next variable.
 * @property {number} offsetFromRBP - RBP的偏移量。Offset from RBP.
 * @property {boolean} isGlobal - 全局标识符。Global identifier.
 * @property {string} initialValue - 初始值。Initial value.
 */
export interface VariableOptions {
    name: string;
    type?: TypeDefinition;
    nextEntry?: SymbolEntry;
    offsetFromRBP: number;
    isGlobal: boolean;
    initialValue?: string;
}

/**
 * 代表一个变量的类。
 * Class representing a variable.
 */
class Variable extends SymbolEntry {
    /** RBP的偏移量。Offset from RBP. */
    offsetFromRBP: number;
    /** 全局标识符。Global identifier. */
    isGlobal: boolean = false;
    /** 初始值。Initial value. */
    initialValue: string | undefined = undefined;

    /**
     * 类构造函数。
     * Class constructor
     * @param {VariableOptions} options - 变量选项。Variable options.
     * @returns {Variable} 类实例（Class instance）。
     * @class
     */
    constructor(options: VariableOptions = { name: '', offsetFromRBP: 0, isGlobal: false }) {
        const { name, type, nextEntry, offsetFromRBP, isGlobal, initialValue } = options;
        super({ name, type, nextEntry });
        this.offsetFromRBP = offsetFromRBP;
        this.isGlobal = isGlobal;
        this.initialValue = initialValue;
    }

    /**
     * 创建一个新的 Variable 实例。
     * Create a new Variable instance.
     * @param {Partial<VariableOptions>} options - 选项。Options.
     * @returns {Variable} 新的 Variable 实例。New Variable instance.
     * @static
     */
    static create(options: Partial<VariableOptions> = {}): Variable {
        const defaultOptions: VariableOptions = {
            name: '',
            offsetFromRBP: 0,
            isGlobal: false,
            ...options,
        };
        return new Variable(defaultOptions);
    }
}

export default Variable;
