import { ASTNodeKind, ASTNodeType } from './commons';
import type { TypeDefinition, ASTNode } from './classes';
import { FunctionNode, Variable, SymbolEntry } from './classes';
import { logMessage } from './logger';

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
 * 类型定义的大小到 Load 操作的映射。
 * A mapping from the size of a type definition to load operation.
 * @type {Record<number | 'default', string>}
 */
const sizeToLoadOperation: Record<number | 'default', string> = {
    1: 'movsbq (%rax), %rax',
    2: 'movswq (%rax), %rax',
    4: 'movsxd (%rax), %rax',
    default: 'mov (%rax), %rax',
};

/**
 * 根据给定的类型定义，将值加载到寄存器中。Load a value into a register based on the given type definition.
 * @param {TypeDefinition} type 要加载的值的类型定义。The type definition of the value to load.
 */
function load(type: TypeDefinition): void {
    if (type.type !== ASTNodeType.Array && type.size !== undefined) {
        const operation = sizeToLoadOperation[type.size] ?? sizeToLoadOperation.default;
        generated.push(`  ${operation}`);
    }
}

/**
 * 类型定义的大小到 Store 操作的映射。
 * A mapping from the size of a type definition to store operation.
 * @type {Record<number | 'default', string>}
 */
const sizeToStoreOperation: Record<number | 'default', string> = {
    1: 'mov %al, (%rdi)',
    2: 'mov %ax, (%rdi)',
    4: 'mov %eax, (%rdi)',
    default: 'mov %rax, (%rdi)',
};
/**
 * 根据给定的类型定义，将值存储到内存中。Store a value into memory based on the given type definition.
 * @param {TypeDefinition} type 要存储的值的类型定义。The type definition of the value to store.
 * @returns {void} 无返回值。No return value.
 */
function store(type: TypeDefinition): void {
    popFromStack('%rdi');
    if (type.size !== undefined) {
        const operation = sizeToStoreOperation[type.size] ?? sizeToStoreOperation.default;
        generated.push(`  ${operation}`);
    }
}

type generateExpressionHandler = (node: ASTNode) => void;

type generateExpressionHandlerMap = {
    [K in ASTNodeKind]?: generateExpressionHandler;
};

/**
 * 生成表达式的处理程序映射。
 * Expression handler map.
 * @type {generateExpressionHandlerMap}
 */
const generateExpressionHandlers: generateExpressionHandlerMap = {
    [ASTNodeKind.Number]: (node: ASTNode) => {
        if (node.numberValue === undefined) {
            logMessage('error', 'Invalid number', { node, position: generateExpression, case: ASTNodeKind.Number });
            throw new Error('invalid number');
        }
        generated.push(`  mov $${node.numberValue}, %rax`);
    },
    [ASTNodeKind.Negation]: (node: ASTNode) => {
        if (node.leftNode === undefined) {
            logMessage('error', 'Invalid negation', {
                node,
                position: generateExpression,
                case: ASTNodeKind.Negation,
            });
            throw new Error('invalid negation');
        }
        generateExpression(node.leftNode);
        generated.push(`  neg %rax`);
    },
    [ASTNodeKind.Dereference]: (node: ASTNode) => {
        if (node.leftNode === undefined) {
            logMessage('error', 'Invalid dereference', {
                node,
                position: generateExpression,
                case: ASTNodeKind.Dereference,
            });
            throw new Error('invalid dereference');
        }
        generateExpression(node.leftNode);
        if (node.typeDef === undefined) {
            logMessage('error', 'Invalid variable', {
                node,
                position: generateExpression,
                case: ASTNodeKind.Variable,
            });
            throw new Error('invalid variable');
        }
        load(node.typeDef);
    },
    [ASTNodeKind.AddressOf]: (node: ASTNode) => {
        if (node.leftNode === undefined) {
            logMessage('error', 'Invalid address', {
                node,
                position: generateExpression,
                case: ASTNodeKind.AddressOf,
            });
            throw new Error('invalid address');
        }
        generateAddress(node.leftNode);
    },
    [ASTNodeKind.Variable]: (node: ASTNode) => {
        generateAddress(node);
        if (node.typeDef === undefined) {
            logMessage('error', 'Invalid variable', {
                node,
                position: generateExpression,
                case: ASTNodeKind.Variable,
            });
            throw new Error('invalid variable');
        }
        load(node.typeDef);
    },
    [ASTNodeKind.Assignment]: (node: ASTNode) => {
        if (node.leftNode === undefined || node.rightNode === undefined) {
            logMessage('error', 'Invalid assignment', {
                node,
                position: generateExpression,
                case: ASTNodeKind.Assignment,
            });
            throw new Error('invalid assignment');
        }
        generateAddress(node.leftNode);
        pushToStack();
        generateExpression(node.rightNode);
        if (node.typeDef === undefined) {
            logMessage('error', 'Invalid variable', {
                node,
                position: generateExpression,
                case: ASTNodeKind.Variable,
            });
            throw new Error('invalid variable');
        }
        store(node.typeDef);
    },
    [ASTNodeKind.FunctionCall]: (node: ASTNode) => {
        if (node.functionDef === undefined) {
            logMessage('error', 'Invalid function call', {
                node,
                position: generateExpression,
                case: ASTNodeKind.FunctionCall,
            });
            throw new Error('invalid function call');
        }
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
    if (node.leftNode === undefined || node.rightNode === undefined) {
        logMessage('error', 'Invalid binary expression', {
            node,
            position: generateExpression,
            case: ASTNodeKind.Addition,
        });
        throw new Error('invalid binary expression');
    }
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
                    logMessage('error', 'Invalid expression', { node, position: generateExpression });
                    throw new Error('invalid expression');
                }
            }
            generated.push(`  movzb %al, %rax`);
            return;
        }
        default: {
            logMessage('error', 'Invalid expression', { node, position: generateExpression });
            throw new Error('invalid expression');
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
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid return', { node, position: generateStatement, case: ASTNodeKind.Return });
                throw new Error('invalid return');
            }

            generateExpression(node.leftNode);
            generated.push(`  jmp .L.return.${nowFunction?.name}`);
            return;
        }
        case ASTNodeKind.ExpressionStatement: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid expression statement', {
                    node,
                    position: generateStatement,
                    case: ASTNodeKind.ExpressionStatement,
                });
                throw new Error('invalid expression statement');
            }

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
            if (node.condition === undefined || node.trueBody === undefined) {
                logMessage('error', 'Invalid if', { node, position: generateExpression, case: ASTNodeKind.If });
                throw new Error('invalid if');
            }
            generateExpression(node.condition);
            generated.push(`  cmp $0, %rax`, `  je  .L.else.${c}`);
            generateStatement(node.trueBody);
            generated.push(`  jmp .L.end.${c}`, `.L.else.${c}:`);
            if (node.elseBody !== undefined) {
                generateStatement(node.elseBody);
            }
            generated.push(`.L.end.${c}:`);
            return;
        }
        case ASTNodeKind.For: {
            const c = addCount();
            if (node.trueBody === undefined) {
                logMessage('error', 'Invalid for', { node, position: generateStatement, case: ASTNodeKind.For });
                throw new Error('invalid for');
            }
            if (node.initBody !== undefined) {
                generateStatement(node.initBody);
            }
            generated.push(`.L.begin.${c}:`);
            if (node.condition !== undefined) {
                generateExpression(node.condition);
                generated.push(`  cmp $0, %rax`, `  je  .L.end.${c}`);
            }
            generateStatement(node.trueBody);
            if (node.incrementBody !== undefined) {
                generateExpression(node.incrementBody);
            }
            generated.push(`  jmp .L.begin.${c}`, `.L.end.${c}:`);
            return;
        }
        default: {
            logMessage('error', 'Invalid statement', { node, position: generateStatement });
            throw new Error('invalid statement');
        }
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
    await new Promise<void>((resolve, reject) => {
        try {
            depth = 0;
            generated = [];
            count = 0;
            nowFunction = undefined;

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
 * 将给定的数字向上舍入到最接近的对齐值。Round the given number up to the nearest alignment value.
 * @param {number} n 要舍入的数字。The number to round.
 * @param {number} align 对齐值。The alignment value.
 * @returns {number} 舍入后的数字。The rounded number.
 */
function alignToNearest(n: number, align: number): number {
    return Math.floor((n + align - 1) / align) * align;
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
        if (node.leftNode === undefined) {
            logMessage('error', 'Invalid dereference', { node, position: generateAddress });
            throw new Error('invalid dereference');
        }
        generateExpression(node.leftNode);
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
