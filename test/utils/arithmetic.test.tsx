import createTestRunner from './commons';

const filename = 'arithmeticTest';
const runTestCases = createTestRunner(filename);

describe('Arithmetic operations', () => {
    const addTestCases = [
        { code: 'int main(){ return 13+25; }', expectedExitStatus: '38' },
        { code: 'int main(){ return 5+7; }', expectedExitStatus: '12' },
        { code: 'int main(){ return 8+9; }', expectedExitStatus: '17' },
    ];
    runTestCases(addTestCases, 'Add test');

    const subtractionTestCases = [
        { code: 'int main(){ return 10-3; }', expectedExitStatus: '7' },
        { code: 'int main(){ return 20-5; }', expectedExitStatus: '15' },
        { code: 'int main(){ return 30-6; }', expectedExitStatus: '24' },
    ];
    runTestCases(subtractionTestCases, 'Subtraction test');

    const multiplicationTestCases = [
        { code: 'int main(){ return 3*4; }', expectedExitStatus: '12' },
        { code: 'int main(){ return 5*6; }', expectedExitStatus: '30' },
        { code: 'int main(){ return 7*8; }', expectedExitStatus: '56' },
    ];
    runTestCases(multiplicationTestCases, 'Multiplication test');

    const divisionTestCases = [
        { code: 'int main(){ return 20/5; }', expectedExitStatus: '4' },
        { code: 'int main(){ return 30/6; }', expectedExitStatus: '5' },
        { code: 'int main(){ return 41/8; }', expectedExitStatus: '5' },
    ];
    runTestCases(divisionTestCases, 'Division test');

    const compoundTestCases = [
        { code: 'int main(){ return (3 + 5) * 7; }', expectedExitStatus: '56' },
        { code: 'int main(){ return 20 - (3 * 5); }', expectedExitStatus: '5' },
        { code: 'int main(){ return (30 + 2) / 8; }', expectedExitStatus: '4' },
        { code: 'int main(){ return 4 * (2 + 9); }', expectedExitStatus: '44' },
        { code: 'int main(){ return (3 + 7) * (2 + 5); }', expectedExitStatus: '70' },
        { code: 'int main(){ return ((3-5*2)*7 + (2*25+3)) * (6-4/3); }', expectedExitStatus: '20' },
    ];
    runTestCases(compoundTestCases, 'Compound test');

    const unaryPlusMinusTestCases = [
        { code: 'int main(){ return -20+30; }', expectedExitStatus: '10' },
        { code: 'int main(){ return - -20; }', expectedExitStatus: '20' },
        { code: 'int main(){ return - + - + 20; }', expectedExitStatus: '20' },
    ];
    runTestCases(unaryPlusMinusTestCases, 'Unary Plus Minus test');

    const equalityTestCases = [
        { code: 'int main(){ return 10==10; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 20==30; }', expectedExitStatus: '0' },
        { code: 'int main(){ return 30!=30; }', expectedExitStatus: '0' },
    ];
    runTestCases(equalityTestCases, 'Equality test');

    const lessThanTestCases = [
        { code: 'int main(){ return 10<20; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 20<20; }', expectedExitStatus: '0' },
        { code: 'int main(){ return 30<20; }', expectedExitStatus: '0' },
    ];
    runTestCases(lessThanTestCases, 'Less Than test');

    const greaterThanTestCases = [
        { code: 'int main(){ return 20>10; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 20>20; }', expectedExitStatus: '0' },
        { code: 'int main(){ return 20>30; }', expectedExitStatus: '0' },
    ];
    runTestCases(greaterThanTestCases, 'Greater Than test');

    const lessThanOrEqualTestCases = [
        { code: 'int main(){ return 10<=20; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 20<=20; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 30<=20; }', expectedExitStatus: '0' },
    ];
    runTestCases(lessThanOrEqualTestCases, 'Less Than or Equal test');

    const greaterThanOrEqualTestCases = [
        { code: 'int main(){ return 20>=10; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 20>=20; }', expectedExitStatus: '1' },
        { code: 'int main(){ return 20>=30; }', expectedExitStatus: '0' },
    ];
    runTestCases(greaterThanOrEqualTestCases, 'Greater Than or Equal test');

    const commaTestCases = [
        { code: 'int main(){ return 1, 2, 3; }', expectedExitStatus: '3' },
        { code: 'int main(){ return (1, 2, 3); }', expectedExitStatus: '3' },
        { code: 'int main(){ int x = 1, y = 2; return x, y; }', expectedExitStatus: '2' },
        { code: 'int main(){ int x = 1, y = 2; return y, x; }', expectedExitStatus: '1' },
        { code: 'int main(){ int x = 1, y = 2; (x = 3, y) = 4; return x, y; }', expectedExitStatus: '4' },
        { code: 'int main(){ int x = 1, y = 2; (x = 3, y) = 4; return y, x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int x = 1, y = 2; (x = 3, y = 4); return x, y; }', expectedExitStatus: '4' },
        { code: 'int main(){ int x = 1, y = 2; (x = 3, y = 4); return y, x; }', expectedExitStatus: '3' },
        { code: 'int main(){ int x = 1, y = 2; x = 3, y = 4; return x, y; }', expectedExitStatus: '4' },
        { code: 'int main(){ int x = 1, y = 2; x = 3, y = 4; return y, x; }', expectedExitStatus: '3' },
    ];
    runTestCases(commaTestCases, 'Comma test');

    const typecastTestCases = [
        { code: 'int main(){ return (int)4294967300; }', expectedExitStatus: '4' },
        { code: 'int main(){ return (short)4295032840; }', expectedExitStatus: '8' },
        { code: 'int main(){ return (char)257; }', expectedExitStatus: '1' },
        { code: 'int main(){ int a = 64; *(char *)&a = 1; return a; }', expectedExitStatus: '1' },
        { code: 'int main(){ int a = 65536; *(short *)&a = 257; return (char)a; }', expectedExitStatus: '1' },
    ];
    runTestCases(typecastTestCases, 'Typecast test');
});
