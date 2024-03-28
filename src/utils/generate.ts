import { type ASTNode, ASTNodeKind, type LocalVariable, type FunctionNode } from './commons';
import { logMessage } from './logger';

let depth: number = 0;
let generated: string[] = [];

let count: number = 0;
function addCount(): number {
    return ++count;
}

function generateExpression(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Number: {
            if (node.numberValue === undefined) {
                logMessage('error', 'Invalid number', { node, position: generateExpression });
                throw new Error('invalid number');
            }
            generated.push(`  mov $${node.numberValue}, %rax`);
            console.log(`  mov $${node.numberValue}, %rax`);
            return;
        }
        case ASTNodeKind.Negation: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid negation', { node, position: generateExpression });
                throw new Error('invalid negation');
            }
            generateExpression(node.leftNode);
            generated.push(`  neg %rax`);
            console.log(`  neg %rax`);
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
                logMessage('error', 'Invalid assignment', { node, position: generateExpression });
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
        logMessage('error', 'Invalid binary expression', { node, position: generateExpression });
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

function generateStatement(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Return: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid return', { node, position: generateStatement });
                throw new Error('invalid return');
            }

            generateExpression(node.leftNode);
            generated.push(`  jmp .L.return`);
            console.log(`  jmp .L.return`);
            return;
        }
        case ASTNodeKind.ExpressionStatement: {
            if (node.leftNode === undefined) {
                logMessage('error', 'Invalid expression statement', { node, position: generateStatement });
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
                logMessage('error', 'Invalid if', { node, position: generateExpression });
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
    }
    logMessage('error', 'Invalid statement', { node, position: generateStatement });
    throw new Error('invalid statement');
}

function assignLocalVariableOffsets(prog: FunctionNode): void {
    let offset = 0;
    // if (prog.locals === undefined) {
    //     logMessage('error', 'Locals is undefined', { position: assignLocalVariableOffsets });
    //     throw new Error('locals is undefined');
    // }

    let localVariable: LocalVariable | undefined = prog.locals;
    while (localVariable !== undefined) {
        // do something with localVar
        offset += 8;
        localVariable.offsetFromRBP = -offset;
        localVariable = localVariable.nextVar;
    }

    prog.stackSize = alignToNearest(offset, 16);
}

export function generateCode(prog: FunctionNode): void {
    depth = 0;
    generated = [];

    assignLocalVariableOffsets(prog);

    console.log(`  .globl main`);
    console.log(`main:`);
    // Prologue
    console.log(`  push %rbp`);
    console.log(`  mov %rsp, %rbp`);
    console.log(`  sub $${prog.stackSize}, %rsp`);

    generated.push(`  .globl main`, `main:`, `  push %rbp`, `  mov %rsp, %rbp`, `  sub $${prog.stackSize}, %rsp`);

    if (prog.body === undefined) {
        logMessage('error', 'Body is undefined', { position: generateCode });
        throw new Error('body is undefined');
    }
    // let node: ASTNode | undefined = prog.body;
    // while (node !== undefined) {
    //     generateStatement(node);
    //     console.assert(depth === 0);
    //     node = node.nextNode;
    // }
    generateStatement(prog.body);
    console.assert(depth === 0);

    console.log(`.L.return:`);
    console.log(`  mov %rbp, %rsp`);
    console.log(`  pop %rbp`);
    console.log(`  ret`);
    generated.push(`.L.return:`, `  mov %rbp, %rsp`, `  pop %rbp`, `  ret`);
}

function pushToStack(): void {
    console.log('  push %rax');
    generated.push('  push %rax');
    depth++;
}

function popFromStack(argument: string): void {
    console.log(`  pop ${argument}`);
    generated.push(`  pop ${argument}`);
    depth--;
}

function alignToNearest(n: number, align: number): number {
    return Math.floor((n + align - 1) / align) * align;
}

function generateAddress(node: ASTNode): void {
    if (node.nodeKind === ASTNodeKind.Variable && node.localVar !== undefined) {
        console.log(`  lea ${node.localVar.offsetFromRBP}(%rbp), %rax`);
        generated.push(`  lea ${node.localVar.offsetFromRBP}(%rbp), %rax`);
        return;
    }
    logMessage('error', 'Not an lvalue', { node, position: generateAddress });
    throw new Error('not an lvalue');
}

export function getGenerated(): string[] {
    return generated;
}
