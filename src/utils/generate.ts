import { type ASTNode, ASTNodeKind, type LocalVariable, type FunctionNode } from './commons';

let depth: number = 0;

function generateExpression(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Number: {
            if (node.numberValue === undefined) {
                throw new Error('invalid number');
            }
            console.log(`  mov $${node.numberValue}, %rax`);
            return;
        }
        case ASTNodeKind.Negation: {
            if (node.leftNode === undefined) {
                throw new Error('invalid negation');
            }
            generateExpression(node.leftNode);
            console.log(`  neg %rax`);
            return;
        }
        case ASTNodeKind.Variable: {
            generateAddress(node);
            console.log(`  mov (%rax), %rax`);
            return;
        }
        case ASTNodeKind.Assignment: {
            if (node.leftNode === undefined || node.rightNode === undefined) {
                throw new Error('invalid assignment');
            }
            generateAddress(node.leftNode);
            pushToStack();
            generateExpression(node.rightNode);
            popFromStack('%rdi');
            console.log(`  mov %rax, (%rdi)`);
            return;
        }
        // TODO: Add other cases
    }
    if (node.leftNode === undefined || node.rightNode === undefined) {
        throw new Error('invalid binary expression');
    }
    generateExpression(node.rightNode);
    pushToStack();
    generateExpression(node.leftNode);
    popFromStack('%rdi');

    switch (node.nodeKind) {
        case ASTNodeKind.Addition: {
            console.log(`  add %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Subtraction: {
            console.log(`  sub %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Multiplication: {
            console.log(`  imul %rdi, %rax`);
            return;
        }
        case ASTNodeKind.Division: {
            console.log(`  cqo`);
            console.log(`  idiv %rdi`);
            return;
        }
        case ASTNodeKind.Equality:
        case ASTNodeKind.Inequality:
        case ASTNodeKind.LessThan:
        case ASTNodeKind.LessThanOrEqual: {
            console.log(`  cmp %rdi, %rax`);
            switch (node.nodeKind) {
                case ASTNodeKind.Equality: {
                    console.log(`  sete %al`);
                    break;
                }
                case ASTNodeKind.Inequality: {
                    console.log(`  setne %al`);
                    break;
                }
                case ASTNodeKind.LessThan: {
                    console.log(`  setl %al`);
                    break;
                }
                case ASTNodeKind.LessThanOrEqual: {
                    console.log(`  setle %al`);
                    break;
                }
                // No default
            }
            console.log(`  movzb %al, %rax`);

            return;
        }
        // No default
    }

    throw new Error('invalid expression');
    // TODO: Add other cases
}

function generateStatement(node: ASTNode): void {
    switch (node.nodeKind) {
        case ASTNodeKind.Return: {
            if (node.leftNode === undefined) {
                throw new Error('invalid return');
            }

            generateExpression(node.leftNode);
            console.log(`  jmp .L.return`);
            return;
        }
        case ASTNodeKind.ExpressionStatement: {
            if (node.leftNode === undefined) {
                throw new Error('invalid expression statement');
            }

            generateExpression(node.leftNode);
            return;
        }
    }

    throw new Error('invalid statement');
}

function assignLocalVariableOffsets(prog: FunctionNode): void {
    let offset = 0;
    if (prog.locals === undefined) {
        throw new Error('locals is undefined');
    }

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
    assignLocalVariableOffsets(prog);

    console.log(`  .globl main`);
    console.log(`main:`);

    // Prologue
    console.log(`  push %rbp`);
    console.log(`  mov %rsp, %rbp`);
    console.log(`  sub $${prog.stackSize}, %rsp`);

    if (prog.body === undefined) {
        throw new Error('body is undefined');
    }
    let node: ASTNode | undefined = prog.body;
    while (node !== undefined) {
        generateStatement(node);
        console.assert(depth === 0);
        node = node.nextNode;
    }

    console.log(`.L.return:`);
    console.log(`  mov %rbp, %rsp`);
    console.log(`  pop %rbp`);
    console.log(`  ret`);
}

function pushToStack(): void {
    console.log('  push %rax');
    depth++;
}

function popFromStack(argument: string): void {
    console.log(`  pop ${argument}`);
    depth--;
}

function alignToNearest(n: number, align: number): number {
    return Math.floor((n + align - 1) / align) * align;
}

function generateAddress(node: ASTNode): void {
    if (node.nodeKind === ASTNodeKind.Variable && node.localVar !== undefined) {
        console.log(`  lea ${node.localVar.offsetFromRBP}(%rbp), %rax`);
        return;
    }

    throw new Error('not an lvalue');
}
