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
