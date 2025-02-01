import { type ASTNode, type Token, Variable, TypeDefinition, ScopeManager, Member } from './classes';
import { TokenType, ASTNodeType, ASTNodeKind } from './enums';
import { logMessage } from './logger';

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
            !(nodeProperty instanceof TypeDefinition) &&
            !(nodeProperty instanceof Member)
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
            return;
        }
        case ASTNodeKind.DotAccess: {
            if (node.members?.type === undefined) {
                logMessage('error', 'Invalid dot access', { token: node.leftNode?.localVar?.name });
                throw new Error('Invalid dot access');
            }
            node.typeDef = node.members.type;
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

/**
 * 将给定的数字向上舍入到最接近的对齐值。Round the given number up to the nearest alignment value.
 * @param {number} n 要舍入的数字。The number to round.
 * @param {number} align 对齐值。The alignment value.
 * @returns {number} 舍入后的数字。The rounded number.
 */
export function alignToNearest(n: number, align: number): number {
    return Math.floor((n + align - 1) / align) * align;
}
