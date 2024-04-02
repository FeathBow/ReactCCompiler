import type TypeDefinition from './typedef-class';

/**
 * 代表一个局部变量的类。
 * Class representing a local variable.
 */
class LocalVariable {
    /** 下一个局部变量。The next local variable. */
    nextVar?: LocalVariable;
    /** 变量名。Variable name. */
    varName = '';
    /** RBP的偏移量。Offset from RBP. */
    offsetFromRBP = 0;
    /** 变量类型。Variable type. */
    varType?: TypeDefinition;
}

export default LocalVariable;
