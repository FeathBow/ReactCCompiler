import type Token from '../lexer/token';
import type ASTNodeType from '../enums/astnodetype-enum';
import type Member from './member-class';

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
    members?: Member;
}

/**
 * 定义了变量类型的类。
 * Defination of variable type class.
 */
class TypeDefinition {
    /** 变量类型。Variable type. */
    type: ASTNodeType;
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
    size: number;
    /** 内存对齐 */
    alignment: number;
    /** 成员 */
    members?: Member;

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
        this.members = options.members;
    }

    /**
     * 深拷贝。
     * Deep copy.
     * @returns {TypeDefinition} 深拷贝后的类型定义。Deep copy of the TypeDefinition.
     */
    deepCopy(): TypeDefinition {
        return new TypeDefinition({
            type: this.type,
            size: this.size,
            alignment: this.alignment,
            ptr: this.ptr === undefined ? undefined : this.ptr.deepCopy(),
            tokens: this.tokens === undefined ? undefined : { ...this.tokens },
            functionType: this.functionType === undefined ? undefined : this.functionType.deepCopy(),
            parameters: this.parameters === undefined ? undefined : this.parameters.deepCopy(),
            nextParameters: this.nextParameters === undefined ? undefined : this.nextParameters.deepCopy(),
            arrayLength: this.arrayLength,
            members: this.members === undefined ? undefined : this.members.deepCopy(),
        });
    }
}

export default TypeDefinition;
