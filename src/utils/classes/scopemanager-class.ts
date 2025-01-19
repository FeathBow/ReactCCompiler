import Scope from './scope-class';
import SymbolEntry from './symbolentry-class';

/**
 * 代表一个作用域管理器的类。
 * Class representing a scope manager.
 */
class ScopeManager {
    private static instance: ScopeManager;
    private readonly scopeStack: Scope[] = [];
    constructor() {
        this.enterScope();
    }

    /**
     * 进入一个新的作用域（作用域栈 push 一个新的 Scope）
     * Enter a new scope (push a new Scope to the scope stack).
     */
    public enterScope(): void {
        this.scopeStack.push(new Scope());
    }

    /**
     * 离开当前作用域（作用域栈 pop 出栈顶 Scope）
     * Leave the current scope (pop the top Scope from the scope stack).
     * @returns {void}
     */
    public leaveScope(): void {
        if (this.scopeStack.length === 0) {
            throw new Error('No scope to leave (scope stack is empty).');
        }
        this.scopeStack.pop();
    }

    /**
     * 声明一个Entry
     * Declare a new Entry
     * @param {SymbolEntry} entry - 要声明的 Entry。The entry to declare.
     * @returns {void}
     */
    public declareEntry(entry: SymbolEntry): void {
        if (this.scopeStack.length === 0) {
            throw new Error(`No scope available to declare entry ${entry.name}.`);
        }
        const currentScope = this.scopeStack[this.scopeStack.length - 1];
        currentScope.declareEntry(entry);
    }

    /**
     * 查找一个entry，从栈顶往下（内层到外层）依次查找
     * Find a entry by name, from the top of the stack to the bottom (inner to outer).
     * @param {string} name - 要查找的 entry 的名字。The name of the entry to find.
     * @returns {SymbolEntry | undefined} 找到的 entry，如果没有找到则返回 undefined。The found entry, or undefined if not found.
     */
    public findEntry(name: string): SymbolEntry | undefined {
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            const scope = this.scopeStack[i];
            const found = scope.getEntry(name);
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    /**
     * 获取 ScopeManager 的单例
     * Get the singleton instance of ScopeManager
     * @returns {ScopeManager} ScopeManager 的单例。The singleton instance of ScopeManager.
     * @static
     */
    public static getInstance(): ScopeManager {
        if (!ScopeManager.instance) {
            ScopeManager.instance = new ScopeManager();
        }
        return ScopeManager.instance;
    }

    /**
     * 重置 ScopeManager 的单例
     * Reset the singleton instance of ScopeManager
     * @returns {void}
     * @static
     */
    public static resetInstance(): void {
        ScopeManager.instance = new ScopeManager();
    }
}

export default ScopeManager;
