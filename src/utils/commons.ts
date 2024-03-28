/**
 * 定义了词法单元的类型。
 * Defination of token type.
 */
export enum TokenType {
    Identifier, // 标识符
    Punctuator, // 标点符号
    Keyword, // 关键字
    NumericLiteral, // 数字字面量
    EndOfFile, // 文件结束标记
}

/**
 * 代表一个词法单元的类。
 * Token class.
 */
export class Token {
    kind: TokenType = TokenType.EndOfFile; // 词法单元的类型
    next?: Token; // 下一个词法单元
    value?: number; // 如果类型是 NumericLiteral，这是它的值
    location?: string; // 词法单元的位置
    length?: number; // 词法单元的长度
}

/**
 * 代表一个局部变量的类。
 * Local variable class.
 */
export class LocalVariable {
    nextVar?: LocalVariable;
    varName: string = ''; // 变量名
    offsetFromRBP: number = 0; // RBP的偏移量
}

/**
 * 代表一个函数节点的类。
 * Function node class.
 */
export class FunctionNode {
    body?: ASTNode;
    locals?: LocalVariable;
    stackSize: number = 0;
}

/**
 * 定义了抽象语法树节点的类型。
 * AST node type.
 */
export enum ASTNodeKind {
    Addition, // 加法
    Subtraction, // 减法
    Multiplication, // 乘法
    Division, // 除法
    Negation, // 取反
    Equality, // 等于
    Inequality, // 不等于
    LessThan, // 小于
    LessThanOrEqual, // 小于等于
    Assignment, // 赋值
    Return, // 返回
    ExpressionStatement, // 表达式语句
    Variable, // 变量
    Number, // 数字
    Block, // 语句块
    If, // If语句
    For, // For语句
    AddressOf, // 取地址
    Dereference, // 解引用
}

/**
 * 代表一个抽象语法树节点的类。
 * AST node class.
 */
export class ASTNode {
    nodeKind: ASTNodeKind = ASTNodeKind.Addition;
    nextNode?: ASTNode;
    leftNode?: ASTNode;
    rightNode?: ASTNode;
    localVar?: LocalVariable;
    numberValue?: number;

    blockBody?: ASTNode;

    condition?: ASTNode;
    trueBody?: ASTNode;
    elseBody?: ASTNode;

    initBody?: ASTNode;
    incrementBody?: ASTNode;

    typeDef?: TypeDefinition;
}

/**
 * 定义了关键字的类型。
 * Defination of keywords.
 */
export enum Keywords {
    Return = 'return',
    If = 'if',
    Else = 'else',
    For = 'for',
    While = 'while',
}

/**
 * 定义了抽象语法树节点变量类型。
 * Defination of AST node variable type.
 */
export enum ASTNodeType {
    Integer = 'Int',
    Pointer = 'Ptr',
}

/**
 * 定义了变量类型的类。
 * Defination of variable type class.
 */
export class TypeDefinition {
    type?: ASTNodeType;
    ptr?: TypeDefinition;

    constructor(type: ASTNodeType, ptr?: TypeDefinition) {
        this.type = type;
        this.ptr = ptr;
    }
}

/**
 * 定义了整数类型的变量。
 * Defination of integer type variable.
 */
export const intTypeDefinition = new TypeDefinition(ASTNodeType.Integer);

/**
 * 判断一个变量类型是否是整数类型。
 * @param type - 要判断的变量类型。
 *
 * Evaluate if a variable type is an integer type.
 * @param type - The variable type to evaluate.
 */
export function isInteger(type: TypeDefinition): boolean {
    return type.type === ASTNodeType.Integer;
}

/**
 * 创建一个指向指定类型的指针。
 * @param ptr - 要指向的类型。
 *
 * Create a pointer to the specified type.
 * @param ptr - The type to point to.
 */
export function pointerTo(ptr: TypeDefinition): TypeDefinition {
    return new TypeDefinition(ASTNodeType.Pointer, ptr);
}

/**
 * 为一个节点添加类型。
 * @param node - 要添加类型的节点。
 *
 * Add type to a node.
 * @param node - The node to add type.
 */
export function addType(node: ASTNode | undefined): void {
    if (node === undefined || node.typeDef !== undefined) {
        return;
    }

    for (const key of ['leftNode', 'rightNode', 'condition', 'trueBody', 'elseBody', 'initBody', 'incrementBody']) {
        const nodeProperty = node[key as keyof ASTNode];
        if (
            typeof nodeProperty === 'number' ||
            nodeProperty instanceof LocalVariable ||
            nodeProperty instanceof FunctionNode ||
            nodeProperty instanceof TypeDefinition
        ) {
            continue;
        }
        addType(nodeProperty);
    }

    let block = node.blockBody;
    while (block !== undefined) {
        addType(block);
        block = block.nextNode;
    }
    switch (node.nodeKind) {
        case ASTNodeKind.Addition:
        case ASTNodeKind.Subtraction:
        case ASTNodeKind.Multiplication:
        case ASTNodeKind.Division:
        case ASTNodeKind.Negation:
        case ASTNodeKind.Assignment: {
            node.typeDef = node.leftNode?.typeDef;
            return;
        }
        case ASTNodeKind.Equality:
        case ASTNodeKind.Inequality:
        case ASTNodeKind.LessThan:
        case ASTNodeKind.LessThanOrEqual:
        case ASTNodeKind.Variable:
        case ASTNodeKind.Number: {
            node.typeDef = intTypeDefinition;
            return;
        }
        case ASTNodeKind.AddressOf: {
            if (node.leftNode?.typeDef !== undefined) {
                node.typeDef = pointerTo(node.leftNode.typeDef);
            }
            return;
        }
        case ASTNodeKind.Dereference: {
            node.typeDef =
                node.leftNode?.typeDef?.type === ASTNodeType.Pointer ? node.leftNode.typeDef.ptr : intTypeDefinition;
        }
    }
}
