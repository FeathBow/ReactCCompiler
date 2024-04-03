import TypeDefinition from './typedef-class';

/**
 * 代表一个局部变量的类。
 * Class representing a local variable.
 */
class LocalVariable {
    /** 下一个局部变量。The next local variable. */
    nextVar?: LocalVariable;
    /** 变量名。Variable name. */
    varName: string;
    /** RBP的偏移量。Offset from RBP. */
    offsetFromRBP: number;
    /** 变量类型。Variable type. */
    varType?: TypeDefinition;

    /**
     * 类构造函数。
     * Class constructor
     * @param {string} variableName - 变量名。Variable name.
     * @param {number} offsetFromRBP - RBP的偏移量。Offset from RBP.
     * @param {TypeDefinition} variableType - 变量类型。Variable type.
     * @param {LocalVariable} nextVariable - 下一个局部变量。The next local variable.
     * @returns {LocalVariable} 类实例（Class instance）。
     * @class
     */
    constructor(variableName = '', offsetFromRBP = 0, variableType?: TypeDefinition, nextVariable?: LocalVariable) {
        this.varName = variableName;
        this.offsetFromRBP = offsetFromRBP;
        this.varType = variableType;
        this.nextVar = nextVariable;
    }
}

export default LocalVariable;
