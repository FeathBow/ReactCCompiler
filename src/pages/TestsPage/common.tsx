import { CheckCircleIcon } from '@chakra-ui/icons';

export const arithmeticFeatures = [
    {
        title: 'Precision Addition',
        description:
            'Delves into the foundational arithmetic operation of addition to ensure exact calculations, crucial for scientific accuracy.',
        example: `int main() {\n\treturn 13 + 25;\n}`,
        result: '38',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Robust Subtraction',
        description:
            'Scrutinizes subtraction processes to guarantee error-free results, vital for applications demanding strict error margins.',
        example: `int main() {\n\treturn 30 - 6;\n}`,
        result: '24',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Multiplicative Reliability',
        description:
            'Confirms the integrity of multiplication operations, ensuring high performance and reliability in computational tasks.',
        example: `int main() {\n\treturn 7 * 8;\n}`,
        result: '56',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Division Accuracy',
        description:
            'Validates division for precise quotient determination, which is essential for applications that require fractional computations.',
        example: `int main() {\n\treturn 20 / 5;\n}`,
        result: '4',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Complex Expression Evaluation',
        description:
            'Tests complex mathematical expressions to ensure that higher-level calculations maintain computational correctness.',
        example: `int main() {\n\treturn (3 + 5) * 7;\n}`,
        result: '56',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Logical Comparisons',
        description:
            'Examines the precision of relational operators, critical for controlling flow and ensuring accurate decision-making in code logic.',
        example: `int main() {\n\treturn 20 >= 10;\n}`,
        result: 'True',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
];
export const controlFeatures = [
    {
        title: 'Conditional Logic Testing',
        description:
            'Ensures that if-else structures operate flawlessly, directing the flow of operations correctly based on given conditions.',
        example: `int main() {\n\tint x;\n\tif (0) {\n\t\tx=2;\n\t} else {\n\t\tx=3;\n\t}\n\treturn x;\n}`,
        result: '3',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Loop Functionality Assurance',
        description:
            'Validates for loops for their ability to handle iterative processing, ensuring they perform efficiently and accurately over ranges of values.',
        example: `int main() {\n\tint i=0; int j=0;\n\tfor (i=0; i<=10; i=i+1) {\n\t\tj=i+j;\n\t}\n\treturn j;\n}`,
        result: '55',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'While Loop Reliability',
        description:
            'Confirms the reliability of while loops in maintaining proper control over repetitive tasks, crucial for tasks requiring conditional repetition.',
        example: `int main() {\n\tint i=0;\n\twhile(i<10) {\n\t\ti=i+1;\n\t}\n\treturn i;\n}`,
        result: '10',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Advanced Control Mechanisms',
        description:
            'Tests complex control logic involving nested loops and conditions, ensuring robustness in handling intricate operations.',
        example: `int main() {\n\tint x;\n\tif (1) {\n\t\tx = 2;\n\t\tint i = 0;\n\t\twhile (i < 5) {\n\t\t\tif (i - i / 2 * 2 == 0) {\n\t\t\t\tx = x + 2;\n\t\t\t} else {\n\t\t\t\tx = x + 1;\n\t\t\t}\n\t\t\ti = i + 1;\n\t\t}\n\t} else {\n\t\tx = 3;\n\t\tint i = 0;\n\t\tfor (i = 0; i < 5; i = i + 1) {\n\t\t\tif (i - i / 2 * 2 == 0) {\n\t\t\t\tx = x + 2;\n\t\t\t} else {\n\t\t\t\tx = x + 1;\n\t\t\t}\n\t\t}\n\t}\n\treturn x;\n}`,
        result: '10',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
];

export const functionFeatures = [
    {
        title: 'Addition Functionality',
        description: 'Asserts the accuracy of the add function, a basic yet crucial element of arithmetic operations.',
        example: `int add(int x, int y) {\n\treturn x + y;\n}`,
        result: '7 (from add(3,4))',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Subtraction Routine',
        description:
            'Verifies that the sub function performs subtraction accurately, testing the complement of addition.',
        example: `int sub(int x, int y) {\n\treturn x - y;\n}`,
        result: '1 (from sub(4,3))',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Multiplication Logic',
        description:
            'Ensures the multiply function yields correct products, an operation essential for scaling values.',
        example: `int multiply(int x, int y) {\n\treturn x * y;\n}`,
        result: '6 (from multiply(2,3))',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Division Operation',
        description:
            'Confirms that the divide function returns an accurate quotient, a foundational operation in arithmetic.',
        example: `int divide(int x, int y) {\n\treturn x / y;\n}`,
        result: '5 (from divide(10,2))',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Accumulative Summation',
        description:
            'Validates the ability of a function to handle multiple arguments simultaneously, testing the upper limits of parameter passing in function calls.',
        example: `int sum(int a, int b, int c, int d, int e, int f) {\n\treturn a + b + c + d + e + f;\n}`,
        result: '21 (from sum(1,2,3,4,5,6))',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Recursive Fibonacci',
        description:
            'Challenges the fib function with a classic recursion scenario, calculating Fibonacci numbers effectively.',
        example: `int main(void) {\n\treturn fib(7); \n} \nint fib(int x) { \n\tif (x<=1) \n\t{\n\t\treturn 1;\n\t}\n\treturn fib(x-1) + fib(x-2);\n}`,
        result: '21 (from fib(7))',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
];
export const pointerArrayFeatures = [
    {
        title: 'Basic Pointer Manipulation',
        description: 'Demonstrates fundamental pointer operations, highlighting the ability to modify data directly through memory addresses.',
        example: `int main() {\n\tint x=5;\n\tint *y=&x;\n\t*y=6;\n\treturn x;\n}`,
        result: '6',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Pointer Arithmetic and Array Navigation',
        description: 'Explores pointer arithmetic alongside array indexing, emphasizing precision in navigating and manipulating contiguous memory spaces.',
        example: `int main() {\n\tint x[2][3];\n\tint *y=x;\n\ty[3]=7;\n\treturn x[1][0];\n}`,
        result: '7',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    },
    {
        title: 'Multidimensional Data Handling',
        description: 'Tests complex data structures using pointers to multidimensional arrays, proving the robustness in handling nested data arrays efficiently.',
        example: `int main() {\n\tint x[2][3][2];\n\tx[0][0][0]=1;\n\tx[0][0][1]=2;\n\tx[0][1][0]=3;\n\tx[0][1][1]=4;\n\tx[0][2][0]=5;\n\tx[0][2][1]=6;\n\tx[1][0][0]=7;\n\tx[1][0][1]=8;\n\tx[1][1][0]=9;\n\tx[1][1][1]=10;\n\tx[1][2][0]=11;\n\tx[1][2][1]=12;\n\treturn x[1][2][1];\n}`,
        result: '12',
        icon: CheckCircleIcon,
        iconColor: 'green.500',
        contentType: 'code',
    }
];
