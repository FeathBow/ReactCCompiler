import { exec as execCallback } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { tokenize } from '../../src/utils/token';
import { parse } from '../../src/utils/parse';
import { generateCode, getGenerated } from '../../src/utils/generate';

const exec = promisify(execCallback);
interface ExecError extends Error {
    code?: number;
}
/**
 * 运行汇编代码并返回退出状态。Execute the assembly code and return the exit status.
 * @param {string[]} assemblyCode - 汇编代码的数组，每个元素代表一行代码。An array of assembly code, each element represents a line of code.
 * @param {string} filename - 生成的文件名。The generated filename.
 * @returns {Promise<string>} Promise，解析为执行汇编代码后的退出状态。A Promise that resolves to the exit status after executing the assembly code.
 */
async function runAssemblyCode(assemblyCode: string[], filename: string): Promise<string> {
    try {
        await writeFile(`dist/${filename}.s`, assemblyCode.join('\n'));
        await exec(`gcc -o dist/${filename} dist/${filename}.s`);
        try {
            await exec(`dist\\${filename}.exe`, { timeout: 3500 });
        } catch (error: unknown) {
            const execError = error as ExecError;
            if (execError.code !== undefined) return execError.code.toString();
            throw execError;
        }
        const { stdout } = await exec('echo %errorlevel%');
        return stdout.trim();
    } catch (error: unknown) {
        console.error('Error running assembly code:', error);
        throw error;
    }
}
/**
 * 测试给定的代码并检查退出状态。Test the given code and check the exit status.
 * @param {string} code - 要测试的代码。The code to test.
 * @param {string} expectedExitStatus - 预期的退出状态。The expected exit status.
 * @param {string} filename - 生成的文件名。The generated filename.
 */
async function testCode(code: string, expectedExitStatus: string, filename: string): Promise<void> {
    const tokens = tokenize(code);
    const { functionNode } = parse(tokens);
    await generateCode(functionNode);
    const assemblyCode = getGenerated();
    const exitStatus = await runAssemblyCode(assemblyCode, filename);
    expect(exitStatus).toBe(expectedExitStatus);
}

/**
 * 运行一组测试用例。Run a group of test cases.
 * @param {Array<{ code: string; expectedExitStatus: string }>} testCases - 包含代码和预期退出状态的测试用例。Test cases containing code and expected exit status.
 * @param {string} testName - 测试名。The name of the test.
 * @param {string} filename - 文件名。The name of the file.
 */
function runTestCases(
    testCases: Array<{ code: string; expectedExitStatus: string }>,
    testName: string,
    filename = 'test',
): void {
    describe(testName, () => {
        for (const { code, expectedExitStatus } of testCases) {
            test(`Code: ${code}\n\tshould return correct exit status [${expectedExitStatus}]`, async () => {
                await testCode(code, expectedExitStatus, filename);
            });
        }
    });
}

/**
 * 创建一个绑定了特定文件名的测试运行器。
 * Create a test runner with a specific filename bound.
 * @param {string} filename - 要绑定的文件名。The filename to bind.
 * @returns {Function} 返回一个新的函数，这个函数接受测试用例和测试名作为参数，并调用 `runTestCases`。Returns a new function that takes test cases and a test name as arguments and calls `runTestCases`.
 */
function createTestRunner(
    filename: string,
): (testCases: Array<{ code: string; expectedExitStatus: string }>, testName: string) => void {
    /**
     * 运行一组绑定了特定文件名的测试用例。
     * Run a group of test cases with a specific filename bound.
     * @param {Array<{ code: string; expectedExitStatus: string }>} testCases - 包含代码和预期退出状态的测试用例。Test cases containing code and expected exit status.
     * @param {string} testName - 测试名。The name of the test.
     */
    return function runTestCasesWithFilename(
        testCases: Array<{ code: string; expectedExitStatus: string }>,
        testName: string,
    ) {
        runTestCases(testCases, testName, filename);
    };
}

export default createTestRunner;
