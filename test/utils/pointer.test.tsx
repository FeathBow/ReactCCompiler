import createTestRunner from './commons';

const filename = 'pointerTest';
const runTestCases = createTestRunner(filename);

describe('Pointer and Array operations', () => {
    const basicPointerTestCases = [
        { code: 'int main(){ int x=5; int *y=&x; *y=6; return x; }', expectedExitStatus: '6' },
        { code: 'int main(){ int x=5; int y=7; return *(&x+1); }', expectedExitStatus: '7' },
        { code: 'int main(){ int x=5; int y=7; return *(&y-1); }', expectedExitStatus: '5' },
    ];
    runTestCases(basicPointerTestCases, 'Basic Pointer test');

    const advancedPointerTestCases = [
        { code: 'int main(){ int x=5; int *y=&x; int **z=&y; **z=7; return x; }', expectedExitStatus: '7' },
        { code: 'int main(){ int x=5; int y=7; int *p=&x, *q=&y; int **r=&p; return **r; }', expectedExitStatus: '5' },
        { code: 'int main(){ int x=5; int y=7; int *p=&x, *q=&y; int **r=&q; return **r; }', expectedExitStatus: '7' },
    ];
    runTestCases(advancedPointerTestCases, 'Advanced Pointer test');

    const multidimensionalPointerTestCases = [
        {
            code: 'int main(){ int x = 5; int *y = &x; int **z = &y; int ***a = &z; return ***a; }',
            expectedExitStatus: '5',
        },
        {
            code: 'int main(){ int x=5; int y=7; int *p=&x, *q=&y; int **r=&p, **s=&q; int ***t=&r; return ***t; }',
            expectedExitStatus: '5',
        },
        {
            code: 'int main(){ int x=5; int y=7; int *p=&x, *q=&y; int **r=&p, **s=&q; int ***t=&s; return ***t; }',
            expectedExitStatus: '7',
        },
    ];
    runTestCases(multidimensionalPointerTestCases, 'Multidimensional Pointer test');

    const basicArrayTestCases = [
        { code: 'int main(){ int x[3]; *x=4; x[1]=5; x[2]=6; return *x; }', expectedExitStatus: '4' },
        { code: 'int main(){ int x[3]; *x=4; x[1]=5; x[2]=6; return *(x+1); }', expectedExitStatus: '5' },
        { code: 'int main(){ int x[3]; *x=4; x[1]=5; x[2]=6; return *(x+2); }', expectedExitStatus: '6' },
    ];
    runTestCases(basicArrayTestCases, 'Basic Array test');

    const advancedArrayTestCases = [
        { code: 'int main(){ int x[2][3]; int *y=x; y[3]=7; return x[1][0]; }', expectedExitStatus: '7' },
        { code: 'int main(){ int x[2][3]; int *y=x; y[4]=8; return x[1][1]; }', expectedExitStatus: '8' },
        { code: 'int main(){ int x[2][3]; int *y=x; y[5]=9; return x[1][2]; }', expectedExitStatus: '9' },
    ];
    runTestCases(advancedArrayTestCases, 'Advanced Array test');

    const multidimensionalArrayTestCases = [
        {
            code: 'int main(){ int x[2][3]; x[0][0]=1; x[0][1]=2; x[0][2]=3; x[1][0]=4; x[1][1]=5; x[1][2]=6; return x[1][2]; }',
            expectedExitStatus: '6',
        },
        {
            code: 'int main(){ int x[2][3][2]; x[0][0][0]=1; x[0][0][1]=2; x[0][1][0]=3; x[0][1][1]=4; x[0][2][0]=5; x[0][2][1]=6; x[1][0][0]=7; x[1][0][1]=8; x[1][1][0]=9; x[1][1][1]=10; x[1][2][0]=11; x[1][2][1]=12; return x[1][2][1]; }',
            expectedExitStatus: '12',
        },
        {
            code: 'int main(){ int x[2][3][2]; x[0][0][0]=1; x[0][0][1]=2; x[0][1][0]=3; x[0][1][1]=4; x[0][2][0]=5; x[0][2][1]=6; x[1][0][0]=7; x[1][0][1]=8; x[1][1][0]=9; x[1][1][1]=10; x[1][2][0]=11; x[1][2][1]=12; return x[0][2][1]; }',
            expectedExitStatus: '6',
        },
    ];
    runTestCases(multidimensionalArrayTestCases, 'Multidimensional Array test');
});
