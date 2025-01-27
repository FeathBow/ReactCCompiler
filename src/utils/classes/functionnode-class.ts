import type Variable from './variable-class';
import type ASTNode from './astnode-class';
import SymbolEntry from './symbolentry-class';
import type TypeDefinition from './typedef-class';

/**
 * 函数节点参数接口。
 * Function node parameters interface.
 * @interface
 * @property {string} name - 函数名。Function name.
 * @property {ASTNode} body - 函数体。Function body.
 * @property {Variable} locals - 局部变量。Local variables.
 * @property {number} stackSize - 栈大小。Stack size.
 * @property {Variable} Arguments - 参数。Arguments.
 * @property {FunctionNode} returnFunc - 返回函数。Return function.
 * @property {TypeDefinition} type - 类型。Type.
 * @property {boolean} declare - 是否声明。Whether to declare.
 */
export interface FunctionNodeParameters {
    name?: string;
    body?: ASTNode;
    locals?: Variable;
    stackSize?: number;
    Arguments?: Variable;
    returnFunc?: FunctionNode;
    type?: TypeDefinition;
    declare?: boolean;
}

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
    /** 函数声明。Function declaration. */
    declare?: boolean;

    /**
     * 类构造函数。
     * Class constructor
     * @param {FunctionNodeParameters} parameters - 参数对象。Parameter object.
     * @returns {FunctionNode} 类实例（Class instance）。
     * @class
     */
    constructor(parameters: FunctionNodeParameters = {}) {
        const { name = '', body, locals, stackSize = 0, Arguments, returnFunc, type, declare = false } = parameters;
        super({ name, type, nextEntry: returnFunc });
        this.body = body;
        this.locals = locals;
        this.stackSize = stackSize;
        this.Arguments = Arguments;
        this.declare = declare;
    }

    /**
     * 创建一个新的 FunctionNode 实例。
     * Create a new FunctionNode instance.
     * @param {Partial<FunctionNodeParameters>} parameters - 参数对象。Parameter object.
     * @returns {FunctionNode} 新的 FunctionNode 实例。New FunctionNode instance.
     * @static
     */
    static create(parameters: Partial<FunctionNodeParameters> = {}): FunctionNode {
        return new FunctionNode(parameters);
    }
}

export default FunctionNode;
