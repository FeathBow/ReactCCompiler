import createTestRunner from './commons';

const filename = 'functionTest';
const runTestCases = createTestRunner(filename);

describe('Function operations', () => {
    const functionTestCases = [
        { code: 'int main() { return add(3,4); } int add(int x, int y) { return x+y; }', expectedExitStatus: '7' },
        { code: 'int main() { return sub(4,3); } int sub(int x, int y) { return x-y; }', expectedExitStatus: '1' },
        {
            code: 'int main() { return multiply(2,3); } int multiply(int x, int y) { return x*y; }',
            expectedExitStatus: '6',
        },
        {
            code: 'int main() { return divide(10,2); } int divide(int x, int y) { return x/y; }',
            expectedExitStatus: '5',
        },
        {
            code: 'int main() { return power(2,3); } int power(int base, int exp) { int result=1; while(exp) { result = result * base; exp = exp - 1; } return result; }',
            expectedExitStatus: '8',
        },
        {
            code: 'int main() { return sum(1,2,3,4,5,6); } int sum(int a, int b, int c, int d, int e, int f) { return a+b+c+d+e+f; }',
            expectedExitStatus: '21',
        },
        {
            code: 'int main(void) { return gcd(60,48); } int gcd(int a, int b) { while(b != 0) { int t = b; b = a - a / b * b; a = t; } return a; }',
            expectedExitStatus: '12',
        },
        {
            code: 'int main(void) { return lcm(5,7); } int gcd(int a, int b) { while(b != 0) { int t = b; b = a - a / b * b; a = t; } return a; } int lcm(int a, int b) { return a * b / gcd(a, b); }',
            expectedExitStatus: '35',
        },

        {
            code: 'int main(void) { return fib(7); } int fib(int x) { if (x<=1) { return 1; } return fib(x-1) + fib(x-2); }',
            expectedExitStatus: '21',
        },
        {
            code: 'int main() { return factorial(5); } int factorial(int n) { if (n==0) { return 1; } else { return(n * factorial(n-1));} }',
            expectedExitStatus: '120',
        },
    ];
    runTestCases(functionTestCases, 'Function test');

    const functionDeclarationTestCases = [
        {
            code: 'int add(int x, int y); int main() { return add(3,4); } int add(int x, int y) { return x+y; }',
            expectedExitStatus: '7',
        },
        {
            code: 'int sub(int x, int y); int main() { return sub(4,3); } int sub(int x, int y) { return x-y; }',
            expectedExitStatus: '1',
        },
        {
            code: 'int multiply(int x, int y); int main() { return multiply(2,3); } int multiply(int x, int y) { return x*y; }',
            expectedExitStatus: '6',
        },
        {
            code: 'int divide(int x, int y); int main() { return divide(10,2); } int divide(int x, int y) { return x/y; }',
            expectedExitStatus: '5',
        },
        {
            code: 'int power(int base, int exp); int main() { return power(2,3); } int power(int base, int exp) { int result=1; while(exp) { result = result * base; exp = exp - 1; } return result; }',
            expectedExitStatus: '8',
        },
    ];
    runTestCases(functionDeclarationTestCases, 'Function declaration test');
});
