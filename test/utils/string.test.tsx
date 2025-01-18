import createTestRunner from './commons';

const filename = 'stringTest';
const runTestCases = createTestRunner(filename);

describe('String operations', () => {
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

        { code: 'int main() { return "\\0"[0]; }', expectedExitStatus: '0' },
        { code: 'int main() { return "\\01"[0]; }', expectedExitStatus: '1' },
        { code: 'int main() { return "\\012"[0]; }', expectedExitStatus: '10' },
        { code: 'int main() { return "\\0123"[0]; }', expectedExitStatus: '10' },
        { code: 'int main() { return "\\0123"[1]; }', expectedExitStatus: '51' },
        { code: 'int main() { return "\\75a3"[0]; }', expectedExitStatus: '61' },
        { code: 'int main() { return "\\75a3"[1]; }', expectedExitStatus: '97' },
        { code: 'int main() { return "\\0123"[1]; }', expectedExitStatus: '51' },

        { code: 'int main() { return "\\x0"[0]; }', expectedExitStatus: '0' },
        { code: 'int main() { return "\\x01"[0]; }', expectedExitStatus: '1' },
        { code: 'int main() { return "\\x011"[0]; }', expectedExitStatus: '17' },
        { code: 'int main() { return "\\x0011"[0]; }', expectedExitStatus: '17' },
        { code: 'int main() { return "\\x1g11"[0]; }', expectedExitStatus: '1' },
        { code: 'int main() { return "\\x11g1"[0]; }', expectedExitStatus: '17' },
        { code: 'int main() { return "\\x11g1"[1]; }', expectedExitStatus: '103' },
        { code: 'int main() { return "\\x11g1"[2]; }', expectedExitStatus: '49' },
        { code: 'int main() { return "\\xag11"[3]; }', expectedExitStatus: '49' },

        { code: 'int main() { return "\\xa\\011\\t\\b"[1]; }', expectedExitStatus: '9' },
        { code: 'int main() { return sizeof("\\xa\\011\\t\\b"); }', expectedExitStatus: '5' },
        { code: 'int main() { return "\\x00000000000000a\\011\\t\\b"[0]; }', expectedExitStatus: '10' },
    ];
    runTestCases(EscapeCharacterTestCases, 'Escape character test');
});
