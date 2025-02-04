import { getIdentifier } from '../commons';
import ASTNodeKind from '../enums/astnodekind-enum';
import {
    type SymbolEntry,
    type TypeDefinition,
    type ASTNode,
    FunctionNode,
    Variable,
    ScopeManager,
    IntermediateManager,
} from '../classes';
import { logMessage } from '../logger';

/**
 * Creator 类封装了创建 AST 节点和符号表 entry 的逻辑，并维护局部变量、全局变量、节点编号等状态。
 * The Creator class encapsulates the logic for creating AST nodes and symbol table entries,
 * maintaining state such as local and global variables and node numbering.
 */
class Creator {
    private locals: Variable | undefined;
    private globals: SymbolEntry | undefined;
    private localConstantNumber: number;
    private astNodeNumber: number;

    /**
     * 构造函数。Constructor.
     */
    constructor() {
        this.locals = undefined;
        this.globals = undefined;
        this.localConstantNumber = 0;
        this.astNodeNumber = 0;
    }

    /**
     * 初始化解析。Initialize the parsing.
     * @returns {void} 无返回值。No return value.
     */
    public initialParse(): void {
        this.locals = undefined;
        this.globals = undefined;
        this.astNodeNumber = 0;
        this.localConstantNumber = 0;
        ScopeManager.resetInstance();
        IntermediateManager.resetInstance();
    }

    /**
     * 获取全局变量。Get globals.
     * @returns {SymbolEntry | undefined} 当前的全局变量。The current global variables.
     */
    public get Globals(): SymbolEntry | undefined {
        return this.globals;
    }

    /**
     * 设置全局变量。Set globals.
     * @param {SymbolEntry | undefined} nowGlobals 当前的全局变量。The current global variables.
     */
    public set Globals(nowGlobals: SymbolEntry | undefined) {
        this.globals = nowGlobals;
    }

    /**
     * 获取局部变量。Get locals.
     * @returns {Variable | undefined} 当前的局部变量。The current local variables.
     */
    public get Locals(): Variable | undefined {
        return this.locals;
    }

    /**
     * 设置局部变量。Set locals.
     * @param {Variable | undefined} nowLocals 当前的局部变量。The current local variables.
     */
    public set Locals(nowLocals: Variable | undefined) {
        this.locals = nowLocals;
    }

    /**
     * 创建一个新的抽象语法树节点。Create a new abstract syntax tree node.
     * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
     * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
     */
    public newNode(kind: ASTNodeKind): ASTNode {
        this.astNodeNumber += 1;
        return {
            nodeKind: kind,
            nodeNumber: this.astNodeNumber,
        };
    }

    /**
     * 创建一个新的二元操作符节点。Create a new binary operator node.
     * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
     * @param {ASTNode} lhs 左操作数。The left operand.
     * @param {ASTNode} rhs 右操作数。The right operand.
     * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
     */
    public newBinary(kind: ASTNodeKind, lhs: ASTNode, rhs: ASTNode): ASTNode {
        this.astNodeNumber += 1;
        return {
            nodeKind: kind,
            leftNode: lhs,
            rightNode: rhs,
            nodeNumber: this.astNodeNumber,
        };
    }

    /**
     * 创建一个新的一元操作符节点。Create a new unary operator node.
     * @param {ASTNodeKind} kind 节点的类型。The kind of the node.
     * @param {ASTNode} expr 操作数。The operand.
     * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
     */
    public newUnary(kind: ASTNodeKind, expr: ASTNode): ASTNode {
        this.astNodeNumber += 1;
        return {
            nodeKind: kind,
            leftNode: expr,
            nodeNumber: this.astNodeNumber,
        };
    }

    /**
     * 创建一个新的数字节点。Create a new number node.
     * @param {number} value 数字的值。The value of the number.
     * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
     */
    public newNumber(value: number): ASTNode {
        this.astNodeNumber += 1;
        return {
            nodeKind: ASTNodeKind.Number,
            numberValue: value,
            nodeNumber: this.astNodeNumber,
        };
    }

    /**
     * 创建一个新的变量节点。Create a new variable node.
     * @param {Variable} variableNode 代表变量的节点。The node representing the variable.
     * @returns {ASTNode} 新创建的抽象语法树节点。The newly created abstract syntax tree node.
     */
    public newVariableNode(variableNode: Variable): ASTNode {
        this.astNodeNumber += 1;
        return {
            nodeKind: ASTNodeKind.Variable,
            localVar: variableNode,
            nodeNumber: this.astNodeNumber,
        };
    }

    /**
     * 创建一个新的局部变量。Create a new local variable.
     * @param {string} name 变量名。The name of the variable.
     * @param {TypeDefinition} type 变量类型。The type of the variable.
     * @returns {Variable} 新创建的局部变量。The newly created local variable.
     */
    public newLocalVariable(name: string, type: TypeDefinition): Variable {
        const localVariable = new Variable({ name, offsetFromRBP: 0, isGlobal: false, type, nextEntry: this.locals });
        ScopeManager.getInstance().declareEntry(localVariable);
        this.locals = localVariable;
        return localVariable;
    }

    /**
     * 创建一个新的全局 entry。Create a new global entry.
     * @param {string} name entry 名。The name of the entry.
     * @param {TypeDefinition} type 类型定义。The type definition.
     * @param {boolean} isFunctionNode 是否是函数节点。Whether it is a function node.
     * @param {boolean} isDeclare 是否是声明。Whether it is a declaration.
     * @returns {SymbolEntry} 新创建的全局 entry。The newly created global entry.
     */
    public newGlobalEntry(name: string, type: TypeDefinition, isFunctionNode: boolean, isDeclare = false): SymbolEntry {
        const globalEntry = isFunctionNode
            ? new FunctionNode({ name, locals: this.locals, returnFunc: this.globals, type, declare: isDeclare })
            : new Variable({ name, offsetFromRBP: 0, isGlobal: true, type, nextEntry: this.globals as Variable });
        ScopeManager.getInstance().declareEntry(globalEntry);
        this.globals = globalEntry;
        return globalEntry;
    }

    /**
     * 创建一个新的字符串字面量。Create a new string literal.
     * @param {string | undefined} value 字符串的值。The value of the string.
     * @param {TypeDefinition} type 类型定义。The type definition.
     * @returns {SymbolEntry} 新创建的全局 entry。The newly created global entry.
     */
    public newStringLiteral(value: string | undefined, type: TypeDefinition): SymbolEntry {
        const currentNumber = this.localConstantNumber;
        this.localConstantNumber += 1;
        const globalEntry = this.newGlobalEntry(`.LC${currentNumber}`, type, false) as Variable;
        globalEntry.initialValue = value;
        this.globals = globalEntry;
        return globalEntry;
    }

    /**
     * 为函数参数创建局部变量。Create local variables for function parameters.
     * @param {TypeDefinition | undefined} type 函数参数类型。The function parameter type.
     * @returns {void} 无返回值。No return value.
     */
    public createLocalVariablesForParameters(type: TypeDefinition | undefined): void {
        if (type !== undefined) {
            this.createLocalVariablesForParameters(type.nextParameters);
            if (type.tokens === undefined) {
                logMessage('error', 'Token is undefined', { position: 'createLocalVariablesForParameters' });
                throw new Error('Token is undefined');
            }
            this.newLocalVariable(getIdentifier(type.tokens), type);

            IntermediateManager.getInstance().emit('param', getIdentifier(type.tokens), type.type);
        }
    }
}

export default Creator;
