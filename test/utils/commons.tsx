import { exec as execCallback, spawn } from 'node:child_process';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import { GenerateCode, GenerateContext } from '../../src/utils/generator';
import { TokenManager, Tokenizer } from '../../src/utils/lexer';
import { Parser } from '../../src/utils/parser';

const exec = promisify(execCallback);

const OUTPUT_DIR = path.join(os.tmpdir(), 'reactccompiler-tests');

/**
 * 确保输出目录存在。只需在整个测试期间创建一次即可。
 * ensure output directory exists.
 * @returns {Promise<void>}
 */
async function ensureOutput(): Promise<void> {
    try {
        await mkdir(OUTPUT_DIR, { recursive: true });
    } catch (error) {
        console.error('Error ensuring output directory exists:', error);
        throw error;
    }
}

/**
 * 全局清理输出目录。
 * global cleanup output directory.
 * @returns {Promise<void>}
 */
export async function cleanupOutput(): Promise<void> {
    try {
        await rm(OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
        console.error('Error cleaning up output directory:', error);
    }
}

/**
 * 将生成的汇编代码写入 OUTPUT_DIR，并用 gcc 编译后执行，返回程序退出状态。
 * write generated assembly code to OUTPUT_DIR, compile with gcc and execute, return program exit status.
 * @param {string[]} assemblyCode - 生成的汇编代码。The generated assembly code.
 * @param {string} filename - 文件名。The filename.
 * @returns {Promise<string>} - 程序退出状态。The program exit status.
 */
async function runAssemblyCode(assemblyCode: string[], filename: string): Promise<string> {
    try {
        await ensureOutput();
        const asmFilePath = path.join(OUTPUT_DIR, `${filename}.s`);
        await writeFile(asmFilePath, assemblyCode.join('\n'));
        const executablePath =
            process.platform === 'win32' ? path.join(OUTPUT_DIR, `${filename}.exe`) : path.join(OUTPUT_DIR, filename);
        await exec(`gcc -o "${executablePath}" "${asmFilePath}"`);
        return await runBinaryAndGetCode(executablePath);
    } catch (error: unknown) {
        console.error('Error running assembly code:', error);
        throw error;
    }
}

/**
 * 启动编译好的二进制文件并返回退出状态。
 * start compiled binary file and return exit status.
 * @param {string} executablePath - 可执行文件路径。The executable file path.
 * @returns {Promise<string>} - 程序退出状态。The program exit status.
 */
async function runBinaryAndGetCode(executablePath: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const child = spawn(executablePath, { stdio: 'ignore' });
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error('Process execution timed out'));
        }, 5000);

        child.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        child.on('close', (code: number | undefined) => {
            clearTimeout(timeout);
            if (code === undefined) {
                reject(new Error('Process exited without an exit code (likely a signal)'));
            } else {
                resolve(code.toString());
            }
        });
    });
}

/**
 * 根据给定代码，执行词法分析、语法分析、代码生成、编译、运行，最后断言程序退出状态是否符合预期。
 * @param {string} code - 代码。The code.
 * @param {string} expectedExitStatus - 预期退出状态。The expected exit status.
 * @param {string} filename - 文件名。The filename.
 * @returns {Promise<void>}
 */
async function testCode(code: string, expectedExitStatus: string, filename: string): Promise<void> {
    const tokenManager = new TokenManager();
    const tokenizer = new Tokenizer(code, tokenManager);
    const parser = new Parser(tokenizer);
    const { globalEntry } = parser.parse();
    if (globalEntry === undefined) throw new Error('Global entry is undefined');
    const context = new GenerateContext();
    const generator = new GenerateCode(context);
    await generator.generateCode(globalEntry);
    const assemblyCode = context.generated;
    const exitStatus = await runAssemblyCode(assemblyCode, filename);
    try {
        expect(exitStatus).toBe(expectedExitStatus);
    } catch (error) {
        console.error('Assembly Code:\n', assemblyCode.join('\n'));
        throw error;
    }
}
/**
 * 运行一组测试用例。Run a group of test cases.
 * @param {Array<{ code: string; expectedExitStatus: string }>} testCases - 包含代码和预期退出状态的测试用例。Test cases containing code and expected exit status.
 * @param {string} testName - 测试名。The name of the test.
 * @param {string} filenamePrefix - 文件名前缀。The filename prefix.
 */
function runTestCases(
    testCases: Array<{ code: string; expectedExitStatus: string }>,
    testName: string,
    filenamePrefix = 'test',
): void {
    describe(testName, () => {
        beforeAll(async () => {
            await ensureOutput();
        });
        for (const [index, testCase] of testCases.entries()) {
            const { code, expectedExitStatus } = testCase;
            const uniqueFilename = `${filenamePrefix}-${index}`;
            test(`Code: ${code} should return exit status [${expectedExitStatus}]`, async () => {
                await testCode(code, expectedExitStatus, uniqueFilename);
            }, 5000);
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
