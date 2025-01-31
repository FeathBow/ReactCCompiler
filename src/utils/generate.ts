import { alignToNearest } from './commons';
import { ASTNodeKind, ASTNodeType } from './enums';
import type { TypeDefinition, ASTNode } from './classes';
import { FunctionNode, Variable, SymbolEntry } from './classes';
import { logMessage } from './logger';
import { generateExpressionHandlerMap } from './parser/handlers';
import { sizeToStoreOperation, sizeToLoadOperation } from './parser/operation';

/**
 * 用于追踪当前的嵌套深度。
 * Used to track the current nesting depth.
 */
let depth = 0;

/**
 * 存储生成的代码行。
 * Stores the generated lines of code.
 */
let generated: string[] = [];

/**
 * 用于计数的变量。
 * A variable used for counting.
 */
let count = 0;

/**
 * 用于存储参数的寄存器。
 * Registers used to store arguments.
 */
const reg64ForArguments: string[] = ['%rdi', '%rsi', '%rdx', '%rcx', '%r8', '%r9'];
const reg32ForArguments: string[] = ['%edi', '%esi', '%edx', '%ecx', '%r8d', '%r9d'];
const reg16ForArguments: string[] = ['%di', '%si', '%dx', '%cx', '%r8w', '%r9w'];
const reg8ForArguments: string[] = ['%dil', '%sil', '%dl', '%cl', '%r8b', '%r9b'];

/**
 * 用于存储当前函数的变量。
 * A variable used to store the current function.
 */
let nowFunction: FunctionNode | undefined;

/**
 * 增加计数并返回新的计数值。Add to the count and return the new count value.
 * @returns {number} 返回新的计数值。Returns the new count value.
 */
function addCount(): number {
    count += 1;
    return count;
}

/**
 * 根据给定的类型定义，将值加载到寄存器中。Load a value into a register based on the given type definition.
 * @param {TypeDefinition} type 要加载的值的类型定义。The type definition of the value to load.
 */
function load(type: TypeDefinition): void {
    const returnType = [ASTNodeType.Array, ASTNodeType.Struct, undefined].includes(type.type);
    if (!returnType) {
        const operation = sizeToLoadOperation[type.size] ?? sizeToLoadOperation.default;
        generated.push(`  ${operation}`);
    }
}

/**
 * 根据给定的类型定义，将值存储到内存中。Store a value into memory based on the given type definition.
 * @param {TypeDefinition} type 要存储的值的类型定义。The type definition of the value to store.
 * @returns {void} 无返回值。No return value.
 */
function store(type: TypeDefinition): void {
    popFromStack('%rdi');
    if (type.type === ASTNodeType.Struct) {
        for (let i = 0; i < type.size; i++) {
            generated.push(`  mov ${i}(%rax), %r8`);
            generated.push(`  mov %r8, ${i}(%rdi)`);
        }
        return;
    }
    if (type.size !== undefined) {
        const operation = sizeToStoreOperation[type.size] ?? sizeToStoreOperation.default;
        generated.push(`  ${operation}`);
    }
}

/**
 * 处理AST错误。
 * Handle AST errors.
 * @param {ASTNode} node - 当前的 AST 节点。The current AST node.
 * @param {string} message - 错误消息。The error message.
 * @param {ASTNodeKind} kind - AST 节点类型。The AST node kind.
 * @param {Function} caller - 调用函数。The caller function.
 * @returns {never} 永远不会返回。Never returns.
 */
function handleASTError(node: ASTNode, message: string, kind: ASTNodeKind, caller: Function): never {
    logMessage('error', message, {
        node,
        position: caller,
        case: kind,
    });
    throw new Error(message);
}

/**
 * 生成表达式的处理程序映射。
 * Expression handler map.
 * @type {generateExpressionHandlerMap}
 */
const generateExpressionHandlers: generateExpressionHandlerMap = {
    [ASTNodeKind.Number]: (node: ASTNode) => {
        if (node.numberValue === undefined)
            handleASTError(node, 'Invalid number', ASTNodeKind.Number, generateExpression);
        generated.push(`  mov $${node.numberValue}, %rax`);
    },
    [ASTNodeKind.Negation]: (node: ASTNode) => {
        if (node.leftNode === undefined)
            handleASTError(node, 'Invalid negation', ASTNodeKind.Negation, generateExpression);
        generateExpression(node.leftNode);
        generated.push(`  neg %rax`);
    },
    [ASTNodeKind.Dereference]: (node: ASTNode) => {
        if (node.leftNode === undefined)
            handleASTError(node, 'Invalid dereference', ASTNodeKind.Dereference, generateExpression);
        generateExpression(node.leftNode);
        if (node.typeDef === undefined)
            handleASTError(node, 'Invalid type', ASTNodeKind.Dereference, generateExpression);
        load(node.typeDef);
    },
    [ASTNodeKind.AddressOf]: (node: ASTNode) => {
        if (node.leftNode === undefined)
            handleASTError(node, 'Invalid address', ASTNodeKind.AddressOf, generateExpression);
        generateAddress(node.leftNode);
    },
    [ASTNodeKind.Variable]: (node: ASTNode) => {
        generateAddress(node);
        if (node.typeDef === undefined)
            handleASTError(node, 'Invalid variable', ASTNodeKind.Variable, generateExpression);
        load(node.typeDef);
    },
    [ASTNodeKind.Assignment]: (node: ASTNode) => {
        if (node.leftNode === undefined || node.rightNode === undefined)
            handleASTError(node, 'Invalid assignment', ASTNodeKind.Assignment, generateExpression);
        generateAddress(node.leftNode);
        pushToStack();
        generateExpression(node.rightNode);
        if (node.typeDef === undefined)
            handleASTError(node, 'Invalid type', ASTNodeKind.Assignment, generateExpression);
        store(node.typeDef);
    },
    [ASTNodeKind.FunctionCall]: (node: ASTNode) => {
        if (node.functionDef === undefined)
            handleASTError(node, 'Invalid function call', ASTNodeKind.FunctionCall, generateExpression);

        let nowArgument = node.functionArgs;
        let argumentNumber = -1;
        while (nowArgument !== undefined) {
            generateExpression(nowArgument);
            pushToStack();
            nowArgument = nowArgument.nextNode;
            argumentNumber += 1;
        }

        while (argumentNumber >= 0) {
            popFromStack(reg64ForArguments[argumentNumber]);
            argumentNumber -= 1;
        }
        generated.push(`  mov $0, %rax`, `  call ${node.functionDef}`);
    },
    [ASTNodeKind.Comma]: (node: ASTNode) => {
        if (node.leftNode === undefined || node.rightNode === undefined)
            handleASTError(node, 'Invalid comma', ASTNodeKind.Comma, generateExpression);
        generateExpression(node.leftNode);
        generateExpression(node.rightNode);
    },
    [ASTNodeKind.DotAccess]: (node: ASTNode) => {
        generateAddress(node);
        if (node.typeDef === undefined)
            handleASTError(node, 'Invalid object member', ASTNodeKind.DotAccess, generateExpression);
        load(node.typeDef);
    },
};

/**
 * 根据给定的 AST 节点生成表达式。Generate an expression based on the given AST node.
 * @param {ASTNode} node 要生成表达式的 AST 节点。The AST node to generate the expression for.
 * @returns {void} 无返回值。No return value.
 */
function generateExpression(node: ASTNode): void {
    const handler = generateExpressionHandlers[node.nodeKind];
    if (handler !== undefined) {
        handler(node);
        return;
    }
    if (node.leftNode === undefined || node.rightNode === undefined)
        handleASTError(node, 'Invalid expression', node.nodeKind, generateExpression);
    generateExpression(node.rightNode);
    pushToStack();
    generateExpression(node.leftNode);
    popFromStack('%rdi');

    switch (node.nodeKind) {
        case ASTNodeKind.Addition: {
            generated.push(`  add %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Subtraction: {
            generated.push(`  sub %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Multiplication: {
            generated.push(`  imul %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Division: {
            generated.push(`  cqo`, `  idiv %rdi`);
            return;
        }
        case ASTNodeKind.Equality:
        case ASTNodeKind.Inequality:
        case ASTNodeKind.LessThan:
        case ASTNodeKind.LessThanOrEqual: {
            generated.push(`  cmp %rdi, %rax`);
            switch (node.nodeKind) {
                case ASTNodeKind.Equality: {
                    generated.push(`  sete %al`);
                    break;
                }
                case ASTNodeKind.Inequality: {
                    generated.push(`  setne %al`);
                    break;
                }
                case ASTNodeKind.LessThan: {
                    generated.push(`  setl %al`);
                    break;
                }
                case ASTNodeKind.LessThanOrEqual: {
                    generated.push(`  setle %al`);
                    break;
                }
                default: {
                    handleASTError(node, 'Invalid expression', node.nodeKind, generateExpression);
                }
            }
            generated.push(`  movzb %al, %rax`);
            return;
        }
        default: {
            handleASTError(node, 'Invalid expression', node.nodeKind, generateExpression);
        }
    }
}

/**
 * 生成给定抽象语法树节点的语句。Generate a statement for the given abstract syntax tree node.
 * @param {ASTNode} node 要生成语句的抽象语法树节点。The abstract syntax tree node to generate the statement for.
 * @returns {void} 无返回值。No return value.
 */
function generateStatement(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Return: {
            if (node.leftNode === undefined)
                handleASTError(node, 'Invalid return', ASTNodeKind.Return, generateStatement);

            generateExpression(node.leftNode);
            generated.push(`  jmp .L.return.${nowFunction?.name}`);
            return;
        }
        case ASTNodeKind.ExpressionStatement: {
            if (node.leftNode === undefined)
                handleASTError(node, 'Invalid statement', ASTNodeKind.ExpressionStatement, generateStatement);

            generateExpression(node.leftNode);
            return;
        }
        case ASTNodeKind.Block: {
            if (node.blockBody !== undefined) {
                let blockNode: ASTNode | undefined = node.blockBody;
                while (blockNode !== undefined) {
                    generateStatement(blockNode);
                    blockNode = blockNode.nextNode;
                }
            }
            return;
        }
        case ASTNodeKind.If: {
            const c = addCount();
            if (node.condition === undefined || node.trueBody === undefined)
                handleASTError(node, 'Invalid if', ASTNodeKind.If, generateStatement);
            generateExpression(node.condition);
            generated.push(`  cmp $0, %rax`, `  je  .L.else.${c}`);
            generateStatement(node.trueBody);
            generated.push(`  jmp .L.end.${c}`, `.L.else.${c}:`);
            if (node.elseBody !== undefined) generateStatement(node.elseBody);
            generated.push(`.L.end.${c}:`);
            return;
        }
        case ASTNodeKind.For: {
            const c = addCount();
            if (node.trueBody === undefined) handleASTError(node, 'Invalid for', ASTNodeKind.For, generateStatement);
            if (node.initBody !== undefined) generateStatement(node.initBody);
            generated.push(`.L.begin.${c}:`);
            if (node.condition !== undefined) {
                generateExpression(node.condition);
                generated.push(`  cmp $0, %rax`, `  je  .L.end.${c}`);
            }
            generateStatement(node.trueBody);
            if (node.incrementBody !== undefined) generateExpression(node.incrementBody);
            generated.push(`  jmp .L.begin.${c}`, `.L.end.${c}:`);
            return;
        }
        default:
            handleASTError(node, 'Invalid statement', node.nodeKind, generateStatement);
    }
}

/**
 * 为函数中的局部变量分配偏移量。Assign offsets for local variables in functions.
 * @param {FunctionNode} prog 要处理的函数节点。The function node to process.
 * @returns {void} 无返回值。No return value.
 */
function assignLocalVariableOffsets(prog: SymbolEntry): void {
    let localFunction: SymbolEntry | undefined = prog;
    while (localFunction !== undefined) {
        if (localFunction instanceof FunctionNode) {
            let offset = 0;
            let localVariable: Variable | undefined = localFunction.locals;
            while (localVariable !== undefined) {
                if (localVariable?.type?.size === undefined) {
                    logMessage('error', 'Invalid variable type', {
                        position: assignLocalVariableOffsets,
                        function: localFunction,
                        variable: localVariable,
                    });
                    throw new Error('invalid variable type');
                }
                offset += localVariable.type.size;
                if (localVariable.type.alignment === undefined) {
                    logMessage('error', 'Invalid variable type', {
                        position: assignLocalVariableOffsets,
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
 * 用于存储给定大小的寄存器。Registers for the given size.
 * @type {Record<number | 'default', string[]>}
 */
const sizeToRegForArguments: Record<number | 'default', string[]> = {
    1: reg8ForArguments,
    2: reg16ForArguments,
    4: reg32ForArguments,
    default: reg64ForArguments,
};

/**
 * 为给定函数节点分配数据段。Assign data section for the given function node.
 * @param {FunctionNode} prog 要处理的函数节点。The function node to process.
 * @returns {void} 无返回值。No return value.
 */
function assignDataSection(prog: SymbolEntry): void {
    let globalVariable: SymbolEntry | undefined = prog;
    while (globalVariable !== undefined) {
        if (globalVariable instanceof Variable) {
            if (globalVariable?.type?.size === undefined) {
                logMessage('error', 'Invalid variable type', {
                    position: generateCode,
                    function: globalVariable,
                });
                throw new Error('invalid variable type');
            }
            generated.push(`  .data`, `  .globl ${globalVariable.name}`, `${globalVariable.name}:`);
            if (globalVariable.initialValue === undefined) {
                generated.push(`  .zero ${globalVariable.type.size}`);
            } else {
                const bytes = Array.from(globalVariable.initialValue).map((char) => `  .byte ${char.charCodeAt(0)}`);
                generated.push(...bytes);
            }
        }
        globalVariable = globalVariable.nextEntry;
    }
}

/**
 * 为给定函数节点分配文本段。Assign text section for the given function node.
 * @param {FunctionNode} prog 要处理的函数节点。The function node to process.
 * @returns {void} 无返回值。No return value.
 */
function assignTextSection(prog: SymbolEntry): void {
    let localFunction: SymbolEntry | undefined = prog;
    while (localFunction !== undefined) {
        if (localFunction instanceof FunctionNode && localFunction.declare) {
            nowFunction = localFunction;
            generated.push(
                `  .globl ${localFunction.name}`,
                `  .text`,
                `${localFunction.name}:`,
                `  push %rbp`,
                `  mov %rsp, %rbp`,
                `  sub $${localFunction.stackSize}, %rsp`,
            );

            if (localFunction.body === undefined) {
                logMessage('error', 'Body is undefined', { position: generateCode, function: localFunction });
                throw new Error('body is undefined');
            }

            let nowArgument = localFunction.Arguments;
            if (nowArgument !== undefined) {
                let argumentNumber = 0;
                while (nowArgument !== undefined) {
                    if (nowArgument?.type?.size === undefined) {
                        logMessage('error', 'Invalid variable type', {
                            position: generateCode,
                            function: localFunction,
                            variable: nowArgument,
                        });
                        throw new Error('invalid variable type');
                    }

                    const regForArguments =
                        sizeToRegForArguments[nowArgument.type.size] ?? sizeToRegForArguments.default;
                    const operation = `  mov ${regForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`;
                    generated.push(operation);
                    nowArgument = nowArgument.nextEntry as Variable;
                    argumentNumber += 1;
                }
            }

            generateStatement(localFunction.body);
            console.assert(depth === 0);
            generated.push(`.L.return.${localFunction.name}:`, `  mov %rbp, %rsp`, `  pop %rbp`, `  ret`);
        }
        localFunction = localFunction.nextEntry;
    }
}

/**
 * 生成给定函数节点的汇编代码。Generate assembly code for the given function node.
 * @param {SymbolEntry} prog 要生成代码的函数节点。The function node to generate code for.
 * @returns {Promise<void>} 生成代码的 Promise。The Promise of generating code.
 */
export async function generateCode(prog: SymbolEntry): Promise<void> {
    depth = 0;
    generated = [];
    count = 0;
    nowFunction = undefined;
    await new Promise<void>((resolve, reject) => {
        try {
            assignLocalVariableOffsets(prog);
            assignDataSection(prog);
            assignTextSection(prog);
            resolve();
        } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
}

/**
 * 从堆栈中弹出一个元素。Pop an element from the stack.
 * @returns {void} 无返回值。No return value.
 */
function pushToStack(): void {
    generated.push('  push %rax');
    depth += 1;
}

/**
 * 从堆栈中弹出一个元素。Pop an element from the stack.
 * @param {string} argument 要弹出的元素的名称。The name of the element to pop.
 * @returns {void} 无返回值。No return value.
 */
function popFromStack(argument: string): void {
    generated.push(`  pop ${argument}`);
    depth -= 1;
}

/**
 * 生成给定抽象语法树节点的地址。Generate the address of the given abstract syntax tree node.
 * @param {ASTNode} node 要生成地址的抽象语法树节点。The abstract syntax tree node to generate the address for.
 * @returns {void} 无返回值。No return value.
 */
function generateAddress(node: ASTNode): void {
    if (node.nodeKind === ASTNodeKind.Variable && node.localVar !== undefined) {
        const address = node.localVar.isGlobal ? `${node.localVar.name}(%rip)` : `${node.localVar.offsetFromRBP}(%rbp)`;
        generated.push(`  lea ${address}, %rax`);
        return;
    }
    if (node.nodeKind === ASTNodeKind.Dereference) {
        if (node.leftNode === undefined)
            handleASTError(node, 'Invalid dereference', ASTNodeKind.Dereference, generateAddress);
        generateExpression(node.leftNode);
        return;
    }
    if (node.nodeKind === ASTNodeKind.Comma) {
        if (node.leftNode === undefined || node.rightNode === undefined)
            handleASTError(node, 'Invalid comma', ASTNodeKind.Comma, generateAddress);
        generateExpression(node.leftNode);
        generateAddress(node.rightNode);
        return;
    }
    if (node.nodeKind === ASTNodeKind.DotAccess) {
        if (node.leftNode === undefined || node.members === undefined)
            handleASTError(node, 'Invalid object member', ASTNodeKind.DotAccess, generateAddress);
        generateAddress(node.leftNode);
        generated.push(`  add $${node.members.offset}, %rax`);
        return;
    }
    logMessage('error', 'Not an lvalue', { node, position: generateAddress });
    throw new Error('not an lvalue');
}

/**
 * 获取生成的代码行。Get the generated lines of code.
 * @returns {string[]} 生成的代码行数组。The array of generated lines of code.
 */
export function getGenerated(): string[] {
    return generated;
}
