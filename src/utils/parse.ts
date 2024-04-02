import {
    ASTNodeKind,
    addType,
    isNumberType,
    intTypeDefinition,
    pointerTo,
    addFunctionType,
    addArray,
    voidTypeDefinition,
    charTypeDefinition,
    int64TypeDefinition,
    shortTypeDefinition,
    ASTNodeType,
    TokenType,
} from './commons';
import type TypeDefinition from './classes/typedef-class';
import type ASTNode from './classes/astnode-class';
import FunctionNode from './classes/functionnode-class';
import type LocalVariable from './classes/localvariable-class';
import type Token from './classes/token-class';
import { logMessage } from './logger';
import { skipToken, isEqual, isVariableTypeDefinition } from './token';

let locals: LocalVariable | undefined;

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
 * 在当前的局部变量列表中查找一个变量。Find a variable in the current list of local variables.
 * @param {Token} token 代表变量的令牌。The token representing the variable.
 * @returns {LocalVariable | undefined} 如果找到了变量，则返回该变量的节点，否则返回undefined。The node of the variable if found, otherwise undefined.
 */
function findVariable(token: Token): LocalVariable | undefined {
    let variableNode = locals;

    while (variableNode !== undefined) {
        if (
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
 * 创建一个新的抽象语法树节点。Create a new abstract syntax tree node.
 * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
function newNode(kind: ASTNodeKind): ASTNode {
    return {
        nodeKind: kind,
    };
}

/**
 * 创建一个新的二元操作符节点。Create a new binary operator node.
 * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
 * @param {ASTNode} lhs 左操作数。The left operand.
 * @param {ASTNode} rhs 右操作数。The right operand.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
function newBinary(kind: ASTNodeKind, lhs: ASTNode, rhs: ASTNode): ASTNode {
    return {
        nodeKind: kind,
        leftNode: lhs,
        rightNode: rhs,
    };
}

/**
 * 创建一个新的一元操作符节点。Create a new unary operator node.
 * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
 * @param {ASTNode} expr 操作数。The operand.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
function newUnary(kind: ASTNodeKind, expr: ASTNode): ASTNode {
    return {
        nodeKind: kind,
        leftNode: expr,
    };
}

/**
 * 创建一个新的数字节点。Create a new number node.
 * @param {number} value 数字的值。The value of the number.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
function newNumber(value: number): ASTNode {
    return {
        nodeKind: ASTNodeKind.Number,
        numberValue: value,
    };
}

/**
 * 创建一个新的变量节点。Create a new variable node.
 * @param {LocalVariable} variableNode 代表变量的节点。The node representing the variable.
 * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
 */
function newVariableNode(variableNode: LocalVariable): ASTNode {
    return {
        nodeKind: ASTNodeKind.Variable,
        localVar: variableNode,
    };
}

/**
 * 创建一个新的局部变量。Create a new local variable.
 * @param {string} name 变量名。The name of the variable.
 * @param {TypeDefinition} type 变量类型。The type of the variable.
 * @returns {LocalVariable} 新创建的局部变量。The newly created local variable.
 */
function newLocalVariable(name: string, type: TypeDefinition): LocalVariable {
    const localVariable: LocalVariable = {
        varName: name,
        nextVar: locals,
        offsetFromRBP: 0,
        varType: type,
    };
    locals = localVariable;
    return localVariable;
}

/**
 * 语句处理器类型。Statement handler type.
 * @typedef {Function} StatementHandler
 * @param {Token} token - 代表语句的令牌。The token representing the statement.
 * @returns {{returnNode: ASTNode, token: Token}} - 返回新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
 * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
 */
type StatementHandler = (token: Token) => { returnNode: ASTNode; token: Token };

/**
 * 语句处理器映射。Statement handler mapping.
 * @type {Record<string, StatementHandler>}
 */
const statementHandlers: Record<string, StatementHandler> = {
    return: returnStatement,
    if: ifStatement,
    for: forStatement,
    while: whileStatement,
};

/**
 * 类型定义处理器类型。Type definition handler type.
 * @typedef {Function} TypeDefinitionHandler
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {TypeDefinition} type - 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
type TypeDefinitionHandler = (token: Token, type: string) => TypeDefinition;

/**
 * 类型到 TypeDefinition 的映射。Mapping from type to TypeDefinition.
 */
const typeDefinitions: Record<string, TypeDefinition> = {
    int: intTypeDefinition,
    void: voidTypeDefinition,
    char: charTypeDefinition,
    i64: int64TypeDefinition,
    short: shortTypeDefinition,
};

/**
 * 关系操作处理器类型。Relational operation handler type.
 * @typedef {Function} RelationalHandler
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {ASTNodeKind} kind - AST节点类型。The kind of AST node.
 * @param {ASTNode} node - 当前的AST节点。The current AST node.
 * @param {boolean} swapNodes - 是否交换节点。Whether to swap nodes.
 * @returns {ASTNode} - 返回新的AST节点。Returns a new AST node.
 */
type RelationalHandler = (token: Token, kind: ASTNodeKind, node: ASTNode, swapNodes: boolean) => ASTNode;

/**
 * 处理关系操作。Handle relational operation.
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {ASTNodeKind} kind - AST节点类型。The kind of AST node.
 * @param {ASTNode} node - 当前的AST节点。The current AST node.
 * @param {boolean} swapNodes - 是否交换节点。Whether to swap nodes.
 * @returns {ASTNode} - 返回新的AST节点。Returns a new AST node.
 */
const handleRelationalOperation: RelationalHandler = (
    token: Token,
    kind: ASTNodeKind,
    node: ASTNode,
    swapNodes: boolean,
) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: relational });
        throw new Error('Unexpected end of input');
    }
    const leftNode: ASTNode = swapNodes ? add(token.next) : node;
    const rightNode: ASTNode = swapNodes ? node : add(token.next);
    return newBinary(kind, leftNode, rightNode);
};

/**
 * 关系操作符映射。Relational operators mapping.
 * @type {Record<string, [ASTNodeKind, boolean]>}
 */
const relationalOperators: Record<string, [ASTNodeKind, boolean]> = {
    '<': [ASTNodeKind.LessThan, false],
    '<=': [ASTNodeKind.LessThanOrEqual, false],
    '>': [ASTNodeKind.LessThan, true],
    '>=': [ASTNodeKind.LessThanOrEqual, true],
};

/**
 * 乘法操作处理器类型。Multiplication operation handler type.
 * @typedef {Function} MulHandler
 * @param {Token} token - 代表乘法表达式的令牌。The token representing the multiplication expression.
 * @param {ASTNodeKind} kind - 乘法操作的种类。The kind of multiplication operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
 */
type MulHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => ASTNode;

/**
 * 处理乘法操作。Handle multiplication operation.
 * @param {Token} token - 代表乘法表达式的令牌。The token representing the multiplication expression.
 * @param {ASTNodeKind} kind - 乘法操作的种类。The kind of multiplication operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
 */
const handleMulOperation: MulHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: mul });
        throw new Error('Unexpected end of input');
    }
    return newBinary(kind, left, unary(token.next));
};

/**
 * 乘法操作符到 ASTNodeKind 的映射。Mapping from multiplication operators to ASTNodeKind.
 */
const mulOperators: Record<string, ASTNodeKind> = {
    '*': ASTNodeKind.Multiplication,
    '/': ASTNodeKind.Division,
};

/**
 * 处理类型定义。Handle type definition.
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {TypeDefinition} type - 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
const handleTypeDefinition: TypeDefinitionHandler = (token: Token, type: string) => {
    const nextToken = skipToken(token, type);
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: declareType });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;
    return typeDefinitions[type];
};

/**
 * 加法操作处理器类型。Addition operation handler type.
 * @typedef {Function} AddHandler
 * @param {Token} token - 代表加法表达式的令牌。The token representing the addition expression.
 * @param {ASTNodeKind} kind - 加法操作的种类。The kind of addition operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
 */
type AddHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => ASTNode;

/**
 * 处理加法操作。Handle addition operation.
 * @param {Token} token - 代表加法表达式的令牌。The token representing the addition expression.
 * @param {ASTNodeKind} kind - 加法操作的种类。The kind of addition operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
 */
const handleAddOperation: AddHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: add });
        throw new Error('Unexpected end of input');
    }
    if (kind === ASTNodeKind.Addition) {
        return ptrAdd(left, mul(token.next));
    }
    if (kind === ASTNodeKind.Subtraction) {
        return ptrSub(left, mul(token.next));
    }
    throw new Error('Invalid operation');
};

/**
 * 加法操作符到 ASTNodeKind 的映射。Mapping from addition operators to ASTNodeKind.
 * @type {Record<string, ASTNodeKind>}
 */
const addOperators: Record<string, ASTNodeKind> = {
    '+': ASTNodeKind.Addition,
    '-': ASTNodeKind.Subtraction,
};

/**
 * 一元操作处理器类型。Unary operation handler type.
 * @typedef {Function} UnaryHandler
 * @param {Token} token - 代表一元表达式的令牌。The token representing the unary expression.
 * @param {ASTNodeKind} kind - 一元操作的种类。The kind of unary operation.
 * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
 */
type UnaryHandler = (token: Token, kind: ASTNodeKind) => ASTNode;

/**
 * 处理一元操作。Handle unary operation.
 * @param {Token} token - 代表一元表达式的令牌。The token representing the unary expression.
 * @param {ASTNodeKind} kind - 一元操作的种类。The kind of unary operation.
 * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
 */
const handleUnaryOperation: UnaryHandler = (token: Token, kind: ASTNodeKind) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: unary });
        throw new Error('Unexpected end of input');
    }
    return kind === ASTNodeKind.Addition ? unary(token.next) : newUnary(kind, unary(token.next));
};

/**
 * 一元操作符到 ASTNodeKind 的映射。Mapping from unary operators to ASTNodeKind.
 */
const unaryOperators: Record<string, ASTNodeKind> = {
    '+': ASTNodeKind.Addition,
    '-': ASTNodeKind.Negation,
    '&': ASTNodeKind.AddressOf,
    '*': ASTNodeKind.Dereference,
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
                let returnNode;
                ({ returnNode, token } = handler(token));
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
function whileStatement(token: Token): { returnNode: ASTNode; token: Token } {
    const node = newNode(ASTNodeKind.For);
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    const conditionToken: Token | undefined = skipToken(token.next, '(');
    if (conditionToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    node.condition = expression(conditionToken);
    token = nowToken;

    const outToken: Token | undefined = skipToken(token, ')');
    if (outToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    node.trueBody = statement(outToken);
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
function forStatement(token: Token): { returnNode: ASTNode; token: Token } {
    const node = newNode(ASTNodeKind.For);
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

    if (!isEqual(token, ';')) {
        node.condition = expression(token);
        token = nowToken;
    }

    let conditionToken: Token | undefined = skipToken(token, ';');
    if (conditionToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }

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
    node.trueBody = statement(outToken);
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
function ifStatement(token: Token): { returnNode: ASTNode; token: Token } {
    const node = newNode(ASTNodeKind.If);
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

    const elseToken: Token | undefined = skipToken(token, ')');
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
function returnStatement(token: Token): { returnNode: ASTNode; token: Token } {
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
    return { returnNode: node, token };
}

/**
 * 获取标识符。Get an identifier.
 * @param {Token} token 代表标识符的令牌。The token representing the identifier.
 * @returns {string} 标识符的字符串表示。The string representation of the identifier.
 */
function getIdentifier(token: Token): string {
    if (token.kind !== TokenType.Identifier) {
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
    for (const type in typeDefinitions) {
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
        type = pointerTo(type);
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
    if (token.kind !== TokenType.Identifier) {
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

    const head: ASTNode = { nodeKind: ASTNodeKind.Return };
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
        if (type.type === ASTNodeType.Void) {
            logMessage('error', 'Variable cannot be of type void', { token, position: parseDeclaration });
            throw new Error('Variable cannot be of type void');
        }
        token = nowToken;
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { token, position: parseDeclaration });
            throw new Error('Token is undefined');
        }
        const variable = newLocalVariable(getIdentifier(type.tokens), type);

        if (isEqual(token, '=')) {
            const leftNode = newVariableNode(variable);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: parseDeclaration });
                throw new Error('Unexpected end of input');
            }
            const rightNode = assign(token.next);
            token = nowToken;
            const node = newBinary(ASTNodeKind.Assignment, leftNode, rightNode);
            current = current.nextNode = newUnary(ASTNodeKind.ExpressionStatement, node);
        }
    }

    const node = newNode(ASTNodeKind.Block);
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
    const head: ASTNode = { nodeKind: ASTNodeKind.Return };
    let current: ASTNode = head;
    while (!isEqual(token, '}')) {
        current = current.nextNode = isVariableTypeDefinition(token) ? parseDeclaration(token) : statement(token);
        token = nowToken;
        addType(current);
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
 * 解析一个表达式语句。Parse an expression statement.
 * 产生式为：表达式语句 ::= 表达式? ';'
 * Production rule: expressionStatement ::= expression? ';'
 * @param {Token} token 代表表达式语句的令牌。The token representing the expression statement.
 * @returns {ASTNode} 代表表达式语句的抽象语法树节点。The abstract syntax tree node representing the expression statement.
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
        node = newBinary(ASTNodeKind.Assignment, node, assign(token.next));
        token = nowToken;
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
        } else if (isEqual(token, '!=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: equality });
                throw new Error('Unexpected end of input');
            }
            node = newBinary(ASTNodeKind.Negation, node, relational(token.next));
            token = nowToken;
        } else {
            nowToken = token;
            return node;
        }
    }
}

/**
 * 解析一个关系表达式。Parse a relational expression.
 * 产生式为：关系表达式 ::= 加法 ( '<' 加法 | '<=' 加法 | '>' 加法 | '>=' 加法 )*
 * Production rule: relational ::= add ( '<' add | '<=' add | '>' add | '>=' add )*
 * @param {Token} token 代表关系表达式的令牌。The token representing the relational expression.
 * @returns {ASTNode} 代表关系表达式的抽象语法树节点。The abstract syntax tree node representing the relational expression.
 */
function relational(token: Token): ASTNode {
    let node = add(token);
    token = nowToken;

    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const [kind, swapNodes] = relationalOperators[operator];
            node = handleRelationalOperation(token, kind, node, swapNodes);
            token = nowToken;
            return true;
        }
        return false;
    };

    while (Object.keys(relationalOperators).some((operator) => processOperator(operator))) {
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
function add(token: Token): ASTNode {
    let node = mul(token);
    token = nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: ASTNodeKind = addOperators[operator];
            node = handleAddOperation(token, kind, node);
            token = nowToken;
            return true;
        }
        return false;
    };
    while (Object.keys(addOperators).some((operator) => processOperator(operator))) {
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
function mul(token: Token): ASTNode {
    let node = unary(token);
    token = nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: ASTNodeKind = mulOperators[operator];
            node = handleMulOperation(token, kind, node);
            token = nowToken;
            return true;
        }
        return false;
    };
    while (Object.keys(mulOperators).some((operator) => processOperator(operator))) {
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
function ptrAdd(leftNode: ASTNode, rightNode: ASTNode): ASTNode {
    addType(leftNode);
    addType(rightNode);

    if (leftNode.typeDef === undefined || rightNode.typeDef === undefined) {
        throw new Error('TypeDefinition is undefined');
    }

    if (isNumberType(leftNode.typeDef) && isNumberType(rightNode.typeDef)) {
        return newBinary(ASTNodeKind.Addition, leftNode, rightNode);
    }
    if (leftNode.typeDef.ptr !== undefined && rightNode.typeDef.ptr !== undefined) {
        logMessage('error', 'Invalid operands', { leftNode, rightNode, position: ptrAdd });
        throw new Error('Invalid operands');
    }
    if (leftNode.typeDef.ptr === undefined && rightNode.typeDef.ptr !== undefined) {
        [leftNode, rightNode] = [rightNode, leftNode];
    }
    if (leftNode.typeDef?.ptr?.size !== undefined) {
        rightNode = newBinary(ASTNodeKind.Multiplication, rightNode, newNumber(leftNode.typeDef.ptr.size));
        return newBinary(ASTNodeKind.Addition, leftNode, rightNode);
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
function ptrSub(leftNode: ASTNode, rightNode: ASTNode): ASTNode {
    addType(leftNode);
    addType(rightNode);

    if (leftNode.typeDef === undefined || rightNode.typeDef === undefined) {
        throw new Error('TypeDefinition is undefined');
    }

    if (isNumberType(leftNode.typeDef) && isNumberType(rightNode.typeDef)) {
        return newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
    }

    if (leftNode.typeDef.ptr?.size !== undefined && isNumberType(rightNode.typeDef)) {
        rightNode = newBinary(ASTNodeKind.Multiplication, rightNode, newNumber(leftNode.typeDef.ptr.size));
        addType(rightNode);
        const node = newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
        node.typeDef = leftNode.typeDef;
        return node;
    }

    if (leftNode.typeDef.ptr?.size !== undefined && rightNode.typeDef.ptr?.size !== undefined) {
        const node = newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
        node.typeDef = intTypeDefinition;
        return newBinary(ASTNodeKind.Division, node, newNumber(leftNode.typeDef.ptr.size));
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
        node = newUnary(ASTNodeKind.Dereference, ptrAdd(node, nowNode));
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
function unary(token: Token): ASTNode {
    for (const operator in unaryOperators) {
        if (isEqual(token, operator)) {
            const kind: ASTNodeKind = unaryOperators[operator];
            return handleUnaryOperation(token, kind);
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

        if (isEqual(token, 'void') && token.next !== undefined && isEqual(token.next, ')')) {
            token = token.next;
        } else {
            let nowType = declareType(token);
            token = nowToken;

            nowType = declare(token, nowType);
            token = nowToken;
            current = current.nextParameters = JSON.parse(JSON.stringify(nowType)) as TypeDefinition;
        }
    }

    type = addFunctionType(type);
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
        if (token.next.kind !== TokenType.NumericLiteral) {
            logMessage('error', 'Invalid array size', { token, position: checkTypeSuffix });
            throw new Error('Invalid array size');
        }
        const { value } = token.next;
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
        return addArray(type, value);
    }
    nowToken = token;
    return type;
}

/**
 * 为函数参数创建局部变量。Create local variables for function parameters.
 * @param {TypeDefinition | undefined} type 函数参数类型。The function parameter type.
 */
function createLocalVariablesForParameters(type: TypeDefinition | undefined): void {
    if (type !== undefined) {
        createLocalVariablesForParameters(type.nextParameters);
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { position: createLocalVariablesForParameters });
            throw new Error('Token is undefined');
        }
        newLocalVariable(getIdentifier(type.tokens), type);
    }
}

/**
 * 解析函数定义。Parse a function definition.
 * @param {Token} token 当前的令牌。The current token.
 * @returns {FunctionNode} 解析出的函数定义。The parsed function definition.
 */
function parseFunction(token: Token): FunctionNode {
    let type = declareType(token);
    token = nowToken;
    type = declare(token, type);
    token = nowToken;
    locals = undefined;

    const functionNode = new FunctionNode();

    if (type.tokens === undefined) {
        logMessage('error', 'Token is undefined', { token, position: parseFunction });
        throw new Error('Token is undefined');
    }
    functionNode.funcName = getIdentifier(type.tokens);

    createLocalVariablesForParameters(type.parameters);
    functionNode.Arguments = locals;

    const nextToken = skipToken(token, '{');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseFunction });
        throw new Error('Unexpected end of input');
    }
    token = nextToken;
    functionNode.body = blockStatement(token);
    functionNode.locals = locals;
    return functionNode;
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

    const head: ASTNode = { nodeKind: ASTNodeKind.Return };
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

        startToken = nowToken;
    }
    const nextToken = skipToken(startToken, ')');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: functionCall });
        throw new Error('Unexpected end of input');
    }
    nowToken = nextToken;

    const node = newNode(ASTNodeKind.FunctionCall);
    node.functionDef = getIdentifier(token);
    node.functionArgs = head.nextNode;
    return node;
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
        type = pointerTo(type);
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
 * 产生式为：主表达式 ::= '(' 表达式 ')' | 标识符 | 数字字面量 | 函数调用
 * Production rule: primary ::= '(' expression ')' | Identifier | NumericLiteral | functionCall
 * @param {Token} token 代表主表达式的令牌。The token representing the primary expression.
 * @returns {ASTNode} 代表主表达式的抽象语法树节点。The abstract syntax tree node representing the primary expression.
 */
function primary(token: Token): ASTNode {
    if (isEqual(token, '(')) {
        let returnNode;
        ({ returnNode, token } = bracketsPrimary(token));
        return returnNode;
    }
    if (isEqual(token, 'sizeof')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        if (isEqual(token.next, '(') && token.next.next !== undefined && isVariableTypeDefinition(token.next.next)) {
            let returnNode;
            ({ returnNode, token } = sizeofVariableType(token.next.next));
            return returnNode;
        }
        return sizeofVariable(token.next);
    }

    if (token.kind === TokenType.Identifier) {
        if (token.next !== undefined && isEqual(token.next, '(')) {
            return functionCall(token);
        }

        return identifierPrimary(token);
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
    if (token.next !== undefined) {
        nowToken = token.next;
    }
    if (variableNode === undefined) {
        logMessage('error', 'Variable not found', { token, position: primary });
        throw new Error('Variable not found');
    }
    return newVariableNode(variableNode);
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
    addType(node);
    if (node?.typeDef?.size === undefined) {
        logMessage('error', 'TypeDefinition is undefined', { token, position: primary });
        throw new Error('TypeDefinition is undefined');
    }
    return newNumber(node.typeDef.size);
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
    return { returnNode: newNumber(type.size), token };
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
 * 解析代码段。Parse a piece of code.
 * @param {Token[]} tokens 代表代码的令牌流。The token stream representing the code.
 * @returns {FunctionNode} 代表代码的抽象语法树节点簇。The abstract syntax tree node representing the code.
 */
export function parse(tokens: Token[]): FunctionNode {
    locals = undefined;
    const head: FunctionNode = { stackSize: 0, funcName: '' };
    let current: FunctionNode = head;

    let token = tokens[0];
    while (token.kind !== TokenType.EndOfFile) {
        current = current.returnFunc = parseFunction(token);
        token = nowToken;
    }
    if (head.returnFunc === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parse });
        throw new Error('Unexpected end of input');
    }
    return head.returnFunc;
}
