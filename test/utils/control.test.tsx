import createTestRunner from './commons';

const filename = 'controlTest';
const runTestCases = createTestRunner(filename);

describe('Control operations', () => {
    const ifElseTestCases = [
        { code: 'int main(){ int x; if (0) {x=2;} else {x=3;} return x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int x; if (1-1) {x=2;} else {x=3;} return x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int x; if (1) {x=2;} else {x=3;} return x; }', expectedExitStatus: '2' },
    ];
    runTestCases(ifElseTestCases, 'If Else test');

    const forLoopTestCases = [
        {
            code: 'int main(){ int i=0; int j=0; for (i=0; i<=10; i=i+1) {j=i+j;} return j; }',
            expectedExitStatus: '55',
        },
        { code: 'int main(){ int i=0; int j=0; for (i=0; i<5; i=i+1) {j=i+j;} return j; }', expectedExitStatus: '10' },
        { code: 'int main(){ int i=0; int j=0; for (i=0; i<3; i=i+1) {j=i+j;} return j; }', expectedExitStatus: '3' },
    ];
    runTestCases(forLoopTestCases, 'For Loop test');

    const whileLoopTestCases = [
        { code: 'int main(){ int i=0; while(i<10) {i=i+1;} return i; }', expectedExitStatus: '10' },
        { code: 'int main(){ int i=0; while(i<5) {i=i+1;} return i; }', expectedExitStatus: '5' },
        { code: 'int main(){ int i=0; while(i<3) {i=i+1;} return i; }', expectedExitStatus: '3' },
    ];
    runTestCases(whileLoopTestCases, 'While Loop test');

    const compoundTestCases = [
        {
            code: 'int main(){ int x; if (1) {x=2;} else {x=3;} int i=0; while(i<5) {i=i+1;} return x+i; }',
            expectedExitStatus: '7',
        },
        {
            code: 'int main(){ int x; if (0) {x=2;} else {x=3;} int i=0; while(i<5) {i=i+1;} return x+i; }',
            expectedExitStatus: '8',
        },
        {
            code: 'int main(){ int x; if (1-1) {x=2;} else {x=3;} int i=0; while(i<5) {i=i+1;} return x+i; }',
            expectedExitStatus: '8',
        },
        {
            code: 'int main(){ int x; if (1) {x=2;} else {x=3;} int i=0; for (i=0; i<5; i=i+1) {x=i+x;} return x; }',
            expectedExitStatus: '12',
        },
        {
            code: 'int main(){ int x; if (3-3) {x=2;} else {x=3;} int i=0; for (i=0; i<5; i=i+1) {x=i+x;} return x; }',
            expectedExitStatus: '13',
        },
        {
            code: 'int main(){int x;if(1){x=2;int i=0;while(i<5){if(i-i/2*2==0){x=x+2;}else{x=x+1;}i=i+1;}}else{x=3;int i=0;for(i=0;i<5;i=i+1){if(i-i/2*2==0){x=x+2;}else{x=x+1;}}}return x;}',
            expectedExitStatus: '10',
        },
    ];
    runTestCases(compoundTestCases, 'Compound test');
});
