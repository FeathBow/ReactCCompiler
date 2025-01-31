/**
 * 定义了变量类型的关键字。
 * Defination of variable type keywords.
 */
enum VariableTypeDefinition {
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
    /** 结构体。struct */
    Struct = 'struct',
    /** 联合体。union */
    Union = 'union',
}

export default VariableTypeDefinition;
