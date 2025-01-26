/**
 * 定义了抽象语法树节点的类型。
 * AST node type.
 */
enum ASTNodeKind {
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
    /** 成员选择(对象)。Member selection (object). */
    DotAccess,
}

export default ASTNodeKind;
