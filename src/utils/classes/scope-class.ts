import SymbolEntry from './symbolentry-class';

/**
 * 代表一个作用域的类。
 * Class representing a scope.
 */
class Scope {
    private readonly entrys: Map<string, SymbolEntry> = new Map();
    /**
     * 声明一个新的 entry.
     * Declare a new entry.
     * @param {SymbolEntry} entry - 要声明的 entry。The entry to declare.
     */
    public declareEntry(entry: SymbolEntry): void {
        this.entrys.set(entry.name, entry);
    }
    /**
     * 获取一个 entry.
     * Get an entry.
     * @param {string} name - 要获取的 entry 的名字。The name of the entry to get.
     * @returns {SymbolEntry | undefined} 找到的 entry，如果没有找到则返回 undefined。The found entry, or undefined if not found.
     */
    public getEntry(name: string): SymbolEntry | undefined {
        return this.entrys.get(name);
    }
}

export default Scope;
