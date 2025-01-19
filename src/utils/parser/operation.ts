import type { ASTNode, Token } from '../classes';
import { ASTNodeKind } from '../commons';
import { newBinary, newUnary } from './creater';
import { logMessage } from '../logger';
import { relational, add, equality, mul, unary, ptrAdd, ptrSub } from '../parse';
import { AddHandler, EqualityHandler, UnaryHandler, RelationalHandler, MulHandler } from './handlers';

/**
 * 处理关系操作。Handle relational operation.
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {ASTNodeKind} kind - AST节点类型。The kind of AST node.
 * @param {ASTNode} node - 当前的AST节点。The current AST node.
 * @param {boolean} swapNodes - 是否交换节点。Whether to swap nodes.
 * @returns {ASTNode} - 返回新的AST节点。Returns a new AST node.
 */
export const handleRelationalOperation: RelationalHandler = (
    token: Token,
    kind: ASTNodeKind,
    node: ASTNode,
    swapNodes: boolean,
) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: relational });
        throw new Error('Unexpected end of input');
    }
    const leftNode: ASTNode = swapNodes ? add(token.next) : node;
    const rightNode: ASTNode = swapNodes ? node : add(token.next);
    return newBinary(kind, leftNode, rightNode);
};

/**
 * 处理加法操作。Handle addition operation.
 * @param {Token} token - 代表加法表达式的令牌。The token representing the addition expression.
 * @param {ASTNodeKind} kind - 加法操作的种类。The kind of addition operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
 */
export const handleAddOperation: AddHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: add });
        throw new Error('Unexpected end of input');
    }
    if (kind === ASTNodeKind.Addition) {
        return ptrAdd(left, mul(token.next));
    }
    if (kind === ASTNodeKind.Subtraction) {
        return ptrSub(left, mul(token.next));
    }
    throw new Error('Invalid operation');
};

/**
 * 处理等式操作。Handle equality operation.
 * @param {Token} token - 代表等式的令牌。The token representing the equality.
 * @param {ASTNodeKind} kind - 等式操作的种类。The kind of equality operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表等式的抽象语法树节点。The abstract syntax tree node representing the equality.
 */
export const handleEqualityOperation: EqualityHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: equality });
        throw new Error('Unexpected end of input');
    }
    return newBinary(kind, left, relational(token.next));
};

/**
 * 处理乘法操作。Handle multiplication operation.
 * @param {Token} token - 代表乘法表达式的令牌。The token representing the multiplication expression.
 * @param {ASTNodeKind} kind - 乘法操作的种类。The kind of multiplication operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
 */
export const handleMulOperation: MulHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: mul });
        throw new Error('Unexpected end of input');
    }
    return newBinary(kind, left, unary(token.next));
};

/**
 * 处理一元操作。Handle unary operation.
 * @param {Token} token - 代表一元表达式的令牌。The token representing the unary expression.
 * @param {ASTNodeKind} kind - 一元操作的种类。The kind of unary operation.
 * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
 */
export const handleUnaryOperation: UnaryHandler = (token: Token, kind: ASTNodeKind) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: unary });
        throw new Error('Unexpected end of input');
    }
    return kind === ASTNodeKind.Addition ? unary(token.next) : newUnary(kind, unary(token.next));
};
