import { exec as execCallback, spawn } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { promisify } from 'node:util';
import { tokenize } from '../../src/utils/token';
import { parse } from '../../src/utils/parse';
import { generateCode, getGenerated } from '../../src/utils/generate';

const exec = promisify(execCallback);

/**
 * 清理 dist 目录中的文件。Cleanup files in the dist directory.
 * @param {string} filename - 要清理的文件名。The filename to cleanup.
 * @returns {Promise<void>} Promise。
 */
async function cleanupDistributionFiles(filename: string): Promise<void> {
    try {
        if (process.platform === 'win32') {
            await unlink(`dist/${filename}.exe`);
            await unlink(`dist/${filename}.s`);
        } else {
            await unlink(`dist/${filename}`);
            await unlink(`dist/${filename}.s`);
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('Error cleaning up dist files:', error);
            throw error;
        }
    }
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
        const executablePath = process.platform === 'win32' ? `dist\\${filename}.exe` : `./dist/${filename}`;
        return await runBinaryAndGetCode(executablePath);
    } catch (error: unknown) {
        console.error('Error running assembly code:', error);
        throw error;
    }
}

/**
 * 运行二进制文件并获取退出状态。Run the binary file and get the exit status.
 * @param {string} executablePath - 可执行文件的路径。The path to the executable file.
 * @returns {Promise<string>} Promise，解析为退出状态。A Promise that resolves to the exit status.
 */
async function runBinaryAndGetCode(executablePath: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const child = spawn(executablePath, { stdio: 'ignore' });
        child.on('error', (error) => {
            reject(error);
        });
        child.on('close', (code: number | undefined) => {
            if (code === undefined) {
                reject(new Error('Process exited without an exit code (likely a signal)'));
            } else {
                resolve(code.toString());
            }
        });
    });
}

/**
 * 测试给定的代码并检查退出状态。Test the given code and check the exit status.
 * @param {string} code - 要测试的代码。The code to test.
 * @param {string} expectedExitStatus - 预期的退出状态。The expected exit status.
 * @param {string} filename - 生成的文件名。The generated filename.
 */
async function testCode(code: string, expectedExitStatus: string, filename: string): Promise<void> {
    const tokens = tokenize(code);
    const { globalEntry } = parse(tokens);
    if (globalEntry === undefined) throw new Error('Global entry is undefined');
    await generateCode(globalEntry);
    const assemblyCode = getGenerated();
    const exitStatus = await runAssemblyCode(assemblyCode, filename);
    try {
        expect(exitStatus).toBe(expectedExitStatus);
    } catch (error) {
        console.error('Assembly Code:', assemblyCode.join('\n'));
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
        for (const [index, testCase] of testCases.entries()) {
            const { code, expectedExitStatus } = testCase;
            const uniqueFilename = `${filenamePrefix}-${index}`;
            test(`Code: ${code}\n\tshould return correct exit status [${expectedExitStatus}]`, async () => {
                await cleanupDistributionFiles(uniqueFilename);
                await testCode(code, expectedExitStatus, uniqueFilename);
                await cleanupDistributionFiles(uniqueFilename);
            }, 3000);
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
