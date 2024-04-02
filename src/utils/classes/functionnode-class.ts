import type LocalVariable from './localvariable-class';
import type ASTNode from './astnode-class';

/**
 * 代表一个函数节点的类。
 * Class representing a function node.
 */
class FunctionNode {
    /** 函数体。Function body. */
    body?: ASTNode;
    /** 局部变量。Local variables. */
    locals?: LocalVariable;
    /** 栈大小。Stack size. */
    stackSize = 0;
    /** 函数名。Function name. */
    funcName = '';
    /** 调用返回 Function call return */
    returnFunc?: FunctionNode;
    /** 参数。Arguments. */
    Arguments?: LocalVariable;
}

export default FunctionNode;
