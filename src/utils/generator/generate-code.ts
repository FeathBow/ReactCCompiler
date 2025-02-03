import { alignToNearest } from '../commons';
import { ASTNodeKind, ASTNodeType } from '../enums';
import { type TypeDefinition, type ASTNode, FunctionNode, Variable, SymbolEntry } from '../classes';
import { logMessage } from '../logger';
import { generateExpressionHandlerMap } from '../parser/handlers';
import { sizeToStoreOperation, sizeToLoadOperation } from '../parser/operation';
import GenerateContext from './generate-context';

/**
 * 代码生成器。Code generator.
 */
class CodeGenerator {
    // 寄存器列表。Register list.
    private readonly reg64ForArguments: string[] = ['%rdi', '%rsi', '%rdx', '%rcx', '%r8', '%r9'];
    private readonly reg32ForArguments: string[] = ['%edi', '%esi', '%edx', '%ecx', '%r8d', '%r9d'];
    private readonly reg16ForArguments: string[] = ['%di', '%si', '%dx', '%cx', '%r8w', '%r9w'];
    private readonly reg8ForArguments: string[] = ['%dil', '%sil', '%dl', '%cl', '%r8b', '%r9b'];

    // 根据数据大小选择相应的寄存器。Select the appropriate register based on the data size.
    private readonly sizeToRegForArguments: Record<number | 'default', string[]> = {
        1: this.reg8ForArguments,
        2: this.reg16ForArguments,
        4: this.reg32ForArguments,
        default: this.reg64ForArguments,
    };

    /**
     * 构造函数。Constructor
     * 将上下文作为 CodeGenerator 的成员。Make the context a member of CodeGenerator.
     * @param {GenerateContext} ctx 上下文。Context.
     * @returns {void} 空。Void.
     */
    constructor(private readonly ctx: GenerateContext) {}

    /**
     * 处理 AST 错误。Handle AST errors.
     * @param {ASTNode} node 节点。Node.
     * @param {string} message 消息。Message.
     * @param {ASTNodeKind} kind 节点类型。Node type.
     * @param {Function} caller 调用者。Caller.
     * @returns {never} 永远不返回。Never return.
     */
    private handleASTError(node: ASTNode, message: string, kind: ASTNodeKind, caller: Function): never {
        logMessage('error', message, {
            node,
            position: caller,
            case: kind,
        });
        throw new Error(message);
    }

    /**
     * 将值加载到寄存器中。Load a value into a register.
     * @param {TypeDefinition} type 类型。Type.
     * @returns {void} 空。Void.
     */
    private load(type: TypeDefinition): void {
        const returnType = [ASTNodeType.Array, ASTNodeType.Struct, undefined].includes(type.type);
        if (!returnType) {
            const operation = sizeToLoadOperation[type.size] ?? sizeToLoadOperation.default;
            this.ctx.addLine(`  ${operation}`);
        }
    }

    /**
     * 将值存储到内存中。Store a value to memory.
     * @param {TypeDefinition} type 类型。Type.
     * @returns {void} 空。Void.
     */
    private store(type: TypeDefinition): void {
        this.popFromStack('%rdi');
        if (type.type === ASTNodeType.Struct) {
            for (let i = 0; i < type.size; i++) {
                this.ctx.addLine(`  mov ${i}(%rax), %r8`);
                this.ctx.addLine(`  mov %r8, ${i}(%rdi)`);
            }
            return;
        }
        if (type.size !== undefined) {
            const operation = sizeToStoreOperation[type.size] ?? sizeToStoreOperation.default;
            this.ctx.addLine(`  ${operation}`);
        }
    }

    /**
     * 定义表达式处理器映射。Define the expression handler mapping.
     * @type {generateExpressionHandlerMap}
     */
    private readonly generateExpressionHandlers: generateExpressionHandlerMap = {
        [ASTNodeKind.Number]: (node: ASTNode) => {
            if (node.numberValue === undefined)
                this.handleASTError(node, 'Invalid number', ASTNodeKind.Number, this.generateExpression);
            this.ctx.addLine(`  mov $${node.numberValue}, %rax`);
        },
        [ASTNodeKind.Negation]: (node: ASTNode) => {
            if (node.leftNode === undefined)
                this.handleASTError(node, 'Invalid negation', ASTNodeKind.Negation, this.generateExpression);
            this.generateExpression(node.leftNode);
            this.ctx.addLine(`  neg %rax`);
        },
        [ASTNodeKind.Dereference]: (node: ASTNode) => {
            if (node.leftNode === undefined)
                this.handleASTError(node, 'Invalid dereference', ASTNodeKind.Dereference, this.generateExpression);
            this.generateExpression(node.leftNode);
            if (node.typeDef === undefined)
                this.handleASTError(node, 'Invalid type', ASTNodeKind.Dereference, this.generateExpression);
            this.load(node.typeDef);
        },
        [ASTNodeKind.AddressOf]: (node: ASTNode) => {
            if (node.leftNode === undefined)
                this.handleASTError(node, 'Invalid address', ASTNodeKind.AddressOf, this.generateExpression);
            this.generateAddress(node.leftNode);
        },
        [ASTNodeKind.Variable]: (node: ASTNode) => {
            this.generateAddress(node);
            if (node.typeDef === undefined)
                this.handleASTError(node, 'Invalid variable', ASTNodeKind.Variable, this.generateExpression);
            this.load(node.typeDef);
        },
        [ASTNodeKind.Assignment]: (node: ASTNode) => {
            if (node.leftNode === undefined || node.rightNode === undefined)
                this.handleASTError(node, 'Invalid assignment', ASTNodeKind.Assignment, this.generateExpression);
            this.generateAddress(node.leftNode);
            this.pushToStack();
            this.generateExpression(node.rightNode);
            if (node.typeDef === undefined)
                this.handleASTError(node, 'Invalid type', ASTNodeKind.Assignment, this.generateExpression);
            this.store(node.typeDef);
        },
        [ASTNodeKind.FunctionCall]: (node: ASTNode) => {
            if (node.functionDef === undefined)
                this.handleASTError(node, 'Invalid function call', ASTNodeKind.FunctionCall, this.generateExpression);

            let nowArgument = node.functionArgs;
            let argumentNumber = -1;
            while (nowArgument !== undefined) {
                this.generateExpression(nowArgument);
                this.pushToStack();
                nowArgument = nowArgument.nextNode;
                argumentNumber += 1;
            }

            while (argumentNumber >= 0) {
                this.popFromStack(this.reg64ForArguments[argumentNumber]);
                argumentNumber -= 1;
            }
            this.ctx.addLine(`  mov $0, %rax`);
            this.ctx.addLine(`  call ${node.functionDef}`);
        },
        [ASTNodeKind.Comma]: (node: ASTNode) => {
            if (node.leftNode === undefined || node.rightNode === undefined)
                this.handleASTError(node, 'Invalid comma', ASTNodeKind.Comma, this.generateExpression);
            this.generateExpression(node.leftNode);
            this.generateExpression(node.rightNode);
        },
        [ASTNodeKind.DotAccess]: (node: ASTNode) => {
            this.generateAddress(node);
            if (node.typeDef === undefined)
                this.handleASTError(node, 'Invalid object member', ASTNodeKind.DotAccess, this.generateExpression);
            this.load(node.typeDef);
        },
    };

    /**
     * 生成表达式。Generate an expression.
     * @param {ASTNode} node 节点。Node.
     * @returns {void} 空。Void.
     */
    private generateExpression(node: ASTNode): void {
        const handler = this.generateExpressionHandlers[node.nodeKind];
        if (handler !== undefined) {
            handler(node);
            return;
        }
        if (node.leftNode === undefined || node.rightNode === undefined)
            this.handleASTError(node, 'Invalid expression', node.nodeKind, this.generateExpression);
        this.generateExpression(node.rightNode);
        this.pushToStack();
        this.generateExpression(node.leftNode);
        this.popFromStack('%rdi');

        switch (node.nodeKind) {
            case ASTNodeKind.Addition:
                this.ctx.addLine(`  add %rdi, %rax`);
                break;
            case ASTNodeKind.Subtraction:
                this.ctx.addLine(`  sub %rdi, %rax`);
                break;
            case ASTNodeKind.Multiplication:
                this.ctx.addLine(`  imul %rdi, %rax`);
                break;
            case ASTNodeKind.Division:
                this.ctx.addLine(`  cqo`);
                this.ctx.addLine(`  idiv %rdi`);
                break;
            case ASTNodeKind.Equality:
            case ASTNodeKind.Inequality:
            case ASTNodeKind.LessThan:
            case ASTNodeKind.LessThanOrEqual:
                this.ctx.addLine(`  cmp %rdi, %rax`);
                switch (node.nodeKind) {
                    case ASTNodeKind.Equality:
                        this.ctx.addLine(`  sete %al`);
                        break;
                    case ASTNodeKind.Inequality:
                        this.ctx.addLine(`  setne %al`);
                        break;
                    case ASTNodeKind.LessThan:
                        this.ctx.addLine(`  setl %al`);
                        break;
                    case ASTNodeKind.LessThanOrEqual:
                        this.ctx.addLine(`  setle %al`);
                        break;
                    default:
                        this.handleASTError(node, 'Invalid expression', node.nodeKind, this.generateExpression);
                }
                this.ctx.addLine(`  movzb %al, %rax`);
                break;
            default:
                this.handleASTError(node, 'Invalid expression', node.nodeKind, this.generateExpression);
        }
    }

    /**
     * 生成语句。Generate a statement.
     * @param {ASTNode} node 节点。Node.
     * @returns {void} 空。Void.
     */
    private generateStatement(node: ASTNode): void {
        switch (node.nodeKind) {
            case ASTNodeKind.Return:
                if (node.leftNode === undefined)
                    this.handleASTError(node, 'Invalid return', ASTNodeKind.Return, this.generateStatement);
                this.generateExpression(node.leftNode);
                this.ctx.addLine(`  jmp .L.return.${this.ctx.nowFunction?.name}`);
                break;
            case ASTNodeKind.ExpressionStatement:
                if (node.leftNode === undefined)
                    this.handleASTError(
                        node,
                        'Invalid statement',
                        ASTNodeKind.ExpressionStatement,
                        this.generateStatement,
                    );
                this.generateExpression(node.leftNode);
                break;
            case ASTNodeKind.Block:
                if (node.blockBody !== undefined) {
                    let blockNode: ASTNode | undefined = node.blockBody;
                    while (blockNode !== undefined) {
                        this.generateStatement(blockNode);
                        blockNode = blockNode.nextNode;
                    }
                }
                break;
            case ASTNodeKind.If: {
                const c = this.ctx.addCount();
                if (node.condition === undefined || node.trueBody === undefined)
                    this.handleASTError(node, 'Invalid if', ASTNodeKind.If, this.generateStatement);
                this.generateExpression(node.condition);
                this.ctx.addLine(`  cmp $0, %rax`);
                this.ctx.addLine(`  je  .L.else.${c}`);
                this.generateStatement(node.trueBody);
                this.ctx.addLine(`  jmp .L.end.${c}`);
                this.ctx.addLine(`.L.else.${c}:`);
                if (node.elseBody !== undefined) this.generateStatement(node.elseBody);
                this.ctx.addLine(`.L.end.${c}:`);
                break;
            }
            case ASTNodeKind.For: {
                const c = this.ctx.addCount();
                if (node.trueBody === undefined)
                    this.handleASTError(node, 'Invalid for', ASTNodeKind.For, this.generateStatement);
                if (node.initBody !== undefined) this.generateStatement(node.initBody);
                this.ctx.addLine(`.L.begin.${c}:`);
                if (node.condition !== undefined) {
                    this.generateExpression(node.condition);
                    this.ctx.addLine(`  cmp $0, %rax`);
                    this.ctx.addLine(`  je  .L.end.${c}`);
                }
                this.generateStatement(node.trueBody);
                if (node.incrementBody !== undefined) this.generateExpression(node.incrementBody);
                this.ctx.addLine(`  jmp .L.begin.${c}`);
                this.ctx.addLine(`.L.end.${c}:`);
                break;
            }
            default:
                this.handleASTError(node, 'Invalid statement', node.nodeKind, this.generateStatement);
        }
    }

    /**
     * 生成表达式时将 %rax 压入栈中。Push %rax onto the stack when generating an expression.
     * @returns {void} 空。Void.
     */
    private pushToStack(): void {
        this.ctx.addLine('  push %rax');
        this.ctx.depth++;
    }

    /**
     * 从栈中弹出数据到指定寄存器。Pop data from the stack to the specified register.
     * @param {string} register 寄存器。Register.
     * @returns {void} 空。Void.
     */
    private popFromStack(register: string): void {
        this.ctx.addLine(`  pop ${register}`);
        this.ctx.depth--;
    }

    /**
     * 生成 AST 节点的地址。Generate the address of an AST node.
     * @param {ASTNode} node 节点。Node.
     * @returns {void} 空。Void.
     */
    private generateAddress(node: ASTNode): void {
        if (node.nodeKind === ASTNodeKind.Variable && node.localVar !== undefined) {
            const address = node.localVar.isGlobal
                ? `${node.localVar.name}(%rip)`
                : `${node.localVar.offsetFromRBP}(%rbp)`;
            this.ctx.addLine(`  lea ${address}, %rax`);
            return;
        }
        if (node.nodeKind === ASTNodeKind.Dereference) {
            if (node.leftNode === undefined)
                this.handleASTError(node, 'Invalid dereference', ASTNodeKind.Dereference, this.generateAddress);
            this.generateExpression(node.leftNode);
            return;
        }
        if (node.nodeKind === ASTNodeKind.Comma) {
            if (node.leftNode === undefined || node.rightNode === undefined)
                this.handleASTError(node, 'Invalid comma', ASTNodeKind.Comma, this.generateAddress);
            this.generateExpression(node.leftNode);
            this.generateAddress(node.rightNode);
            return;
        }
        if (node.nodeKind === ASTNodeKind.DotAccess) {
            if (node.leftNode === undefined || node.members === undefined)
                this.handleASTError(node, 'Invalid object member', ASTNodeKind.DotAccess, this.generateAddress);
            this.generateAddress(node.leftNode);
            this.ctx.addLine(`  add $${node.members.offset}, %rax`);
            return;
        }
        logMessage('error', 'Not an lvalue', { node, position: this.generateAddress });
        throw new Error('not an lvalue');
    }

    /**
     * 为函数内局部变量分配偏移量。Assign offsets to local variables in a function.
     * @param {SymbolEntry} prog 符号表。Symbol table.
     * @returns {void} 空。Void.
     */
    private assignLocalVariableOffsets(prog: SymbolEntry): void {
        let localFunction: SymbolEntry | undefined = prog;
        while (localFunction !== undefined) {
            if (localFunction instanceof FunctionNode) {
                let offset = 0;
                let localVariable: Variable | undefined = localFunction.locals;
                while (localVariable !== undefined) {
                    if (localVariable?.type?.size === undefined) {
                        logMessage('error', 'Invalid variable type', {
                            position: this.assignLocalVariableOffsets,
                            function: localFunction,
                            variable: localVariable,
                        });
                        throw new Error('invalid variable type');
                    }
                    offset += localVariable.type.size;
                    if (localVariable.type.alignment === undefined) {
                        logMessage('error', 'Invalid variable type', {
                            position: this.assignLocalVariableOffsets,
                            function: localFunction,
                            variable: localVariable,
                        });
                        throw new Error('invalid variable type');
                    }
                    offset = alignToNearest(offset, localVariable.type.alignment);
                    localVariable.offsetFromRBP = -offset;
                    localVariable = localVariable.nextEntry as Variable;
                }
                localFunction.stackSize = alignToNearest(offset, 16);
            }
            localFunction = localFunction.nextEntry;
        }
    }

    /**
     * 分配全局变量的数据段。Assign the data section of global variables.
     * @param {SymbolEntry} prog 符号表。Symbol table.
     * @returns {void} 空。Void.
     */
    private assignDataSection(prog: SymbolEntry): void {
        let globalVariable: SymbolEntry | undefined = prog;
        while (globalVariable !== undefined) {
            if (globalVariable instanceof Variable) {
                if (globalVariable?.type?.size === undefined) {
                    logMessage('error', 'Invalid variable type', {
                        position: this.generateCode.bind(this),
                        function: globalVariable,
                    });
                    throw new Error('invalid variable type');
                }
                this.ctx.addLine(`  .data`);
                this.ctx.addLine(`  .globl ${globalVariable.name}`);
                this.ctx.addLine(`${globalVariable.name}:`);
                if (globalVariable.initialValue === undefined) {
                    this.ctx.addLine(`  .zero ${globalVariable.type.size}`);
                } else {
                    const bytes = Array.from(globalVariable.initialValue).map(
                        (char) => `  .byte ${char.charCodeAt(0)}`,
                    );
                    bytes.forEach((b) => this.ctx.addLine(b));
                }
            }
            globalVariable = globalVariable.nextEntry;
        }
    }

    /**
     * 分配函数的文本段并生成函数体代码。Assign the text section of a function and generate the function body code.
     * @param {SymbolEntry} prog 符号表。Symbol table.
     * @returns {void} 空。Void.
     */
    private assignTextSection(prog: SymbolEntry): void {
        let localFunction: SymbolEntry | undefined = prog;
        while (localFunction !== undefined) {
            if (localFunction instanceof FunctionNode && localFunction.declare) {
                this.ctx.nowFunction = localFunction;
                this.ctx.addLine(`  .globl ${localFunction.name}`);
                this.ctx.addLine(`  .text`);
                this.ctx.addLine(`${localFunction.name}:`);
                this.ctx.addLine(`  push %rbp`);
                this.ctx.addLine(`  mov %rsp, %rbp`);
                this.ctx.addLine(`  sub $${localFunction.stackSize}, %rsp`);

                if (localFunction.body === undefined) {
                    logMessage('error', 'Body is undefined', {
                        position: this.generateCode.bind(this),
                        function: localFunction,
                    });
                    throw new Error('body is undefined');
                }

                let nowArgument = localFunction.Arguments;
                if (nowArgument !== undefined) {
                    let argumentNumber = 0;
                    while (nowArgument !== undefined) {
                        if (nowArgument?.type?.size === undefined) {
                            logMessage('error', 'Invalid variable type', {
                                position: this.generateCode.bind(this),
                                function: localFunction,
                                variable: nowArgument,
                            });
                            throw new Error('invalid variable type');
                        }

                        const regForArguments =
                            this.sizeToRegForArguments[nowArgument.type.size] ?? this.sizeToRegForArguments.default;
                        const operation = `  mov ${regForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`;
                        this.ctx.addLine(operation);
                        nowArgument = nowArgument.nextEntry as Variable;
                        argumentNumber++;
                    }
                }

                this.generateStatement(localFunction.body);
                console.assert(this.ctx.depth === 0);
                this.ctx.addLine(`.L.return.${localFunction.name}:`);
                this.ctx.addLine(`  mov %rbp, %rsp`);
                this.ctx.addLine(`  pop %rbp`);
                this.ctx.addLine(`  ret`);
            }
            localFunction = localFunction.nextEntry;
        }
    }

    /**
     * 对外接口：生成给定 AST 的汇编代码。Public interface: generate assembly code for a given AST.
     * @async
     * @param {SymbolEntry} prog 符号表。Symbol table.
     * @returns {Promise<void>} 空。Void.
     */
    public async generateCode(prog: SymbolEntry): Promise<void> {
        // 重置上下文状态（由调用方或在上下文构造时完成）。Reset the context state (done by the caller or in the context constructor).
        this.ctx.depth = 0;
        this.ctx.generated = [];
        this.ctx.count = 0;
        this.ctx.nowFunction = undefined;

        return new Promise<void>((resolve, reject) => {
            try {
                this.assignLocalVariableOffsets(prog);
                this.assignDataSection(prog);
                this.assignTextSection(prog);
                resolve();
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
}

export default CodeGenerator;
