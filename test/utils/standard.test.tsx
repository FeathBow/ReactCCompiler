import createTestRunner from './commons';

const filename = 'standardTest';
const runTestCases = createTestRunner(filename);

describe('Standard operations', () => {
    const standardTestCases = [
        { code: 'int main(){ int x = 2 + 3 * 4 - 5 / 3; return x; }', expectedExitStatus: '13' },
        { code: 'int main(){ int a[3]; a[2] = 1; int x = a[2]; return x; }', expectedExitStatus: '1' },
        { code: 'int main() { return sub(4,3); } int sub(int x, int y) { return x-y; }', expectedExitStatus: '1' },
        { code: 'int main(){ int x=5; int *y=&x; int **z=&y; **z=7; return x; }', expectedExitStatus: '7' },
        { code: 'int main(){ int x; if (1 < 0) {x=2;} else {x=3;} return x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int i=0; while(i + 1 < 3) {i=i+1;} return i; }', expectedExitStatus: '2' },
        { code: 'int main(){ int i = 0;int j = 0; for (i=0; i<3; i=i+1) {j= i + j;} return j; }', expectedExitStatus: '3' },
        { code: 'int main(){ return sizeof(void); }', expectedExitStatus: '1' },
        { code: 'int main(){ return sizeof(i64*); }', expectedExitStatus: '8' },
        { code: 'int main(){ int (x[2])[2]; return sizeof(x); }', expectedExitStatus: '16' },
        { code: 'int main(){ return 20>=30; }', expectedExitStatus: '0' },
        {
            code: 'int main(){int x;if(1){x=2;int i=0;while(i<5){if(i-i/2*2==0){x=x+2;}else{x=x+1;}i=i+1;}}else{x=3;int i=0;for(i=0;i<5;i=i+1){if(i-i/2*2==0){x=x+2;}else{x=x+1;}}}return x;}',
            expectedExitStatus: '10',
        },
        {
            code: 'int program(int a,int b,int c){int i;int j;i=0;if(a>(b+c)){j=a+(b*c+1);}else{j=a;}while(i<=100){i=j*2;j=i;}return i;}int demo(int a){a=a+2;return a*2;}int main(void){int a;int b;int c;a=3;b=4;c=2;a=program(a,b,demo(c));return a;}',
            expectedExitStatus: '192',
        },
        {
            code: 'int program(int a,int b,int c){int i;int j;i=0;if(a>(b+c)){j=a+(b*c+1);}else{j=a;}while(i<=100){i=j*2;j=i;}return i;}int demo(int a){a=a+2;return a*2;}int main(void){int a[2][2];a[0][0]=3;a[0][1]=a[0][0]+1;a[1][0]=a[0][0]+a[0][1];a[1][1]=program(a[0][0],a[0][1],demo(a[1][0]));return a[1][1];}',
            expectedExitStatus: '192',
        },
    ];
    runTestCases(standardTestCases, 'Standard test');
});
