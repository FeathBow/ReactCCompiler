import type Variable from './variable-class';
import type ASTNode from './astnode-class';
import SymbolEntry from './symbolentry-class';
import type TypeDefinition from './typedef-class';
/**
 * 代表一个函数节点的类。
 * Class representing a function node.
 */
class FunctionNode extends SymbolEntry {
    /** 函数体。Function body. */
    body?: ASTNode;
    /** 局部变量。Local variables. */
    locals?: Variable;
    /** 栈大小。Stack size. */
    stackSize?: number = 0;
    /** 参数。Arguments. */
    Arguments?: Variable;

    /**
     * 类构造函数。
     * Class constructor
     * @param {string} name - 函数名。Function name.
     * @param {ASTNode} body - 函数体。Function body.
     * @param {Variable} locals - 局部变量。Local variables.
     * @param {number} stackSize - 栈大小。Stack size.
     * @param {Variable} Arguments - 参数。Arguments.
     * @param {returnFunc} returnFunc - 返回函数。Return function.
     * @param {TypeDefinition} type - 类型。Type.
     * @returns {FunctionNode} 类实例（Class instance）。
     * @class
     */
    constructor(
        name = '',
        body?: ASTNode,
        locals?: Variable,
        stackSize = 0,
        Arguments?: Variable,
        returnFunc?: FunctionNode,
        type?: TypeDefinition,
    ) {
        super(name, type, returnFunc);
        this.body = body;
        this.locals = locals;
        this.stackSize = stackSize;
        this.Arguments = Arguments;
    }
}

export default FunctionNode;
