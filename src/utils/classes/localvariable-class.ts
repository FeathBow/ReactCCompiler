import SymbolEntry from './symbolentry-class';
import type TypeDefinition from './typedef-class';
/**
 * 代表一个变量的类。
 * Class representing a variable.
 */
class Variable extends SymbolEntry {
    /** RBP的偏移量。Offset from RBP. */
    offsetFromRBP: number;
    /** 全局标识符。Global identifier. */
    isGlobal: boolean;

    /**
     * 类构造函数。
     * Class constructor
     * @param {string} variableName - 变量名。Variable name.
     * @param {number} offsetFromRBP - RBP的偏移量。Offset from RBP.
     * @param {boolean} isGlobal - 全局标识符。Global identifier.
     * @param {TypeDefinition} variableType - 变量类型。Variable type.
     * @param {Variable} nextVariable - 下一个变量。Next variable.
     * @returns {Variable} 类实例（Class instance）。
     * @class
     */
    constructor(
        variableName = '',
        offsetFromRBP = 0,
        isGlobal = false,
        variableType?: TypeDefinition,
        nextVariable?: Variable,
    ) {
        super(variableName, variableType, nextVariable);
        this.offsetFromRBP = offsetFromRBP;
        this.isGlobal = isGlobal;
    }
}

export default Variable;
