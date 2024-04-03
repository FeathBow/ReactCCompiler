import createTestRunner from './commons';

const filename = 'otherTest';
const runTestCases = createTestRunner(filename);

describe('Others operations', () => {
    const typeTestCases = [
        { code: 'int main(){ return sizeof(i64); }', expectedExitStatus: '8' },
        { code: 'int main(){ return sizeof(int); }', expectedExitStatus: '4' },
        { code: 'int main(){ return sizeof(short); }', expectedExitStatus: '2' },
        { code: 'int main(){ return sizeof(char); }', expectedExitStatus: '1' },
        { code: 'int main(){ return sizeof(void); }', expectedExitStatus: '1' },
        { code: 'int main(){ return sizeof(i64*); }', expectedExitStatus: '8' },
        { code: 'int main(){ return sizeof(int*); }', expectedExitStatus: '8' },
        { code: 'int main(){ return sizeof(short*); }', expectedExitStatus: '8' },
        { code: 'int main(){ return sizeof(char*); }', expectedExitStatus: '8' },
        { code: 'int main(){ return sizeof(void*); }', expectedExitStatus: '8' },

        { code: 'int main(){ int (x[2])[2]; return sizeof(x); }', expectedExitStatus: '16' },
        { code: 'int main(){ int (x[2])[2]; return sizeof(x[0]); }', expectedExitStatus: '8' },
        { code: 'int main(){ int (*x)[2]; return sizeof(x[0]); }', expectedExitStatus: '8' },
    ];
    runTestCases(typeTestCases, 'Type test');

    const sizeofTestCases = [
        { code: 'int main(){ int x[13]; return sizeof(x); }', expectedExitStatus: '52' },
        { code: 'int main(){ int x[13]; return sizeof(*x); }', expectedExitStatus: '4' },

        { code: 'int main(){ int x[2][13]; return sizeof(x); }', expectedExitStatus: '104' },
        { code: 'int main(){ int x[2][13]; return sizeof(*x); }', expectedExitStatus: '52' },
        { code: 'int main(){ int x[2][13]; return sizeof(**x); }', expectedExitStatus: '4' },

        { code: 'int main(){ char x[2][13]; return sizeof(**x + 1); }', expectedExitStatus: '1' },
        { code: 'int main(){ char x[2][13]; return sizeof(**x) + 1; }', expectedExitStatus: '2' },
        { code: 'int main(){ char x[2][13]; return sizeof **x + 1; }', expectedExitStatus: '2' },
    ];
    runTestCases(sizeofTestCases, 'Sizeof test');

    const localVariableTestCases = [
        { code: 'int main(){ i64 x = 1; return x; }', expectedExitStatus: '1' },
        { code: 'int main(){ short x = 2; return x; }', expectedExitStatus: '2' },
        { code: 'int main(){ char x = 3; return x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int x = 4; return x; }', expectedExitStatus: '4' },
        { code: 'int main(){ int x = 10; i64 y = 13; char z = 4; return x; }', expectedExitStatus: '10' },
        { code: 'int main(){ char x = 97; short xx = 96; i64 xxx= 95; return x; }', expectedExitStatus: '97' },

    ];
    runTestCases(localVariableTestCases, 'Local variable test');
});
