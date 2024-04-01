import {
    type ASTNode,
    ASTNodeKind,
    type LocalVariable,
    type FunctionNode,
    type TypeDefinition,
    ASTNodeType,
} from './commons';
import { logMessage } from './logger';

/**
 * 用于追踪当前的嵌套深度。
 * Used to track the current nesting depth.
 */
let depth: number = 0;

/**
 * 存储生成的代码行。
 * Stores the generated lines of code.
 */
let generated: string[] = [];

/**
 * 用于计数的变量。
 * A variable used for counting.
 */
let count: number = 0;

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
    return ++count;
}

/**
 * 根据给定的类型定义，将值加载到寄存器中。Load a value into a register based on the given type definition.
 * @param {TypeDefinition} type 要加载的值的类型定义。The type definition of the value to load.
 */
function load(type: TypeDefinition): void {
    if (type.type !== ASTNodeType.Array) {
        switch (type.size) {
            case 1: {
                console.log('  movsbq (%rax), %rax');
                generated.push('  movsbq (%rax), %rax');

                break;
            }
            case 4: {
                console.log('  movsxd (%rax), %rax');
                generated.push('  movsxd (%rax), %rax');

                break;
            }
            case 2: {
                console.log('  movswq (%rax), %rax');
                generated.push('  movswq (%rax), %rax');

                break;
            }
            default: {
                console.log('  mov (%rax), %rax');
                generated.push('  mov (%rax), %rax');
            }
        }
    }
}

/**
 * 根据给定的类型定义，将值存储到内存中。Store a value into memory based on the given type definition.
 * @param {TypeDefinition} type 要存储的值的类型定义。The type definition of the value to store.
 */
function store(type: TypeDefinition): void {
    popFromStack('%rdi');
    switch (type.size) {
        case 1: {
            console.log('  mov %al, (%rdi)');
            generated.push('  mov %al, (%rdi)');

            break;
        }
        case 4: {
            console.log('  mov %eax, (%rdi)');
            generated.push('  mov %eax, (%rdi)');

            break;
        }
        case 2: {
            console.log('  mov %ax, (%rdi)');
            generated.push('  mov %ax, (%rdi)');

            break;
        }
        default: {
            console.log('  mov %rax, (%rdi)');
            generated.push('  mov %rax, (%rdi)');
        }
    }
}

/**
 * 根据给定的 AST 节点生成表达式。Generate an expression based on the given AST node.
 * @param {ASTNode} node 要生成表达式的 AST 节点。The AST node to generate the expression for.
 */
function generateExpression(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Number: {
            if (node.numberValue === undefined) {
                logMessage('error', 'Invalid number', { node, position: generateExpression, case: ASTNodeKind.Number });
                throw new Error('invalid number');
            }
            generated.push(`  mov $${node.numberValue}, %rax`);
            console.log(`  mov $${node.numberValue}, %rax`);
            return;
        }
        case ASTNodeKind.Negation: {
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
            console.log(`  neg %rax`);
            return;
        }
        case ASTNodeKind.Dereference: {
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
            return;
        }
        case ASTNodeKind.AddressOf: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid address', {
                    node,
                    position: generateExpression,
                    case: ASTNodeKind.AddressOf,
                });
                throw new Error('invalid address');
            }
            generateAddress(node.leftNode);
            return;
        }
        case ASTNodeKind.Variable: {
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
            return;
        }
        case ASTNodeKind.Assignment: {
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
            return;
        }
        case ASTNodeKind.FunctionCall: {
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
                argumentNumber++;
            }

            while (argumentNumber >= 0) {
                popFromStack(reg64ForArguments[argumentNumber]);
                argumentNumber--;
            }
            console.log(`  mov $0, %rax`);
            console.log(`  call ${node.functionDef}`);
            generated.push(`  mov $0, %rax`, `  call ${node.functionDef}`);
            return;
        }
        // TODO: Add other cases
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
            console.log(`  add %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Subtraction: {
            generated.push(`  sub %rdi, %rax`);
            console.log(`  sub %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Multiplication: {
            generated.push(`  imul %rdi, %rax`);
            console.log(`  imul %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Division: {
            generated.push(`  cqo`, `  idiv %rdi`);
            console.log(`  cqo`);
            console.log(`  idiv %rdi`);
            return;
        }
        case ASTNodeKind.Equality:
        case ASTNodeKind.Inequality:
        case ASTNodeKind.LessThan:
        case ASTNodeKind.LessThanOrEqual: {
            generated.push(`  cmp %rdi, %rax`);
            console.log(`  cmp %rdi, %rax`);
            switch (node.nodeKind) {
                case ASTNodeKind.Equality: {
                    generated.push(`  sete %al`);
                    console.log(`  sete %al`);
                    break;
                }
                case ASTNodeKind.Inequality: {
                    generated.push(`  setne %al`);
                    console.log(`  setne %al`);
                    break;
                }
                case ASTNodeKind.LessThan: {
                    generated.push(`  setl %al`);
                    console.log(`  setl %al`);
                    break;
                }
                case ASTNodeKind.LessThanOrEqual: {
                    generated.push(`  setle %al`);
                    console.log(`  setle %al`);
                    break;
                }
                // No default
            }
            generated.push(`  movzb %al, %rax`);
            console.log(`  movzb %al, %rax`);

            return;
        }
        // No default
    }
    logMessage('error', 'Invalid expression', { node, position: generateExpression });
    throw new Error('invalid expression');
    // TODO: Add other cases
}

/**
 * 生成给定抽象语法树节点的语句。Generate a statement for the given abstract syntax tree node.
 * @param {ASTNode} node 要生成语句的抽象语法树节点。The abstract syntax tree node to generate the statement for.
 */
function generateStatement(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Return: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid return', { node, position: generateStatement, case: ASTNodeKind.Return });
                throw new Error('invalid return');
            }

            generateExpression(node.leftNode);
            console.log(`  jmp .L.return.${nowFunction?.funcName}`);
            generated.push(`  jmp .L.return.${nowFunction?.funcName}`);
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
            console.log(`  cmp $0, %%rax`);
            console.log(`  je  .L.else.${c}`);
            generated.push(`  cmp $0, %rax`, `  je  .L.else.${c}`);
            generateStatement(node.trueBody);
            console.log(`  jmp .L.end.${c}`);
            console.log(`.L.else.${c}:`);
            generated.push(`  jmp .L.end.${c}`, `.L.else.${c}:`);
            if (node.elseBody !== undefined) {
                generateStatement(node.elseBody);
            }
            console.log(`.L.end.${c}:`);
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
            console.log(`.L.begin.${c}:`);
            generated.push(`.L.begin.${c}:`);
            if (node.condition !== undefined) {
                generateExpression(node.condition);
                console.log(`  cmp $0, %rax`);
                console.log(`  je  .L.end.${c}`);
                generated.push(`  cmp $0, %rax`, `  je  .L.end.${c}`);
            }
            generateStatement(node.trueBody);
            if (node.incrementBody !== undefined) {
                generateExpression(node.incrementBody);
            }
            console.log(`  jmp .L.begin.${c}`);
            console.log(`.L.end.${c}:`);
            generated.push(`  jmp .L.begin.${c}`, `.L.end.${c}:`);
            return;
        }
    }
    logMessage('error', 'Invalid statement', { node, position: generateStatement });
    throw new Error('invalid statement');
}

/**
 * 为函数中的局部变量分配偏移量。Assign offsets for local variables in functions.
 * @param {FunctionNode} prog 要处理的函数节点。The function node to process.
 */
function assignLocalVariableOffsets(prog: FunctionNode): void {
    let localFunction: FunctionNode | undefined = prog;
    while (localFunction !== undefined) {
        let offset = 0;
        let localVariable: LocalVariable | undefined = localFunction.locals;
        while (localVariable !== undefined) {
            if (localVariable?.varType?.size === undefined) {
                logMessage('error', 'Invalid variable type', {
                    position: assignLocalVariableOffsets,
                    function: localFunction,
                    variable: localVariable,
                });
                throw new Error('invalid variable type');
            }
            offset += localVariable.varType?.size;
            if (localVariable.varType.alignment === undefined) {
                logMessage('error', 'Invalid variable type', {
                    position: assignLocalVariableOffsets,
                    function: localFunction,
                    variable: localVariable,
                });
                throw new Error('invalid variable type');
            }
            offset = alignToNearest(offset, localVariable.varType.alignment);
            localVariable.offsetFromRBP = -offset;
            localVariable = localVariable.nextVar;
        }
        localFunction.stackSize = alignToNearest(offset, 16);
        localFunction = localFunction.returnFunc;
    }
}

/**
 * 生成给定函数节点的汇编代码。Generate assembly code for the given function node.
 * @param {FunctionNode} prog 要生成代码的函数节点。The function node to generate code for.
 */
export function generateCode(prog: FunctionNode): void {
    depth = 0;
    generated = [];
    count = 0;
    nowFunction = undefined;

    assignLocalVariableOffsets(prog);

    let localFunction: FunctionNode | undefined = prog;
    while (localFunction !== undefined) {
        console.log(`  .globl ${localFunction.funcName}`);
        console.log(`${localFunction.funcName}:`);

        nowFunction = localFunction;

        console.log(`  push %rbp`);
        console.log(`  mov %rsp, %rbp`);
        console.log(`  sub $${localFunction.stackSize}, %rsp`);

        generated.push(
            `  .globl ${localFunction.funcName}`,
            `${localFunction.funcName}:`,
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
                if (nowArgument?.varType?.size === undefined) {
                    logMessage('error', 'Invalid variable type', {
                        position: generateCode,
                        function: localFunction,
                        variable: nowArgument,
                    });
                    throw new Error('invalid variable type');
                }
                switch (nowArgument.varType.size) {
                    case 1: {
                        console.log(`  mov ${reg8ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`);
                        generated.push(`  mov ${reg8ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`);

                        break;
                    }
                    case 4: {
                        console.log(`  mov ${reg32ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`);
                        generated.push(
                            `  mov ${reg32ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`,
                        );

                        break;
                    }
                    case 2: {
                        console.log(`  mov ${reg16ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`);
                        generated.push(
                            `  mov ${reg16ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`,
                        );

                        break;
                    }
                    default: {
                        console.log(`  mov ${reg64ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`);
                        generated.push(
                            `  mov ${reg64ForArguments[argumentNumber]}, ${nowArgument.offsetFromRBP}(%rbp)`,
                        );
                    }
                }
                nowArgument = nowArgument.nextVar;
                argumentNumber++;
            }
        }

        generateStatement(localFunction.body);
        console.assert(depth === 0);

        console.log(`.L.return.${localFunction.funcName}:`);
        console.log(`  mov %rbp, %rsp`);
        console.log(`  pop %rbp`);
        console.log(`  ret`);

        generated.push(`.L.return.${localFunction.funcName}:`, `  mov %rbp, %rsp`, `  pop %rbp`, `  ret`);

        localFunction = localFunction.returnFunc;
    }
}

/**
 * 从堆栈中弹出一个元素。Pop an element from the stack.
 */
function pushToStack(): void {
    console.log('  push %rax');
    generated.push('  push %rax');
    depth++;
}

/**
 * 从堆栈中弹出一个元素。Pop an element from the stack.
 * @param {string} argument 要弹出的元素的名称。The name of the element to pop.
 */
function popFromStack(argument: string): void {
    console.log(`  pop ${argument}`);
    generated.push(`  pop ${argument}`);
    depth--;
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
 */
function generateAddress(node: ASTNode): void {
    if (node.nodeKind === ASTNodeKind.Variable && node.localVar !== undefined) {
        console.log(`  lea ${node.localVar.offsetFromRBP}(%rbp), %rax`);
        generated.push(`  lea ${node.localVar.offsetFromRBP}(%rbp), %rax`);
        return;
    } else if (node.nodeKind === ASTNodeKind.Dereference) {
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
