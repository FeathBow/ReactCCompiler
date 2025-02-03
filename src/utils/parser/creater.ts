import { getIdentifier } from '../commons';
import ASTNodeKind from '../enums/astnodekind-enum';
import {
    type SymbolEntry,
    type TypeDefinition,
    type ASTNode,
    FunctionNode,
    Variable,
    ScopeManager,
    IntermediateManager,
} from '../classes';
import { logMessage } from '../logger';

let locals: Variable | undefined;
let globals: SymbolEntry | undefined;
let localConstantNumber = 0;
let astNodeNumber = 0;

/**
 * 设置局部变量。Set locals.
 * @param {Variable | undefined} nowLocals - 当前的局部变量。The current local variables.
 * @returns {void}
 */
export function setLocals(nowLocals: Variable | undefined): void {
    locals = nowLocals;
}

/**
 * 获取局部变量。Get locals.
 * @returns {Variable | undefined} 当前的局部变量。The current local variables.
 */
export function getLocals(): Variable | undefined {
    return locals;
}

/**
 * 设置全局变量。Set globals.
 * @param {SymbolEntry | undefined} nowGlobals - 当前的全局变量。The current global variables.
 * @returns {void}
 */
export function setGlobals(nowGlobals: SymbolEntry | undefined): void {
    globals = nowGlobals;
}

/**
 * 获取全局变量。Get globals.
 * @returns {SymbolEntry | undefined} 当前的全局变量。The current global variables.
 */
export function getGlobals(): SymbolEntry | undefined {
    return globals;
}

/**
 * 创建一个新的抽象语法树节点。Create a new abstract syntax tree node.
 * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
export function newNode(kind: ASTNodeKind): ASTNode {
    astNodeNumber += 1;
    return {
        nodeKind: kind,
        nodeNumber: astNodeNumber,
    };
}
/**
 * 创建一个新的二元操作符节点。Create a new binary operator node.
 * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
 * @param {ASTNode} lhs 左操作数。The left operand.
 * @param {ASTNode} rhs 右操作数。The right operand.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
export function newBinary(kind: ASTNodeKind, lhs: ASTNode, rhs: ASTNode): ASTNode {
    astNodeNumber += 1;
    return {
        nodeKind: kind,
        leftNode: lhs,
        rightNode: rhs,
        nodeNumber: astNodeNumber,
    };
}

/**
 * 创建一个新的一元操作符节点。Create a new unary operator node.
 * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
 * @param {ASTNode} expr 操作数。The operand.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
export function newUnary(kind: ASTNodeKind, expr: ASTNode): ASTNode {
    astNodeNumber += 1;
    return {
        nodeKind: kind,
        leftNode: expr,
        nodeNumber: astNodeNumber,
    };
}

/**
 * 创建一个新的数字节点。Create a new number node.
 * @param {number} value 数字的值。The value of the number.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
export function newNumber(value: number): ASTNode {
    astNodeNumber += 1;
    return {
        nodeKind: ASTNodeKind.Number,
        numberValue: value,
        nodeNumber: astNodeNumber,
    };
}

/**
 * 创建一个新的变量节点。Create a new variable node.
 * @param {Variable} variableNode 代表变量的节点。The node representing the variable.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
export function newVariableNode(variableNode: Variable): ASTNode {
    astNodeNumber += 1;
    return {
        nodeKind: ASTNodeKind.Variable,
        localVar: variableNode,
        nodeNumber: astNodeNumber,
    };
}

/**
 * 创建一个新的局部变量。Create a new local variable.
 * @param {string} name 变量名。The name of the variable.
 * @param {TypeDefinition} type 变量类型。The type of the variable.
 * @returns {Variable} 新创建的局部变量。The newly created local variable.
 */
export function newLocalVariable(name: string, type: TypeDefinition): Variable {
    const localVariable = new Variable({ name, offsetFromRBP: 0, isGlobal: false, type, nextEntry: locals });
    ScopeManager.getInstance().declareEntry(localVariable);
    locals = localVariable;
    return localVariable;
}

/**
 * 创建一个新的全局 entry。Create a new global entry.
 * @param {string} name entry 名。The name of the entry.
 * @param {TypeDefinition} type 类型定义。The type definition.
 * @param {boolean} isFunctionNode 是否是函数节点。Whether it is a function node.
 * @param {boolean} isDeclare 是否是声明。Whether it is a declaration.
 * @returns {SymbolEntry} 新创建的全局 entry。The newly created global entry.
 */
export function newGlobalEntry(
    name: string,
    type: TypeDefinition,
    isFunctionNode: boolean,
    isDeclare = false,
): SymbolEntry {
    const globalEntry = isFunctionNode
        ? new FunctionNode({ name, locals, returnFunc: globals, type, declare: isDeclare })
        : new Variable({ name, offsetFromRBP: 0, isGlobal: true, type, nextEntry: globals as Variable });
    ScopeManager.getInstance().declareEntry(globalEntry);
    globals = globalEntry;
    return globalEntry;
}

/**
 * 创建一个新的字符串字面量。Create a new string literal.
 * @param {string | undefined} value 字符串的值。The value of the string.
 * @param {TypeDefinition} type 类型定义。The type definition.
 * @returns {SymbolEntry} 新创建的全局 entry。The newly created global entry.
 */
export function newStringLiteral(value: string | undefined, type: TypeDefinition): SymbolEntry {
    const currentNumber = localConstantNumber;
    localConstantNumber += 1;
    const globalEntry = newGlobalEntry(`.LC${currentNumber}`, type, false) as Variable;
    globalEntry.initialValue = value;
    globals = globalEntry;
    return globalEntry;
}

/**
 * 初始化解析变量。Initialize the parsing of a variable.
 * @returns {void} 无返回值。No return value.
 */
export function initialParse(): void {
    locals = undefined;
    globals = undefined;
    astNodeNumber = 0;
    localConstantNumber = 0;
    ScopeManager.resetInstance();
    IntermediateManager.resetInstance();
}

/**
 * 为函数参数创建局部变量。Create local variables for function parameters.
 * @param {TypeDefinition | undefined} type 函数参数类型。The function parameter type.
 * @returns {void} 无返回值。No return value.
 */
export function createLocalVariablesForParameters(type: TypeDefinition | undefined): void {
    if (type !== undefined) {
        createLocalVariablesForParameters(type.nextParameters);
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { position: createLocalVariablesForParameters });
            throw new Error('Token is undefined');
        }
        newLocalVariable(getIdentifier(type.tokens), type);

        IntermediateManager.getInstance().emit('param', getIdentifier(type.tokens), type.type);
    }
}
