import { FunctionNode, type Token, type LocalVariable, type ASTNode, ASTNodeKind, TokenType } from './commons';
import { logMessage } from './logger';
import { skipToken, isEqual } from './token';

let locals: LocalVariable | undefined;

let nowToken: Token;

/**
 * 在当前的局部变量列表中查找一个变量。
 * @param token 代表变量的令牌。
 * @returns 如果找到了变量，则返回该变量的节点，否则返回undefined。
 *
 * Find a variable in the current list of local variables.
 * @param token The token representing the variable.
 * @returns The node of the variable if found, otherwise undefined.
 */
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

/**
 * 创建一个新的抽象语法树节点。
 * @param kind 节点的类型。
 * @returns 新创建的抽象语法树节点。
 *
 * Create a new abstract syntax tree node.
 * @param kind The kind of the node.
 * @returns The newly created abstract syntax tree node.
 */
function newNode(kind: ASTNodeKind): ASTNode {
    return {
        nodeKind: kind,
    };
}

/**
 * 创建一个新的二元操作符节点。
 * @param kind 节点的类型。
 * @param lhs 左操作数。
 * @param rhs 右操作数。
 * @returns 新创建的抽象语法树节点。
 *
 * Create a new binary operator node.
 * @param kind The kind of the node.
 * @param lhs The left operand.
 * @param rhs The right operand.
 * @returns The newly created abstract syntax tree node.
 */
function newBinary(kind: ASTNodeKind, lhs: ASTNode, rhs: ASTNode): ASTNode {
    return {
        nodeKind: kind,
        leftNode: lhs,
        rightNode: rhs,
    };
}

/**
 * 创建一个新的一元操作符节点。
 * @param kind 节点的类型。
 * @param expr 操作数。
 * @returns 新创建的抽象语法树节点。
 *
 * Create a new unary operator node.
 * @param kind The kind of the node.
 * @param expr The operand.
 * @returns The newly created abstract syntax tree node.
 */
function newUnary(kind: ASTNodeKind, expr: ASTNode): ASTNode {
    return {
        nodeKind: kind,
        leftNode: expr,
    };
}

/**
 * 创建一个新的数字节点。
 * @param value 数字的值。
 * @returns 新创建的抽象语法树节点。
 *
 * Create a new number node.
 * @param value The value of the number.
 * @returns The newly created abstract syntax tree node.
 */
function newNumber(value: number): ASTNode {
    return {
        nodeKind: ASTNodeKind.Number,
        numberValue: value,
    };
}

/**
 * 创建一个新的变量节点。
 * @param variableNode 代表变量的节点。
 * @returns 新创建的抽象语法树节点。
 *
 * Create a new variable node.
 * @param variableNode The node representing the variable.
 * @returns The newly created abstract syntax tree node.
 */
function newVariableNode(variableNode: LocalVariable): ASTNode {
    return {
        nodeKind: ASTNodeKind.Variable,
        localVar: variableNode,
    };
}

/**
 * 创建一个新的局部变量。
 * @param name 变量名。
 * @returns 新创建的局部变量。
 *
 * Create a new local variable.
 * @param name The name of the variable.
 * @returns The newly created local variable.
 */
function newLocalVariable(name: string): LocalVariable {
    const localVariable: LocalVariable = {
        varName: name,
        nextVar: locals,
        offsetFromRBP: 0,
    };
    locals = localVariable;
    return localVariable;
}

/**
 * 解析一个语句。语句可以是多种类型之一：
 * - 表达式语句
 * - 返回语句('return' 表达式 ';')
 * - 块语句
 * - if语句('if' '(' 表达式 ')' 语句 ('else' 语句)?)
 * - for语句('for' '(' 表达式? ';' 表达式? ';' 表达式? ')' 语句)
 * - while语句('while' '(' 表达式 ')' 语句)
 *
 * @param token 代表语句的令牌。
 * @returns 代表语句的抽象语法树节点。
 *
 * Parse a statement.
 * - Expression statement
 * - Return statement ('return' expression ';')
 * - Block statement
 * - If statement ('if' '(' expression ')' statement ('else' statement)?)
 * - For statement ('for' '(' expression? ';' expression? ';' expression? ')' statement)
 * - While statement ('while' '(' expression ')' statement)
 *
 * @param token The token representing the statement.
 * @returns The abstract syntax tree node representing the statement.
 */
function statement(token: Token): ASTNode {
    if (token.location !== undefined && token.location !== '') {
        if (token.location.slice(0, 6) === 'return') {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'return' });
                throw new Error('Unexpected end of input');
            }
            const node = newUnary(ASTNodeKind.Return, expression(token.next));
            token = nowToken;
            const nextToken = skipToken(token, ';');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'return' });
                throw new Error('Unexpected end of input');
            }
            nowToken = nextToken;
            return node;
        } else if (token.location.slice(0, 1) === '{') {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'block' });
                throw new Error('Unexpected end of input');
            }
            return blockStatement(token.next);
        } else if (token.location.slice(0, 2) === 'if') {
            const node = newNode(ASTNodeKind.If);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
                throw new Error('Unexpected end of input');
            }
            const trueToken = skipToken(token.next, ';');
            if (trueToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
                throw new Error('Unexpected end of input');
            }
            node.condition = expression(trueToken);
            token = nowToken;

            const elseToken = skipToken(token, ')');
            if (elseToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
                throw new Error('Unexpected end of input');
            }
            node.trueBody = statement(elseToken);
            token = nowToken;

            if (isEqual(token, 'else')) {
                if (token.next === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'else' });
                    throw new Error('Unexpected end of input');
                }

                node.elseBody = statement(token.next);
                token = nowToken;
            }
            nowToken = token;
            return node;
        } else if (token.location.slice(0, 3) === 'for') {
            const node = newNode(ASTNodeKind.For);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
                throw new Error('Unexpected end of input');
            }
            const initToken = skipToken(token.next, '(');
            if (initToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
                throw new Error('Unexpected end of input');
            }
            node.initBody = expressionStatement(initToken);
            token = nowToken;

            if (!isEqual(token, ';')) {
                node.condition = expression(token);
                token = nowToken;
            }

            let conditionToken = skipToken(token, ';');
            if (conditionToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
                throw new Error('Unexpected end of input');
            }

            if (!isEqual(conditionToken, ')')) {
                node.incrementBody = expression(conditionToken);
                token = nowToken;
                conditionToken = nowToken;
            }

            const outToken = skipToken(conditionToken, ')');
            if (outToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
                throw new Error('Unexpected end of input');
            }
            node.trueBody = statement(outToken);
            return node;
        } else if (token.location.slice(0, 5) === 'while') {
            const node = newNode(ASTNodeKind.For);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
                throw new Error('Unexpected end of input');
            }
            const conditionToken = skipToken(token.next, '(');
            if (conditionToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
                throw new Error('Unexpected end of input');
            }
            node.condition = expression(conditionToken);
            token = nowToken;

            const outToken = skipToken(token, ')');
            if (outToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
                throw new Error('Unexpected end of input');
            }
            node.trueBody = statement(outToken);
            return node;
        }
    }
    return expressionStatement(token);
}

/**
 * 解析一个块语句。
 * 产生式为：块语句 ::= '{' 语句* '}'
 * @param token 代表块语句的令牌。
 * @returns 代表块语句的抽象语法树节点。
 *
 * Parse a block statement.
 * Production rule: blockStatement ::= '{' statement* '}'
 * @param token The token representing the block statement.
 * @returns The abstract syntax tree node representing the block statement.
 */
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

/**
 * 解析一个表达式语句。
 * 产生式为：表达式语句 ::= 表达式? ';'
 * @param token 代表表达式语句的令牌。
 * @returns 代表表达式语句的抽象语法树节点。
 *
 * Parse an expression statement.
 * Production rule: expressionStatement ::= expression? ';'
 * @param token The token representing the expression statement.
 * @returns The abstract syntax tree node representing the expression statement.
 */
function expressionStatement(token: Token): ASTNode {
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
    return node;
}

/**
 * 解析一个表达式。
 * 产生式为：表达式 ::= 赋值表达式
 * @param token 代表表达式的令牌。
 * @returns 代表表达式的抽象语法树节点。
 *
 * Parse an expression.
 * Production rule: expression ::= assign
 * @param token The token representing the expression.
 * @returns The abstract syntax tree node representing the expression.
 */
function expression(token: Token): ASTNode {
    // return assign(rest, token);
    return assign(token);
}

/**
 * 解析一个赋值表达式。
 * 产生式为：赋值表达式 ::= 等式 ('=' 赋值表达式)?
 * @param token 代表赋值表达式的令牌。
 * @returns 代表赋值表达式的抽象语法树节点。
 *
 * Parse an assignment expression.
 * Production rule: assign ::= equality ('=' assign)?
 * @param token The token representing the assignment expression.
 * @returns The abstract syntax tree node representing the assignment expression.
 */
function assign(token: Token): ASTNode {
    let node = equality(token);
    token = nowToken;

    if (isEqual(token, '=')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: assign });
            throw new Error('Unexpected end of input');
        }
        node = newBinary(ASTNodeKind.Assignment, node, assign(token.next));
        token = nowToken;
    }
    if (token === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: assign });
        throw new Error('Unexpected end of input');
    }
    nowToken = token;
    return node;
}

/**
 * 解析一个等式。
 * 产生式为：等式 ::= 关系表达式 ( '==' 关系表达式 | '!=' 关系表达式 )*
 * @param token 代表等式的令牌。
 * @returns 代表等式的抽象语法树节点。
 *
 * Parse an equality.
 * Production rule: equality ::= relational ( '==' relational | '!=' relational )*
 * @param token The token representing the equality.
 * @returns The abstract syntax tree node representing the equality.
 */
function equality(token: Token): ASTNode {
    let node = relational(token);
    token = nowToken;
    while (true) {
        if (isEqual(token, '==')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: equality });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Equality, node, relational(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '!=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: equality });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Negation, node, relational(token.next));
            token = nowToken;
            continue;
        }
        nowToken = token;
        return node;
    }
}

/**
 * 解析一个关系表达式。
 * 产生式为：关系表达式 ::= 加法 ( '<' 加法 | '<=' 加法 | '>' 加法 | '>=' 加法 )*
 * @param token 代表关系表达式的令牌。
 * @returns 代表关系表达式的抽象语法树节点。
 *
 * Parse a relational expression.
 * Production rule: relational ::= add ( '<' add | '<=' add | '>' add | '>=' add )*
 * @param token The token representing the relational expression.
 * @returns The abstract syntax tree node representing the relational expression.
 */
function relational(token: Token): ASTNode {
    let node = add(token);
    token = nowToken;

    while (true) {
        if (isEqual(token, '<')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.LessThan, node, add(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '<=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.LessThanOrEqual, node, add(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '>')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.LessThan, add(token.next), node);
            token = nowToken;
            continue;
        }

        if (isEqual(token, '>=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: relational });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.LessThanOrEqual, add(token.next), node);
            token = nowToken;
            continue;
        }
        nowToken = token;
        return node;
    }
}

/**
 * 解析一个加法表达式。
 * 产生式为：加法 ::= 乘法 ( '+' 乘法 | '-' 乘法 )*
 * @param token 代表加法表达式的令牌。
 * @returns 代表加法表达式的抽象语法树节点。
 *
 * Parse an addition expression.
 * Production rule: add ::= mul ( '+' mul | '-' mul )*
 * @param token The token representing the addition expression.
 * @returns The abstract syntax tree node representing the addition expression.
 */
function add(token: Token): ASTNode {
    let node = mul(token);
    token = nowToken;
    while (true) {
        if (isEqual(token, '+')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: add });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Addition, node, mul(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '-')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: add });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Subtraction, node, mul(token.next));
            token = nowToken;
            continue;
        }
        nowToken = token;
        return node;
    }
}

/**
 * 解析一个乘法表达式。
 * 产生式为：乘法 ::= 一元 ( '*' 一元 | '/' 一元 )*
 * @param token 代表乘法表达式的令牌。
 * @returns 代表乘法表达式的抽象语法树节点。
 *
 * Parse a multiplication expression.
 * Production rule: mul ::= unary ( '*' unary | '/' unary )*
 * @param token The token representing the multiplication expression.
 * @returns The abstract syntax tree node representing the multiplication expression.
 */
function mul(token: Token): ASTNode {
    let node = unary(token);
    token = nowToken;
    while (true) {
        if (isEqual(token, '*')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: mul });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Multiplication, node, unary(token.next));
            token = nowToken;
            continue;
        }

        if (isEqual(token, '/')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: mul });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Division, node, unary(token.next));
            token = nowToken;
            continue;
        }
        nowToken = token;
        return node;
    }
}

/**
 * 解析一个一元表达式。
 * 产生式为：一元 ::= '+' 一元 | '-' 一元 | 主表达式
 * @param token 代表一元表达式的令牌。
 * @returns 代表一元表达式的抽象语法树节点。
 *
 * Parse a unary expression.
 * Production rule: unary ::= '+' unary | '-' unary | primary
 * @param token The token representing the unary expression.
 * @returns The abstract syntax tree node representing the unary expression.
 */
function unary(token: Token): ASTNode {
    if (isEqual(token, '+')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: unary });
            throw new Error('Unexpected end of input');
        }
        return unary(token.next);
    }

    if (isEqual(token, '-')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: unary });
            throw new Error('Unexpected end of input');
        }
        return newUnary(ASTNodeKind.Negation, unary(token.next));
    }

    return primary(token);
}

/**
 * 解析一个主表达式。
 * 产生式为：主表达式 ::= '(' 表达式 ')' | 标识符 | 数字字面量
 * @param token 代表主表达式的令牌。
 * @returns 代表主表达式的抽象语法树节点。
 *
 * Parse a primary expression.
 * Production rule: primary ::= '(' expression ')' | Identifier | NumericLiteral
 * @param token The token representing the primary expression.
 * @returns The abstract syntax tree node representing the primary expression.
 */
function primary(token: Token): ASTNode {
    if (isEqual(token, '(')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        const node = expression(token.next);
        token = nowToken;
        const nextToken = skipToken(token, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        nowToken = nextToken;
        return node;
    }

    if (token.kind === TokenType.Identifier) {
        let variableNode = findVariable(token);
        if (variableNode === undefined && token.location !== undefined && token.length !== undefined) {
            const tokenText = token.location.slice(0, Math.max(0, token.length));
            variableNode = newLocalVariable(tokenText);
        }
        if (token.next !== undefined) {
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
        nowToken = token.next;
        return node;
    }
    logMessage('error', 'Expected an expression', { token, position: primary });
    throw new Error('Expected an expression');
}

/**
 * 解析代码段。
 * @param tokens 代表代码的令牌流。
 * @returns 代表代码的抽象语法树节点簇。
 *
 * Parse a piece of code.
 * @param tokens The token stream representing the code.
 * @returns The abstract syntax tree node representing the code.
 */
export function parse(tokens: Token[]): FunctionNode {
    locals = undefined;
    const nextToken = skipToken(tokens[0], '{');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token: tokens[0], position: parse });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    const program = new FunctionNode();
    program.body = blockStatement(nowToken);
    program.locals = locals;
    return program;
}
