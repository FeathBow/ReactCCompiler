import { FunctionNode, type Token, type LocalVariable, type ASTNode, ASTNodeKind, TokenType } from './commons';
import { logMessage } from './logger';
import { skipToken, isEqual } from './token';

let locals: LocalVariable | undefined;

let nowToken: Token;

function findVariable(token: Token): LocalVariable | undefined {
    let variableNode = locals;

    while (variableNode !== undefined) {
        if (
            variableNode.varName !== undefined &&
            token.location !== undefined &&
            variableNode.varName.length === token.length &&
            variableNode.varName === token.location.slice(0, Math.max(0, token.length))
        ) {
            return variableNode;
        }
        variableNode = variableNode.nextVar;
    }
    return undefined;
}

function newNode(kind: ASTNodeKind): ASTNode {
    return {
        nodeKind: kind,
    };
}

function newBinary(kind: ASTNodeKind, lhs: ASTNode, rhs: ASTNode): ASTNode {
    return {
        nodeKind: kind,
        leftNode: lhs,
        rightNode: rhs,
    };
}

function newUnary(kind: ASTNodeKind, expr: ASTNode): ASTNode {
    return {
        nodeKind: kind,
        leftNode: expr,
    };
}

function newNumber(value: number): ASTNode {
    return {
        nodeKind: ASTNodeKind.Number,
        numberValue: value,
    };
}

function newVariableNode(variableNode: LocalVariable): ASTNode {
    return {
        nodeKind: ASTNodeKind.Variable,
        localVar: variableNode,
    };
}

function newLocalVariable(name: string): LocalVariable {
    const localVariable: LocalVariable = {
        varName: name,
        nextVar: locals,
        offsetFromRBP: 0,
    };
    locals = localVariable;
    return localVariable;
}

// statement ::= expressionStatement | returnStatement(return expression ';')
// | blockStatement | ifStatement(if '(' expression ')' statement (else statement)?)
// function statement(rest: Token[], token: Token): ASTNode {
function statement(token: Token): ASTNode {
    if (token.location !== undefined && token.location !== '') {
        if (token.location.slice(0, 6) === 'return') {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement });
                throw new Error('Unexpected end of input');
            }
            // const node = newUnary(ASTNodeKind.Return, expression(rest, token.next));
            const node = newUnary(ASTNodeKind.Return, expression(token.next));
            token = nowToken;
            const nextToken = skipToken(token, ';');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement });
                throw new Error('Unexpected end of input');
            }
            nowToken = nextToken;
            // rest[0] = nextToken;
            return node;
        } else if (token.location.slice(0, 1) === '{') {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement });
                throw new Error('Unexpected end of input');
            }
            // const node =
            // nowToken = token.next;
            return blockStatement(token.next);
        } else if (token.location.slice(0, 2) === 'if') {
            const node = newNode(ASTNodeKind.If);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement });
                throw new Error('Unexpected end of input');
            }
            const trueToken = skipToken(token.next, ';');
            if (trueToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement });
                throw new Error('Unexpected end of input');
            }
            node.condition = expression(trueToken);
            token = nowToken;

            const elseToken = skipToken(token, ')');
            if (elseToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement });
                throw new Error('Unexpected end of input');
            }
            node.trueBody = statement(elseToken);
            token = nowToken;

            if (isEqual(token, 'else')) {
                if (token.next === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: statement });
                    throw new Error('Unexpected end of input');
                }

                node.elseBody = statement(token.next);
                token = nowToken;
            }
            nowToken = token;
            return node;
        }
    }

    // return expressionStatement(rest, token);
    return expressionStatement(token);
}

function blockStatement(token: Token): ASTNode {
    const head: ASTNode = { nodeKind: ASTNodeKind.Return };
    let current: ASTNode = head;
    // nowToken = token;
    while (!isEqual(token, '}')) {
        current = current.nextNode = statement(token);
        token = nowToken;
    }
    const node = newNode(ASTNodeKind.Block);
    node.blockBody = head.nextNode;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: blockStatement });
        throw new Error('Unexpected end of input');
    }
    nowToken = token.next;
    return node;
}

// expressionStatement ::= expression? ';'
// function expressionStatement(rest: Token[], token: Token): ASTNode {
function expressionStatement(token: Token): ASTNode {
    // const node = newUnary(ASTNodeKind.ExpressionStatement, expression(rest, token));4
    let node: ASTNode;
    if (isEqual(token, ';')) {
        node = newNode(ASTNodeKind.Block);
    } else {
        node = newUnary(ASTNodeKind.ExpressionStatement, expression(token));
        token = nowToken;
    }
    const nextToken = skipToken(token, ';');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: expressionStatement });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    // rest[0] = nextToken;
    return node;
}

// expression ::= assign
// function expression(rest: Token[], token: Token): ASTNode {
function expression(token: Token): ASTNode {
    // return assign(rest, token);
    return assign(token);
}

// assign ::= equality ('=' assign)?
// function assign(rest: Token[], token: Token): ASTNode {
function assign(token: Token): ASTNode {
    // let node = equality(rest, token);
    let node = equality(token);
    token = nowToken;

    if (isEqual(token, '=')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: assign });
            throw new Error('Unexpected end of input');
        }
        // node = newBinary(ASTNodeKind.Assignment, node, assign(rest, token.next));
        node = newBinary(ASTNodeKind.Assignment, node, assign(token.next));
        token = nowToken;
    }
    if (token === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: assign });
        throw new Error('Unexpected end of input');
    }
    // rest[0] = token;
    nowToken = token;
    return node;
}

// equality ::= relational ( '==' relational | '!=' relational )*
// function equality(rest: Token[], token: Token): ASTNode {
function equality(token: Token): ASTNode {
    // let node = relational(rest, token);
    let node = relational(token);
    token = nowToken;
    while (true) {
        if (isEqual(token, '==')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: equality });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.Equality, node, relational(rest, token.next));
            node = newBinary(ASTNodeKind.Equality, node, relational(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '!=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: equality });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.Negation, node, relational(rest, token.next));
            node = newBinary(ASTNodeKind.Negation, node, relational(token.next));
            token = nowToken;
            continue;
        }
        nowToken = token;
        // rest[0] = token;
        return node;
    }
}

// relational ::= add ( '<' add | '<=' add | '>' add | '>=' add )*
// function relational(rest: Token[], token: Token): ASTNode {
function relational(token: Token): ASTNode {
    // let node = add(rest, token);
    let node = add(token);
    token = nowToken;

    while (true) {
        if (isEqual(token, '<')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.LessThan, node, add(rest, token.next));
            node = newBinary(ASTNodeKind.LessThan, node, add(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '<=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.LessThanOrEqual, node, add(rest, token.next));
            node = newBinary(ASTNodeKind.LessThanOrEqual, node, add(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '>')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.LessThan, add(rest, token.next), node);
            node = newBinary(ASTNodeKind.LessThan, add(token.next), node);
            token = nowToken;
            continue;
        }

        if (isEqual(token, '>=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.LessThanOrEqual, add(rest, token.next), node);
            node = newBinary(ASTNodeKind.LessThanOrEqual, add(token.next), node);
            token = nowToken;
            continue;
        }
        nowToken = token;
        // rest[0] = token;
        return node;
    }
}

// add ::= mul ( '+' mul | '-' mul )*
// function add(rest: Token[], token: Token): ASTNode {
function add(token: Token): ASTNode {
    // let node = mul(rest, token);
    let node = mul(token);
    token = nowToken;
    while (true) {
        if (isEqual(token, '+')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: add });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.Addition, node, mul(rest, token.next));
            node = newBinary(ASTNodeKind.Addition, node, mul(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '-')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: add });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.Subtraction, node, mul(rest, token.next));
            node = newBinary(ASTNodeKind.Subtraction, node, mul(token.next));
            token = nowToken;
            continue;
        }
        nowToken = token;
        // rest[0] = token;
        return node;
    }
}

// mul ::= unary ( '*' unary | '/' unary )*
// function mul(rest: Token[], token: Token): ASTNode {
function mul(token: Token): ASTNode {
    // let node = unary(rest, token);
    let node = unary(token);
    token = nowToken;
    while (true) {
        if (isEqual(token, '*')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: mul });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.Multiplication, node, unary(rest, token.next));
            node = newBinary(ASTNodeKind.Multiplication, node, unary(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '/')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: mul });
                throw new Error('Unexpected end of input');
            }
            // node = newBinary(ASTNodeKind.Division, node, unary(rest, token.next));
            node = newBinary(ASTNodeKind.Division, node, unary(token.next));
            token = nowToken;
            continue;
        }
        nowToken = token;
        // rest[0] = token;
        return node;
    }
}

// unary ::= ('+' | '-') unary | primary
// function unary(rest: Token[], token: Token): ASTNode {
function unary(token: Token): ASTNode {
    if (isEqual(token, '+')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: unary });
            throw new Error('Unexpected end of input');
        }
        // return unary(rest, token.next);
        return unary(token.next);
    }

    if (isEqual(token, '-')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: unary });
            throw new Error('Unexpected end of input');
        }
        // return newUnary(ASTNodeKind.Negation, unary(rest, token.next));
        return newUnary(ASTNodeKind.Negation, unary(token.next));
    }

    // return primary(rest, token);
    return primary(token);
}

// primary ::= '(' expression ')' | Identifier | NumericLiteral
// function primary(rest: Token[], token: Token): ASTNode {
function primary(token: Token): ASTNode {
    if (isEqual(token, '(')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        // const node = expression(rest, token.next);
        const node = expression(token.next);
        token = nowToken;
        const nextToken = skipToken(token, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        nowToken = nextToken;
        // rest[0] = nextToken;
        return node;
    }

    if (token.kind === TokenType.Identifier) {
        let variableNode = findVariable(token);
        if (variableNode === undefined && token.location !== undefined && token.length !== undefined) {
            const tokenText = token.location.slice(0, Math.max(0, token.length));
            variableNode = newLocalVariable(tokenText);
        }
        // if (token.next === undefined) {
        //     throw new Error('Unexpected end of input');
        // }
        if (token.next !== undefined) {
            // rest[0] = token.next;
            nowToken = token.next;
        }
        if (variableNode === undefined) {
            logMessage('error', 'Variable not found', { token, position: primary });
            throw new Error('Variable not found');
        }
        return newVariableNode(variableNode);
    }

    if (token.kind === TokenType.NumericLiteral) {
        if (token.value === undefined) {
            logMessage('error', 'Invalid number', { token, position: primary });
            throw new Error('Invalid number');
        }
        const node = newNumber(token.value);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        // rest[0] = token.next;
        nowToken = token.next;
        return node;
    }
    logMessage('error', 'Expected an expression', { token, position: primary });
    throw new Error('Expected an expression');
}

// program ::= statement*
export function parse(tokens: Token[]): FunctionNode {
    locals = undefined;
    const nextToken = skipToken(tokens[0], '{');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token: tokens[0], position: parse });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    // while (nowToken.kind !== TokenType.EndOfFile) {
    //     current = current.nextNode = statement(nowToken);
    // }

    const program = new FunctionNode();
    // program.body = head.nextNode;
    program.body = blockStatement(nowToken);
    program.locals = locals;
    return program;
}
