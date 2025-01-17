import { Keywords, VariableTypeDefinition, TokenType, charTypeDefinition, addArray } from './commons';
import Token from './classes/token-class';
import { logMessage } from './logger';

/**
 * 判断给定的 token 是否是一个关键字。Evaluate if the given token is a keyword.
 * @param {Token} token - 需要判断的 token。Determine if the given token is a keyword.
 * @returns {boolean} 如果 token 是一个关键字，返回 true，否则返回 false。If the token is a keyword, return true, otherwise return false.
 */
function isKeyword(token: Token): boolean {
    const keywords: string[] = Object.values(Keywords);
    if (token.kind === TokenType.EndOfFile) return false;
    if (token.location === undefined || token.length === undefined) {
        logMessage('error', 'Token location or length is undefined', { token, position: isKeyword });
        return false;
    }
    return keywords.includes(token.location.slice(0, token.length));
}

/**
 * 判断给定的 token 是否是一个变量类型定义。Evaluate if the given token is a variable type definition.
 * @param {Token} token - 需要判断的 token。Determine if the given token is a variable type definition.
 * @returns {boolean} 如果 token 是一个变量类型定义，返回 true，否则返回 false。If the token is a variable type definition, return true, otherwise return false.
 */
export function isVariableTypeDefinition(token: Token): boolean {
    const variableTypeDefinition: string[] = Object.values(VariableTypeDefinition);
    if (token.location === undefined || token.length === undefined) {
        logMessage('error', 'Token location or length is undefined', { token, position: isVariableTypeDefinition });
        return false;
    }
    return variableTypeDefinition.includes(token.location.slice(0, token.length));
}

/**
 * 判断给定的 token 是否等于指定的操作符。Evaluate if the given token is equal to the specified operator.
 * @param {Token} token - 需要判断的 token。Determine if the given token is equal to the operator.
 * @param {string} operator - 指定的操作符。The specified operator.
 * @returns {boolean} 如果 token 等于操作符，返回 true，否则返回 false。If the token is equal to the operator, return true, otherwise return false.
 */
export function isEqual(token: Token, operator: string): boolean {
    return token.location !== undefined && token.length !== undefined
        ? token.location.slice(0, token.length) === operator && operator.length === token.length
        : false;
}

/**
 * 跳过指定的操作符。如果 token 不等于操作符，抛出错误。Skip the specified operator. If the token is not equal to the operator, an error is thrown.
 * @param {Token} token - 需要跳过的 token。The token to skip.
 * @param {string} operator - 指定的操作符。The specified operator.
 * @returns {Token | undefined} 如果 token 等于操作符，返回 token 的下一个 token，否则返回 undefined。If the token is equal to the operator, return the next token of the token, otherwise return undefined.
 */
export function skipToken(token: Token, operator: string): Token | undefined {
    if (!isEqual(token, operator)) {
        const location = token.location === undefined ? 'undefined' : token.location.slice(0, token.length);
        logMessage('info', `Unexpected token: ${location}. Expected: ${operator}`, {
            token: location,
            operator,
            position: skipToken,
        });
    }
    return token.next;
}

/**
 * 判断一个字符串是否以另一个字符串开头。Evaluate if a string starts with another string.
 * @param {string} p - 需要判断的字符串。The string to be evaluated.
 * @param {string} q - 需要判断的前缀。The prefix to be evaluated.
 * @returns {boolean} 如果 p 以 q 开头，返回 true，否则返回 false。If p starts with q, return true, otherwise return false.
 */
function startsWith(p: string, q: string): boolean {
    return p.startsWith(q);
}

/**
 * 判断一个字符是否是一个有效的标识符的第一个字符。Evaluate if a character is a valid first character of an identifier.
 * @param {string} c - 需要判断的字符。The character to be evaluated.
 * @returns {boolean} 如果 c 是一个有效的标识符的第一个字符，返回 true，否则返回 false。If c is a valid first character of an identifier, return true, otherwise return false.
 */
function isValidFirstCharOfIdentifier(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

/**
 * 判断一个字符是否是一个有效的标识符的非第一个字符。Evaluate if a character is a valid non-first character of an identifier.
 * @param {string} c - 需要判断的字符。The character to be evaluated.
 * @returns {boolean} 如果 c 是一个有效的标识符的非第一个字符，返回 true，否则返回 false。If c is a valid non-first character of an identifier, return true, otherwise return false.
 */
function isValidNonFirstCharOfIdentifier(c: string): boolean {
    return isValidFirstCharOfIdentifier(c) || (c >= '0' && c <= '9');
}

/**
 * 读取标点符号的长度。Read the length of the punctuation.
 * @param {string} p - 需要读取的字符串。The string to be read.
 * @returns {number} 返回标点符号的长度。Return the length of the punctuation.
 */
function readPunctuation(p: string): number {
    if (startsWith(p, '==') || startsWith(p, '!=') || startsWith(p, '<=') || startsWith(p, '>=')) {
        return 2;
    }

    return isPunctuation(p.charAt(0)) ? 1 : 0;
}

/**
 * 判断一个字符是否是标点符号。Evaluate if a character is a punctuation.
 * @param {string} c - 需要判断的字符。The character to be evaluated.
 * @returns {boolean} 如果 c 是标点符号，返回 true，否则返回 false。If c is a punctuation, return true, otherwise return false.
 */
function isPunctuation(c: string): boolean {
    const punctuations = '!"#$%&\'()*+,-./:;<=>?@[]^_`{|}~';
    return punctuations.includes(c);
}

/**
 * 将关键字转换为关键字类型。Convert keywords to keyword types.
 * @param {Token[]} tokens - 需要转换的 token 列表。The list of tokens to convert.
 * @returns {void}
 */
function convertKeywords(tokens: Token[]): void {
    for (const t of tokens) {
        if (isKeyword(t)) {
            t.kind = TokenType.Keyword;
        }
    }
}

/**
 * 对给定的字符串进行词法分析，返回新的词法单元。Perform lexical analysis on the given string and return new tokens.
 * @param {string} p - 需要进行词法分析的字符串。The string to perform lexical analysis.
 * @returns {Token[]} 返回词法分析后的 token 列表。Return the list of tokens after lexical analysis.
 */
export function tokenize(p: string): Token[] {
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
                logMessage('error', 'Unclosed block comment', { position: tokenize });
                throw new Error('Unclosed block comment');
            }
            p = p.slice(end + 2);
        }

        if (p.charAt(0).trim() === '') {
            p = p.slice(1);
        } else if (/\d/.test(p.charAt(0))) {
            const current = new Token();
            current.kind = TokenType.NumericLiteral;
            current.location = p;
            current.numericValue = Number.parseInt(p, 10);
            current.length = current.numericValue.toString().length;
            tokens.push(current);
            p = p.slice(current.length);
        } else if (isValidFirstCharOfIdentifier(p.charAt(0))) {
            const start = p;
            do {
                p = p.slice(1);
            } while (p.length > 0 && isValidNonFirstCharOfIdentifier(p.charAt(0)));
            const current = new Token();
            current.kind = TokenType.Identifier;
            current.location = start;
            current.length = start.length - p.length;
            tokens.push(current);
        } else if (p.startsWith('"')) {
            let str = p.slice(1);
            let endIndex = str.indexOf('"');
            if (endIndex === -1) {
                logMessage('error', 'Unclosed string literal', { position: tokenize });
                throw new Error('Unclosed string literal');
            }

            const value =
                str.slice(0, endIndex).replace(/\\(.)/g, (_, e) => {
                    switch (e) {
                        case 'n':
                            return '\n';
                        case 't':
                            return '\t';
                        case 'r':
                            return '\r';
                        case 'b':
                            return '\b';
                        case 'f':
                            return '\f';
                        case 'v':
                            return '\v';
                        case '0':
                            return '\0';
                        case '\\':
                            return '\\';
                        case '"':
                            return '"';
                        case "'":
                            return "'";
                        default:
                            return e;
                    }
                }) + '\0';
            const len = value.length;
            const current = new Token();
            current.kind = TokenType.StringLiteral;
            current.location = p;
            current.length = endIndex + 2;
            current.stringValue = value;
            current.stringType = addArray(charTypeDefinition, len);
            tokens.push(current);
            p = p.slice(current.length);
        } else if (readPunctuation(p) > 0) {
            const punctLength = readPunctuation(p);
            const current = new Token();
            current.kind = TokenType.Punctuator;
            current.location = p;
            current.length = punctLength;
            tokens.push(current);
            p = p.slice(current.length);
        } else {
            logMessage('error', `Invalid token at ${p}`, { position: tokenize });
            throw new Error(`Invalid token at ${p}`);
        }
    }

    const eofToken = new Token();
    eofToken.kind = TokenType.EndOfFile;
    eofToken.location = p;
    tokens.push(eofToken);

    convertKeywords(tokens);

    for (let index = 0; index < tokens.length - 1; index += 1) {
        tokens[index].next = tokens[index + 1];
    }
    return tokens;
}
