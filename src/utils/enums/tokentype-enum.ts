/**
 * 定义了词法单元的类型。
 * Defination of token type.
 */
enum TokenType {
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

export default TokenType;
