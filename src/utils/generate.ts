import { type ASTNode, ASTNodeKind, type LocalVariable, type FunctionNode } from './commons';
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
 * 增加计数并返回新的计数值。
 * @returns 返回新的计数值。
 *
 * Increases the count and returns the new count value.
 * @returns Returns the new count value.
 */
function addCount(): number {
    return ++count;
}
/**
 * 生成给定抽象语法树节点的汇编代码。
 * @param node 要生成代码的抽象语法树节点。
 *
 * Generate assembly code for the given abstract syntax tree node.
 * @param node The abstract syntax tree node to generate code for.
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
            generated.push(`  mov (%rax), %rax`);
            console.log(`  mov (%rax), %rax`);
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
            generated.push(`  mov (%rax), %rax`);
            console.log(`  mov (%rax), %rax`);
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
            popFromStack('%rdi');
            generated.push(`  mov %rax, (%rdi)`);
            console.log(`  mov %rax, (%rdi)`);
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
 * 生成给定抽象语法树节点的汇编代码。
 * @param node 要生成代码的抽象语法树节点。
 *
 * Generate assembly code for the given abstract syntax tree node.
 * @param node The abstract syntax tree node to generate code for.
 */
function generateStatement(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Return: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid return', { node, position: generateStatement, case: ASTNodeKind.Return });
                throw new Error('invalid return');
            }

            generateExpression(node.leftNode);
            generated.push(`  jmp .L.return`);
            console.log(`  jmp .L.return`);
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
 * 为函数中的局部变量分配偏移量。
 * @param prog 要处理的函数节点。
 *
 * Assign offsets to local variables in a function.
 * @param prog The function node to process.
 */
function assignLocalVariableOffsets(prog: FunctionNode): void {
    let offset = 0;

    let localVariable: LocalVariable | undefined = prog.locals;
    while (localVariable !== undefined) {
        offset += 8;
        localVariable.offsetFromRBP = -offset;
        localVariable = localVariable.nextVar;
    }

    prog.stackSize = alignToNearest(offset, 16);
}

/**
 * 生成给定函数节点的汇编代码。
 * @param prog 要生成代码的函数节点。
 *
 * Generate assembly code for the given function node.
 * @param prog The function node to generate code for.
 */
export function generateCode(prog: FunctionNode): void {
    depth = 0;
    generated = [];

    assignLocalVariableOffsets(prog);

    console.log(`  .globl main`);
    console.log(`main:`);
    console.log(`  push %rbp`);
    console.log(`  mov %rsp, %rbp`);
    console.log(`  sub $${prog.stackSize}, %rsp`);

    generated.push(`  .globl main`, `main:`, `  push %rbp`, `  mov %rsp, %rbp`, `  sub $${prog.stackSize}, %rsp`);

    if (prog.body === undefined) {
        logMessage('error', 'Body is undefined', { position: generateCode });
        throw new Error('body is undefined');
    }
    generateStatement(prog.body);
    console.assert(depth === 0);

    console.log(`.L.return:`);
    console.log(`  mov %rbp, %rsp`);
    console.log(`  pop %rbp`);
    console.log(`  ret`);
    generated.push(`.L.return:`, `  mov %rbp, %rsp`, `  pop %rbp`, `  ret`);
}

/**
 * 将当前结果推入堆栈。
 *
 * Push the current result onto the stack.
 */
function pushToStack(): void {
    console.log('  push %rax');
    generated.push('  push %rax');
    depth++;
}

/**
 * 从堆栈中弹出一个元素。
 * @param argument 要弹出的元素的名称。
 *
 * Pop an element from the stack.
 * @param argument The name of the element to pop.
 */
function popFromStack(argument: string): void {
    console.log(`  pop ${argument}`);
    generated.push(`  pop ${argument}`);
    depth--;
}

/**
 * 将给定的数字向上舍入到最接近的对齐值。
 * @param n 要舍入的数字。
 * @param align 对齐值。
 * @returns 舍入后的数字。
 *
 * Rounds up the given number to the nearest alignment value.
 * @param n The number to round up.
 * @param align The alignment value.
 * @returns The rounded number.
 */
function alignToNearest(n: number, align: number): number {
    return Math.floor((n + align - 1) / align) * align;
}

/**
 * 生成给定抽象语法树节点的地址。
 * @param node 要生成地址的抽象语法树节点。
 *
 * Generate the address for the given abstract syntax tree node.
 * @param node The abstract syntax tree node to generate the address for.
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
 * 获取生成的代码行。
 * @returns 生成的代码行数组。
 *
 * Get the generated lines of code.
 * @returns The array of generated lines of code.
 */
export function getGenerated(): string[] {
    return generated;
}
