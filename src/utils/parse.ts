import * as commons from './commons';
import type { TypeDefinition, ASTNode, Token } from './classes';
import { FunctionNode, Variable, SymbolEntry, ScopeManager } from './classes';
import { logMessage } from './logger';
import { skipToken, isEqual, isVariableTypeDefinition } from './token';
import { IntermediateCodeList, makelist, getNodeValue } from './quadruple';
import * as parser from './parser';

const { creater, operators, operation, handlers } = parser;

let intermediateCodeList = new IntermediateCodeList();

let nowToken: Token;

/**
 * 消费一个令牌，如果令牌的值与给定的字符串匹配。
 * Consumes a token if the token's value matches the given string.
 * @param {Token} token 当前的令牌。The current token.
 * @param {string} tokenName 要匹配的字符串。The string to match.
 * @returns {boolean} 如果令牌的值与给定的字符串匹配，则返回true并将nowToken设置为下一个令牌，否则返回false并将nowToken设置为当前令牌。
 * True if the token's value matches the given string and sets nowToken to the next token, false otherwise and sets nowToken to the current token.
 */
function consumeToken(token: Token, tokenName: string): boolean {
    if (isEqual(token, tokenName)) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: consumeToken });
            throw new Error('Unexpected end of input');
        }
        nowToken = token.next;
        return true;
    }
    nowToken = token;
    return false;
}

/**
 * 在当前的变量列表中查找一个变量。Find a variable in the current list of local variables.
 * @param {Token} token 代表变量的令牌。The token representing the variable.
 * @returns {Variable | undefined} 如果找到了变量，则返回该变量的节点，否则返回undefined。The node of the variable if found, otherwise undefined.
 */
function findVariable(token: Token): Variable | undefined {
    const result = ScopeManager.getInstance().findEntry(getIdentifier(token));
    return result instanceof Variable ? result : undefined;
    // let variableSet = [creater.getLocals()];
    // let globalSet = creater.getGlobals();
    // if (globalSet !== undefined) variableSet.push(globalSet as Variable);
    // for (const variable of variableSet) {
    //     let variableNode = variable;
    //     while (variableNode !== undefined) {
    //         if (
    //             token.location !== undefined &&
    //             variableNode.name.length === token.length &&
    //             variableNode.name === token.location.slice(0, Math.max(0, token.length))
    //         ) {
    //             return variableNode;
    //         }
    //         variableNode = variableNode.nextEntry as Variable;
    //     }
    // }
    // return undefined;
}

/**
 * 语句处理器映射。Statement handler mapping.
 * @type {Record<string, handlers.StatementHandler>}
 */
export const statementHandlers: Record<string, parser.handlers.StatementHandler> = {
    return: returnStatement,
    if: ifStatement,
    for: forStatement,
    while: whileStatement,
};

/**
 * 处理类型定义。Handle type definition.
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {TypeDefinition} type - 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
const handleTypeDefinition: parser.handlers.TypeDefinitionHandler = (token: Token, type: string) => {
    const nextToken = skipToken(token, type);
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: declareType });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    return handlers.typeDefinitions[type];
};

/**
 * 解析一个语句。语句可以是多种类型之一：
 * - 表达式语句
 * - 块语句
 * - 流程控制语句
 * Parse a statement. The statement can be one of the following types:
 * - Expression statement
 * - Block statement
 * - Control flow statement
 * @param {Token} token 代表语句的令牌。The token representing the statement.
 * @returns {ASTNode} 代表语句的抽象语法树节点。The abstract syntax tree node representing the statement.
 */
function statement(token: Token): ASTNode {
    if (token.location !== undefined && token.location !== '') {
        if (token.location.startsWith('{')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'block' });
                throw new Error('Unexpected end of input');
            }
            return blockStatement(token.next);
        }
        for (const [prefix, handler] of Object.entries(statementHandlers)) {
            if (token.location.startsWith(prefix)) {
                const { returnNode } = handler(token);
                return returnNode;
            }
        }
    }
    return expressionStatement(token);
}

/**
 * 创建一个新的while语句节点。Create a new while statement node.
 * - while语句('while' '(' 表达式 ')' 语句)
 * - While statement ('while' '(' expression ')' statement)
 * @param {Token} token 代表while语句的令牌。The token representing the while statement.
 * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
export function whileStatement(token: Token): { returnNode: ASTNode; token: Token } {
    const node = creater.newNode(commons.ASTNodeKind.For);
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    const conditionToken: Token | undefined = skipToken(token.next, '(');
    if (conditionToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }

    const conditionLabel = String(intermediateCodeList.nextquad);

    node.condition = expression(conditionToken);
    token = nowToken;
    const conditionValue = getNodeValue(node.condition);
    const jumpFalseIndex = intermediateCodeList.emit('j=', conditionValue, '0');

    const outToken: Token | undefined = skipToken(token, ')');
    if (outToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    node.trueBody = statement(outToken);

    intermediateCodeList.emit('j', undefined, undefined, conditionLabel);
    intermediateCodeList.backpatch(makelist(String(jumpFalseIndex)), String(intermediateCodeList.nextquad));

    return { returnNode: node, token };
}

/**
 * 创建一个新的for语句节点。Create a new for statement node.
 * - for语句('for' '(' 表达式? ';' 表达式? ';' 表达式? ')' 语句)
 * - For statement ('for' '(' expression? ';' expression? ';' expression? ')' statement)
 * @param {Token} token 代表for语句的令牌。The token representing the for statement.
 * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
export function forStatement(token: Token): { returnNode: ASTNode; token: Token } {
    const node = creater.newNode(commons.ASTNodeKind.For);
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }
    const initToken: Token | undefined = skipToken(token.next, '(');
    if (initToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }
    node.initBody = expressionStatement(initToken);
    token = nowToken;

    const bIndex = intermediateCodeList.nextquad;

    if (!isEqual(token, ';')) {
        node.condition = expression(token);
        token = nowToken;
    }

    let jumpFalseIndex: number | undefined;

    if (node.condition !== undefined) {
        const conditionValue = getNodeValue(node.condition);
        jumpFalseIndex = intermediateCodeList.emit('j=', conditionValue, '0');
    }

    let conditionToken: Token | undefined = skipToken(token, ';');
    if (conditionToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }

    const jumpTrueIndex = intermediateCodeList.emit('j');

    if (!isEqual(conditionToken, ')')) {
        node.incrementBody = expression(conditionToken);
        token = nowToken;
        conditionToken = nowToken;
    }

    const outToken: Token | undefined = skipToken(conditionToken, ')');
    if (outToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }

    const cIndex = intermediateCodeList.nextquad;
    intermediateCodeList.emit('j', undefined, undefined, String(bIndex));

    node.trueBody = statement(outToken);

    intermediateCodeList.emit('j', undefined, undefined, String(jumpTrueIndex + 1));
    intermediateCodeList.backpatch(makelist(String(jumpTrueIndex)), String(cIndex + 1));

    if (node.condition !== undefined && jumpFalseIndex !== undefined) {
        intermediateCodeList.backpatch(makelist(String(jumpFalseIndex)), String(intermediateCodeList.nextquad));
    }

    return { returnNode: node, token };
}

/**
 * 创建一个新的if语句节点。Create a new if statement node.
 * - if语句('if' '(' 表达式 ')' 语句 ('else' 语句)?)
 * - If statement ('if' '(' expression ')' statement ('else' statement)?)
 * @param {Token} token 代表if语句的令牌。The token representing the if statement.
 * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
export function ifStatement(token: Token): { returnNode: ASTNode; token: Token } {
    const node = creater.newNode(commons.ASTNodeKind.If);
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
        throw new Error('Unexpected end of input');
    }
    const trueToken: Token | undefined = skipToken(token.next, ';');
    if (trueToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
        throw new Error('Unexpected end of input');
    }
    node.condition = expression(trueToken);
    token = nowToken;

    const conditionValue = getNodeValue(node.condition);
    const jumpFalseIndex = intermediateCodeList.emit('j=', conditionValue, '0', '-');

    const elseToken: Token | undefined = skipToken(token, ')');
    if (elseToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
        throw new Error('Unexpected end of input');
    }

    node.trueBody = statement(elseToken);
    token = nowToken;

    const jumpIndex = intermediateCodeList.emit('j');

    intermediateCodeList.backpatch(makelist(String(jumpFalseIndex)), String(intermediateCodeList.nextquad));

    if (isEqual(token, 'else')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'else' });
            throw new Error('Unexpected end of input');
        }

        node.elseBody = statement(token.next);
        token = nowToken;
    }

    intermediateCodeList.backpatch(makelist(String(jumpIndex)), String(intermediateCodeList.nextquad));

    nowToken = token;
    return { returnNode: node, token };
}

/**
 * 创建一个新的return语句节点。Create a new return statement node.
 * - 返回语句('return' 表达式 ';')
 * - Return statement ('return' expression ';')
 * @param {Token} token 代表return语句的令牌。The token representing the return statement.
 * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
export function returnStatement(token: Token): { returnNode: ASTNode; token: Token } {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'return' });
        throw new Error('Unexpected end of input');
    }
    const node = creater.newUnary(commons.ASTNodeKind.Return, expression(token.next));
    token = nowToken;
    const nextToken = skipToken(token, ';');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'return' });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    if (node.leftNode?.functionDef === undefined) {
        intermediateCodeList.emit('return', getNodeValue(node.leftNode));
    } else {
        intermediateCodeList.emit('return', 'call', getNodeValue(node.leftNode));
    }

    return { returnNode: node, token };
}

/**
 * 获取标识符。Get an identifier.
 * @param {Token} token 代表标识符的令牌。The token representing the identifier.
 * @returns {string} 标识符的字符串表示。The string representation of the identifier.
 */
function getIdentifier(token: Token): string {
    if (token.kind !== commons.TokenType.Identifier) {
        logMessage('error', 'Expected an identifier', { token, position: getIdentifier });
        throw new Error('Expected an identifier');
    }
    if (token.location === undefined || token.length === undefined) {
        logMessage('error', 'Token location or length is undefined', { token, position: getIdentifier });
        throw new Error('Token location or length is undefined');
    }
    return token.location.slice(0, Math.max(0, token.length));
}

/**
 * 声明类型。Declare a type.
 * 产生式为：类型定义 ::= 'int' | 'void' | 'char' | 'i64' | 'short'
 * Production rule: typeDefinition ::= 'int' | 'void' | 'char' | 'i64' | 'short'
 * @param {Token} token 代表类型的令牌。The token representing the type.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
export function declareType(token: Token): TypeDefinition {
    for (const type in handlers.typeDefinitions) {
        if (isEqual(token, type)) {
            return handleTypeDefinition(token, type);
        }
    }
    logMessage('error', 'Unknown type', { token, position: declareType });
    throw new Error('Unknown type');
}

/**
 * 声明。Declare.
 * @param {Token} token 代表声明的令牌。The token representing the declaration.
 * @param {TypeDefinition} type 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
export function declare(token: Token, type: TypeDefinition): TypeDefinition {
    while (consumeToken(token, '*')) {
        token = nowToken;
        type = commons.pointerTo(type);
    }
    if (isEqual(token, '(')) {
        const returnToken: Token | undefined = skipToken(token, '(');
        if (returnToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: declare });
            throw new Error('Unexpected end of input');
        }
        declare(returnToken, type);
        token = nowToken;
        let nextToken = skipToken(token, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: declare });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        type = checkTypeSuffix(token, type);
        nextToken = nowToken;
        type = declare(returnToken, type);
        nowToken = nextToken;
        return type;
    }
    if (token.kind !== commons.TokenType.Identifier) {
        logMessage('error', 'Expected an identifier', { token, position: declare });
        throw new Error('Expected an identifier');
    }

    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: declare });
        throw new Error('Unexpected end of input');
    }
    type = checkTypeSuffix(token.next, type);
    type.tokens = token;
    return type;
}

/**
 * 解析声明。Parse a declaration.
 * 产生式为：声明 ::= 类型标识符 ('*' 类型标识符)* 变量名 ('=' 表达式)?
 * Production rule: declaration ::= type identifier ('*' type identifier)* identifier ('=' expression)?
 * @param {Token} token 代表声明的令牌。The token representing the declaration.
 * @returns {ASTNode} 代表声明的抽象语法树节点。The abstract syntax tree node representing the declaration.
 */
function parseDeclaration(token: Token): ASTNode {
    const baseType = declareType(token);
    token = nowToken;

    const head: ASTNode = { nodeKind: commons.ASTNodeKind.Return, nodeNumber: -1 };
    let current: ASTNode = head;
    let parseFirst = false;

    while (!isEqual(token, ';')) {
        if (parseFirst) {
            const nextToken = skipToken(token, ',');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: parseDeclaration });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
        }
        parseFirst = true;
        const type = declare(token, baseType);
        if (type.type === commons.ASTNodeType.Void) {
            logMessage('error', 'Variable cannot be of type void', { token, position: parseDeclaration });
            throw new Error('Variable cannot be of type void');
        }
        token = nowToken;
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { token, position: parseDeclaration });
            throw new Error('Token is undefined');
        }
        const variable = creater.newLocalVariable(getIdentifier(type.tokens), type);

        if (isEqual(token, '=')) {
            const leftNode = creater.newVariableNode(variable);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: parseDeclaration });
                throw new Error('Unexpected end of input');
            }
            const rightNode = assign(token.next);
            token = nowToken;
            const node = creater.newBinary(commons.ASTNodeKind.Assignment, leftNode, rightNode);
            current = current.nextNode = creater.newUnary(commons.ASTNodeKind.ExpressionStatement, node);

            if (rightNode.functionDef === undefined) {
                intermediateCodeList.emit(':=', 'call', getNodeValue(rightNode), variable.name);
            } else intermediateCodeList.emit(':=', getNodeValue(rightNode), undefined, variable.name);
        } else {
            intermediateCodeList.emit('declare', String(variable?.type?.type), undefined, variable.name);
        }
    }

    const node = creater.newNode(commons.ASTNodeKind.Block);
    node.blockBody = head.nextNode;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseDeclaration });
        throw new Error('Unexpected end of input');
    }
    nowToken = token.next;
    return node;
}

/**
 * 解析一个块语句。Parse a block statement.
 * 产生式为：块语句 ::= '{' 语句* '}'
 * Production rule: blockStatement ::= '{' statement* '}'
 * @param {Token} token 代表块语句的令牌。The token representing the block statement.
 * @returns {ASTNode} 代表块语句的抽象语法树节点。The abstract syntax tree node representing the block statement.
 */
function blockStatement(token: Token): ASTNode {
    const head: ASTNode = { nodeKind: commons.ASTNodeKind.Return, nodeNumber: -1 };
    let current: ASTNode = head;
    ScopeManager.getInstance().enterScope();
    while (!isEqual(token, '}')) {
        current = current.nextNode = isVariableTypeDefinition(token) ? parseDeclaration(token) : statement(token);
        token = nowToken;
        commons.addType(current);
    }
    ScopeManager.getInstance().leaveScope();
    const node = creater.newNode(commons.ASTNodeKind.Block);
    node.blockBody = head.nextNode;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: blockStatement });
        throw new Error('Unexpected end of input');
    }
    nowToken = token.next;
    return node;
}

/**
 * 解析一个表达式语句。Parse an expression statement.
 * 产生式为：表达式语句 ::= 表达式? ';'
 * Production rule: expressionStatement ::= expression? ';'
 * @param {Token} token 代表表达式语句的令牌。The token representing the expression statement.
 * @returns {ASTNode} 代表表达式语句的抽象语法树节点。The abstract syntax tree node representing the expression statement.
 */
function expressionStatement(token: Token): ASTNode {
    let node: ASTNode;
    if (isEqual(token, ';')) {
        node = creater.newNode(commons.ASTNodeKind.Block);
    } else {
        node = creater.newUnary(commons.ASTNodeKind.ExpressionStatement, expression(token));
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
 * 解析一个表达式。Parse an expression.
 * 产生式为：表达式 ::= 赋值表达式
 * Production rule: expression ::= assign
 * @param {Token} token 代表表达式的令牌。The token representing the expression.
 * @returns {ASTNode} 代表表达式的抽象语法树节点。The abstract syntax tree node representing the expression.
 */
function expression(token: Token): ASTNode {
    return assign(token);
}

/**
 * 解析一个赋值表达式。Parse an assignment expression.
 * 产生式为：赋值表达式 ::= 等式 ('=' 赋值表达式)?
 * Production rule: assign ::= equality ('=' assign)?
 * @param {Token} token 代表赋值表达式的令牌。The token representing the assignment expression.
 * @returns {ASTNode} 代表赋值表达式的抽象语法树节点。The abstract syntax tree node representing the assignment expression.
 */
function assign(token: Token): ASTNode {
    let node = equality(token);
    token = nowToken;

    if (isEqual(token, '=')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: assign });
            throw new Error('Unexpected end of input');
        }
        node = creater.newBinary(commons.ASTNodeKind.Assignment, node, assign(token.next));
        token = nowToken;
        if (node.rightNode?.functionDef === undefined) {
            intermediateCodeList.emit(':=', getNodeValue(node.rightNode), undefined, getNodeValue(node.leftNode));
        } else {
            intermediateCodeList.emit(':=', 'call', getNodeValue(node.rightNode), getNodeValue(node.leftNode));
        }
    }
    nowToken = token;
    return node;
}
/**
 * 解析一个等式。Parse an equality.
 * 产生式为：等式 ::= 关系表达式 ( '==' 关系表达式 | '!=' 关系表达式 )*
 * Production rule: equality ::= relational ( '==' relational | '!=' relational )*
 * @param {Token} token 代表等式的令牌。The token representing the equality.
 * @returns {ASTNode} 代表等式的抽象语法树节点。The abstract syntax tree node representing the equality.
 */
export function equality(token: Token): ASTNode {
    let node = relational(token);
    token = nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: commons.ASTNodeKind = operators.equalityOperators[operator];
            node = operation.handleEqualityOperation(token, kind, node);
            token = nowToken;

            intermediateCodeList.emit(
                operator,
                getNodeValue(node.leftNode),
                getNodeValue(node.rightNode),
                getNodeValue(node),
            );

            return true;
        }
        return false;
    };
    while (Object.keys(operators.equalityOperators).some((operator) => processOperator(operator))) {
        // continue;
    }
    nowToken = token;
    return node;
}

/**
 * 解析一个关系表达式。Parse a relational expression.
 * 产生式为：关系表达式 ::= 加法 ( '<' 加法 | '<=' 加法 | '>' 加法 | '>=' 加法 )*
 * Production rule: relational ::= add ( '<' add | '<=' add | '>' add | '>=' add )*
 * @param {Token} token 代表关系表达式的令牌。The token representing the relational expression.
 * @returns {ASTNode} 代表关系表达式的抽象语法树节点。The abstract syntax tree node representing the relational expression.
 */
export function relational(token: Token): ASTNode {
    let node = add(token);
    token = nowToken;

    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const [kind, swapNodes] = operators.relationalOperators[operator];
            node = operation.handleRelationalOperation(token, kind, node, swapNodes);
            token = nowToken;

            intermediateCodeList.emit(
                operator,
                getNodeValue(node.leftNode),
                getNodeValue(node.rightNode),
                getNodeValue(node),
            );

            return true;
        }
        return false;
    };

    while (Object.keys(operators.relationalOperators).some((operator) => processOperator(operator))) {
        // continue;
    }
    nowToken = token;
    return node;
}

/**
 * 解析一个加法表达式。Parse an addition expression.
 * 产生式为：加法 ::= 乘法 ( '+' 乘法 | '-' 乘法 )*
 * Production rule: add ::= mul ( '+' mul | '-' mul )*
 * @param {Token} token 代表加法表达式的令牌。The token representing the addition expression.
 * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
 */
export function add(token: Token): ASTNode {
    let node = mul(token);
    token = nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: commons.ASTNodeKind = operators.addOperators[operator];
            node = operation.handleAddOperation(token, kind, node);
            token = nowToken;

            intermediateCodeList.emit(
                operator,
                getNodeValue(node.leftNode),
                getNodeValue(node.rightNode),
                getNodeValue(node),
            );

            return true;
        }
        return false;
    };
    while (Object.keys(operators.addOperators).some((operator) => processOperator(operator))) {
        // continue;
    }
    nowToken = token;
    return node;
}

/**
 * 解析一个乘法表达式。Parse a multiplication expression.
 * 产生式为：乘法 ::= 一元 ( '*' 一元 | '/' 一元 )*
 * Production rule: mul ::= unary ( '*' unary | '/' unary )*
 * @param {Token} token 代表乘法表达式的令牌。The token representing the multiplication expression.
 * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
 */
export function mul(token: Token): ASTNode {
    let node = unary(token);
    token = nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: commons.ASTNodeKind = operators.mulOperators[operator];
            node = operation.handleMulOperation(token, kind, node);
            token = nowToken;

            intermediateCodeList.emit(
                operator,
                getNodeValue(node.leftNode),
                getNodeValue(node.rightNode),
                getNodeValue(node),
            );

            return true;
        }
        return false;
    };
    while (Object.keys(operators.mulOperators).some((operator) => processOperator(operator))) {
        // continue;
    }
    nowToken = token;
    return node;
}
/**
 * 处理指针加法。Handle pointer addition.
 * @param {ASTNode} leftNode 左节点。The left node.
 * @param {ASTNode} rightNode 右节点。The right node.
 * @returns {ASTNode} 代表指针加法的抽象语法树节点。The abstract syntax tree node representing the pointer addition.
 */
export function ptrAdd(leftNode: ASTNode, rightNode: ASTNode): ASTNode {
    commons.addType(leftNode);
    commons.addType(rightNode);

    if (leftNode.typeDef === undefined || rightNode.typeDef === undefined)
        throw new Error('TypeDefinition is undefined');

    if (commons.isNumberType(leftNode.typeDef) && commons.isNumberType(rightNode.typeDef))
        return creater.newBinary(commons.ASTNodeKind.Addition, leftNode, rightNode);

    if (leftNode.typeDef.ptr !== undefined && rightNode.typeDef.ptr !== undefined) {
        logMessage('error', 'Invalid operands', { leftNode, rightNode, position: ptrAdd });
        throw new Error('Invalid operands');
    }
    if (leftNode.typeDef.ptr === undefined && rightNode.typeDef.ptr !== undefined)
        [leftNode, rightNode] = [rightNode, leftNode];

    if (leftNode.typeDef?.ptr?.size !== undefined) {
        rightNode = creater.newBinary(
            commons.ASTNodeKind.Multiplication,
            rightNode,
            creater.newNumber(leftNode.typeDef.ptr.size),
        );
        return creater.newBinary(commons.ASTNodeKind.Addition, leftNode, rightNode);
    }
    logMessage('error', 'Invalid operands', { leftNode, rightNode, position: ptrAdd });
    throw new Error('Invalid operands');
}

/**
 * 处理指针减法。Handle pointer subtraction.
 * @param {ASTNode} leftNode 左节点。The left node.
 * @param {ASTNode} rightNode 右节点。The right node.
 * @returns {ASTNode} 代表指针减法的抽象语法树节点。The abstract syntax tree node representing the pointer subtraction.
 */
export function ptrSub(leftNode: ASTNode, rightNode: ASTNode): ASTNode {
    commons.addType(leftNode);
    commons.addType(rightNode);

    if (leftNode.typeDef === undefined || rightNode.typeDef === undefined)
        throw new Error('TypeDefinition is undefined');

    if (commons.isNumberType(leftNode.typeDef) && commons.isNumberType(rightNode.typeDef))
        return creater.newBinary(commons.ASTNodeKind.Subtraction, leftNode, rightNode);

    if (leftNode.typeDef.ptr?.size !== undefined && commons.isNumberType(rightNode.typeDef)) {
        rightNode = creater.newBinary(
            commons.ASTNodeKind.Multiplication,
            rightNode,
            creater.newNumber(leftNode.typeDef.ptr.size),
        );
        commons.addType(rightNode);
        const node = creater.newBinary(commons.ASTNodeKind.Subtraction, leftNode, rightNode);
        node.typeDef = leftNode.typeDef;
        return node;
    }

    if (leftNode.typeDef.ptr?.size !== undefined && rightNode.typeDef.ptr?.size !== undefined) {
        const node = creater.newBinary(commons.ASTNodeKind.Subtraction, leftNode, rightNode);
        node.typeDef = commons.intTypeDefinition;
        return creater.newBinary(commons.ASTNodeKind.Division, node, creater.newNumber(leftNode.typeDef.ptr.size));
    }

    throw new Error('Invalid operands');
}

/**
 * 解析数组访问表达式。Parses array access expression.
 * 产生式为：数组访问表达式 ::= 主表达式 ('[' 表达式 ']')*
 * Production rule: arrayAccess ::= primary ('[' expression ']')*
 * @param {Token} token 要解析的令牌。The token to parse.
 * @returns {ASTNode} 表示解析后表达式的节点。A Node representing the parsed expression.
 */
function parseArrayAccess(token: Token): ASTNode {
    let node = primary(token);
    token = nowToken;
    while (isEqual(token, '[')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: parseArrayAccess });
            throw new Error('Unexpected end of input');
        }
        const nowNode = expression(token.next);
        token = nowToken;
        const nextToken = skipToken(token, ']');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: parseArrayAccess });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        const primaryNode = node;
        node = creater.newUnary(commons.ASTNodeKind.Dereference, ptrAdd(node, nowNode));

        intermediateCodeList.emit('=[]', getNodeValue(primaryNode), getNodeValue(nowNode), getNodeValue(node));
    }
    nowToken = token;
    return node;
}

/**
 * 解析一个一元表达式。Parse a unary expression.
 * 产生式为：一元 ::= '+' 一元 | '-' 一元 | '&' 一元 | '*' 一元 | 数组访问表达式
 * Production rule: unary ::= '+' unary | '-' unary | '&' unary | '*' unary | arrayAccess
 * @param {Token} token 代表一元表达式的令牌。The token representing the unary expression.
 * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
 */
export function unary(token: Token): ASTNode {
    for (const operator in operators.unaryOperators) {
        if (isEqual(token, operator)) {
            const kind: commons.ASTNodeKind = operators.unaryOperators[operator];
            const node = operation.handleUnaryOperation(token, kind);

            intermediateCodeList.emit(operator, getNodeValue(node.leftNode), undefined, getNodeValue(node));

            return node;
        }
    }
    return parseArrayAccess(token);
}

/**
 * 解析函数参数列表，将类型转换为函数类型。Parse the function parameter list and convert the type to a function type.
 * 函数参数列表 ::= '(' (类型声明 (',' 类型声明)*)? ')'
 * Function parameter list ::= '(' (declaration (',' declaration)*)? ')'
 * @param {Token} token 当前的令牌。The current token.
 * @param {TypeDefinition} type 当前的类型。The current type.
 * @returns {TypeDefinition} 存在函数参数列表，返回函数类型。If there is a function parameter list, return the function type.
 */
function checkTypeFunction(token: Token, type: TypeDefinition): TypeDefinition {
    const head: TypeDefinition = {};
    let current: TypeDefinition = head;
    while (!isEqual(token, ')')) {
        if (current !== head) {
            const nextToken = skipToken(token, ',');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
        }

        if (isEqual(token, 'void') && token.next !== undefined && isEqual(token.next, ')')) token = token.next;
        else {
            let nowType = declareType(token);
            token = nowToken;

            nowType = declare(token, nowType);
            token = nowToken;
            current = current.nextParameters = JSON.parse(JSON.stringify(nowType)) as TypeDefinition;
        }
    }

    type = commons.addFunctionType(type);
    type.parameters = head.nextParameters;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
        throw new Error('Unexpected end of input');
    }
    nowToken = token.next;
    return type;
}

/**
 * 检查类型后缀参数列表，若为函数参数列表则将类型转换为函数类型，若为数组则将类型转换为数组类型。Check if the type has a function parameter list, then convert the type to a function type. If it is an array, convert the type to an array type.
 * 函数参数列表 ::= '(' (类型声明 (',' 类型声明)*)? ')'
 * Function parameter list ::= '(' (declaration (',' declaration)*)? ')'
 * 数组 ::= '[' 数字 ']'
 * Array ::= '[' number ']'
 * @param {Token} token 当前的令牌。The current token.
 * @param {TypeDefinition} type 当前的类型。The current type.
 * @returns {TypeDefinition} 如果存在函数参数列表，则返回函数类型，否则返回原始类型。If there is a function parameter list, return the function type, otherwise return the original type.
 */
function checkTypeSuffix(token: Token, type: TypeDefinition): TypeDefinition {
    if (isEqual(token, '(')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
            throw new Error('Unexpected end of input');
        }
        return checkTypeFunction(token.next, type);
    }

    if (isEqual(token, '[')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
            throw new Error('Unexpected end of input');
        }
        if (token.next.kind !== commons.TokenType.NumericLiteral) {
            logMessage('error', 'Invalid array size', { token, position: checkTypeSuffix });
            throw new Error('Invalid array size');
        }
        const { numericValue: value } = token.next;
        if (value === undefined) {
            logMessage('error', 'Number is undefined', { token, position: checkTypeSuffix });
            throw new Error('Number is undefined');
        }
        if (token.next.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
            throw new Error('Unexpected end of input');
        }
        const nextToken = skipToken(token.next.next, ']');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        type = checkTypeSuffix(token, type);
        return commons.addArray(type, value);
    }
    nowToken = token;
    return type;
}

/**
 * 为函数参数创建局部变量。Create local variables for function parameters.
 * @param {TypeDefinition | undefined} type 函数参数类型。The function parameter type.
 * @returns {void} 无返回值。No return value.
 */
function createLocalVariablesForParameters(type: TypeDefinition | undefined): void {
    if (type !== undefined) {
        createLocalVariablesForParameters(type.nextParameters);
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { position: createLocalVariablesForParameters });
            throw new Error('Token is undefined');
        }
        creater.newLocalVariable(getIdentifier(type.tokens), type);

        intermediateCodeList.emit('param', getIdentifier(type.tokens), type.type);
    }
}

/**
 * 解析函数定义。Parse a function definition.
 * @param {Token} token 当前的令牌。The current token.
 * @param {TypeDefinition} type 函数类型。The function type.
 * @returns {Token} 下一个令牌。The next token.
 */
function parseFunction(token: Token, type: TypeDefinition): Token {
    type = declare(token, type);
    token = nowToken;
    if (type.tokens === undefined) {
        logMessage('error', 'Token is undefined', { token, position: parseFunction });
        throw new Error('Token is undefined');
    }
    let nowEntry = creater.newGlobalEntry(getIdentifier(type.tokens), type, true) as FunctionNode;
    creater.setLocals(undefined);
    intermediateCodeList.emit('begin', nowEntry.name, type.type);
    ScopeManager.getInstance().enterScope();
    createLocalVariablesForParameters(type.parameters);
    nowEntry.Arguments = creater.getLocals();

    const nextToken = skipToken(token, '{');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseFunction });
        throw new Error('Unexpected end of input');
    }
    token = nextToken;
    nowEntry.body = blockStatement(token);
    token = nowToken;
    nowEntry.locals = creater.getLocals();
    ScopeManager.getInstance().leaveScope();
    return token;
}

/**
 * 解析一个函数调用。Parse a function call.
 * 产生式为：函数调用 ::= 标识符 '(' (表达式 (',' 表达式)*)? ')'
 * Production rule: functionCall ::= Identifier '(' (expression (',' expression)*)? ')'
 * @param {Token} token 代表函数调用的令牌。The token representing the function call.
 * @returns {ASTNode} 代表函数调用的抽象语法树节点。The abstract syntax tree node representing the function call.
 */
function functionCall(token: Token): ASTNode {
    if (token?.next?.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: functionCall });
        throw new Error('Unexpected end of input');
    }
    let startToken = token.next.next;

    const head: ASTNode = { nodeKind: commons.ASTNodeKind.Return, nodeNumber: -1 };
    let current: ASTNode = head;

    while (!isEqual(startToken, ')')) {
        if (current !== head) {
            const nextToken = skipToken(startToken, ',');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: functionCall });
                throw new Error('Unexpected end of input');
            }
            startToken = nextToken;
        }
        current = current.nextNode = assign(startToken);

        if (current.functionDef === undefined) intermediateCodeList.emit('arg', getNodeValue(current));
        else intermediateCodeList.emit('arg', 'call', getNodeValue(current));

        startToken = nowToken;
    }
    const nextToken = skipToken(startToken, ')');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: functionCall });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;

    const node = creater.newNode(commons.ASTNodeKind.FunctionCall);
    node.functionDef = getIdentifier(token);
    node.functionArgs = head.nextNode;
    return node;
}

/**
 * 解析一个全局变量。Parse a global variable.
 * 产生式为：全局变量 ::= 类型标识符 ('*' 类型标识符)* 变量名 (',' 变量名)* ';'
 * Production rule: globalVariable ::= typeIdentifier ('*' typeIdentifier)* identifier (',' identifier)* ';'
 * @param {Token} token 代表全局变量的令牌。The token representing the global variable.
 * @param {TypeDefinition} type 初始类型。The initial type.
 * @returns {Token} 下一个令牌。The next token.
 */
function parseGlobalVariable(token: Token, type: TypeDefinition): Token {
    let judgeFirst = true;
    while (true) {
        let judge = consumeToken(token, ';');
        token = nowToken;
        if (judge) break;
        if (!judgeFirst) {
            const nextToken = skipToken(token, ',');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: parseGlobalVariable });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
        }
        judgeFirst = false;
        let nowType = declare(token, type);
        token = nowToken;
        if (nowType.tokens === undefined) {
            logMessage('error', 'Token is undefined', { token, position: parseFunction });
            throw new Error('Token is undefined');
        }
        creater.newGlobalEntry(getIdentifier(nowType.tokens), nowType, false);
    }
    return token;
}

/**
 * 解析抽象声明符。Parse an abstract declarator.
 * 抽象声明符用于描述一个类型而不需要给出具体的变量名。在函数声明中，我们可以使用抽象声明符来描述函数的参数类型。
 * An abstract declarator is used to describe a type without giving a specific variable name. In function declarations, we can use an abstract declarator to describe the parameter types of a function.
 * 产生式为：抽象声明符 ::= ('*' 抽象声明符)? 类型后缀
 * Production rule: abstractDeclarator ::= ('*' abstractDeclarator)? typeSuffix
 * @param {Token} token 代表抽象声明符的令牌序列。The token sequence representing the abstract declarator.
 * @param {TypeDefinition} type 初始类型。The initial type.
 * @returns {TypeDefinition} 解析得到的类型。The parsed type.
 */
function parseAbstractDeclarator(token: Token, type: TypeDefinition): TypeDefinition {
    while (isEqual(token, '*')) {
        type = commons.pointerTo(type);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: parseAbstractDeclarator });
            throw new Error('Unexpected end of input');
        }
        token = token.next;
    }

    if (isEqual(token, '(')) {
        const nextToken = token.next;
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: parseAbstractDeclarator });
            throw new Error('Unexpected end of input');
        }
        parseAbstractDeclarator(nextToken, type);
        token = nowToken;
        const outToken = skipToken(token, ')');
        if (outToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: parseAbstractDeclarator });
            throw new Error('Unexpected end of input');
        }
        token = outToken;
        type = checkTypeSuffix(token, type);
        return parseAbstractDeclarator(nextToken, type);
    }
    return checkTypeSuffix(token, type);
}

/**
 * 解析类型。Parse a type.
 * 产生式为：类型 ::= 类型标识符 ('*' 类型标识符)*
 * Production rule: type ::= typeIdentifier ('*' typeIdentifier)*
 * @param {Token} token 代表类型的令牌。The token representing the type.
 * @returns {TypeDefinition} 代表类型的抽象语法树节点。The abstract syntax tree node representing the type.
 */
function parseType(token: Token): TypeDefinition {
    const type: TypeDefinition = declareType(token);
    token = nowToken;
    return parseAbstractDeclarator(token, type);
}

/**
 * 解析一个主表达式。Parse a primary expression.
 * 产生式为：主表达式 ::= '(' 表达式 ')' | 标识符 | 数字字面量 | 函数调用 | 字符串字面量
 * Production rule: primary ::= '(' expression ')' | Identifier | NumericLiteral | functionCall | stringLiteral
 * @param {Token} token 代表主表达式的令牌。The token representing the primary expression.
 * @returns {ASTNode} 代表主表达式的抽象语法树节点。The abstract syntax tree node representing the primary expression.
 */
function primary(token: Token): ASTNode {
    if (isEqual(token, '(')) {
        const { returnNode } = bracketsPrimary(token);
        return returnNode;
    }
    if (isEqual(token, 'sizeof')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        if (isEqual(token.next, '(') && token.next.next !== undefined && isVariableTypeDefinition(token.next.next)) {
            const { returnNode } = sizeofVariableType(token.next.next);

            intermediateCodeList.emit('sizeof', String(returnNode.numberValue), undefined, getNodeValue(returnNode));

            return returnNode;
        }
        const sizeofNode = sizeofVariable(token.next);

        intermediateCodeList.emit('sizeof', String(sizeofNode.numberValue), undefined, getNodeValue(sizeofNode));

        return sizeofNode;
    }

    if (token.kind === commons.TokenType.Identifier) {
        if (token.next !== undefined && isEqual(token.next, '(')) return functionCall(token);
        return identifierPrimary(token);
    }

    if (token.kind === commons.TokenType.StringLiteral) {
        if (token.stringType === undefined) {
            logMessage('error', 'String type is undefined', { token, position: primary });
            throw new Error('String type is undefined');
        }
        const node = creater.newStringLiteral(token.stringValue, token.stringType) as Variable;
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        nowToken = token.next;

        intermediateCodeList.emit('=', token.stringValue, undefined, `LC${node.name}`);

        return creater.newVariableNode(node);
    }

    if (token.kind === commons.TokenType.NumericLiteral) {
        if (token.numericValue === undefined) {
            logMessage('error', 'Invalid number', { token, position: primary });
            throw new Error('Invalid number');
        }
        const node = creater.newNumber(token.numericValue);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        nowToken = token.next;

        intermediateCodeList.emit('=', String(token.numericValue), undefined, `N${node.nodeNumber}`);

        return node;
    }
    logMessage('error', 'Expected an expression', { token, position: primary });
    throw new Error('Expected an expression');
}

/**
 * 解析一个标识符主表达式。Parse an identifier primary expression.
 * Production rule: identifierPrimary ::= Identifier
 * @param {Token} token 代表标识符主表达式的令牌。The token representing the identifier primary expression.
 * @returns {ASTNode} 代表标识符主表达式的抽象语法树节点。The abstract syntax tree node representing the identifier primary expression.
 * @throws 当变量未定义或未找到时抛出错误。Throws an error when the variable is not defined or not found.
 */
function identifierPrimary(token: Token): ASTNode {
    const variableNode = findVariable(token);
    if (variableNode === undefined && token.location !== undefined && token.length !== undefined) {
        logMessage('error', 'Variable not defined', { token, position: primary });
        throw new Error('Variable not defined');
    }
    if (token.next !== undefined) nowToken = token.next;
    if (variableNode === undefined) {
        logMessage('error', 'Variable not found', { token, position: primary });
        throw new Error('Variable not found');
    }
    return creater.newVariableNode(variableNode);
}

/**
 * 解析一个sizeof变量表达式。Parse a sizeof variable expression.
 * Production rule: sizeofVariable ::= 'sizeof' Variable
 * @param {Token} token 代表sizeof变量表达式的令牌。The token representing the sizeof variable expression.
 * @returns {ASTNode} 代表sizeof变量表达式的抽象语法树节点。The abstract syntax tree node representing the sizeof variable expression.
 * @throws 当类型定义未定义时抛出错误。Throws an error when the type definition is undefined.
 */
function sizeofVariable(token: Token): ASTNode {
    const node = unary(token);
    commons.addType(node);
    if (node?.typeDef?.size === undefined) {
        logMessage('error', 'TypeDefinition is undefined', { token, position: primary });
        throw new Error('TypeDefinition is undefined');
    }
    return creater.newNumber(node.typeDef.size);
}

/**
 * 解析一个sizeof变量类型表达式。Parse a sizeof variable type expression.
 * 产生式为：sizeof变量类型表达式 ::= 'sizeof' '(' 类型 ')'
 * Production rule: sizeofVariableType ::= 'sizeof' '(' Type ')'
 * @param {Token} token 代表sizeof变量类型表达式的令牌。The token representing the sizeof variable type expression.
 * @returns {{returnNode: ASTNode, token: Token}} 代表sizeof变量类型表达式的抽象语法树节点和下一个令牌。The abstract syntax tree node representing the sizeof variable type expression and the next token.
 * @throws 当输入意外结束或类型定义未定义时抛出错误。Throws an error when the input ends unexpectedly or the type definition is undefined.
 */
function sizeofVariableType(token: Token): { returnNode: ASTNode; token: Token } {
    const type = parseType(token);
    token = nowToken;
    const nextToken = skipToken(token, ')');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: primary });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    if (type.size === undefined) {
        logMessage('error', 'TypeDefinition is undefined', { token, position: primary });
        throw new Error('TypeDefinition is undefined');
    }
    return { returnNode: creater.newNumber(type.size), token };
}

/**
 * 解析一个括号内的主表达式。Parse a brackets primary expression.
 * 产生式为：括号内的主表达式 ::= '(' 表达式 ')'
 * Production rule: bracketsPrimary ::= '(' expression ')'
 * @param {Token} token 代表括号内的主表达式的令牌。The token representing the brackets primary expression.
 * @returns {{returnNode: ASTNode, token: Token}} 代表括号内的主表达式的抽象语法树节点和下一个令牌。The abstract syntax tree node representing the brackets primary expression and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
function bracketsPrimary(token: Token): { returnNode: ASTNode; token: Token } {
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
    return { returnNode: node, token };
}

/**
 * 获取四元式。Get the quadruple.
 * @returns {string} 四元式输出。The quadruple output.
 */
function getQuadruple(): string {
    const nodeToQuadrupleMap = new Map<string, string>();
    let nextQuadrupleNumber = 1;
    const quadrupleOutput = `${['id', 'op', 'argument1', 'argument2', 'result'].map((header) => header.padEnd(13)).join('')}\n${intermediateCodeList.codes
        .map(
            (code, index) =>
                `${(100 + index).toString().padEnd(13)}${code
                    .map((item) => {
                        if (item?.startsWith('N')) {
                            if (!nodeToQuadrupleMap.has(item)) {
                                nodeToQuadrupleMap.set(item, `N${nextQuadrupleNumber}`);
                                nextQuadrupleNumber += 1;
                            }
                            const mappedItem = nodeToQuadrupleMap.get(item);
                            return (mappedItem ?? '').padEnd(13);
                        }
                        return (item ?? '').padEnd(13);
                    })
                    .join('')}`,
        )
        .join('\n')}`;
    return quadrupleOutput;
}

/**
 * 解析代码段。Parse a piece of code.
 * @param {Token[]} tokens 代表代码的令牌流。The token stream representing the code.
 * @returns { { globalVar: SymbolEntry | undefined, quadrupleOutput: string } } 解析得到的全局 entry 和四元式输出。The parsed global entry and quadruple output.
 */
export function parse(tokens: Token[]): { globalEntry: SymbolEntry | undefined; quadrupleOutput: string } {
    creater.initialParse();
    intermediateCodeList = new IntermediateCodeList();
    ScopeManager.resetInstance();
    let token = tokens[0];
    while (token.kind !== commons.TokenType.EndOfFile) {
        let type = declareType(token);
        token = nowToken;
        let judgeFunction =
            token.next !== undefined &&
            !isEqual(token.next, ';') &&
            declare(token, type).type == commons.ASTNodeType.Function;
        token = judgeFunction ? parseFunction(token, type) : parseGlobalVariable(token, type);
    }
    const quadrupleOutput = getQuadruple();
    return { globalEntry: creater.getGlobals(), quadrupleOutput };
}
