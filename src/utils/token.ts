import { TokenType, Token, Keywords } from './commons';
import { logMessage } from './logger';

// judge whether the token is a keyword
function isKeyword(token: Token): boolean {
    const keywords: string[] = Object.values(Keywords);
    if (token.location === undefined || token.length === undefined) {
        logMessage('error', 'Token location or length is undefined', { token, position: isKeyword });
        return false;
    }
    return keywords.includes(token.location.slice(0, token.length));
}

// judge whether the token is equal to the operator
export function isEqual(token: Token, operator: string): boolean {
    if (token.location !== undefined && token.location !== null && token.length !== undefined) {
        return token.location.slice(0, token.length) === operator && operator.length === token.length;
    } else {
        logMessage('error', 'Token location or length is undefined', { token, operator, position: isEqual });
        return false;
    }
}

// skip the token
export function skipToken(token: Token, operator: string): Token | undefined {
    if (!isEqual(token, operator)) {
        const location = token.location === undefined ? 'undefined' : token.location.slice(0, token.length);
        logMessage('error', `Unexpected token: ${location}. Expected: ${operator}`, {
            token: location,
            operator,
            position: skipToken,
        });
    }
    return token.next;
}

// judge whether the string starts with another string
function startsWith(p: string, q: string): boolean {
    return p.startsWith(q);
}

// judge whether the character is a valid first character of an identifier
function isValidFirstCharOfIdentifier(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

// judge whether the character is a valid non-first character of an identifier
function isValidNonFirstCharOfIdentifier(c: string): boolean {
    return isValidFirstCharOfIdentifier(c) || (c >= '0' && c <= '9');
}

// read punctuation
function readPunctuation(p: string): number {
    if (startsWith(p, '==') || startsWith(p, '!=') || startsWith(p, '<=') || startsWith(p, '>=')) {
        return 2;
    }

    return isPunctuation(p.charAt(0)) ? 1 : 0;
}

// judge whether the character is a punctuation
function isPunctuation(c: string): boolean {
    const punctuations = '!"#$%&\'()*+,-./:;<=>?@[]^_`{|}~';
    return punctuations.includes(c);
}

// 将标识符转换为关键字

function convertKeywords(tokens: Token[]): void {
    for (const t of tokens) {
        if (isKeyword(t)) {
            t.kind = TokenType.Keyword;
        }
    }
}
// 对给定的字符串进行词法分析，并返回新的词法单元
export function tokenize(p: string): Token[] {
    const tokens: Token[] = [];

    while (p.length > 0) {
        // Skip whitespace characters.
        if (p.charAt(0).trim() === '') {
            p = p.slice(1);
            continue;
        }

        // Numeric literal
        if (/\d/.test(p.charAt(0))) {
            const current = new Token();
            current.kind = TokenType.NumericLiteral;
            current.location = p;
            current.value = Number.parseInt(p, 10);
            current.length = current.value.toString().length;
            tokens.push(current);
            p = p.slice(current.length);
            continue;
        }

        // Identifier or keyword
        if (isValidFirstCharOfIdentifier(p.charAt(0))) {
            const start = p;
            do {
                p = p.slice(1);
            } while (p.length > 0 && isValidNonFirstCharOfIdentifier(p.charAt(0)));
            const current = new Token();
            current.kind = TokenType.Identifier;
            current.location = start;
            current.length = start.length - p.length;
            tokens.push(current);
            continue;
        }

        // Punctuators
        const punctLength = readPunctuation(p);
        if (punctLength > 0) {
            const current = new Token();
            current.kind = TokenType.Punctuator;
            current.location = p;
            current.length = punctLength;
            tokens.push(current);
            p = p.slice(current.length);
            continue;
        }
        logMessage('error', `Invalid token at ${p}`, { position: tokenize });
        throw new Error(`Invalid token at ${p}`);
    }

    const eofToken = new Token();
    eofToken.kind = TokenType.EndOfFile;
    eofToken.location = p;
    tokens.push(eofToken);

    convertKeywords(tokens);

    for (let index = 0; index < tokens.length - 1; index++) {
        tokens[index].next = tokens[index + 1];
    }
    return tokens;
}
