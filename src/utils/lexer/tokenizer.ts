import TokenType from '../enums/tokentype-enum';
import Token from './token';
import { logMessage } from '../logger';
import { addArray, charTypeDefinition } from '../commons';
import TokenManager from './tokenmanager';
import {
    isValidFirstCharOfIdentifier,
    isValidNonFirstCharOfIdentifier,
    isKeyword,
    readPunctuation,
} from './tokenutils';

/**
 * Tokenizer 负责将输入字符串转换为 Token 数组。
 * Tokenizer tokenizes the input string into an array of tokens.
 */
class Tokenizer {
    private readonly input: string;
    private tokenManager: TokenManager;

    /**
     * 设置令牌管理器。Set the token manager.
     * @param {TokenManager} tokenManager - 令牌管理器。The token manager.
     */
    public set manager(tokenManager: TokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     * 获取令牌管理器。Get the token manager.
     * @returns {TokenManager} 令牌管理器。The token manager.
     */
    public get manager(): TokenManager {
        return this.tokenManager;
    }

    /**
     * 类构造函数。
     * Class constructor.
     * @param {string} input - 输入字符串。The input string.
     * @param {TokenManager} tokenManager - 令牌管理器。The token manager.
     */
    constructor(input: string, tokenManager: TokenManager) {
        this.input = input;
        this.tokenManager = tokenManager;
    }

    /**
     * 判断一个字符串是否以另一个字符串开头。Evaluate if a string starts with another string.
     * @param {string} p - 需要判断的字符串。The string to be evaluated.
     * @param {string} q - 需要判断的前缀。The prefix to be evaluated.
     * @returns {boolean} 如果 p 以 q 开头，返回 true，否则返回 false。If p starts with q, return true, otherwise return false.
     */
    private static startsWith(p: string, q: string): boolean {
        return p.startsWith(q);
    }

    /**
     * 将关键字转换为关键字类型。Convert keywords to keyword types.
     * @param {Token[]} tokens - 需要转换的 token 列表。The list of tokens to convert.
     * @returns {void}
     */
    private static convertKeywords(tokens: Token[]): void {
        for (const t of tokens) {
            if (isKeyword(t)) {
                t.kind = TokenType.Keyword;
            }
        }
    }

    public tokenize(): Token[] {
        let p = this.input;
        const tokens: Token[] = [];

        while (p.length > 0) {
            // Skip line comments.
            while (p.startsWith('//')) {
                p = p.slice(p.indexOf('\n') + 1);
            }

            // Skip block comments.
            while (p.startsWith('/*')) {
                const end = p.indexOf('*/', 2);
                if (end === -1) {
                    logMessage('error', 'Unclosed block comment', { position: Tokenizer });
                    throw new Error('Unclosed block comment');
                }
                p = p.slice(end + 2);
            }

            if (p.charAt(0).trim() === '') {
                p = p.slice(1);
            } else if (/\d/.test(p.charAt(0))) {
                const numericValue = Number.parseInt(p, 10);
                const current = new Token(
                    TokenType.NumericLiteral,
                    undefined,
                    numericValue,
                    undefined,
                    undefined,
                    p,
                    numericValue.toString().length,
                );
                tokens.push(current);
                p = p.slice(current.length);
            } else if (isValidFirstCharOfIdentifier(p.charAt(0))) {
                const start = p;
                do {
                    p = p.slice(1);
                } while (p.length > 0 && isValidNonFirstCharOfIdentifier(p.charAt(0)));
                const current = new Token(
                    TokenType.Identifier,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    start,
                    start.length - p.length,
                );
                tokens.push(current);
            } else if (Tokenizer.startsWith(p, '"')) {
                const nowString = p.slice(1);
                const endIndex = nowString.indexOf('"');
                if (endIndex === -1) {
                    logMessage('error', 'Unclosed string literal', { position: Tokenizer });
                    throw new Error('Unclosed string literal');
                }

                const value = `${nowString
                    .slice(0, endIndex)
                    .replaceAll(/\\(x[\dA-Fa-f]+|[0-7]{1,3}|.)/g, (_: string, symbol: string): string => {
                        if (symbol.startsWith('x')) {
                            return String.fromCodePoint(Number.parseInt(symbol.slice(1), 16));
                        }
                        if (/^[0-7]{1,3}$/.test(symbol)) {
                            return String.fromCodePoint(Number.parseInt(symbol, 8));
                        }
                        switch (symbol) {
                            case 'a': {
                                return '\u0007';
                            }
                            case 'n': {
                                return '\n';
                            }
                            case 't': {
                                return '\t';
                            }
                            case 'r': {
                                return '\r';
                            }
                            case 'b': {
                                return '\b';
                            }
                            case 'f': {
                                return '\f';
                            }
                            case 'v': {
                                return '\v';
                            }
                            case '\\': {
                                return '\\';
                            }
                            case '"': {
                                return '"';
                            }
                            case "'": {
                                return "'";
                            }
                            default: {
                                return symbol;
                            }
                        }
                    })}\0`;
                const current = new Token(
                    TokenType.StringLiteral,
                    undefined,
                    undefined,
                    value,
                    addArray(charTypeDefinition, value.length),
                    p,
                    endIndex + 2,
                );
                tokens.push(current);
                p = p.slice(current.length);
            } else if (readPunctuation(p) > 0) {
                const punctLength = readPunctuation(p);
                const current = new Token(
                    TokenType.Punctuator,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    p,
                    punctLength,
                );
                tokens.push(current);
                p = p.slice(current.length);
            } else {
                logMessage('error', `Invalid token at ${p}`, { position: Tokenizer });
                throw new Error(`Invalid token at ${p}`);
            }
        }

        const eofToken = new Token(TokenType.EndOfFile, undefined, undefined, undefined, undefined, p, 0);
        tokens.push(eofToken);

        Tokenizer.convertKeywords(tokens);

        for (let index = 0; index < tokens.length - 1; index += 1) {
            tokens[index].next = tokens[index + 1];
        }
        return tokens;
    }
}

export default Tokenizer;
