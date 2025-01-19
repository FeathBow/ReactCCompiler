import type { ASTNode, Token, TypeDefinition } from '../classes';
import {
    intTypeDefinition,
    voidTypeDefinition,
    charTypeDefinition,
    int64TypeDefinition,
    shortTypeDefinition,
    ASTNodeKind,
} from '../commons';

/**
 * 语句处理器类型。Statement handler type.
 * @typedef {Function} StatementHandler
 * @param {Token} token - 代表语句的令牌。The token representing the statement.
 * @returns {{returnNode: ASTNode, token: Token}} - 返回新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
export type StatementHandler = (token: Token) => { returnNode: ASTNode; token: Token };

/**
 * 类型定义处理器类型。Type definition handler type.
 * @typedef {Function} TypeDefinitionHandler
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {TypeDefinition} type - 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
export type TypeDefinitionHandler = (token: Token, type: string) => TypeDefinition;
/**
 * 类型到 TypeDefinition 的映射。Mapping from type to TypeDefinition.
 * @type {Record<string, TypeDefinition>}
 */
export const typeDefinitions: Record<string, TypeDefinition> = {
    int: intTypeDefinition,
    void: voidTypeDefinition,
    char: charTypeDefinition,
    i64: int64TypeDefinition,
    short: shortTypeDefinition,
};
/**
 * 关系操作处理器类型。Relational operation handler type.
 * @typedef {Function} RelationalHandler
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {ASTNodeKind} kind - AST节点类型。The kind of AST node.
 * @param {ASTNode} node - 当前的AST节点。The current AST node.
 * @param {boolean} swapNodes - 是否交换节点。Whether to swap nodes.
 * @returns {ASTNode} - 返回新的AST节点。Returns a new AST node.
 */

export type RelationalHandler = (token: Token, kind: ASTNodeKind, node: ASTNode, swapNodes: boolean) => ASTNode;
/**
 * 乘法操作处理器类型。Multiplication operation handler type.
 * @typedef {Function} MulHandler
 * @param {Token} token - 代表乘法表达式的令牌。The token representing the multiplication expression.
 * @param {ASTNodeKind} kind - 乘法操作的种类。The kind of multiplication operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
 */

export type MulHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => ASTNode; /**
 * 加法操作处理器类型。Addition operation handler type.
 * @typedef {Function} AddHandler
 * @param {Token} token - 代表加法表达式的令牌。The token representing the addition expression.
 * @param {ASTNodeKind} kind - 加法操作的种类。The kind of addition operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
 */

export type AddHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => ASTNode;
/**
 * 一元操作处理器类型。Unary operation handler type.
 * @typedef {Function} UnaryHandler
 * @param {Token} token - 代表一元表达式的令牌。The token representing the unary expression.
 * @param {ASTNodeKind} kind - 一元操作的种类。The kind of unary operation.
 * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
 */

export type UnaryHandler = (token: Token, kind: ASTNodeKind) => ASTNode;
/**
 * 等式操作处理器类型。Equality operation handler type.
 * @typedef {Function} EqualityHandler
 * @param {Token} token - 代表等式的令牌。The token representing the equality.
 * @param {ASTNodeKind} kind - 等式操作的种类。The kind of equality operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表等式的抽象语法树节点。The abstract syntax tree node representing the equality.
 */

export type EqualityHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => ASTNode;
