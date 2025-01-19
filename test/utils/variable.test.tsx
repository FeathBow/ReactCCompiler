import createTestRunner from './commons';

const filename = 'variableTest';
const runTestCases = createTestRunner(filename);

describe('Variable operations', () => {
    const localVariableTestCases = [
        { code: 'int main(){ i64 x = 1; return x; }', expectedExitStatus: '1' },
        { code: 'int main(){ short x = 2; return x; }', expectedExitStatus: '2' },
        { code: 'int main(){ char x = 3; return x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int x = 4; return x; }', expectedExitStatus: '4' },
        { code: 'int main(){ int x = 10; i64 y = 13; char z = 4; return x; }', expectedExitStatus: '10' },
        { code: 'int main(){ char x = 97; short xx = 96; i64 xxx= 95; return x; }', expectedExitStatus: '97' },
    ];
    runTestCases(localVariableTestCases, 'Local variable test');

    const globalVariableTestCases = [
        { code: 'int x; int main(){ x = 2 + 3 * 4 - 5 / 3; return x; }', expectedExitStatus: '13' },
        { code: 'int a[3], x; int main(){ a[2] = 1; x = a[2]; return x; }', expectedExitStatus: '1' },
        { code: 'int (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '16' },
        { code: 'char (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '4' },
        { code: 'i64 (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '32' },
        { code: 'short (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '8' },
    ];
    runTestCases(globalVariableTestCases, 'Global variable test');

    const scopeTestCases = [
        { code: 'int main(){ int x = 1; { int x = 2; return x; } }', expectedExitStatus: '2' },
        { code: 'int main(){ int x = 1; { int x = 2; } return x; }', expectedExitStatus: '1' },
        { code: 'int main(){ int x = 1; { x = 2; } return x; }', expectedExitStatus: '2' },
        { code: 'int main(){ int x = 1; { int y = 2; return x; } }', expectedExitStatus: '1' },

        { code: 'int x; int main(){ x = 1; { x = 2; { int x = 3; return x; } } }', expectedExitStatus: '3' },
        { code: 'int x; int main(){ x = 1; { x = 2; { int x = 3; } return x; } }', expectedExitStatus: '2' },
        { code: 'int x; int main(){ x = 1; { x = 2; { x = 3; } return x; } }', expectedExitStatus: '3' },
        { code: 'int x; int main(){ x = 1; { x = 2; { x = 3; return x; } } }', expectedExitStatus: '3' },

        { code: 'int x; int main(){ x = 1; { int x = 2; { x = 3; return x; } } }', expectedExitStatus: '3' },
        { code: 'int x; int main(){ x = 1; { int x = 2; { x = 3; } return x; } }', expectedExitStatus: '3' },
        { code: 'int x; int main(){ x = 1; { int x = 2; { int x = 3; return x; } } }', expectedExitStatus: '3' },
        { code: 'int x; int main(){ x = 1; { int x = 2; { int x = 3; } return x; } }', expectedExitStatus: '2' },

        { code: 'int x; int main(){ x = 1; { { x = 2; { int x = 3; } } return x; } }', expectedExitStatus: '2' },
        { code: 'int x; int main(){ x = 1; { { x = 2; { int x = 3; } } return x; } }', expectedExitStatus: '2' },
        { code: 'int x; int main(){ x = 1; { { x = 2; { x = 3; } } return x; } }', expectedExitStatus: '3' },
        { code: 'int x; int main(){ x = 1; { { x = 2; { x = 3; } } return x; } }', expectedExitStatus: '3' },

        { code: 'int x; int main(){ x = 1; { { int x = 2; { x = 3; } } return x; } }', expectedExitStatus: '1' },
        { code: 'int x; int main(){ x = 1; { { int x = 2; { x = 3; } } return x; } }', expectedExitStatus: '1' },
        { code: 'int x; int main(){ x = 1; { { int x = 2; { int x = 3; } } return x; } }', expectedExitStatus: '1' },
        { code: 'int x; int main(){ x = 1; { { int x = 2; { int x = 3; } } return x; } }', expectedExitStatus: '1' },
    ];
    runTestCases(scopeTestCases, 'Scope test');
});
