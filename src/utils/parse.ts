import * as commons from './commons';
import { ASTNodeType, ASTNodeKind, TokenType } from './enums';
import {
    type ASTNode,
    type Token,
    type FunctionNode,
    type Variable,
    type SymbolEntry,
    ScopeManager,
    TokenManager,
    Member,
    TypeDefinition,
} from './classes';
import { logMessage } from './logger';
import { skipToken, isEqual, isVariableTypeDefinition, consumeToken } from './token';
import { getNodeValue, getQuadruple } from './quadruple';
import { IntermediateManager } from './classes/intermediate-class';
import * as parser from './parser';
import { handlers } from './parser';
import Tag from './classes/tag-class';

const { creater, operators } = parser;

/**
 * 语句处理器映射。Statement handler mapping.
 * @type {Record<string, handlers.StatementHandler>}
 */
export const statementHandlers: Record<string, handlers.StatementHandler> = {
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
const handleTypeDefinition: parser.handlers.TypeDefinitionHandler = (token: Token, type: string): TypeDefinition => {
    const nextToken = skipToken(token, type);
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: declareType });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = nextToken;
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
    const node = creater.newNode(ASTNodeKind.For);
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    const conditionToken: Token | undefined = skipToken(token.next, '(');
    if (conditionToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }

    const conditionLabel = String(IntermediateManager.getInstance().nextquad);

    node.condition = expression(conditionToken);
    token = TokenManager.getInstance().nowToken;
    const conditionValue = getNodeValue(node.condition);
    const jumpFalseIndex = IntermediateManager.getInstance().emit('j=', conditionValue, '0');

    const outToken: Token | undefined = skipToken(token, ')');
    if (outToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'while' });
        throw new Error('Unexpected end of input');
    }
    node.trueBody = statement(outToken);

    IntermediateManager.getInstance().emit('j', undefined, undefined, conditionLabel);
    IntermediateManager.getInstance().backpatch(
        commons.makelist(String(jumpFalseIndex)),
        String(IntermediateManager.getInstance().nextquad),
    );

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
    const node = creater.newNode(ASTNodeKind.For);
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
    token = TokenManager.getInstance().nowToken;

    const bIndex = IntermediateManager.getInstance().nextquad;

    if (!isEqual(token, ';')) {
        node.condition = expression(token);
        token = TokenManager.getInstance().nowToken;
    }

    let jumpFalseIndex: number | undefined;

    if (node.condition !== undefined) {
        const conditionValue = getNodeValue(node.condition);
        jumpFalseIndex = IntermediateManager.getInstance().emit('j=', conditionValue, '0');
    }

    let conditionToken: Token | undefined = skipToken(token, ';');
    if (conditionToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }

    const jumpTrueIndex = IntermediateManager.getInstance().emit('j');

    if (!isEqual(conditionToken, ')')) {
        node.incrementBody = expression(conditionToken);
        token = TokenManager.getInstance().nowToken;
        conditionToken = token;
    }

    const outToken: Token | undefined = skipToken(conditionToken, ')');
    if (outToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'for' });
        throw new Error('Unexpected end of input');
    }

    const cIndex = IntermediateManager.getInstance().nextquad;
    IntermediateManager.getInstance().emit('j', undefined, undefined, String(bIndex));

    node.trueBody = statement(outToken);

    IntermediateManager.getInstance().emit('j', undefined, undefined, String(jumpTrueIndex + 1));
    IntermediateManager.getInstance().backpatch(commons.makelist(String(jumpTrueIndex)), String(cIndex + 1));

    if (node.condition !== undefined && jumpFalseIndex !== undefined) {
        IntermediateManager.getInstance().backpatch(
            commons.makelist(String(jumpFalseIndex)),
            String(IntermediateManager.getInstance().nextquad),
        );
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
    const node = creater.newNode(ASTNodeKind.If);
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
    token = TokenManager.getInstance().nowToken;

    const conditionValue = getNodeValue(node.condition);
    const jumpFalseIndex = IntermediateManager.getInstance().emit('j=', conditionValue, '0', '-');

    const elseToken: Token | undefined = skipToken(token, ')');
    if (elseToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'if' });
        throw new Error('Unexpected end of input');
    }

    node.trueBody = statement(elseToken);
    token = TokenManager.getInstance().nowToken;

    const jumpIndex = IntermediateManager.getInstance().emit('j');

    IntermediateManager.getInstance().backpatch(
        commons.makelist(String(jumpFalseIndex)),
        String(IntermediateManager.getInstance().nextquad),
    );

    if (isEqual(token, 'else')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'else' });
            throw new Error('Unexpected end of input');
        }

        node.elseBody = statement(token.next);
        token = TokenManager.getInstance().nowToken;
    }

    IntermediateManager.getInstance().backpatch(
        commons.makelist(String(jumpIndex)),
        String(IntermediateManager.getInstance().nextquad),
    );

    TokenManager.getInstance().nowToken = token;
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
    const node = creater.newUnary(ASTNodeKind.Return, expression(token.next));
    token = TokenManager.getInstance().nowToken;
    const nextToken = skipToken(token, ';');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: statement, condition: 'return' });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = nextToken;
    if (node.leftNode?.functionDef === undefined) {
        IntermediateManager.getInstance().emit('return', getNodeValue(node.leftNode));
    } else {
        IntermediateManager.getInstance().emit('return', 'call', getNodeValue(node.leftNode));
    }

    return { returnNode: node, token };
}

/**
 * 为成员分配偏移量。Assign offsets for members.
 * @param {TypeDefinition} type - 要处理的类型。The type to process.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
function assignMemberOffsets(type: TypeDefinition): TypeDefinition {
    if (type.type === ASTNodeType.Struct) {
        let offset = 0;
        let member: Member | undefined = type.members;
        while (member !== undefined) {
            const memberType = member.type;
            if (memberType?.alignment === undefined) {
                logMessage('error', 'Invalid variable type', { position: assignMemberOffsets, type: memberType });
                throw new Error('Invalid variable type');
            }
            offset = commons.alignToNearest(offset, memberType.alignment);
            member.offset = offset;
            offset += memberType.size ?? 0;
            member = member.nextMember;
            type.alignment = Math.max(type.alignment ?? 1, memberType.alignment);
        }
        type.size = commons.alignToNearest(offset, type.alignment ?? 1);
    } else if (type.type === ASTNodeType.Union) {
        let member: Member | undefined = type.members;
        while (member !== undefined) {
            const memberType = member.type;
            if (memberType?.alignment === undefined) {
                logMessage('error', 'Invalid variable type', { position: assignMemberOffsets, type: memberType });
                throw new Error('Invalid variable type');
            }
            member.offset = 0;
            member = member.nextMember;
            type.alignment = Math.max(type.alignment ?? 1, memberType.alignment);
            type.size = Math.max(type.size ?? 0, memberType.size ?? 0);
        }
        type.size = commons.alignToNearest(type.size ?? 0, type.alignment ?? 1);
    }
    return type;
}

/**
 * 解析结构体。Parse a struct.
 * 产生式为：结构体 ::= 标签 '{' 成员* '}'
 * Production rule: struct ::= tag '{' member* '}'
 * @param {Token} token 代表结构体的令牌。The token representing the struct.
 * @param {TypeDefinition} type 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
function parseStruct(token: Token, type: TypeDefinition): TypeDefinition {
    type = parseTag(token, type);
    return assignMemberOffsets(type);
}

/**
 * 解析标签。Parse a tag.
 * 产生式为：标签 ::= 标识符 ('{' 成员* '}')?
 * Production rule: tag ::= identifier ('{' member* '}')?
 * @param {Token} token 代表标签的令牌。The token representing the tag.
 * @param {TypeDefinition} type 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
function parseTag(token: Token, type: TypeDefinition): TypeDefinition {
    let tag: Tag | undefined;
    if (token.kind === TokenType.Identifier) {
        tag = new Tag({ name: commons.getIdentifier(token), type });
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: parseTag });
            throw new Error('Unexpected end of input');
        }
        token = token.next;
    }

    if (tag !== undefined && !isEqual(token, '{')) {
        const foundTag = ScopeManager.getInstance().findTag(tag.name);
        if (foundTag !== undefined) {
            TokenManager.getInstance().nowToken = token;
            return foundTag.type;
        }
        logMessage('error', 'Tag not found', { token, position: parseTag });
        throw new Error('Tag not found');
    }

    let nextToken = skipToken(token, '{');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseTag });
        throw new Error('Unexpected end of input');
    }
    token = nextToken;
    const head: Member = new Member({});
    let current: Member = head;

    while (!isEqual(token, '}')) {
        const nowType = declareType(token);
        token = TokenManager.getInstance().nowToken;
        let parseFirst = false;
        while (true) {
            const successConsume = consumeToken(token, ';');
            token = TokenManager.getInstance().nowToken;
            if (successConsume) break;
            if (parseFirst) {
                nextToken = skipToken(token, ',');
                if (nextToken === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: parseTag });
                    throw new Error('Unexpected end of input');
                }
                token = nextToken;
            }
            parseFirst = true;
            const memberType = declare(token, nowType);
            token = TokenManager.getInstance().nowToken;
            const member: Member = new Member({
                type: memberType,
                token: memberType.tokens,
                nextMember: undefined,
                offset: 0,
            });
            current = current.nextMember = member;
        }
    }
    type.members = head.nextMember?.deepCopy();
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseTag });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = token.next;
    if (tag !== undefined) ScopeManager.getInstance().declareTag(tag);
    return type;
}

/**
 * 解析联合体。Parse a union.
 * 产生式为：联合体 ::= 标签 '{' 成员* '}'
 * Production rule: union ::= tag '{' member* '}'
 * @param {Token} token 代表联合体的令牌。The token representing the union.
 * @param {TypeDefinition} type 类型定义。The type definition.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
function parseUnion(token: Token, type: TypeDefinition): TypeDefinition {
    type = parseTag(token, type);
    return assignMemberOffsets(type);
}

/**
 * 声明类型。Declare a type.
 * 产生式为：类型定义 ::= 'int' | 'void' | 'char' | 'i64' | 'short' | 'struct'
 * Production rule: typeDefinition ::= 'int' | 'void' | 'char' | 'i64' | 'short' | 'struct'
 * @param {Token} token 代表类型的令牌。The token representing the type.
 * @returns {TypeDefinition} 类型定义。The type definition.
 */
export function declareType(token: Token): TypeDefinition {
    for (const type in handlers.typeDefinitions) if (isEqual(token, type)) return handleTypeDefinition(token, type);
    if (isEqual(token, 'struct')) {
        const nextToken = token.next;
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: declareType });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        return parseStruct(token, new TypeDefinition({ type: ASTNodeType.Struct, size: 0, alignment: 1 }));
    }
    if (isEqual(token, 'union')) {
        const nextToken = token.next;
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: declareType });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        return parseUnion(token, new TypeDefinition({ type: ASTNodeType.Union, size: 0, alignment: 1 }));
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
        token = TokenManager.getInstance().nowToken;
        type = commons.pointerTo(type);
    }
    if (isEqual(token, '(')) {
        const returnToken: Token | undefined = skipToken(token, '(');
        if (returnToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: declare });
            throw new Error('Unexpected end of input');
        }
        declare(returnToken, type);
        token = TokenManager.getInstance().nowToken;
        let nextToken = skipToken(token, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: declare });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        type = checkTypeSuffix(token, type);
        nextToken = TokenManager.getInstance().nowToken;
        type = declare(returnToken, type);
        TokenManager.getInstance().nowToken = nextToken;
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
    const nowType = checkTypeSuffix(token.next, type);
    nowType.tokens = token;
    return nowType;
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
    token = TokenManager.getInstance().nowToken;

    const head: ASTNode = { nodeKind: ASTNodeKind.Return, nodeNumber: -1 };
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
        token = TokenManager.getInstance().nowToken;
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { token, position: parseDeclaration });
            throw new Error('Token is undefined');
        }
        const variable = creater.newLocalVariable(commons.getIdentifier(type.tokens), type);

        if (isEqual(token, '=')) {
            const leftNode = creater.newVariableNode(variable);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: parseDeclaration });
                throw new Error('Unexpected end of input');
            }
            const rightNode = assign(token.next);
            token = TokenManager.getInstance().nowToken;
            const node = creater.newBinary(ASTNodeKind.Assignment, leftNode, rightNode);
            current = current.nextNode = creater.newUnary(ASTNodeKind.ExpressionStatement, node);

            if (rightNode.functionDef === undefined) {
                IntermediateManager.getInstance().emit(':=', 'call', getNodeValue(rightNode), variable.name);
            } else IntermediateManager.getInstance().emit(':=', getNodeValue(rightNode), undefined, variable.name);
        } else {
            IntermediateManager.getInstance().emit('declare', String(variable?.type?.type), undefined, variable.name);
        }
    }

    const node = creater.newNode(ASTNodeKind.Block);
    node.blockBody = head.nextNode;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseDeclaration });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = token.next;
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
    const head: ASTNode = { nodeKind: ASTNodeKind.Return, nodeNumber: -1 };
    let current: ASTNode = head;
    ScopeManager.getInstance().enterScope();
    while (!isEqual(token, '}')) {
        current = current.nextNode = isVariableTypeDefinition(token) ? parseDeclaration(token) : statement(token);
        token = TokenManager.getInstance().nowToken;
        commons.addType(current);
    }
    ScopeManager.getInstance().leaveScope();
    const node = creater.newNode(ASTNodeKind.Block);
    node.blockBody = head.nextNode;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: blockStatement });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = token.next;
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
        node = creater.newNode(ASTNodeKind.Block);
    } else {
        node = creater.newUnary(ASTNodeKind.ExpressionStatement, expression(token));
        token = TokenManager.getInstance().nowToken;
    }
    const nextToken = skipToken(token, ';');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: expressionStatement });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = nextToken;
    return node;
}

/**
 * 解析一个表达式。Parse an expression.
 * 产生式为：表达式 ::= 赋值表达式 (',' 表达式)?
 * Production rule: expression ::= assign (',' expr)?
 * @param {Token} token 代表表达式的令牌。The token representing the expression.
 * @returns {ASTNode} 代表表达式的抽象语法树节点。The abstract syntax tree node representing the expression.
 */
function expression(token: Token): ASTNode {
    let node = assign(token);
    token = TokenManager.getInstance().nowToken;
    if (isEqual(token, ',')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: expression });
            throw new Error('Unexpected end of input');
        }
        node = creater.newBinary(ASTNodeKind.Comma, node, expression(token.next));
        token = TokenManager.getInstance().nowToken;
    }
    TokenManager.getInstance().nowToken = token;
    return node;
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
    token = TokenManager.getInstance().nowToken;

    if (isEqual(token, '=')) {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: assign });
            throw new Error('Unexpected end of input');
        }
        node = creater.newBinary(ASTNodeKind.Assignment, node, assign(token.next));
        token = TokenManager.getInstance().nowToken;
        if (node.rightNode?.functionDef === undefined) {
            IntermediateManager.getInstance().emit(
                ':=',
                getNodeValue(node.rightNode),
                undefined,
                getNodeValue(node.leftNode),
            );
        } else {
            IntermediateManager.getInstance().emit(
                ':=',
                'call',
                getNodeValue(node.rightNode),
                getNodeValue(node.leftNode),
            );
        }
    }
    TokenManager.getInstance().nowToken = token;
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
    token = TokenManager.getInstance().nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: ASTNodeKind = operators.equalityOperators[operator];
            node = handleEqualityOperation(token, kind, node);
            token = TokenManager.getInstance().nowToken;

            IntermediateManager.getInstance().emit(
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
    TokenManager.getInstance().nowToken = token;
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
    token = TokenManager.getInstance().nowToken;

    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const [kind, swapNodes] = operators.relationalOperators[operator];
            node = handleRelationalOperation(token, kind, node, swapNodes);
            token = TokenManager.getInstance().nowToken;

            IntermediateManager.getInstance().emit(
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
    TokenManager.getInstance().nowToken = token;
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
    token = TokenManager.getInstance().nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: ASTNodeKind = operators.addOperators[operator];
            node = handleAddOperation(token, kind, node);
            token = TokenManager.getInstance().nowToken;

            IntermediateManager.getInstance().emit(
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
    TokenManager.getInstance().nowToken = token;
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
    token = TokenManager.getInstance().nowToken;
    const processOperator = (operator: string): boolean => {
        if (isEqual(token, operator)) {
            const kind: ASTNodeKind = operators.mulOperators[operator];
            node = handleMulOperation(token, kind, node);
            token = TokenManager.getInstance().nowToken;

            IntermediateManager.getInstance().emit(
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
    TokenManager.getInstance().nowToken = token;
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
        return creater.newBinary(ASTNodeKind.Addition, leftNode, rightNode);

    if (leftNode.typeDef.ptr !== undefined && rightNode.typeDef.ptr !== undefined) {
        logMessage('error', 'Invalid operands', { leftNode, rightNode, position: ptrAdd });
        throw new Error('Invalid operands');
    }
    if (leftNode.typeDef.ptr === undefined && rightNode.typeDef.ptr !== undefined)
        [leftNode, rightNode] = [rightNode, leftNode];

    if (leftNode.typeDef?.ptr?.size !== undefined) {
        rightNode = creater.newBinary(
            ASTNodeKind.Multiplication,
            rightNode,
            creater.newNumber(leftNode.typeDef.ptr.size),
        );
        return creater.newBinary(ASTNodeKind.Addition, leftNode, rightNode);
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
        return creater.newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);

    if (leftNode.typeDef.ptr?.size !== undefined && commons.isNumberType(rightNode.typeDef)) {
        rightNode = creater.newBinary(
            ASTNodeKind.Multiplication,
            rightNode,
            creater.newNumber(leftNode.typeDef.ptr.size),
        );
        commons.addType(rightNode);
        const node = creater.newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
        node.typeDef = leftNode.typeDef;
        return node;
    }

    if (leftNode.typeDef.ptr?.size !== undefined && rightNode.typeDef.ptr?.size !== undefined) {
        const node = creater.newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
        node.typeDef = new TypeDefinition({ type: ASTNodeType.Integer, size: 4, alignment: 4 });
        return creater.newBinary(ASTNodeKind.Division, node, creater.newNumber(leftNode.typeDef.ptr.size));
    }

    throw new Error('Invalid operands');
}

/**
 * 解析数组访问表达式。Parse an array access expression.
 * 产生式为：数组访问表达式 ::= 主表达式 '[' 表达式 ']'
 * Production rule: arrayAccess ::= primary '[' expression ']'
 * @param {Token} token 代表数组访问表达式的令牌。The token representing the array access expression.
 * @param {ASTNode} node 代表数组访问表达式的抽象语法树节点。The abstract syntax tree node representing the array access expression.
 * @returns {[ASTNode, Token]} 解析得到的抽象语法树节点和下一个令牌。The parsed abstract syntax tree node and the next token.
 */
function parseArrayAccess(token: Token, node: ASTNode): [ASTNode, Token] {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parsePostfix });
        throw new Error('Unexpected end of input');
    }
    const nowNode = expression(token.next);
    token = TokenManager.getInstance().nowToken;
    const nextToken = skipToken(token, ']');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parsePostfix });
        throw new Error('Unexpected end of input');
    }
    token = nextToken;
    const primaryNode = node;
    node = creater.newUnary(ASTNodeKind.Dereference, ptrAdd(node, nowNode));

    IntermediateManager.getInstance().emit('=[]', getNodeValue(primaryNode), getNodeValue(nowNode), getNodeValue(node));
    return [node, token];
}

/**
 * 解析点访问表达式。Parse a dot access expression.
 * 产生式为：点访问表达式 ::= 主表达式 '.' 标识符
 * Production rule: dotAccess ::= primary '.' identifier
 * @param {Token} token 代表点访问表达式的令牌。The token representing the dot access expression.
 * @param {ASTNode} node 代表点访问表达式的抽象语法树节点。The abstract syntax tree node representing the dot access expression.
 * @returns {[ASTNode, Token]} 解析得到的抽象语法树节点和下一个令牌。The parsed abstract syntax tree node and the next token.
 */
function parseDotAccess(token: Token, node: ASTNode): [ASTNode, Token] {
    const nextToken = token.next;
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseDotAccess });
        throw new Error('Unexpected end of input');
    }
    token = nextToken;
    commons.addType(node);
    if (node.typeDef === undefined) throw new Error('TypeDefinition is undefined');
    if (node.typeDef.type !== ASTNodeType.Struct && node.typeDef.type !== ASTNodeType.Union)
        throw new Error('Type is not a struct or union');
    const nowNode = creater.newUnary(ASTNodeKind.DotAccess, node);
    let foundMember: Member | undefined = node.typeDef?.members;
    while (foundMember !== undefined) {
        if (foundMember.token === undefined) throw new Error('Token is undefined');
        if (commons.getIdentifier(token) === commons.getIdentifier(foundMember.token)) break;
        foundMember = foundMember.nextMember;
    }
    if (foundMember === undefined) {
        logMessage('error', 'Member not found in struct', { token, position: parseDotAccess });
        throw new Error(`Member ${commons.getIdentifier(token)} not found in struct`);
    }
    nowNode.members = foundMember;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseDotAccess });
        throw new Error('Unexpected end of input');
    }
    token = token.next;
    node = nowNode;
    return [node, token];
}

/**
 * 解析后缀表达式。Parses postfix expression.
 * 产生式为：后缀表达式 ::= 主表达式 (('[' 表达式 ']') | ('.' 标识符) | ('->' 标识符))*
 * Production rule: postfix ::= primary (('[' expression ']') | ('.' identifier) | ('->' identifier))*
 * @param {Token} token 要解析的令牌。The token to parse.
 * @returns {ASTNode} 表示解析后表达式的节点。A Node representing the parsed expression.
 */
function parsePostfix(token: Token): ASTNode {
    let node = primary(token);
    token = TokenManager.getInstance().nowToken;
    while (true) {
        if (isEqual(token, '[')) [node, token] = parseArrayAccess(token, node);
        else if (isEqual(token, '.')) [node, token] = parseDotAccess(token, node);
        else if (isEqual(token, '->')) {
            node = creater.newUnary(ASTNodeKind.Dereference, node);
            [node, token] = parseDotAccess(token, node);
        } else break;
    }
    TokenManager.getInstance().nowToken = token;
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
            const kind: ASTNodeKind = operators.unaryOperators[operator];
            const node = handleUnaryOperation(token, kind);

            IntermediateManager.getInstance().emit(
                operator,
                getNodeValue(node.leftNode),
                undefined,
                getNodeValue(node),
            );

            return node;
        }
    }
    return parsePostfix(token);
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
    const head: TypeDefinition = new TypeDefinition({ type: ASTNodeType.Void, size: 0, alignment: 0 });
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
            token = TokenManager.getInstance().nowToken;

            nowType = declare(token, nowType);
            token = TokenManager.getInstance().nowToken;
            current = current.nextParameters = JSON.parse(JSON.stringify(nowType)) as TypeDefinition;
        }
    }

    type = commons.addFunctionType(type);
    type.parameters = head.nextParameters;
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: checkTypeSuffix });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = token.next;
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
    TokenManager.getInstance().nowToken = token;
    return type;
}

/**
 * 解析函数定义。Parse a function definition.
 * @param {Token} token 当前的令牌。The current token.
 * @param {TypeDefinition} type 函数类型。The function type.
 * @returns {Token} 下一个令牌。The next token.
 */
function parseFunction(token: Token, type: TypeDefinition): Token {
    type = declare(token, type);
    token = TokenManager.getInstance().nowToken;
    if (type.tokens === undefined) {
        logMessage('error', 'Token is undefined', { token, position: parseFunction });
        throw new Error('Token is undefined');
    }
    const isDeclare = consumeToken(token, ';');
    token = TokenManager.getInstance().nowToken;
    const nowEntry = creater.newGlobalEntry(commons.getIdentifier(type.tokens), type, true, !isDeclare) as FunctionNode;
    if (nowEntry.declare === false) return token;

    creater.setLocals(undefined);
    IntermediateManager.getInstance().emit('begin', nowEntry.name, type.type);
    ScopeManager.getInstance().enterScope();
    creater.createLocalVariablesForParameters(type.parameters);
    nowEntry.Arguments = creater.getLocals();

    const nextToken = skipToken(token, '{');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: parseFunction });
        throw new Error('Unexpected end of input');
    }
    token = nextToken;
    nowEntry.body = blockStatement(token);
    token = TokenManager.getInstance().nowToken;
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

    const head: ASTNode = { nodeKind: ASTNodeKind.Return, nodeNumber: -1 };
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

        if (current.functionDef === undefined) IntermediateManager.getInstance().emit('arg', getNodeValue(current));
        else IntermediateManager.getInstance().emit('arg', 'call', getNodeValue(current));

        startToken = TokenManager.getInstance().nowToken;
    }
    const nextToken = skipToken(startToken, ')');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: functionCall });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = nextToken;

    const node = creater.newNode(ASTNodeKind.FunctionCall);
    node.functionDef = commons.getIdentifier(token);
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
        const judge = consumeToken(token, ';');
        token = TokenManager.getInstance().nowToken;
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
        const nowType = declare(token, type);
        token = TokenManager.getInstance().nowToken;
        if (nowType.tokens === undefined) {
            logMessage('error', 'Token is undefined', { token, position: parseFunction });
            throw new Error('Token is undefined');
        }
        creater.newGlobalEntry(commons.getIdentifier(nowType.tokens), nowType, false);
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
        token = TokenManager.getInstance().nowToken;
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
    token = TokenManager.getInstance().nowToken;
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

            IntermediateManager.getInstance().emit(
                'sizeof',
                String(returnNode.numberValue),
                undefined,
                getNodeValue(returnNode),
            );

            return returnNode;
        }
        const sizeofNode = sizeofVariable(token.next);

        IntermediateManager.getInstance().emit(
            'sizeof',
            String(sizeofNode.numberValue),
            undefined,
            getNodeValue(sizeofNode),
        );

        return sizeofNode;
    }

    if (token.kind === TokenType.Identifier) {
        if (token.next !== undefined && isEqual(token.next, '(')) return functionCall(token);
        return identifierPrimary(token);
    }

    if (token.kind === TokenType.StringLiteral) {
        if (token.stringType === undefined) {
            logMessage('error', 'String type is undefined', { token, position: primary });
            throw new Error('String type is undefined');
        }
        const node = creater.newStringLiteral(token.stringValue, token.stringType) as Variable;
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        TokenManager.getInstance().nowToken = token.next;

        IntermediateManager.getInstance().emit('=', token.stringValue, undefined, `LC${node.name}`);

        return creater.newVariableNode(node);
    }

    if (token.kind === TokenType.NumericLiteral) {
        if (token.numericValue === undefined) {
            logMessage('error', 'Invalid number', { token, position: primary });
            throw new Error('Invalid number');
        }
        const node = creater.newNumber(token.numericValue);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: primary });
            throw new Error('Unexpected end of input');
        }
        TokenManager.getInstance().nowToken = token.next;

        IntermediateManager.getInstance().emit('=', String(token.numericValue), undefined, `N${node.nodeNumber}`);

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
    const variableNode = commons.findVariable(token);
    if (variableNode === undefined && token.location !== undefined && token.length !== undefined) {
        logMessage('error', 'Variable not defined', { token, position: primary });
        throw new Error('Variable not defined');
    }
    if (token.next !== undefined) TokenManager.getInstance().nowToken = token.next;
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
    token = TokenManager.getInstance().nowToken;
    const nextToken = skipToken(token, ')');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: primary });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = nextToken;
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
    token = TokenManager.getInstance().nowToken;
    const nextToken = skipToken(token, ')');
    if (nextToken === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: primary });
        throw new Error('Unexpected end of input');
    }
    TokenManager.getInstance().nowToken = nextToken;
    return { returnNode: node, token };
}

/**
 * 解析代码段。Parse a piece of code.
 * @param {Token[]} tokens 代表代码的令牌流。The token stream representing the code.
 * @returns { { globalVar: SymbolEntry | undefined, quadrupleOutput: string } } 解析得到的全局 entry 和四元式输出。The parsed global entry and quadruple output.
 */
export function parse(tokens: Token[]): { globalEntry: SymbolEntry | undefined; quadrupleOutput: string } {
    creater.initialParse();
    let token = tokens[0];
    while (token.kind !== TokenType.EndOfFile) {
        const type = declareType(token);
        token = TokenManager.getInstance().nowToken;
        const judgeFunction =
            token.next !== undefined && !isEqual(token.next, ';') && declare(token, type).type === ASTNodeType.Function;
        token = judgeFunction ? parseFunction(token, type) : parseGlobalVariable(token, type);
    }
    const quadrupleOutput = getQuadruple();
    return { globalEntry: creater.getGlobals(), quadrupleOutput };
}

/**
 * 处理关系操作。Handle relational operation.
 * @param {Token} token - 代表类型的令牌。The token representing the type.
 * @param {ASTNodeKind} kind - AST节点类型。The kind of AST node.
 * @param {ASTNode} node - 当前的AST节点。The current AST node.
 * @param {boolean} swapNodes - 是否交换节点。Whether to swap nodes.
 * @returns {ASTNode} - 返回新的AST节点。Returns a new AST node.
 */
export const handleRelationalOperation: handlers.RelationalHandler = (
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
    return creater.newBinary(kind, leftNode, rightNode);
};

/**
 * 处理加法操作。Handle addition operation.
 * @param {Token} token - 代表加法表达式的令牌。The token representing the addition expression.
 * @param {ASTNodeKind} kind - 加法操作的种类。The kind of addition operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
 */
export const handleAddOperation: handlers.AddHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
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
 * 处理等式操作。Handle equality operation.
 * @param {Token} token - 代表等式的令牌。The token representing the equality.
 * @param {ASTNodeKind} kind - 等式操作的种类。The kind of equality operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表等式的抽象语法树节点。The abstract syntax tree node representing the equality.
 */
export const handleEqualityOperation: handlers.EqualityHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: equality });
        throw new Error('Unexpected end of input');
    }
    return creater.newBinary(kind, left, relational(token.next));
};

/**
 * 处理乘法操作。Handle multiplication operation.
 * @param {Token} token - 代表乘法表达式的令牌。The token representing the multiplication expression.
 * @param {ASTNodeKind} kind - 乘法操作的种类。The kind of multiplication operation.
 * @param {ASTNode} left - 左操作数。The left operand.
 * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
 */
export const handleMulOperation: handlers.MulHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: mul });
        throw new Error('Unexpected end of input');
    }
    return creater.newBinary(kind, left, unary(token.next));
};

/**
 * 处理一元操作。Handle unary operation.
 * @param {Token} token - 代表一元表达式的令牌。The token representing the unary expression.
 * @param {ASTNodeKind} kind - 一元操作的种类。The kind of unary operation.
 * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
 */
export const handleUnaryOperation: handlers.UnaryHandler = (token: Token, kind: ASTNodeKind) => {
    if (token.next === undefined) {
        logMessage('error', 'Unexpected end of input', { token, position: unary });
        throw new Error('Unexpected end of input');
    }
    return kind === ASTNodeKind.Addition ? unary(token.next) : creater.newUnary(kind, unary(token.next));
};
