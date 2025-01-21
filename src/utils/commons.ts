import type { ASTNode, Token } from './classes';
import { Variable, TypeDefinition, TokenManager, ScopeManager } from './classes';
import { logMessage } from './logger';
import { isEqual } from './token';

/**
 * 定义了词法单元的类型。
 * Defination of token type.
 */
export enum TokenType {
    /** 标识符 Identifier */
    Identifier,
    /** 标点符号 Punctuator */
    Punctuator,
    /** 关键字 Keyword */
    Keyword,
    /** 数字字面量 Numeric Literal */
    NumericLiteral,
    /** 字符串字面量 String Literal */
    StringLiteral,
    /** 文件结束标记 End of File */
    EndOfFile,
}
/**
 * 定义了抽象语法树节点的类型。
 * AST node type.
 */
export enum ASTNodeKind {
    /** 加法。Addition. */
    Addition,
    /** 减法。Subtraction. */
    Subtraction,
    /** 乘法。Multiplication. */
    Multiplication,
    /** 除法。Division. */
    Division,
    /** 取反。Negation. */
    Negation,
    /** 等于。Equality. */
    Equality,
    /** 不等于。Inequality. */
    Inequality,
    /** 小于。Less than. */
    LessThan,
    /** 小于等于。Less than or equal. */
    LessThanOrEqual,
    /** 赋值。Assignment. */
    Assignment,
    /** 返回。Return. */
    Return,
    /** 表达式语句。Expression statement. */
    ExpressionStatement,
    /** 变量。Variable. */
    Variable,
    /** 数字。Number. */
    Number,
    /** 语句块。Block. */
    Block,
    /** If语句。If statement. */
    If,
    /** For语句。For statement. */
    For,
    /** 取地址。Address of. */
    AddressOf,
    /** 解引用。Dereference. */
    Dereference,
    /** 函数调用。Function call. */
    FunctionCall,
    /** 逗号。Comma. */
    Comma,
}

/**
 * 定义了关键字的类型。
 * Defination of keywords.
 */
export enum Keywords {
    /** 返回。Return. */
    Return = 'return',
    /** 如果。If. */
    If = 'if',
    /** 否则。Else. */
    Else = 'else',
    /** For 循环。For. */
    For = 'for',
    /** While 循环。While. */
    While = 'while',
    /** 整型。Int. */
    Int = 'int',
    /** 空。Void. */
    Void = 'void',
    /** 字符。char */
    Char = 'char',
    /** 长整形 i64(long long) */
    Int64 = 'i64',
    /** 短整型。short */
    Short = 'short',
    /** 操作数大小。Sizeof. */
    Sizeof = 'sizeof',
}

/**
 * 定义了变量类型的关键字。
 * Defination of variable type keywords.
 */
export enum VariableTypeDefinition {
    /** 整型。Int. */
    Int = 'int',
    /** 空。Void. */
    Void = 'void',
    /** 字符。char */
    Char = 'char',
    /** 长整形 i64(long long) */
    Int64 = 'i64',
    /** 短整型。short */
    Short = 'short',
}

/**
 * 定义了抽象语法树节点变量类型。
 * Defination of AST node variable type.
 */
export enum ASTNodeType {
    /** 整型。Integer. */
    Integer = 'Int',
    /** 指针。Pointer. */
    Pointer = 'Ptr',
    /** 函数。Function. */
    Function = 'Func',
    /** 数组。Array. */
    Array = 'Array',
    /** 空。Void. */
    Void = 'Void',
    /** 字符。Char */
    Char = 'Char',
    /** 长整形 i64(long long) */
    Int64 = 'Int64',
    /** 短整型。Short */
    Short = 'Short',
}

/**
 * 定义了类型定义的选项。
 * Defination of type definition options.
 */
export interface TypeDefinitionOptions {
    type: ASTNodeType;
    size: number;
    alignment: number;
    ptr?: TypeDefinition;
    tokens?: Token;
    functionType?: TypeDefinition;
    parameters?: TypeDefinition;
    nextParameters?: TypeDefinition;
    arrayLength?: number;
}

/**
 * 定义了整数类型的变量。
 * Defination of integer type variable.
 */
export const intTypeDefinition = new TypeDefinition({
    type: ASTNodeType.Integer,
    size: 4,
    alignment: 4,
});

/**
 * 定义了空类型的变量。
 * Defination of void type variable.
 */
export const voidTypeDefinition = new TypeDefinition({
    type: ASTNodeType.Void,
    size: 1,
    alignment: 1,
});

/**
 * 定义了字符类型的变量。
 * Defination of char type variable.
 */
export const charTypeDefinition = new TypeDefinition({
    type: ASTNodeType.Char,
    size: 1,
    alignment: 1,
});

/**
 * 定义了长整型类型的变量。
 * Defination of long long type variable.
 */
export const int64TypeDefinition = new TypeDefinition({
    type: ASTNodeType.Int64,
    size: 8,
    alignment: 8,
});

/**
 * 定义了短整型类型的变量。
 * Defination of short type variable.
 */
export const shortTypeDefinition = new TypeDefinition({
    type: ASTNodeType.Short,
    size: 2,
    alignment: 2,
});

/**
 * 判断一个变量类型是否是数类型。Judge if a variable type is a number type.
 * @param {TypeDefinition} type - 要判断的变量类型（The variable type to evaluate）。
 * @returns {boolean} 如果变量类型是数类型，返回 true，否则返回 false（Return true if the variable type is a number type, otherwise return false）。
 */
export function isNumberType(type: TypeDefinition): boolean {
    return (
        type.type === ASTNodeType.Integer ||
        type.type === ASTNodeType.Char ||
        type.type === ASTNodeType.Int64 ||
        type.type === ASTNodeType.Short
    );
}

/**
 * 创建一个指向指定类型的指针。
 * Create a pointer to the specified type.
 * @param {TypeDefinition} ptr - 要指向的类型（The type to point to）。
 * @returns {TypeDefinition} 指向指定类型的指针（A pointer to the specified type）。
 */
export function pointerTo(ptr: TypeDefinition): TypeDefinition {
    const pointer = new TypeDefinition({
        type: ASTNodeType.Pointer,
        size: 8,
        alignment: 8,
    });
    pointer.ptr = ptr;
    pointer.type = ASTNodeType.Pointer;
    return pointer;
}

/**
 * 为一个节点添加类型。
 * Add a type to a node.
 * @param {ASTNode | undefined} node - 要添加类型的节点（The node to add type）。
 * @returns {void}
 */
export function addType(node: ASTNode | undefined): void {
    if (node === undefined || node.typeDef !== undefined) {
        return;
    }

    for (const key of ['leftNode', 'rightNode', 'condition', 'trueBody', 'elseBody', 'initBody', 'incrementBody']) {
        const nodeProperty = node[key as keyof ASTNode];
        if (
            typeof nodeProperty !== 'number' &&
            typeof nodeProperty !== 'string' &&
            !(nodeProperty instanceof Variable) &&
            !(nodeProperty instanceof TypeDefinition)
        ) {
            addType(nodeProperty);
        }
    }

    let block = node.blockBody;
    while (block !== undefined) {
        addType(block);
        block = block.nextNode;
    }

    let { functionArgs } = node;
    while (functionArgs !== undefined) {
        addType(functionArgs);
        functionArgs = functionArgs.nextNode;
    }
    switch (node.nodeKind) {
        case ASTNodeKind.Comma: {
            node.typeDef = node.rightNode?.typeDef;
            return;
        }
        case ASTNodeKind.Addition:
        case ASTNodeKind.Subtraction:
        case ASTNodeKind.Multiplication:
        case ASTNodeKind.Division:
        case ASTNodeKind.Negation: {
            node.typeDef = node.leftNode?.typeDef;
            return;
        }
        case ASTNodeKind.Assignment: {
            if (node.leftNode?.typeDef?.type === ASTNodeType.Array) {
                logMessage('error', 'Not an lvalue', { token: node.leftNode.localVar?.name });
                throw new Error('Not an lvalue');
            }
            node.typeDef = node.leftNode?.typeDef;
            return;
        }
        case ASTNodeKind.Equality:
        case ASTNodeKind.Inequality:
        case ASTNodeKind.LessThan:
        case ASTNodeKind.LessThanOrEqual:
        case ASTNodeKind.FunctionCall:
        case ASTNodeKind.Number: {
            node.typeDef = int64TypeDefinition;
            return;
        }
        case ASTNodeKind.Variable: {
            node.typeDef = node.localVar?.type;
            return;
        }
        case ASTNodeKind.AddressOf: {
            if (node.leftNode?.typeDef?.type === ASTNodeType.Array) {
                if (node.leftNode.typeDef.ptr === undefined) {
                    logMessage('error', 'Invalid array address', { token: node.leftNode.localVar?.name });
                    throw new Error('Invalid array address');
                }
                node.typeDef = pointerTo(node.leftNode.typeDef.ptr);
            } else if (node.leftNode?.typeDef !== undefined) {
                node.typeDef = pointerTo(node.leftNode?.typeDef);
            }
            return;
        }
        case ASTNodeKind.Dereference: {
            if (node.leftNode?.typeDef?.ptr === undefined) {
                logMessage('error', 'Invalid pointer dereference', { token: node.leftNode?.localVar?.name });
                throw new Error('Invalid pointer dereference');
            }
            if (node.leftNode.typeDef.ptr.type === ASTNodeType.Void) {
                logMessage('error', 'Invalid pointer dereference', { token: node.leftNode.localVar?.name });
                throw new Error('Invalid pointer dereference');
            }
            node.typeDef = node.leftNode.typeDef.ptr;
            break;
        }
        default: {
            break;
        }
    }
}

/**
 * 创建一个新的函数类型。
 * Create a new function type.
 * @param {TypeDefinition} type - 返回类型（Return type）。
 * @returns {TypeDefinition} 新的函数类型（New function type）。
 */
export function addFunctionType(type: TypeDefinition): TypeDefinition {
    const nowType = new TypeDefinition({
        type: ASTNodeType.Function,
        size: 8,
        alignment: 8,
    });
    nowType.functionType = type;
    return nowType;
}

/**
 * 创建一个新的数组类型。
 * @param {TypeDefinition} type - 数组元素的类型。
 * @param {number} length - 数组的长度。
 * @returns {TypeDefinition} 新的数组类型。
 */
export function addArray(type: TypeDefinition, length: number): TypeDefinition {
    if (type.size === undefined) {
        logMessage('error', 'Array type must have size', { type });
        throw new Error('Array type must have size');
    }
    if (type.alignment === undefined) {
        logMessage('error', 'Array type must have alignment', { type });
        throw new Error('Array type must have alignment');
    }
    const arrayType = new TypeDefinition({
        type: ASTNodeType.Array,
        size: type.size * length,
        alignment: type.alignment,
    });
    arrayType.ptr = type;
    arrayType.arrayLength = length;
    return arrayType;
}

/**
 * 消费一个令牌，如果令牌的值与给定的字符串匹配。
 * Consumes a token if the token's value matches the given string.
 * @param {Token} token 当前的令牌。The current token.
 * @param {string} tokenName 要匹配的字符串。The string to match.
 * @returns {boolean} 如果令牌的值与给定的字符串匹配，则返回true并将nowToken设置为下一个令牌，否则返回false并将nowToken设置为当前令牌。
 * True if the token's value matches the given string and sets nowToken to the next token, false otherwise and sets nowToken to the current token.
 */

export function consumeToken(token: Token, tokenName: string): boolean {
    if (isEqual(token, tokenName)) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: consumeToken });
            throw new Error('Unexpected end of input');
        }
        TokenManager.getInstance().nowToken = token.next;
        return true;
    }
    TokenManager.getInstance().nowToken = token;
    return false;
}
/**
 * 在当前的变量列表中查找一个变量。Find a variable in the current list of local variables.
 * @param {Token} token 代表变量的令牌。The token representing the variable.
 * @returns {Variable | undefined} 如果找到了变量，则返回该变量的节点，否则返回undefined。The node of the variable if found, otherwise undefined.
 */
export function findVariable(token: Token): Variable | undefined {
    const result = ScopeManager.getInstance().findEntry(getIdentifier(token));
    return result instanceof Variable ? result : undefined;
}

/**
 * 获取标识符。Get an identifier.
 * @param {Token} token 代表标识符的令牌。The token representing the identifier.
 * @returns {string} 标识符的字符串表示。The string representation of the identifier.
 */
export function getIdentifier(token: Token): string {
    if (token.kind !== TokenType.Identifier) {
        logMessage('error', 'Expected an identifier', { token, position: getIdentifier });
        throw new Error('Expected an identifier');
    }
    if (token.location === undefined || token.length === undefined) {
        logMessage('error', 'Token location or length is undefined', { token, position: getIdentifier });
        throw new Error('Token location or length is undefined');
    }
    return token.location.slice(0, Math.max(0, token.length));
}

/**
 * 创建一个只包含一个元素的数组
 * Create an array containing only one element
 * @param {string} index 元素。The element.
 * @returns {string[]} 返回包含一个元素的数组。An array containing only one element.
 */
export function makelist(index: string): string[] {
    return [index];
}
