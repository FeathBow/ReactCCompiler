import ASTNode from './classes/astnode-class';
import { IntermediateManager } from './classes/intermediate-class';

/**
 * 获取节点的值
 * @param {ASTNode | undefined} node 节点
 * @returns {string | undefined} 返回节点的值
 */
export function getNodeValue(node: ASTNode | undefined): string | undefined {
    if (node === undefined) return undefined;

    if (node.localVar?.name !== undefined) return node.localVar?.name;
    else if (node.functionDef !== undefined) return node.functionDef;
    else if (node.nodeNumber !== undefined) return `N${node.nodeNumber}`;
    else if (node.numberValue !== undefined) return String(node.numberValue);
    else return undefined;
} /**
 * 获取四元式。Get the quadruple.
 * @returns {string} 四元式输出。The quadruple output.
 */
export function getQuadruple(): string {
    const nodeToQuadrupleMap = new Map<string, string>();
    let nextQuadrupleNumber = 1;
    const quadrupleOutput = `${['id', 'op', 'argument1', 'argument2', 'result'].map((header) => header.padEnd(13)).join('')}\n${IntermediateManager.getInstance()
        .codes.map(
            (code, index) =>
                `${(100 + index).toString().padEnd(13)}${code
                    .map((item) => {
                        if (item?.startsWith('N')) {
                            if (!nodeToQuadrupleMap.has(item)) {
                                nodeToQuadrupleMap.set(item, `N${nextQuadrupleNumber}`);
                                nextQuadrupleNumber += 1;
                            }
                            const mappedItem = nodeToQuadrupleMap.get(item);
                            return (mappedItem ?? '').padEnd(13);
                        }
                        return (item ?? '').padEnd(13);
                    })
                    .join('')}`,
        )
        .join('\n')}`;
    return quadrupleOutput;
}
