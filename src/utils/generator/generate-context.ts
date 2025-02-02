import { FunctionNode } from "../classes";

/**
 * 代码生成上下文。
 * Code generation context.
 */
class GenerateContext {
    // 当前嵌套深度。Current nesting depth.
    public depth = 0;
    // 生成的汇编代码行。Generated assembly code lines.
    public generated: string[] = [];
    // 计数器，用于生成唯一标签等。Counter, used to generate unique labels, etc.
    public count = 0;
    // 当前处理的函数。Current function being processed.
    public nowFunction?: FunctionNode;

    // 增加计数并返回当前值。Increase the counter and return the current value.
    public addCount(): number {
        this.count++;
        return this.count;
    }

    // 添加一行代码。Add a line of code.
    public addLine(line: string): void {
        this.generated.push(line);
    }
}

export default GenerateContext;
