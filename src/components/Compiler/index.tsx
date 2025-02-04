import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import {
    Box,
    Button,
    Textarea,
    Grid,
    GridItem,
    useDisclosure,
    Spinner,
    Flex,
    useToast,
    useColorMode,
    Text,
    VStack,
    Container,
    Heading,
} from '@chakra-ui/react';
import { solarizedlight, okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowForwardIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useLocation } from 'react-router-dom';
import Separator from 'Components/Separator';
import CustomAlert from 'Components/Alert';
import Parser from 'Utils/parser/parser';
import { GenerateCode, GenerateContext } from 'Utils/generator';
import TokenManager from 'Src/utils/lexer/tokenmanager';
import Tokenizer from 'Src/utils/lexer/tokenizer';
import OutputComponent from './output-component';
import QuadrupleOutputComponent from './quadruple-output-component';
import CodeBlock from './code-block';

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
    const { colorMode } = useColorMode();
    const toast = useToast();
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
        void (async () => {
            try {
                const tokenManager = new TokenManager();
                const tokenizer = new Tokenizer(code, tokenManager);
                const parser = new Parser(tokenizer);
                const { globalEntry, quadrupleOutput } = parser.parse();
                if (globalEntry === undefined) throw new Error('Global entry is undefined');
                const context = new GenerateContext();
                const generator = new GenerateCode(context);
                await generator.generateCode(globalEntry);
                setOutput(context.generated);
                setQuadruple(quadrupleOutput);
                setIsLoading(false);
            } catch (error) {
                console.error('An error occurred during parsing:', error);
                setIsLoading(false);
                toast({
                    id: 'copy-toast',
                    duration: 5000,
                    isClosable: true,
                    position: 'bottom',
                    render: () => (
                        <CustomAlert
                            type='error'
                            title='Compilation Error'
                            description='Syntax error: Please ensure your code follows standard C syntax.'
                            isClosable
                            isToast
                            fullWidth={false}
                        />
                    ),
                });
            }
        })();
    };

    const currentStyle = colorMode === 'light' ? solarizedlight : okaidia;
    const isAssemblyPage = location.pathname === '/assembly';
    const isQuadruplePage = location.pathname === '/quadruple';
    const pageTitle = isAssemblyPage ? 'C Code to Assembly Converter' : 'C Code to Quadruple Converter';
    const pageDescription = isAssemblyPage
        ? 'Enter standard C code in the input box below and click the submit button. The code will be converted to assembly code.'
        : 'Enter standard C code in the input box below and click the submit button. The code will be converted to quadruple representation.';

    return (
        <Container maxW='container.lg' py={8}>
            {' '}
            <VStack spacing={6} align='stretch'>
                <Box textAlign='center'>
                    <Heading size='lg' mb={2}>
                        {pageTitle}
                    </Heading>{' '}
                    <Text fontSize='md' color='gray.600'>
                        {pageDescription}
                    </Text>{' '}
                </Box>
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
                                    minHeight='200px'
                                    resize='vertical'
                                    placeholder='Please enter your C code here...'
                                    fontFamily='monaco'
                                    borderColor='gray.300'
                                    _hover={{ borderColor: 'gray.400' }}
                                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                                />
                            </GridItem>

                            <Button
                                rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                colorScheme='teal'
                                onClick={onToggle}
                            >
                                {isOpen ? 'Hide Code' : 'Show Code'}
                            </Button>

                            <CodeBlock isOpen={isOpen} code={code} colorMode={colorMode} currentStyle={currentStyle} />
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
                            {isAssemblyPage && output !== undefined && output.length > 0 && (
                                <Box>
                                    <Heading size='md' mt={4} mb={2}>
                                        Converted Assembly Code
                                    </Heading>{' '}
                                    <OutputComponent output={output} />
                                </Box>
                            )}
                            {isQuadruplePage && quadruple !== undefined && quadruple.length > 0 && (
                                <Box>
                                    <Heading size='md' mt={4} mb={2}>
                                        Converted Quadruple Representation
                                    </Heading>
                                    <QuadrupleOutputComponent quadrupleOutput={quadruple} />
                                </Box>
                            )}
                        </>
                    )}
                </Box>
                <CustomAlert
                    type='info'
                    title='Note'
                    description='Please ensure your code follows standard C syntax to obtain correct conversion results.'
                    isClosable={false}
                    isToast={false}
                    fullWidth
                />
            </VStack>
        </Container>
    );
}
export default Compiler;
