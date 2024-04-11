import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import {
    Box,
    Button,
    Textarea,
    Grid,
    GridItem,
    Collapse,
    useDisclosure,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Tfoot,
    Spinner,
    TableCaption,
    Flex,
    useToast,
} from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowForwardIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon } from '@chakra-ui/icons';
import { useLocation } from 'react-router-dom';
import Separator from 'Components/Separator';
import CustomAlert from 'Components/Alert';
import { tokenize } from './utils/token';
import { parse } from './utils/parse';
import { generateCode, getGenerated } from './utils/generate';
import { logMessage } from './utils/logger';

interface Location {
    pathname: string;
}

const debounce = (
    functionToDebounce: (event: FormEvent<HTMLTextAreaElement>) => void,
    wait: number,
): ((event: FormEvent<HTMLTextAreaElement>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return (event: FormEvent<HTMLTextAreaElement>): void => {
        if (event.currentTarget === null) return;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            functionToDebounce(event);
        }, wait);
    };
};

/**
 * Compiler 组件，用于处理用户输入的代码，生成和显示输出。
 * The Compiler component, used to handle user input code, generate and display output.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function Compiler(): JSX.Element {
    const [code, setCode] = useState<string>('');
    const [output, setOutput] = useState<string[]>([]);
    const [quadruple, setQuadruple] = useState('');
    const { isOpen, onToggle } = useDisclosure();
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const location: Location = useLocation();
    const debouncedHandleInput = useRef<((event: FormEvent<HTMLTextAreaElement>) => void) & { cancel?: () => void }>();

    useEffect(() => {
        debouncedHandleInput.current = debounce((event: FormEvent<HTMLTextAreaElement>) => {
            setCode((event.target as HTMLTextAreaElement).value);
        }, 300);
        return () => {
            if (debouncedHandleInput.current?.cancel !== undefined) {
                debouncedHandleInput.current.cancel();
            }
        };
    }, [debouncedHandleInput]);

    const handleInput = (event: FormEvent<HTMLTextAreaElement>): void => {
        const target = event.target as HTMLTextAreaElement;
        target.style.height = 'inherit';
        target.style.height = `${target.scrollHeight}px`;
        debouncedHandleInput.current?.(event);
    };

    const handleSubmit = (event: React.FormEvent): void => {
        event.preventDefault();
        setIsLoading(true);
        const tokens = tokenize(code);
        logMessage('info', 'Tokens', { tokens: JSON.stringify(tokens) });
        const { functionNode, quadrupleOutput } = parse(tokens);
        logMessage('info', 'AST', { program: JSON.stringify(functionNode) });

        // generateCode(functionNode);
        // setOutput(getGenerated());
        // setQuadruple(quadrupleOutput);

        generateCode(functionNode)
            .then(() => {
                setOutput(getGenerated());
                setQuadruple(quadrupleOutput);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('An error occurred:', error);
                setIsLoading(false);
            });
    };

    return (
        <Box>
            <Box as='form' onSubmit={handleSubmit}>
                <Grid templateColumns='repeat(1, 1fr)' gap={6} height='full'>
                    <GridItem>
                        <Textarea
                            aria-label='Code Input'
                            value={code}
                            onInput={handleInput}
                            onChange={(event) => {
                                setCode(event.target.value);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Tab') {
                                    event.preventDefault();
                                    const target = event.target as HTMLTextAreaElement;
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    const newCode = `${code.slice(0, start)}\t${code.slice(end)}`;
                                    setCode(newCode);
                                    setTimeout(() => {
                                        target.selectionStart = target.selectionEnd = start + 1;
                                    }, 0);
                                }
                            }}
                            minHeight='100px'
                            resize='none'
                        />
                    </GridItem>

                    <Button
                        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        colorScheme='teal'
                        onClick={onToggle}
                    >
                        {isOpen ? 'Hide Code' : 'Show Code'}
                    </Button>
                    <Collapse in={isOpen} animateOpacity>
                        <Box width='100%' overflowX='hidden'>
                            <SyntaxHighlighter
                                language='cpp'
                                style={solarizedlight}
                                showLineNumbers
                                wrapLines
                                wrapLongLines
                                customStyle={{ whiteSpace: 'pre-wrap' }}
                                lineProps={(lineNumber) => {
                                    const style: React.CSSProperties = { display: 'block' };
                                    if (lineNumber % 2 === 0) {
                                        style.backgroundColor = '#ede5cf';
                                    }
                                    return { style };
                                }}
                            >
                                {code}
                            </SyntaxHighlighter>
                        </Box>
                    </Collapse>
                </Grid>
                <Separator />
                <Button
                    type='submit'
                    rightIcon={<ArrowForwardIcon />}
                    colorScheme='teal'
                    variant='outline'
                    width='full'
                >
                    Submit
                </Button>
            </Box>

            {isLoading ? (
                <Flex justify='center' align='center' h='200px'>
                    <Spinner size='xl' color='teal.500' />
                </Flex>
            ) : (
                <>
                    {location.pathname === '/assembly' && output !== undefined && output.length > 0 && (
                        <OutputComponent output={output} />
                    )}
                    {location.pathname === '/quadruple' && quadruple !== undefined && quadruple.length > 0 && (
                        <QuadrupleOutputComponent quadrupleOutput={quadruple} />
                    )}
                </>
            )}

        </Box>
    );
}

interface OutputProperties {
    readonly output: string[];
}
/**
 * OutputComponent 组件，用于显示输出的结果。
 * The OutputComponent, used to display the output results.
 * @param {OutputProperties} output - 需要显示的输出结果。The output results to display.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function OutputComponent({ output }: OutputProperties): JSX.Element {
    const codeString = output.join('\n');
    const toast = useToast();
    return (
        <Box>
            <SyntaxHighlighter
                language='nasm'
                style={solarizedlight}
                showLineNumbers
                wrapLines
                wrapLongLines
                customStyle={{ whiteSpace: 'pre-wrap' }}
                lineProps={(lineNumber) => {
                    const style: React.CSSProperties = { display: 'block' };
                    if (lineNumber % 2 === 0) {
                        style.backgroundColor = '#ede5cf';
                    }
                    return { style };
                }}
            >
                {codeString}
            </SyntaxHighlighter>
            <Button
                colorScheme='teal'
                variant='outline'
                width='full'
                onClick={() => {
                    navigator.clipboard
                        .writeText(codeString)
                        .then(() => {
                            toast({
                                duration: 5000,
                                isClosable: true,

                                render: () => (
                                    <CustomAlert
                                        type='success'
                                        title='Success'
                                        description='Code copied to clipboard!'
                                        isClosable
                                    />
                                ),
                            });
                        })
                        .catch((error) => {
                            console.error('Failed to copy text:', error);
                        });
                }}
            >
                <CopyIcon /> 复制
            </Button>
        </Box>
    );
}

interface QuadrupleOutputProperties {
    readonly quadrupleOutput: string;
}

/**
 * QuadrupleOutputComponent 组件，用于显示四元式输出。
 * The QuadrupleOutputComponent, used to display the quadruple output.
 * @param {QuadrupleOutputProperties} quadrupleOutput - 需要显示的四元式输出。The quadruple output to display.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function QuadrupleOutputComponent({ quadrupleOutput }: QuadrupleOutputProperties): JSX.Element {
    const quadrupleArray = quadrupleOutput
        .split('\n')
        .slice(1)
        .map((line) => line.match(/.{1,13}/g) ?? []);

    return (
        <Table variant='striped' colorScheme='teal'>
            <TableCaption> Quadruple Output </TableCaption>
            <Thead>
                <Tr>
                    <Th>id</Th>
                    <Th>op</Th>
                    <Th>argument1</Th>
                    <Th>argument2</Th>
                    <Th>result</Th>
                </Tr>
            </Thead>
            <Tbody>
                {quadrupleArray.map((quad, index) => (
                    <Tr key={quad[0]}>
                        {quad.map((item, itemIndex) => (
                            /* eslint-disable-next-line react/no-array-index-key */
                            <Td key={`${quad[0]}-${index}-${itemIndex}`}>{item}</Td>
                        ))}
                    </Tr>
                ))}
            </Tbody>
            <Tfoot>
                <Tr>
                    <Th>id</Th>
                    <Th>op</Th>
                    <Th>argument1</Th>
                    <Th>argument2</Th>
                    <Th>result</Th>
                </Tr>
            </Tfoot>
        </Table>
    );
}

export default Compiler;
