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

        { code: 'int main(){ struct {char a;int b;} x[10]; return sizeof(x); }', expectedExitStatus: '80' },
        { code: 'int main(){ struct {char a;int b;} x[10]; return sizeof(x[0]); }', expectedExitStatus: '8' },
    ];
    runTestCases(typeTestCases, 'Type test');

    const sizeofTestCases = [
        { code: 'int main(){ int x[13]; return sizeof(x); }', expectedExitStatus: '52' },
        { code: 'int main(){ int x[13]; return sizeof(*x); }', expectedExitStatus: '4' },
        { code: 'int main(){ int x[13]; return sizeof(x[0]); }', expectedExitStatus: '4' },

        { code: 'int main(){ int x[2][13]; return sizeof(x); }', expectedExitStatus: '104' },
        { code: 'int main(){ int x[2][13]; return sizeof(*x); }', expectedExitStatus: '52' },
        { code: 'int main(){ int x[2][13]; return sizeof(**x); }', expectedExitStatus: '4' },

        { code: 'int main(){ char x[2][13]; return sizeof(**x + 1); }', expectedExitStatus: '1' },
        { code: 'int main(){ char x[2][13]; return sizeof(**x) + 1; }', expectedExitStatus: '2' },
        { code: 'int main(){ char x[2][13]; return sizeof **x + 1; }', expectedExitStatus: '2' },
    ];
    runTestCases(sizeofTestCases, 'Sizeof test');

    const memoryAlignmentTestCases = [
        { code: 'int main(){ struct {char a;int b[3];} x[10]; return sizeof(x[0]); }', expectedExitStatus: '16' },
        { code: 'int main(){ struct {char a;int b[3];} x[10]; return sizeof(x[0].b); }', expectedExitStatus: '12' },
        { code: 'int main(){ struct {char a;int b[3];} x[10]; return sizeof(x[0].a); }', expectedExitStatus: '1' },
        { code: 'int main(){ union {char a;int b[3];} x; x.a = 1; return sizeof(x); }', expectedExitStatus: '12' },
        { code: 'int main(){ union {short a;int b[3];} x; x.a = 1; return sizeof(x); }', expectedExitStatus: '12' },
        { code: 'int main(){ union {char a;short b[3];} x; x.a = 1; return sizeof(x); }', expectedExitStatus: '6' },
        { code: 'int main(){ union {int a;char b[3];} x; x.a = 1; return sizeof(x); }', expectedExitStatus: '4' },
    ];
    runTestCases(memoryAlignmentTestCases, 'Memory alignment test');
});
