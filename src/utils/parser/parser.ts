import * as commons from '../commons';
import { ASTNodeType, ASTNodeKind, TokenType } from '../enums';
import {
    type ASTNode,
    type FunctionNode,
    type Variable,
    type SymbolEntry,
    ScopeManager,
    Member,
    TypeDefinition,
    Tag,
    IntermediateManager,
} from '../classes';
import { type Token, type TokenManager, Tokenizer, Tokenutils } from '../lexer';
import { logMessage } from '../logger';
import { getNodeValue, getQuadruple } from '../quadruple';
import * as handlers from './handlers';
import Creator from './creator';
import * as operators from './operators';

/**
 * Parser 类封装了解析过程，依赖注入 Tokenizer（及其内部的 TokenManager）。
 * Parser class encapsulates the parsing process, depending on the Tokenizer (and its internal TokenManager).
 */
class Parser {
    private readonly tokenizer: Tokenizer;
    private readonly tokenManager: TokenManager;
    private readonly creator: Creator;

    /**
     * 构造函数。Constructor.
     * @param {Tokenizer} tokenizer - 令牌化器。The tokenizer.
     */
    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
        this.tokenManager = tokenizer.manager;
        this.creator = new Creator();
        this.creator.initialParse();
    }

    /**
     * 解析。Parse.
     * - 解析输入的令牌流，生成抽象语法树。
     * - Parse the input token stream, generating an abstract syntax tree.
     * @returns { { globalEntry: SymbolEntry | undefined; quadrupleOutput: string } } 包含全局入口和四元输出的对象。An object containing the global entry and the quadruple output.
     */
    public parse(): { globalEntry: SymbolEntry | undefined; quadrupleOutput: string } {
        const tokens = this.tokenizer.tokenize();
        let token = tokens[0];
        while (token.kind !== TokenType.EndOfFile) {
            const type = this.declareType(token);
            token = this.tokenManager.nowToken;
            const judgeFunction =
                token.next !== undefined &&
                !Tokenutils.isEqual(token.next, ';') &&
                this.declare(token, type).type === ASTNodeType.Function;
            token = judgeFunction ? this.parseFunction(token, type) : this.parseGlobalVariable(token, type);
        }
        const quadrupleOutput = getQuadruple();
        return { globalEntry: this.creator.Globals, quadrupleOutput };
    }

    /**
     * 处理类型定义。Handle type definition.
     * @param {Token} token - 代表类型的令牌。The token representing the type.
     * @param {TypeDefinition} type - 类型定义。The type definition.
     * @returns {TypeDefinition} 类型定义。The type definition.
     */
    private readonly handleTypeDefinition: handlers.TypeDefinitionHandler = (
        token: Token,
        type: string,
    ): TypeDefinition => {
        const nextToken = Tokenutils.skipToken(token, type);
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'handleTypeDefinition' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = nextToken;
        return handlers.typeDefinitions[type];
    };

    /**
     * 创建一个新的return语句节点。Create a new return statement node.
     * - 返回语句('return' 表达式 ';')
     * - Return statement ('return' expression ';')
     * @param {Token} token 代表return语句的令牌。The token representing the return statement.
     * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
     * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
     */
    private readonly returnStatement = (token: Token): { returnNode: ASTNode; token: Token } => {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'returnStatement', condition: 'return' });
            throw new Error('Unexpected end of input');
        }
        const node = this.creator.newUnary(ASTNodeKind.Return, this.expression(token.next));
        token = this.tokenManager.nowToken;
        const nextToken = Tokenutils.skipToken(token, ';');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'returnStatement', condition: 'return' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = nextToken;
        if (node.leftNode?.functionDef === undefined) {
            IntermediateManager.getInstance().emit('return', getNodeValue(node.leftNode));
        } else {
            IntermediateManager.getInstance().emit('return', 'call', getNodeValue(node.leftNode));
        }

        return { returnNode: node, token };
    };

    /**
     * 创建一个新的while语句节点。Create a new while statement node.
     * - while语句('while' '(' 表达式 ')' 语句)
     * - While statement ('while' '(' expression ')' statement)
     * @param {Token} token 代表while语句的令牌。The token representing the while statement.
     * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
     * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
     */
    private readonly whileStatement = (token: Token): { returnNode: ASTNode; token: Token } => {
        const node = this.creator.newNode(ASTNodeKind.For);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'whileStatement', condition: 'while' });
            throw new Error('Unexpected end of input');
        }
        const conditionToken: Token | undefined = Tokenutils.skipToken(token.next, '(');
        if (conditionToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'whileStatement', condition: 'while' });
            throw new Error('Unexpected end of input');
        }

        const conditionLabel = String(IntermediateManager.getInstance().nextquad);

        node.condition = this.expression(conditionToken);
        token = this.tokenManager.nowToken;
        const conditionValue = getNodeValue(node.condition);
        const jumpFalseIndex = IntermediateManager.getInstance().emit('j=', conditionValue, '0');

        const outToken: Token | undefined = Tokenutils.skipToken(token, ')');
        if (outToken === undefined) {
            logMessage('error', 'Unexpected end of input', {
                token,
                position: 'whileStatement',
                condition: 'while',
            });
            throw new Error('Unexpected end of input');
        }
        node.trueBody = this.statement(outToken);

        IntermediateManager.getInstance().emit('j', undefined, undefined, conditionLabel);
        IntermediateManager.getInstance().backpatch(
            commons.makelist(String(jumpFalseIndex)),
            String(IntermediateManager.getInstance().nextquad),
        );

        return { returnNode: node, token };
    };

    /**
     * 创建一个新的for语句节点。Create a new for statement node.
     * - for语句('for' '(' 表达式? ';' 表达式? ';' 表达式? ')' 语句)
     * - For statement ('for' '(' expression? ';' expression? ';' expression? ')' statement)
     * @param {Token} token 代表for语句的令牌。The token representing the for statement.
     * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
     * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
     */
    private readonly forStatement = (token: Token): { returnNode: ASTNode; token: Token } => {
        const node = this.creator.newNode(ASTNodeKind.For);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'forStatement', condition: 'for' });
            throw new Error('Unexpected end of input');
        }
        const initToken: Token | undefined = Tokenutils.skipToken(token.next, '(');
        if (initToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'forStatement', condition: 'for' });
            throw new Error('Unexpected end of input');
        }
        node.initBody = this.expressionStatement(initToken);
        token = this.tokenManager.nowToken;

        const bIndex = IntermediateManager.getInstance().nextquad;

        if (!Tokenutils.isEqual(token, ';')) {
            node.condition = this.expression(token);
            token = this.tokenManager.nowToken;
        }

        let jumpFalseIndex: number | undefined;

        if (node.condition !== undefined) {
            const conditionValue = getNodeValue(node.condition);
            jumpFalseIndex = IntermediateManager.getInstance().emit('j=', conditionValue, '0');
        }

        let conditionToken: Token | undefined = Tokenutils.skipToken(token, ';');
        if (conditionToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'forStatement', condition: 'for' });
            throw new Error('Unexpected end of input');
        }

        const jumpTrueIndex = IntermediateManager.getInstance().emit('j');

        if (!Tokenutils.isEqual(conditionToken, ')')) {
            node.incrementBody = this.expression(conditionToken);
            token = this.tokenManager.nowToken;
            conditionToken = token;
        }

        const outToken: Token | undefined = Tokenutils.skipToken(conditionToken, ')');
        if (outToken === undefined) {
            logMessage('error', 'Unexpected end of input', {
                token,
                position: 'forStatement',
                condition: 'for',
            });
            throw new Error('Unexpected end of input');
        }

        const cIndex = IntermediateManager.getInstance().nextquad;
        IntermediateManager.getInstance().emit('j', undefined, undefined, String(bIndex));

        node.trueBody = this.statement(outToken);

        IntermediateManager.getInstance().emit('j', undefined, undefined, String(jumpTrueIndex + 1));
        IntermediateManager.getInstance().backpatch(commons.makelist(String(jumpTrueIndex)), String(cIndex + 1));

        if (node.condition !== undefined && jumpFalseIndex !== undefined) {
            IntermediateManager.getInstance().backpatch(
                commons.makelist(String(jumpFalseIndex)),
                String(IntermediateManager.getInstance().nextquad),
            );
        }

        return { returnNode: node, token };
    };

    /**
     * 创建一个新的if语句节点。Create a new if statement node.
     * - if语句('if' '(' 表达式 ')' 语句 ('else' 语句)?)
     * - If statement ('if' '(' expression ')' statement ('else' statement)?)
     * @param {Token} token 代表if语句的令牌。The token representing the if statement.
     * @returns {{returnNode: ASTNode, token: Token}} 新创建的抽象语法树节点和下一个令牌。The newly created abstract syntax tree node and the next token.
     * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
     */
    private readonly ifStatement = (token: Token): { returnNode: ASTNode; token: Token } => {
        const node = this.creator.newNode(ASTNodeKind.If);
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'ifStatement', condition: 'if' });
            throw new Error('Unexpected end of input');
        }
        const trueToken: Token | undefined = Tokenutils.skipToken(token.next, '(');
        if (trueToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'ifStatement', condition: 'if' });
            throw new Error('Unexpected end of input');
        }
        node.condition = this.expression(trueToken);
        token = this.tokenManager.nowToken;

        const conditionValue = getNodeValue(node.condition);
        const jumpFalseIndex = IntermediateManager.getInstance().emit('j=', conditionValue, '0', '-');

        const elseToken: Token | undefined = Tokenutils.skipToken(token, ')');
        if (elseToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'ifStatement', condition: 'if' });
            throw new Error('Unexpected end of input');
        }

        node.trueBody = this.statement(elseToken);
        token = this.tokenManager.nowToken;

        const jumpIndex = IntermediateManager.getInstance().emit('j');

        IntermediateManager.getInstance().backpatch(
            commons.makelist(String(jumpFalseIndex)),
            String(IntermediateManager.getInstance().nextquad),
        );

        if (Tokenutils.isEqual(token, 'else')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'ifStatement', condition: 'else' });
                throw new Error('Unexpected end of input');
            }

            node.elseBody = this.statement(token.next);
            token = this.tokenManager.nowToken;
        }

        IntermediateManager.getInstance().backpatch(
            commons.makelist(String(jumpIndex)),
            String(IntermediateManager.getInstance().nextquad),
        );

        this.tokenManager.nowToken = token;
        return { returnNode: node, token };
    };

    /**
     * 语句处理器映射。Statement handler mapping.
     * @type {Record<string, handlers.StatementHandler>}
     */
    private readonly statementHandlers: Record<string, handlers.StatementHandler> = {
        return: this.returnStatement,
        if: this.ifStatement,
        for: this.forStatement,
        while: this.whileStatement,
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
    private statement(token: Token): ASTNode {
        if (token.location !== undefined && token.location !== '') {
            if (token.location.startsWith('{')) {
                if (token.next === undefined) {
                    logMessage('error', 'Unexpected end of input', {
                        token,
                        position: 'statement',
                        condition: 'block',
                    });
                    throw new Error('Unexpected end of input');
                }
                return this.blockStatement(token.next);
            }
            for (const [prefix, handler] of Object.entries(this.statementHandlers)) {
                if (token.location.startsWith(prefix)) {
                    const { returnNode } = handler(token);
                    return returnNode;
                }
            }
        }
        return this.expressionStatement(token);
    }

    /**
     * 为成员分配偏移量。Assign offsets for members.
     * @param {TypeDefinition} type - 要处理的类型。The type to process.
     * @returns {TypeDefinition} 类型定义。The type definition.
     */
    private static assignMemberOffsets(type: TypeDefinition): TypeDefinition {
        if (type.type === ASTNodeType.Struct) {
            let offset = 0;
            let member: Member | undefined = type.members;
            while (member !== undefined) {
                const memberType = member.type;
                if (memberType?.alignment === undefined) {
                    logMessage('error', 'Invalid variable type', { position: 'assignMemberOffsets', type: memberType });
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
                    logMessage('error', 'Invalid variable type', { position: 'assignMemberOffsets', type: memberType });
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
    private parseStruct(token: Token, type: TypeDefinition): TypeDefinition {
        type = this.parseTag(token, type);
        return Parser.assignMemberOffsets(type);
    }

    /**
     * 解析标签。Parse a tag.
     * 产生式为：标签 ::= 标识符 ('{' 成员* '}')?
     * Production rule: tag ::= identifier ('{' member* '}')?
     * @param {Token} token 代表标签的令牌。The token representing the tag.
     * @param {TypeDefinition} type 类型定义。The type definition.
     * @returns {TypeDefinition} 类型定义。The type definition.
     */
    private parseTag(token: Token, type: TypeDefinition): TypeDefinition {
        let tag: Tag | undefined;
        if (token.kind === TokenType.Identifier) {
            tag = new Tag({ name: commons.getIdentifier(token), type });
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'parseTag' });
                throw new Error('Unexpected end of input');
            }
            token = token.next;
        }

        if (tag !== undefined && !Tokenutils.isEqual(token, '{')) {
            const foundTag = ScopeManager.getInstance().findTag(tag.name);
            if (foundTag !== undefined) {
                this.tokenManager.nowToken = token;
                return foundTag.type;
            }
            logMessage('error', 'Tag not found', { token, position: 'parseTag' });
            throw new Error('Tag not found');
        }

        let nextToken = Tokenutils.skipToken(token, '{');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseTag' });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        const head: Member = new Member({});
        let current: Member = head;

        while (!Tokenutils.isEqual(token, '}')) {
            const nowType = this.declareType(token);
            token = this.tokenManager.nowToken;
            let parseFirst = false;
            while (true) {
                const successConsume = Tokenutils.consumeToken(token, ';', this.tokenManager);
                token = this.tokenManager.nowToken;
                if (successConsume) break;
                if (parseFirst) {
                    nextToken = Tokenutils.skipToken(token, ',');
                    if (nextToken === undefined) {
                        logMessage('error', 'Unexpected end of input', { token, position: 'parseTag' });
                        throw new Error('Unexpected end of input');
                    }
                    token = nextToken;
                }
                parseFirst = true;
                const memberType = this.declare(token, nowType);
                token = this.tokenManager.nowToken;
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
            logMessage('error', 'Unexpected end of input', { token, position: 'parseTag' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = token.next;
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
    private parseUnion(token: Token, type: TypeDefinition): TypeDefinition {
        type = this.parseTag(token, type);
        return Parser.assignMemberOffsets(type);
    }

    /**
     * 声明类型。Declare a type.
     * 产生式为：类型定义 ::= 'int' | 'void' | 'char' | 'i64' | 'short' | 'struct'
     * Production rule: typeDefinition ::= 'int' | 'void' | 'char' | 'i64' | 'short' | 'struct'
     * @param {Token} token 代表类型的令牌。The token representing the type.
     * @returns {TypeDefinition} 类型定义。The type definition.
     */
    private declareType(token: Token): TypeDefinition {
        for (const type in handlers.typeDefinitions)
            if (Tokenutils.isEqual(token, type)) return this.handleTypeDefinition(token, type);
        if (Tokenutils.isEqual(token, 'struct')) {
            const nextToken = token.next;
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'declareType' });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
            return this.parseStruct(token, new TypeDefinition({ type: ASTNodeType.Struct, size: 0, alignment: 1 }));
        }
        if (Tokenutils.isEqual(token, 'union')) {
            const nextToken = token.next;
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'declareType' });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
            return this.parseUnion(token, new TypeDefinition({ type: ASTNodeType.Union, size: 0, alignment: 1 }));
        }
        logMessage('error', 'Unknown type', { token, position: 'declareType' });
        throw new Error('Unknown type');
    }

    /**
     * 声明。Declare.
     * @param {Token} token 代表声明的令牌。The token representing the declaration.
     * @param {TypeDefinition} type 类型定义。The type definition.
     * @returns {TypeDefinition} 类型定义。The type definition.
     */
    private declare(token: Token, type: TypeDefinition): TypeDefinition {
        while (Tokenutils.consumeToken(token, '*', this.tokenManager)) {
            token = this.tokenManager.nowToken;
            type = commons.pointerTo(type);
        }
        if (Tokenutils.isEqual(token, '(')) {
            const returnToken: Token | undefined = Tokenutils.skipToken(token, '(');
            if (returnToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'declare' });
                throw new Error('Unexpected end of input');
            }
            this.declare(returnToken, type);
            token = this.tokenManager.nowToken;
            let nextToken = Tokenutils.skipToken(token, ')');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'declare' });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
            type = this.checkTypeSuffix(token, type);
            nextToken = this.tokenManager.nowToken;
            type = this.declare(returnToken, type);
            this.tokenManager.nowToken = nextToken;
            return type;
        }
        if (token.kind !== TokenType.Identifier) {
            logMessage('error', 'Expected an identifier', { token, position: 'declare' });
            throw new Error('Expected an identifier');
        }

        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'declare' });
            throw new Error('Unexpected end of input');
        }
        const nowType = this.checkTypeSuffix(token.next, type);
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
    private parseDeclaration(token: Token): ASTNode {
        const baseType = this.declareType(token);
        token = this.tokenManager.nowToken;

        const head: ASTNode = { nodeKind: ASTNodeKind.Return, nodeNumber: -1 };
        let current: ASTNode = head;
        let parseFirst = false;

        while (!Tokenutils.isEqual(token, ';')) {
            if (parseFirst) {
                const nextToken = Tokenutils.skipToken(token, ',');
                if (nextToken === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: 'parseDeclaration' });
                    throw new Error('Unexpected end of input');
                }
                token = nextToken;
            }
            parseFirst = true;
            const type = this.declare(token, baseType);
            if (type.type === ASTNodeType.Void) {
                logMessage('error', 'Variable cannot be of type void', { token, position: 'parseDeclaration' });
                throw new Error('Variable cannot be of type void');
            }
            token = this.tokenManager.nowToken;
            if (type.tokens === undefined) {
                logMessage('error', 'Token is undefined', { token, position: 'parseDeclaration' });
                throw new Error('Token is undefined');
            }
            const variable = this.creator.newLocalVariable(commons.getIdentifier(type.tokens), type);

            if (Tokenutils.isEqual(token, '=')) {
                const leftNode = this.creator.newVariableNode(variable);
                if (token.next === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: 'parseDeclaration' });
                    throw new Error('Unexpected end of input');
                }
                const rightNode = this.assign(token.next);
                token = this.tokenManager.nowToken;
                const node = this.creator.newBinary(ASTNodeKind.Assignment, leftNode, rightNode);
                current = current.nextNode = this.creator.newUnary(ASTNodeKind.ExpressionStatement, node);

                if (rightNode.functionDef === undefined) {
                    IntermediateManager.getInstance().emit(':=', 'call', getNodeValue(rightNode), variable.name);
                } else IntermediateManager.getInstance().emit(':=', getNodeValue(rightNode), undefined, variable.name);
            } else {
                IntermediateManager.getInstance().emit(
                    'declare',
                    String(variable?.type?.type),
                    undefined,
                    variable.name,
                );
            }
        }

        const node = this.creator.newNode(ASTNodeKind.Block);
        node.blockBody = head.nextNode;
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseDeclaration' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = token.next;
        return node;
    }

    /**
     * 解析一个块语句。Parse a block statement.
     * 产生式为：块语句 ::= '{' 语句* '}'
     * Production rule: blockStatement ::= '{' statement* '}'
     * @param {Token} token 代表块语句的令牌。The token representing the block statement.
     * @returns {ASTNode} 代表块语句的抽象语法树节点。The abstract syntax tree node representing the block statement.
     */
    private blockStatement(token: Token): ASTNode {
        const head: ASTNode = { nodeKind: ASTNodeKind.Return, nodeNumber: -1 };
        let current: ASTNode = head;
        ScopeManager.getInstance().enterScope();
        while (!Tokenutils.isEqual(token, '}')) {
            current = current.nextNode = Tokenutils.isVariableTypeDefinition(token)
                ? this.parseDeclaration(token)
                : this.statement(token);
            token = this.tokenManager.nowToken;
            commons.addType(current);
        }
        ScopeManager.getInstance().leaveScope();
        const node = this.creator.newNode(ASTNodeKind.Block);
        node.blockBody = head.nextNode;
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'blockStatement' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = token.next;
        return node;
    }

    /**
     * 解析一个表达式语句。Parse an expression statement.
     * 产生式为：表达式语句 ::= 表达式? ';'
     * Production rule: expressionStatement ::= expression? ';'
     * @param {Token} token 代表表达式语句的令牌。The token representing the expression statement.
     * @returns {ASTNode} 代表表达式语句的抽象语法树节点。The abstract syntax tree node representing the expression statement.
     */
    private expressionStatement(token: Token): ASTNode {
        let node: ASTNode;
        if (Tokenutils.isEqual(token, ';')) {
            node = this.creator.newNode(ASTNodeKind.Block);
        } else {
            node = this.creator.newUnary(ASTNodeKind.ExpressionStatement, this.expression(token));
            token = this.tokenManager.nowToken;
        }
        const nextToken = Tokenutils.skipToken(token, ';');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'expressionStatement' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = nextToken;
        return node;
    }

    /**
     * 解析一个表达式。Parse an expression.
     * 产生式为：表达式 ::= 赋值表达式 (',' 表达式)?
     * Production rule: expression ::= assign (',' expr)?
     * @param {Token} token 代表表达式的令牌。The token representing the expression.
     * @returns {ASTNode} 代表表达式的抽象语法树节点。The abstract syntax tree node representing the expression.
     */
    private expression(token: Token): ASTNode {
        let node = this.assign(token);
        token = this.tokenManager.nowToken;
        if (Tokenutils.isEqual(token, ',')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'expression' });
                throw new Error('Unexpected end of input');
            }
            node = this.creator.newBinary(ASTNodeKind.Comma, node, this.expression(token.next));
            token = this.tokenManager.nowToken;
        }
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 解析一个赋值表达式。Parse an assignment expression.
     * 产生式为：赋值表达式 ::= 等式 ('=' 赋值表达式)?
     * Production rule: assign ::= equality ('=' assign)?
     * @param {Token} token 代表赋值表达式的令牌。The token representing the assignment expression.
     * @returns {ASTNode} 代表赋值表达式的抽象语法树节点。The abstract syntax tree node representing the assignment expression.
     */
    private assign(token: Token): ASTNode {
        let node = this.equality(token);
        token = this.tokenManager.nowToken;

        if (Tokenutils.isEqual(token, '=')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'assign' });
                throw new Error('Unexpected end of input');
            }
            node = this.creator.newBinary(ASTNodeKind.Assignment, node, this.assign(token.next));
            token = this.tokenManager.nowToken;
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
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 解析一个等式。Parse an equality.
     * 产生式为：等式 ::= 关系表达式 ( '==' 关系表达式 | '!=' 关系表达式 )*
     * Production rule: equality ::= relational ( '==' relational | '!=' relational )*
     * @param {Token} token 代表等式的令牌。The token representing the equality.
     * @returns {ASTNode} 代表等式的抽象语法树节点。The abstract syntax tree node representing the equality.
     */
    private equality(token: Token): ASTNode {
        let node = this.relational(token);
        token = this.tokenManager.nowToken;
        const processOperator = (operator: string): boolean => {
            if (Tokenutils.isEqual(token, operator)) {
                const kind: ASTNodeKind = operators.equalityOperators[operator];
                node = this.handleEqualityOperation(token, kind, node);
                token = this.tokenManager.nowToken;

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
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 解析一个关系表达式。Parse a relational expression.
     * 产生式为：关系表达式 ::= 加法 ( '<' 加法 | '<=' 加法 | '>' 加法 | '>=' 加法 )*
     * Production rule: relational ::= add ( '<' add | '<=' add | '>' add | '>=' add )*
     * @param {Token} token 代表关系表达式的令牌。The token representing the relational expression.
     * @returns {ASTNode} 代表关系表达式的抽象语法树节点。The abstract syntax tree node representing the relational expression.
     */
    private relational(token: Token): ASTNode {
        let node = this.add(token);
        token = this.tokenManager.nowToken;

        const processOperator = (operator: string): boolean => {
            if (Tokenutils.isEqual(token, operator)) {
                const [kind, swapNodes] = operators.relationalOperators[operator];
                node = this.handleRelationalOperation(token, kind, node, swapNodes);
                token = this.tokenManager.nowToken;

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
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 解析一个加法表达式。Parse an addition expression.
     * 产生式为：加法 ::= 乘法 ( '+' 乘法 | '-' 乘法 )*
     * Production rule: add ::= mul ( '+' mul | '-' mul )*
     * @param {Token} token 代表加法表达式的令牌。The token representing the addition expression.
     * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
     */
    private add(token: Token): ASTNode {
        let node = this.mul(token);
        token = this.tokenManager.nowToken;
        const processOperator = (operator: string): boolean => {
            if (Tokenutils.isEqual(token, operator)) {
                const kind: ASTNodeKind = operators.addOperators[operator];
                node = this.handleAddOperation(token, kind, node);
                token = this.tokenManager.nowToken;

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
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 解析一个乘法表达式。Parse a multiplication expression.
     * 产生式为：乘法 ::= 一元 ( '*' 一元 | '/' 一元 )*
     * Production rule: mul ::= unary ( '*' unary | '/' unary )*
     * @param {Token} token 代表乘法表达式的令牌。The token representing the multiplication expression.
     * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
     */
    private mul(token: Token): ASTNode {
        let node = this.unary(token);
        token = this.tokenManager.nowToken;
        const processOperator = (operator: string): boolean => {
            if (Tokenutils.isEqual(token, operator)) {
                const kind: ASTNodeKind = operators.mulOperators[operator];
                node = this.handleMulOperation(token, kind, node);
                token = this.tokenManager.nowToken;

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
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 处理指针加法。Handle pointer addition.
     * @param {ASTNode} leftNode 左节点。The left node.
     * @param {ASTNode} rightNode 右节点。The right node.
     * @returns {ASTNode} 代表指针加法的抽象语法树节点。The abstract syntax tree node representing the pointer addition.
     */
    private ptrAdd(leftNode: ASTNode, rightNode: ASTNode): ASTNode {
        commons.addType(leftNode);
        commons.addType(rightNode);

        if (leftNode.typeDef === undefined || rightNode.typeDef === undefined)
            throw new Error('TypeDefinition is undefined');

        if (commons.isNumberType(leftNode.typeDef) && commons.isNumberType(rightNode.typeDef))
            return this.creator.newBinary(ASTNodeKind.Addition, leftNode, rightNode);

        if (leftNode.typeDef.ptr !== undefined && rightNode.typeDef.ptr !== undefined) {
            logMessage('error', 'Invalid operands', { leftNode, rightNode, position: 'ptrAdd' });
            throw new Error('Invalid operands');
        }
        if (leftNode.typeDef.ptr === undefined && rightNode.typeDef.ptr !== undefined)
            [leftNode, rightNode] = [rightNode, leftNode];

        if (leftNode.typeDef?.ptr?.size !== undefined) {
            rightNode = this.creator.newBinary(
                ASTNodeKind.Multiplication,
                rightNode,
                this.creator.newNumber(leftNode.typeDef.ptr.size),
            );
            return this.creator.newBinary(ASTNodeKind.Addition, leftNode, rightNode);
        }
        logMessage('error', 'Invalid operands', { leftNode, rightNode, position: 'ptrAdd' });
        throw new Error('Invalid operands');
    }

    /**
     * 处理指针减法。Handle pointer subtraction.
     * @param {ASTNode} leftNode 左节点。The left node.
     * @param {ASTNode} rightNode 右节点。The right node.
     * @returns {ASTNode} 代表指针减法的抽象语法树节点。The abstract syntax tree node representing the pointer subtraction.
     */
    private ptrSub(leftNode: ASTNode, rightNode: ASTNode): ASTNode {
        commons.addType(leftNode);
        commons.addType(rightNode);

        if (leftNode.typeDef === undefined || rightNode.typeDef === undefined)
            throw new Error('TypeDefinition is undefined');

        if (commons.isNumberType(leftNode.typeDef) && commons.isNumberType(rightNode.typeDef))
            return this.creator.newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);

        if (leftNode.typeDef.ptr?.size !== undefined && commons.isNumberType(rightNode.typeDef)) {
            rightNode = this.creator.newBinary(
                ASTNodeKind.Multiplication,
                rightNode,
                this.creator.newNumber(leftNode.typeDef.ptr.size),
            );
            commons.addType(rightNode);
            const node = this.creator.newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
            node.typeDef = leftNode.typeDef;
            return node;
        }

        if (leftNode.typeDef.ptr?.size !== undefined && rightNode.typeDef.ptr?.size !== undefined) {
            const node = this.creator.newBinary(ASTNodeKind.Subtraction, leftNode, rightNode);
            node.typeDef = commons.intTypeDefinition;
            return this.creator.newBinary(
                ASTNodeKind.Division,
                node,
                this.creator.newNumber(leftNode.typeDef.ptr.size),
            );
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
    private parseArrayAccess(token: Token, node: ASTNode): [ASTNode, Token] {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseArrayAccess' });
            throw new Error('Unexpected end of input');
        }
        const nowNode = this.expression(token.next);
        token = this.tokenManager.nowToken;
        const nextToken = Tokenutils.skipToken(token, ']');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseArrayAccess' });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        const primaryNode = node;
        node = this.creator.newUnary(ASTNodeKind.Dereference, this.ptrAdd(node, nowNode));

        IntermediateManager.getInstance().emit(
            '=[]',
            getNodeValue(primaryNode),
            getNodeValue(nowNode),
            getNodeValue(node),
        );
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
    private parseDotAccess(token: Token, node: ASTNode): [ASTNode, Token] {
        const nextToken = token.next;
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseDotAccess' });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        commons.addType(node);
        if (node.typeDef === undefined) throw new Error('TypeDefinition is undefined');
        if (node.typeDef.type !== ASTNodeType.Struct && node.typeDef.type !== ASTNodeType.Union)
            throw new Error('Type is not a struct or union');
        const nowNode = this.creator.newUnary(ASTNodeKind.DotAccess, node);
        let foundMember: Member | undefined = node.typeDef?.members;
        while (foundMember !== undefined) {
            if (foundMember.token === undefined) throw new Error('Token is undefined');
            if (commons.getIdentifier(token) === commons.getIdentifier(foundMember.token)) break;
            foundMember = foundMember.nextMember;
        }
        if (foundMember === undefined) {
            logMessage('error', 'Member not found in struct', { token, position: 'parseDotAccess' });
            throw new Error(`Member ${commons.getIdentifier(token)} not found in struct`);
        }
        nowNode.members = foundMember;
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseDotAccess' });
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
    private parsePostfix(token: Token): ASTNode {
        let node = this.primary(token);
        token = this.tokenManager.nowToken;
        while (true) {
            if (Tokenutils.isEqual(token, '[')) [node, token] = this.parseArrayAccess(token, node);
            else if (Tokenutils.isEqual(token, '.')) [node, token] = this.parseDotAccess(token, node);
            else if (Tokenutils.isEqual(token, '->')) {
                node = this.creator.newUnary(ASTNodeKind.Dereference, node);
                [node, token] = this.parseDotAccess(token, node);
            } else break;
        }
        this.tokenManager.nowToken = token;
        return node;
    }

    /**
     * 解析一个一元表达式。Parse a unary expression.
     * 产生式为：一元 ::= '+' 一元 | '-' 一元 | '&' 一元 | '*' 一元 | 数组访问表达式
     * Production rule: unary ::= '+' unary | '-' unary | '&' unary | '*' unary | arrayAccess
     * @param {Token} token 代表一元表达式的令牌。The token representing the unary expression.
     * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
     */
    private unary(token: Token): ASTNode {
        for (const operator in operators.unaryOperators) {
            if (Tokenutils.isEqual(token, operator)) {
                const kind: ASTNodeKind = operators.unaryOperators[operator];
                const node = this.handleUnaryOperation(token, kind);

                IntermediateManager.getInstance().emit(
                    operator,
                    getNodeValue(node.leftNode),
                    undefined,
                    getNodeValue(node),
                );

                return node;
            }
        }
        return this.parsePostfix(token);
    }

    /**
     * 解析函数参数列表，将类型转换为函数类型。Parse the function parameter list and convert the type to a function type.
     * 函数参数列表 ::= '(' (类型声明 (',' 类型声明)*)? ')'
     * Function parameter list ::= '(' (declaration (',' declaration)*)? ')'
     * @param {Token} token 当前的令牌。The current token.
     * @param {TypeDefinition} type 当前的类型。The current type.
     * @returns {TypeDefinition} 存在函数参数列表，返回函数类型。If there is a function parameter list, return the function type.
     */
    private checkTypeFunction(token: Token, type: TypeDefinition): TypeDefinition {
        const head: TypeDefinition = new TypeDefinition({ type: ASTNodeType.Void, size: 0, alignment: 0 });
        let current: TypeDefinition = head;
        while (!Tokenutils.isEqual(token, ')')) {
            if (current !== head) {
                const nextToken = Tokenutils.skipToken(token, ',');
                if (nextToken === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: 'checkTypeFunction' });
                    throw new Error('Unexpected end of input');
                }
                token = nextToken;
            }

            if (Tokenutils.isEqual(token, 'void') && token.next !== undefined && Tokenutils.isEqual(token.next, ')'))
                token = token.next;
            else {
                let nowType = this.declareType(token);
                token = this.tokenManager.nowToken;

                nowType = this.declare(token, nowType);
                token = this.tokenManager.nowToken;
                current = current.nextParameters = JSON.parse(JSON.stringify(nowType)) as TypeDefinition;
            }
        }

        type = commons.addFunctionType(type);
        type.parameters = head.nextParameters;
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'checkTypeFunction' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = token.next;
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
    private checkTypeSuffix(token: Token, type: TypeDefinition): TypeDefinition {
        if (Tokenutils.isEqual(token, '(')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'checkTypeSuffix' });
                throw new Error('Unexpected end of input');
            }
            return this.checkTypeFunction(token.next, type);
        }

        if (Tokenutils.isEqual(token, '[')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'checkTypeSuffix' });
                throw new Error('Unexpected end of input');
            }
            if (token.next.kind !== TokenType.NumericLiteral) {
                logMessage('error', 'Invalid array size', { token, position: 'checkTypeSuffix' });
                throw new Error('Invalid array size');
            }
            const { numericValue: value } = token.next;
            if (value === undefined) {
                logMessage('error', 'Number is undefined', { token, position: 'checkTypeSuffix' });
                throw new Error('Number is undefined');
            }
            if (token.next.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'checkTypeSuffix' });
                throw new Error('Unexpected end of input');
            }
            const nextToken = Tokenutils.skipToken(token.next.next, ']');
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'checkTypeSuffix' });
                throw new Error('Unexpected end of input');
            }
            token = nextToken;
            type = this.checkTypeSuffix(token, type);
            return commons.addArray(type, value);
        }
        this.tokenManager.nowToken = token;
        return type;
    }

    /**
     * 解析函数定义。Parse a function definition.
     * @param {Token} token 当前的令牌。The current token.
     * @param {TypeDefinition} type 函数类型。The function type.
     * @returns {Token} 下一个令牌。The next token.
     */
    private parseFunction(token: Token, type: TypeDefinition): Token {
        type = this.declare(token, type);
        token = this.tokenManager.nowToken;
        if (type.tokens === undefined) {
            logMessage('error', 'Token is undefined', { token, position: 'parseFunction' });
            throw new Error('Token is undefined');
        }
        const isDeclare = Tokenutils.consumeToken(token, ';', this.tokenManager);
        token = this.tokenManager.nowToken;
        const nowEntry = this.creator.newGlobalEntry(
            commons.getIdentifier(type.tokens),
            type,
            true,
            !isDeclare,
        ) as FunctionNode;
        if (nowEntry.declare === false) return token;

        this.creator.Locals = undefined;
        IntermediateManager.getInstance().emit('begin', nowEntry.name, type.type);
        ScopeManager.getInstance().enterScope();
        this.creator.createLocalVariablesForParameters(type.parameters);
        nowEntry.Arguments = this.creator.Locals;

        const nextToken = Tokenutils.skipToken(token, '{');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'parseFunction' });
            throw new Error('Unexpected end of input');
        }
        token = nextToken;
        nowEntry.body = this.blockStatement(token);
        token = this.tokenManager.nowToken;
        nowEntry.locals = this.creator.Locals;
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
    private functionCall(token: Token): ASTNode {
        if (token?.next?.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'functionCall' });
            throw new Error('Unexpected end of input');
        }
        let startToken = token.next.next;

        const head: ASTNode = { nodeKind: ASTNodeKind.Return, nodeNumber: -1 };
        let current: ASTNode = head;

        while (!Tokenutils.isEqual(startToken, ')')) {
            if (current !== head) {
                const nextToken = Tokenutils.skipToken(startToken, ',');
                if (nextToken === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: 'functionCall' });
                    throw new Error('Unexpected end of input');
                }
                startToken = nextToken;
            }
            current = current.nextNode = this.assign(startToken);

            if (current.functionDef === undefined) IntermediateManager.getInstance().emit('arg', getNodeValue(current));
            else IntermediateManager.getInstance().emit('arg', 'call', getNodeValue(current));

            startToken = this.tokenManager.nowToken;
        }
        const nextToken = Tokenutils.skipToken(startToken, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'functionCall' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = nextToken;

        const node = this.creator.newNode(ASTNodeKind.FunctionCall);
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
    private parseGlobalVariable(token: Token, type: TypeDefinition): Token {
        let judgeFirst = true;
        while (true) {
            const judge = Tokenutils.consumeToken(token, ';', this.tokenManager);
            token = this.tokenManager.nowToken;
            if (judge) break;
            if (!judgeFirst) {
                const nextToken = Tokenutils.skipToken(token, ',');
                if (nextToken === undefined) {
                    logMessage('error', 'Unexpected end of input', { token, position: 'parseGlobalVariable' });
                    throw new Error('Unexpected end of input');
                }
                token = nextToken;
            }
            judgeFirst = false;
            const nowType = this.declare(token, type);
            token = this.tokenManager.nowToken;
            if (nowType.tokens === undefined) {
                logMessage('error', 'Token is undefined', { token, position: 'parseGlobalVariable' });
                throw new Error('Token is undefined');
            }
            this.creator.newGlobalEntry(commons.getIdentifier(nowType.tokens), nowType, false);
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
    private parseAbstractDeclarator(token: Token, type: TypeDefinition): TypeDefinition {
        while (Tokenutils.isEqual(token, '*')) {
            type = commons.pointerTo(type);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'parseAbstractDeclarator' });
                throw new Error('Unexpected end of input');
            }
            token = token.next;
        }

        if (Tokenutils.isEqual(token, '(')) {
            const nextToken = token.next;
            if (nextToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'parseAbstractDeclarator' });
                throw new Error('Unexpected end of input');
            }
            this.parseAbstractDeclarator(nextToken, type);
            token = this.tokenManager.nowToken;
            const outToken = Tokenutils.skipToken(token, ')');
            if (outToken === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'parseAbstractDeclarator' });
                throw new Error('Unexpected end of input');
            }
            token = outToken;
            type = this.checkTypeSuffix(token, type);
            return this.parseAbstractDeclarator(nextToken, type);
        }
        return this.checkTypeSuffix(token, type);
    }

    /**
     * 解析类型。Parse a type.
     * 产生式为：类型 ::= 类型标识符 ('*' 类型标识符)*
     * Production rule: type ::= typeIdentifier ('*' typeIdentifier)*
     * @param {Token} token 代表类型的令牌。The token representing the type.
     * @returns {TypeDefinition} 代表类型的抽象语法树节点。The abstract syntax tree node representing the type.
     */
    private parseType(token: Token): TypeDefinition {
        const type: TypeDefinition = this.declareType(token);
        token = this.tokenManager.nowToken;
        return this.parseAbstractDeclarator(token, type);
    }

    /**
     * 解析一个主表达式。Parse a primary expression.
     * 产生式为：主表达式 ::= '(' 表达式 ')' | 标识符 | 数字字面量 | 函数调用 | 字符串字面量
     * Production rule: primary ::= '(' expression ')' | Identifier | NumericLiteral | functionCall | stringLiteral
     * @param {Token} token 代表主表达式的令牌。The token representing the primary expression.
     * @returns {ASTNode} 代表主表达式的抽象语法树节点。The abstract syntax tree node representing the primary expression.
     */
    private primary(token: Token): ASTNode {
        if (Tokenutils.isEqual(token, '(')) {
            const { returnNode } = this.bracketsPrimary(token);
            return returnNode;
        }
        if (Tokenutils.isEqual(token, 'sizeof')) {
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'primary' });
                throw new Error('Unexpected end of input');
            }
            if (
                Tokenutils.isEqual(token.next, '(') &&
                token.next.next !== undefined &&
                Tokenutils.isVariableTypeDefinition(token.next.next)
            ) {
                const { returnNode } = this.sizeofVariableType(token.next.next);

                IntermediateManager.getInstance().emit(
                    'sizeof',
                    String(returnNode.numberValue),
                    undefined,
                    getNodeValue(returnNode),
                );

                return returnNode;
            }
            const sizeofNode = this.sizeofVariable(token.next);

            IntermediateManager.getInstance().emit(
                'sizeof',
                String(sizeofNode.numberValue),
                undefined,
                getNodeValue(sizeofNode),
            );

            return sizeofNode;
        }

        if (token.kind === TokenType.Identifier) {
            if (token.next !== undefined && Tokenutils.isEqual(token.next, '(')) return this.functionCall(token);
            return this.identifierPrimary(token);
        }

        if (token.kind === TokenType.StringLiteral) {
            if (token.stringType === undefined) {
                logMessage('error', 'String type is undefined', { token, position: 'primary' });
                throw new Error('String type is undefined');
            }
            const node = this.creator.newStringLiteral(token.stringValue, token.stringType) as Variable;
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'primary' });
                throw new Error('Unexpected end of input');
            }
            this.tokenManager.nowToken = token.next;

            IntermediateManager.getInstance().emit('=', token.stringValue, undefined, `LC${node.name}`);

            return this.creator.newVariableNode(node);
        }

        if (token.kind === TokenType.NumericLiteral) {
            if (token.numericValue === undefined) {
                logMessage('error', 'Invalid number', { token, position: 'primary' });
                throw new Error('Invalid number');
            }
            const node = this.creator.newNumber(token.numericValue);
            if (token.next === undefined) {
                logMessage('error', 'Unexpected end of input', { token, position: 'primary' });
                throw new Error('Unexpected end of input');
            }
            this.tokenManager.nowToken = token.next;

            IntermediateManager.getInstance().emit('=', String(token.numericValue), undefined, `N${node.nodeNumber}`);

            return node;
        }
        logMessage('error', 'Expected an expression', { token, position: 'primary' });
        throw new Error('Expected an expression');
    }

    /**
     * 解析一个标识符主表达式。Parse an identifier primary expression.
     * Production rule: identifierPrimary ::= Identifier
     * @param {Token} token 代表标识符主表达式的令牌。The token representing the identifier primary expression.
     * @returns {ASTNode} 代表标识符主表达式的抽象语法树节点。The abstract syntax tree node representing the identifier primary expression.
     * @throws 当变量未定义或未找到时抛出错误。Throws an error when the variable is not defined or not found.
     */
    private identifierPrimary(token: Token): ASTNode {
        const variableNode = commons.findVariable(token);
        if (variableNode === undefined && token.location !== undefined && token.length !== undefined) {
            logMessage('error', 'Variable not defined', { token, position: 'identifierPrimary' });
            throw new Error('Variable not defined');
        }
        if (token.next !== undefined) this.tokenManager.nowToken = token.next;
        if (variableNode === undefined) {
            logMessage('error', 'Variable not found', { token, position: 'identifierPrimary' });
            throw new Error('Variable not found');
        }
        return this.creator.newVariableNode(variableNode);
    }

    /**
     * 解析一个sizeof变量表达式。Parse a sizeof variable expression.
     * Production rule: sizeofVariable ::= 'sizeof' Variable
     * @param {Token} token 代表sizeof变量表达式的令牌。The token representing the sizeof variable expression.
     * @returns {ASTNode} 代表sizeof变量表达式的抽象语法树节点。The abstract syntax tree node representing the sizeof variable expression.
     * @throws 当类型定义未定义时抛出错误。Throws an error when the type definition is undefined.
     */
    private sizeofVariable(token: Token): ASTNode {
        const node = this.unary(token);
        commons.addType(node);
        if (node?.typeDef?.size === undefined) {
            logMessage('error', 'TypeDefinition is undefined', { token, position: 'sizeofVariable' });
            throw new Error('TypeDefinition is undefined');
        }
        return this.creator.newNumber(node.typeDef.size);
    }

    /**
     * 解析一个sizeof变量类型表达式。Parse a sizeof variable type expression.
     * 产生式为：sizeof变量类型表达式 ::= 'sizeof' '(' 类型 ')'
     * Production rule: sizeofVariableType ::= 'sizeof' '(' Type ')'
     * @param {Token} token 代表sizeof变量类型表达式的令牌。The token representing the sizeof variable type expression.
     * @returns {{returnNode: ASTNode, token: Token}} 代表sizeof变量类型表达式的抽象语法树节点和下一个令牌。The abstract syntax tree node representing the sizeof variable type expression and the next token.
     * @throws 当输入意外结束或类型定义未定义时抛出错误。Throws an error when the input ends unexpectedly or the type definition is undefined.
     */
    private sizeofVariableType(token: Token): { returnNode: ASTNode; token: Token } {
        const type = this.parseType(token);
        token = this.tokenManager.nowToken;
        const nextToken = Tokenutils.skipToken(token, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'sizeofVariableType' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = nextToken;
        if (type.size === undefined) {
            logMessage('error', 'TypeDefinition is undefined', { token, position: 'sizeofVariableType' });
            throw new Error('TypeDefinition is undefined');
        }
        return { returnNode: this.creator.newNumber(type.size), token };
    }

    /**
     * 解析一个括号内的主表达式。Parse a brackets primary expression.
     * 产生式为：括号内的主表达式 ::= '(' 表达式 ')'
     * Production rule: bracketsPrimary ::= '(' expression ')'
     * @param {Token} token 代表括号内的主表达式的令牌。The token representing the brackets primary expression.
     * @returns {{returnNode: ASTNode, token: Token}} 代表括号内的主表达式的抽象语法树节点和下一个令牌。The abstract syntax tree node representing the brackets primary expression and the next token.
     * @throws 当输入意外结束时抛出错误。Throws an error when the input ends unexpectedly.
     */
    private bracketsPrimary(token: Token): { returnNode: ASTNode; token: Token } {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'bracketsPrimary' });
            throw new Error('Unexpected end of input');
        }
        const node = this.expression(token.next);
        token = this.tokenManager.nowToken;
        const nextToken = Tokenutils.skipToken(token, ')');
        if (nextToken === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'bracketsPrimary' });
            throw new Error('Unexpected end of input');
        }
        this.tokenManager.nowToken = nextToken;
        return { returnNode: node, token };
    }

    /**
     * 处理关系操作。Handle relational operation.
     * @param {Token} token - 代表类型的令牌。The token representing the type.
     * @param {ASTNodeKind} kind - AST节点类型。The kind of AST node.
     * @param {ASTNode} node - 当前的AST节点。The current AST node.
     * @param {boolean} swapNodes - 是否交换节点。Whether to swap nodes.
     * @returns {ASTNode} - 返回新的AST节点。Returns a new AST node.
     */
    private readonly handleRelationalOperation: handlers.RelationalHandler = (
        token: Token,
        kind: ASTNodeKind,
        node: ASTNode,
        swapNodes: boolean,
    ) => {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'handleRelationalOperation' });
            throw new Error('Unexpected end of input');
        }
        const leftNode: ASTNode = swapNodes ? this.add(token.next) : node;
        const rightNode: ASTNode = swapNodes ? node : this.add(token.next);
        return this.creator.newBinary(kind, leftNode, rightNode);
    };

    /**
     * 处理加法操作。Handle addition operation.
     * @param {Token} token - 代表加法表达式的令牌。The token representing the addition expression.
     * @param {ASTNodeKind} kind - 加法操作的种类。The kind of addition operation.
     * @param {ASTNode} left - 左操作数。The left operand.
     * @returns {ASTNode} 代表加法表达式的抽象语法树节点。The abstract syntax tree node representing the addition expression.
     */
    private readonly handleAddOperation: handlers.AddHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'handleAddOperation' });
            throw new Error('Unexpected end of input');
        }
        if (kind === ASTNodeKind.Addition) {
            return this.ptrAdd(left, this.mul(token.next));
        }
        if (kind === ASTNodeKind.Subtraction) {
            return this.ptrSub(left, this.mul(token.next));
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
    private readonly handleEqualityOperation: handlers.EqualityHandler = (
        token: Token,
        kind: ASTNodeKind,
        left: ASTNode,
    ) => {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'handleEqualityOperation' });
            throw new Error('Unexpected end of input');
        }
        return this.creator.newBinary(kind, left, this.relational(token.next));
    };

    /**
     * 处理乘法操作。Handle multiplication operation.
     * @param {Token} token - 代表乘法表达式的令牌。The token representing the multiplication expression.
     * @param {ASTNodeKind} kind - 乘法操作的种类。The kind of multiplication operation.
     * @param {ASTNode} left - 左操作数。The left operand.
     * @returns {ASTNode} 代表乘法表达式的抽象语法树节点。The abstract syntax tree node representing the multiplication expression.
     */
    private readonly handleMulOperation: handlers.MulHandler = (token: Token, kind: ASTNodeKind, left: ASTNode) => {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'handleMulOperation' });
            throw new Error('Unexpected end of input');
        }
        return this.creator.newBinary(kind, left, this.unary(token.next));
    };

    /**
     * 处理一元操作。Handle unary operation.
     * @param {Token} token - 代表一元表达式的令牌。The token representing the unary expression.
     * @param {ASTNodeKind} kind - 一元操作的种类。The kind of unary operation.
     * @returns {ASTNode} 代表一元表达式的抽象语法树节点。The abstract syntax tree node representing the unary expression.
     */
    private readonly handleUnaryOperation: handlers.UnaryHandler = (token: Token, kind: ASTNodeKind) => {
        if (token.next === undefined) {
            logMessage('error', 'Unexpected end of input', { token, position: 'handleUnaryOperation' });
            throw new Error('Unexpected end of input');
        }
        return kind === ASTNodeKind.Addition
            ? this.unary(token.next)
            : this.creator.newUnary(kind, this.unary(token.next));
    };
}

export default Parser;
