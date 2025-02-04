import TokenType from '../enums/tokentype-enum';
import TypeDefinition from '../classes/typedef-class';

/**
 * 代表一个词法单元的类。
 * Token class.
 */
class Token {
    /** 词法单元的类型。The type of the token. */
    kind: TokenType = TokenType.EndOfFile;
    /** 下一个词法单元。The next token. */
    next?: Token;
    /** 如果类型是 NumericLiteral，这是它的值。The value if the type is NumericLiteral. */
    numericValue?: number;
    /** 如果类型是 StringLiteral，这是它的值。The value if the type is StringLiteral. */
    stringValue?: string;
    /** 如果类型是 StringLiteral，这是它的数组类型。The array type if the type is StringLiteral. */
    stringType?: TypeDefinition;
    /** 词法单元的位置。The location of the token. */
    location?: string;
    /** 词法单元的长度。The length of the token. */
    length?: number;

    /**
     * 类构造函数。
     * Class constructor
     * @param {TokenType} kind - 词法单元的类型。The type of the token.
     * @param {Token} next - 下一个词法单元。The next token.
     * @param {number} numericValue - 如果类型是 NumericLiteral，这是它的值。The value if the type is NumericLiteral.
     * @param {string} stringValue - 如果类型是 StringLiteral，这是它的值。The value if the type is StringLiteral.
     * @param {TypeDefinition} stringType - 如果类型是 StringLiteral，这是它的数组类型。The array type if the type is StringLiteral.
     * @param {string} location - 词法单元的位置。The location of the token.
     * @param {number} length - 词法单元的长度。The length of the token.
     */
    constructor(
        kind: TokenType = TokenType.EndOfFile,
        next?: Token,
        numericValue?: number,
        stringValue?: string,
        stringType?: TypeDefinition,
        location?: string,
        length?: number,
    ) {
        this.kind = kind;
        this.next = next;
        this.numericValue = numericValue;
        this.stringValue = stringValue;
        this.stringType = stringType;
        this.location = location;
        this.length = length;
    }
}

export default Token;
