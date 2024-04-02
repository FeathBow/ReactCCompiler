import { TokenType } from '../commons';

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
    value?: number;
    /** 词法单元的位置。The location of the token. */
    location?: string;
    /** 词法单元的长度。The length of the token. */
    length?: number;
}

export default Token;
