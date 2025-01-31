import createTestRunner from './commons';

const filename = 'structTest';
const runTestCases = createTestRunner(filename);

describe('Struct operations', () => {
    const dotAccessTestCases = [
        { code: 'int main(){ struct A {char a;int b;} x; x.a=1; x.b=2; return x.a; }', expectedExitStatus: '1' },
        { code: 'int main(){ struct A {char a;int b;} x; x.a=1; x.b=2; return x.b; }', expectedExitStatus: '2' },
        { code: 'int main(){ struct A {char a;int b;} x, y; x.a = 1; y = x; return y.a; }', expectedExitStatus: '1' },
        { code: 'int main(){ struct A {char a;int b;}; struct A x; x.a = 1; return x.a; }', expectedExitStatus: '1' },
        {
            code: 'int main(){ struct A {char a;int b;}; struct A x, y; x.a = 1; y = x; return y.a; }',
            expectedExitStatus: '1',
        },
        {
            code: 'int main(){ struct A {char a;int b;}; struct A x; x.a = 1; struct A *y = &x; return y->a; }',
            expectedExitStatus: '1',
        },
        {
            code: 'int main(){ struct A {char a;int b;}; struct A x; x.a = 1; struct A *y = &x; y->a = 2; return x.a; }',
            expectedExitStatus: '2',
        },

        { code: 'int main(){ struct A {char a;int b;} x; return sizeof(x); }', expectedExitStatus: '8' },
        { code: 'int main(){ struct A {char a;int b;} x; return sizeof(x.a); }', expectedExitStatus: '1' },
        { code: 'int main(){ struct A {char a;int b;} x; return sizeof(x.b); }', expectedExitStatus: '4' },

        { code: 'int main(){ struct B {} x; return sizeof(x); }', expectedExitStatus: '0' },
        { code: 'int main(){ struct B { struct {int a;} b;} x; return sizeof(x); }', expectedExitStatus: '4' },
        { code: 'int main(){ struct B { struct {int a;} b;} x; x.b.a = 1; return x.b.a; }', expectedExitStatus: '1' },
        {
            code: 'int main(){ struct B { struct {int a;} b;} x; int *y = &x.b.a; *y = 2; return x.b.a; }',
            expectedExitStatus: '2',
        },
        {
            code: 'int main(){ struct B { struct { struct {int a;} b;} c;} x; x.c.b.a = 3; return x.c.b.a; }',
            expectedExitStatus: '3',
        },
    ];
    runTestCases(dotAccessTestCases, 'Dot Access test');

    const arrowAccessTestCases = [
        {
            code: 'int main(){ struct C {char a;int b;} x; struct C *y = &x; y->a = 7; return x.a; }',
            expectedExitStatus: '7',
        },
        {
            code: 'int main(){ struct C { struct {int a;} b;} x; struct C *y = &x; y->b.a = 7; return x.b.a; }',
            expectedExitStatus: '7',
        },
        {
            code: 'int main(){ struct C { struct {int a;} b;} x; struct C *y = &x; (*y).b.a = 7; return x.b.a; }',
            expectedExitStatus: '7',
        },
        {
            code: 'int main(){ struct C { struct {int a;} b;} x; struct C *y = &x; int *z = &(*y).b.a; *z = 7; return x.b.a; }',
            expectedExitStatus: '7',
        },
        {
            code: 'int main(){ struct C { struct {int a;} b;} x; struct C *y = &x; int *z = &y->b.a; *z = 7; return x.b.a; }',
            expectedExitStatus: '7',
        },

    ];
    runTestCases(arrowAccessTestCases, 'Arrow Access test');
});
