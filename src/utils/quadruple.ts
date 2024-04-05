import ASTNode from './classes/astnode-class';
export type IntermediateCode = [string, string | undefined, string | undefined, string | undefined];

/**
 * 定义四元式列表类，用于存储四元式的数组和下一个四元式的索引
 */
export class IntermediateCodeList {
    codes: IntermediateCode[] = [];
    nextquad = 100;
    nowVariable = 0;

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

/**
 * 创建一个只包含一个元素的数组
 * @param {string} index 元素
 * @returns {string[]} 返回包含一个元素的数组
 */
export function makelist(index: string): string[] {
    return [index];
}

/**
 * 获取节点的值
 * @param {ASTNode | undefined} node 节点
 * @returns {string | undefined} 返回节点的值
 */
export function getNodeValue(node: ASTNode | undefined): string | undefined {
    if (node === undefined) return undefined;

    if (node.localVar?.varName !== undefined) return node.localVar?.varName;
    else if (node.functionDef !== undefined) return node.functionDef;
    else if (node.nodeNumber !== undefined) return `N${node.nodeNumber}`
    else if (node.numberValue !== undefined) return String(node.numberValue);
    else return undefined;
}
