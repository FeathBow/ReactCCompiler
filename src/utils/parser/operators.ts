import ASTNodeKind from '../enums/astnodekind-enum';

/**
 * 加法操作符到 ASTNodeKind 的映射。Mapping from addition operators to ASTNodeKind.
 * @type {Record<string, ASTNodeKind>}
 */
export const addOperators: Record<string, ASTNodeKind> = {
    '+': ASTNodeKind.Addition,
    '-': ASTNodeKind.Subtraction,
};

/**
 * 一元操作符到 ASTNodeKind 的映射。Mapping from unary operators to ASTNodeKind.
 * @type {Record<string, ASTNodeKind>}
 */
export const unaryOperators: Record<string, ASTNodeKind> = {
    '+': ASTNodeKind.Addition,
    '-': ASTNodeKind.Negation,
    '&': ASTNodeKind.AddressOf,
    '*': ASTNodeKind.Dereference,
};

/**
 * 等式操作符到 ASTNodeKind 的映射。Mapping from equality operators to ASTNodeKind.
 * @typedef {object} EqualityOperators
 * @property {ASTNodeKind} '==' - 代表等式操作的 ASTNodeKind。The ASTNodeKind representing the equality operation.
 * @property {ASTNodeKind} '!=' - 代表不等式操作的 ASTNodeKind。The ASTNodeKind representing the inequality operation.
 */
export const equalityOperators: Record<string, ASTNodeKind> = {
    '==': ASTNodeKind.Equality,
    '!=': ASTNodeKind.Inequality,
};

/**
 * 乘法操作符到 ASTNodeKind 的映射。Mapping from multiplication operators to ASTNodeKind.
 * @type {Record<string, ASTNodeKind>}
 */
export const mulOperators: Record<string, ASTNodeKind> = {
    '*': ASTNodeKind.Multiplication,
    '/': ASTNodeKind.Division,
};

/**
 * 关系操作符映射。Relational operators mapping.
 * @type {Record<string, [ASTNodeKind, boolean]>}
 */
export const relationalOperators: Record<string, [ASTNodeKind, boolean]> = {
    '<': [ASTNodeKind.LessThan, false],
    '<=': [ASTNodeKind.LessThanOrEqual, false],
    '>': [ASTNodeKind.LessThan, true],
    '>=': [ASTNodeKind.LessThanOrEqual, true],
};
