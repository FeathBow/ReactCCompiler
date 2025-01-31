/**
 * 定义了抽象语法树节点变量类型。
 * Defination of AST node variable type.
 */
enum ASTNodeType {
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
    /** 结构体。Struct */
    Struct = 'Struct',
    /** 联合体。Union */
    Union = 'Union',
}

export default ASTNodeType;
