import Scope from './scope-class';
import type SymbolEntry from './symbolentry-class';
import type Tag from './tag-class';

/**
 * 代表一个作用域管理器的类。
 * Class representing a scope manager.
 */
class ScopeManager {
    private static instance: ScopeManager;
    private readonly scopeStack: Scope[] = [];

    /**
     * 类构造函数。
     * Class constructor
     * @returns {ScopeManager} 类实例（Class instance）。
     * @class
     */
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
        const currentScope = this.scopeStack.at(-1);
        if (currentScope !== undefined) currentScope.declareEntry(entry);
    }

    /**
     * 查找一个entry，从栈顶往下（内层到外层）依次查找
     * Find a entry by name, from the top of the stack to the bottom (inner to outer).
     * @param {string} name - 要查找的 entry 的名字。The name of the entry to find.
     * @returns {SymbolEntry | undefined} 找到的 entry，如果没有找到则返回 undefined。The found entry, or undefined if not found.
     */
    public findEntry(name: string): SymbolEntry | undefined {
        for (let index = this.scopeStack.length - 1; index >= 0; index -= 1) {
            const scope = this.scopeStack[index];
            const found = scope.getEntry(name);
            if (found !== undefined) return found;
        }
        return undefined;
    }

    /**
     * 声明一个 Tag
     * Declare a Tag
     * @param {Tag} tag - 要声明的 Tag。The tag to declare.
     */
    public declareTag(tag: Tag): void {
        if (this.scopeStack.length === 0) {
            throw new Error(`No scope available to declare tag ${tag.name}.`);
        }
        const currentScope = this.scopeStack.at(-1);
        if (currentScope !== undefined) currentScope.declareTag(tag);
    }

    /**
     * 查找一个 Tag, 从栈顶往下（内层到外层）依次查找
     * Find a Tag, from the top of the stack to the bottom (inner to outer).
     * @param {string} name - 要查找的 Tag 的名字。The name of the tag to find.
     * @returns {Tag | undefined} 找到的 Tag，如果没有找到则返回 undefined。The found tag, or undefined if not found.
     */
    public findTag(name: string): Tag | undefined {
        for (let index = this.scopeStack.length - 1; index >= 0; index -= 1) {
            const scope = this.scopeStack[index];
            const found = scope.getTag(name);
            if (found !== undefined) return found;
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
        if (ScopeManager.instance === undefined) ScopeManager.instance = new ScopeManager();
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
