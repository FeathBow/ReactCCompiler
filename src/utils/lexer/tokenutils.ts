import TokenType from '../enums/tokentype-enum';
import Token from '../classes/token-class';
import { logMessage } from '../logger';
import { Keywords, VariableTypeDefinition } from '../enums';
import TokenManager from '../classes/tokenmanager-class';

/**
 * 判断给定的 token 是否是一个关键字。Evaluate if the given token is a keyword.
 * @param {Token} token - 需要判断的 token。Determine if the given token is a keyword.
 * @returns {boolean} 如果 token 是一个关键字，返回 true，否则返回 false。If the token is a keyword, return true, otherwise return false.
 */
export function isKeyword(token: Token): boolean {
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
 * 判断一个字符是否是一个有效的标识符的第一个字符。Evaluate if a character is a valid first character of an identifier.
 * @param {string} c - 需要判断的字符。The character to be evaluated.
 * @returns {boolean} 如果 c 是一个有效的标识符的第一个字符，返回 true，否则返回 false。If c is a valid first character of an identifier, return true, otherwise return false.
 */
export function isValidFirstCharOfIdentifier(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

/**
 * 判断一个字符是否是一个有效的标识符的非第一个字符。Evaluate if a character is a valid non-first character of an identifier.
 * @param {string} c - 需要判断的字符。The character to be evaluated.
 * @returns {boolean} 如果 c 是一个有效的标识符的非第一个字符，返回 true，否则返回 false。If c is a valid non-first character of an identifier, return true, otherwise return false.
 */
export function isValidNonFirstCharOfIdentifier(c: string): boolean {
    return isValidFirstCharOfIdentifier(c) || (c >= '0' && c <= '9');
}

/**
 * 判断一个字符是否是标点符号。Evaluate if a character is a punctuation.
 * @param {string} c - 需要判断的字符。The character to be evaluated.
 * @returns {boolean} 如果 c 是标点符号，返回 true，否则返回 false。If c is a punctuation, return true, otherwise return false.
 */
export function isPunctuation(c: string): boolean {
    const punctuations = '!"#$%&\'()*+,-./:;<=>?@[]^_`{|}~';
    return punctuations.includes(c);
}

/**
 * 消费 token，如果 token 的值与给定字符串匹配，则更新 TokenManager 中的当前 token。
 * Consume a token, and update the current token in TokenManager if it matches the given string.
 * @param {Token} token - 需要判断的 token。The token to be evaluated.
 * @param {string} tokenName - 需要判断的字符串。The string to be evaluated.
 * @returns {boolean} 如果 token 的值与给定字符串匹配，返回 true，否则返回 false。If the token matches the given string, return true, otherwise return false.
 */
export function consumeToken(token: Token, tokenName: string, tokenManager: TokenManager): boolean {
    if (isEqual(token, tokenName)) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: consumeToken });
            throw new Error('Unexpected end of input');
        }
        tokenManager.nowToken = token.next;
        return true;
    }
    tokenManager.nowToken = token;
    return false;
}

/**
 * 读取标点符号的长度。Read the length of the punctuation.
 * @param {string} p - 需要读取的字符串。The string to be read.
 * @returns {number} 返回标点符号的长度。Return the length of the punctuation.
 */
export function readPunctuation(p: string): number {
    const punctuations = ['==', '!=', '<=', '>=', '->'];
    for (const punctuation of punctuations) {
        if (p.startsWith(punctuation)) {
            return punctuation.length;
        }
    }
    return isPunctuation(p.charAt(0)) ? 1 : 0;
}

/**
 * 跳过指定操作符的 token，如果不匹配则抛出异常。
 * Skip a token with a given operator, and throw an exception if it does not match.
 * @param {Token} token - 需要判断的 token。The token to be evaluated.
 * @param {string} operator - 需要判断的操作符。The operator to be evaluated.
 * @returns {Token} 跳过后的 token。The token after skipping.
 */
export function skipToken(token: Token, operator: string): Token {
    if (!isEqual(token, operator)) {
        const location = token.location === undefined ? 'undefined' : token.location.slice(0, token.length);
        logMessage('error', `Unexpected token: ${location}. Expected: ${operator}`, {
            token: location,
            operator,
            position: skipToken,
        });
        throw new Error(`Unexpected token: ${location}. Expected: ${operator}`);
    }
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: skipToken });
        throw new Error('Unexpected end of input');
    }
    return token.next;
}
