import type Token from './token-class';
import type { ASTNodeType, TypeDefinitionOptions } from '../commons';

/**
 * 定义了变量类型的类。
 * Defination of variable type class.
 */
class TypeDefinition {
    /** 变量类型。Variable type. */
    type?: ASTNodeType;
    /** 指针。Pointer. */
    ptr?: TypeDefinition;
    /** 词法单元。Tokens. */
    tokens?: Token;
    /** 函数类型 */
    functionType?: TypeDefinition;
    /** 函数参数 */
    parameters?: TypeDefinition;
    /** 下一个参数 */
    nextParameters?: TypeDefinition;
    /** 数组长度 */
    arrayLength?: number;
    /** 变量大小 */
    size?: number;
    /** 内存对齐 */
    alignment?: number;

    /**
     * 类构造函数。Class constructor
     * @param {TypeDefinitionOptions} options - 类实例的接口选项（Interface options for class instance）。
     * @returns {TypeDefinition} 类实例（Class instance）。
     */
    constructor(options: TypeDefinitionOptions) {
        this.type = options.type;
        this.size = options.size;
        this.alignment = options.alignment;
        this.ptr = options.ptr;
        this.tokens = options.tokens;
        this.functionType = options.functionType;
        this.parameters = options.parameters;
        this.nextParameters = options.nextParameters;
        this.arrayLength = options.arrayLength;
    }
}

export default TypeDefinition;
