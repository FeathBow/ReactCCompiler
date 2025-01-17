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

    const globalVariableTestCases = [
        { code: 'int x; int main(){ x = 2 + 3 * 4 - 5 / 3; return x; }', expectedExitStatus: '13' },
        { code: 'int a[3], x; int main(){ a[2] = 1; x = a[2]; return x; }', expectedExitStatus: '1' },
        { code: 'int (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '16' },
        { code: 'char (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '4' },
        { code: 'i64 (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '32' },
        { code: 'short (x[2])[2]; int main(){ return sizeof(x); }', expectedExitStatus: '8' },
    ];
    runTestCases(globalVariableTestCases, 'Global variable test');

    const stringTestCases = [
        { code: 'int main(){ return sizeof(""); }', expectedExitStatus: '1' },
        { code: 'int main() { return ""[0]; }', expectedExitStatus: '0' },
        { code: 'int main() { return "abc123"[0]; }', expectedExitStatus: '97' },
        { code: 'int main() { return "abc123"[1]; }', expectedExitStatus: '98' },
        { code: 'int main() { return "abc123"[2]; }', expectedExitStatus: '99' },
        { code: 'int main() { return "abc123"[3]; }', expectedExitStatus: '49' },
        { code: 'int main() { return "abc123"[4]; }', expectedExitStatus: '50' },
        { code: 'int main() { return "abc123"[5]; }', expectedExitStatus: '51' },
        { code: 'int main() { return "abc123"[6]; }', expectedExitStatus: '0' },
        { code: 'int main() { return sizeof("abc123"); }', expectedExitStatus: '7' },
        { code: 'int main() { return sizeof("abc123"[2]); }', expectedExitStatus: '1' },
    ];
    runTestCases(stringTestCases, 'String test');

    const EscapeCharacterTestCases = [
        { code: 'int main() { return "\\n"[0]; }', expectedExitStatus: '10' },
        { code: 'int main() { return "\\t"[0]; }', expectedExitStatus: '9' },
        { code: 'int main() { return "\\r"[0]; }', expectedExitStatus: '13' },
        { code: 'int main() { return "\\f"[0]; }', expectedExitStatus: '12' },
        { code: 'int main() { return "\\b"[0]; }', expectedExitStatus: '8' },
        { code: 'int main() { return "\\"[0]; }', expectedExitStatus: '92' },
        { code: 'int main() { return "\nt\rn"[0]; }', expectedExitStatus: '10' },
        { code: 'int main() { return "\nt\rn"[1]; }', expectedExitStatus: '116' },
        { code: 'int main() { return "\nt\rn"[2]; }', expectedExitStatus: '13' },
        { code: 'int main() { return "\nt\rn"[3]; }', expectedExitStatus: '110' },
        { code: 'int main() { return "\nt\rn"[4]; }', expectedExitStatus: '0' },
        { code: 'int main() { return sizeof("\nt\rn"); }', expectedExitStatus: '5' },
        { code: 'int main() { return sizeof("\\\\"); }', expectedExitStatus: '2' },
    ];
    runTestCases(EscapeCharacterTestCases, 'Escape character test');
});
