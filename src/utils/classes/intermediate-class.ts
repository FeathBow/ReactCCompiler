/**
 * 定义四元式列表类，用于存储四元式的数组和下一个四元式的索引
 * Define the IntermediateCodeList class, which is used to store an array of quadruples and the index of the next quadruple
 */
export class IntermediateManager {
    private static instance: IntermediateManager;
    codes: IntermediateCode[] = [];
    nextquad: number;
    nowVariable: number;
    /** Private constructor to enforce singleton pattern */
    private constructor() {
        this.nowVariable = 0;
        this.nextquad = 100;
        this.codes = [];
    }

    /**
     * 获取四元式列表的单例实例
     * Get the singleton instance of IntermediateCodeList
     * @returns {IntermediateManager} 返回四元式列表的单例实例。The singleton instance of IntermediateCodeList.
     * @static
     */
    public static getInstance(): IntermediateManager {
        if (IntermediateManager.instance === undefined) {
            IntermediateManager.instance = new IntermediateManager();
        }
        return IntermediateManager.instance;
    }

    public static resetInstance(): void {
        IntermediateManager.instance = new IntermediateManager();
    }

    /**
     * 生成新的四元式并添加到数组中
     * @param {string} op 操作符
     * @param {string | undefined} argument1 操作数1
     * @param {string | undefined} argument2 操作数2
     * @param {string | undefined} result 结果
     * @returns {number} 返回新生成的四元式的索引
     */
    emit(
        op: string,
        argument1: string | undefined = undefined,
        argument2: string | undefined = undefined,
        result: string | undefined = undefined,
    ): number {
        this.codes.push([op, argument1, argument2, result]);
        const returnIndex = this.nextquad;
        this.nextquad += 1;
        return returnIndex;
    }

    /**
     * 修改数组中指定索引的四元式的结果
     * @param {string[]} p 需要修改的四元式的索引数组
     * @param {string} t 新的结果
     */
    backpatch(p: string[], t: string): void {
        for (const index of p) {
            const numberIndex = Number.parseInt(index, 10);
            this.codes[numberIndex - 100][3] = t;
        }
    }
}

export default IntermediateManager;
/**
 * 四元式的类型定义
 * Type definition of quadruples
 * @typedef {Array<string, string | undefined, string | undefined, string | undefined>} IntermediateCode
 * @property {string} 0 操作符 Operator
 * @property {string | undefined} 1 操作数1 Operand 1
 * @property {string | undefined} 2 操作数2 Operand 2
 * @property {string | undefined} 3 结果 Result
 */
export type IntermediateCode = [string, string | undefined, string | undefined, string | undefined];
