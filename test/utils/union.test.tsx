import createTestRunner from './commons';

const filename = 'unionTest';
const runTestCases = createTestRunner(filename);

describe('Union operations', () => {
    const unionTestCases = [
        { code: 'int main(){ union A {int a;char b[4];} x; x.a = 3; return x.a; }', expectedExitStatus: '3' },
        { code: 'int main(){ union A {int a;char b[4];} x; x.a = 16909060; return x.b[0]; }', expectedExitStatus: '4' },
        { code: 'int main(){ union A {int a;char b[4];} x; x.a = 16909060; return x.b[1]; }', expectedExitStatus: '3' },
        { code: 'int main(){ union A {int a;char b[4];} x; x.a = 16909060; return x.b[2]; }', expectedExitStatus: '2' },
        { code: 'int main(){ union A {int a;char b[4];} x; x.a = 16909060; return x.b[3]; }', expectedExitStatus: '1' },
    ];
    runTestCases(unionTestCases, 'Union test');
});
