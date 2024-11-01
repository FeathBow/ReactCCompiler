import {
    Box,
    Heading,
    Text,
    Code,
    Collapse,
    Button,
    useDisclosure,
    useToast,
    Link,
    VStack,
    useColorMode,
    UnorderedList,
    ListItem,
    Container,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { CopyIcon } from '@chakra-ui/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight, okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import CustomAlert from 'Components/Alert';
import Separator from 'Components/Separator';
import { Link as RouterLink } from 'react-router-dom';

/**
 * HelpsPage component.
 * @returns {JSX.Element} The rendered HelpsPage component.
 */
function HelpsPage(): JSX.Element {
    const { isOpen, onToggle } = useDisclosure();
    const toast = useToast();
    const codeStringC = 'int main()\n{\n\treturn 42;\n}';
    const codeStringCommand = 'gcc -o test test.s && ./test && echo $?';
    const { colorMode } = useColorMode();
    const currentStyle = colorMode === 'light' ? solarizedlight : okaidia;
    const boxShadowColor = colorMode === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';

    const handleCopy = (textToCopy: string): void => {
        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                toast({
                    id: 'copy-toast',
                    duration: 5000,
                    isClosable: true,
                    position: 'bottom',
                    render: () => (
                        <CustomAlert
                            type='success'
                            title='Success'
                            description='Code copied to clipboard!'
                            isClosable
                            isToast={false}
                        />
                    ),
                });
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
            });
    };

    return (
        <Container maxW='container.lg' py={8}>
            <VStack spacing={4} align='stretch' p={5}>
                <Heading size='lg'>How to Use</Heading>

                <Text>
                    This help page will guide you on how to use the code conversion feature and observe the execution
                    results of the converted code.
                </Text>

                <Heading size='md'>1. Converting C-like Code</Heading>
                <Text>
                    When you visit the{' '}
                    <Link
                        as={RouterLink}
                        to='/Assembly'
                        transition='all 0.3s ease'
                        borderRadius='md'
                        p={3}
                        _hover={{
                            transform: 'scale(1.03)',
                            boxShadow: `0px 2px 3px ${boxShadowColor}`,
                            textDecoration: 'none',
                        }}
                        colorScheme='teal'
                    >
                        Assembly
                    </Link>{' '}
                    page, you can input standard C-like code in the{' '}
                    <Code borderRadius='md' colorScheme='teal'>
                        TextArea
                    </Code>
                </Text>
                <CustomAlert
                    type='info'
                    title='Reminder'
                    description='Ensure that your code adheres to standard C syntax to enable correct conversion.'
                    isClosable={false}
                    isToast={false}
                    fullWidth={true}
                />
                <Button onClick={onToggle} mt='2' borderRadius='md' colorScheme='teal'>
                    {isOpen ? 'Hide Sample Code' : 'Show Sample Code'}
                </Button>

                <Collapse in={isOpen}>
                    <Box
                        p={4}
                        borderRadius='md'
                        transition='all 0.3s ease'
                        _hover={{
                            transform: 'scale(1.03)',
                            boxShadow: `0px 2px 3px ${boxShadowColor}`,
                            textDecoration: 'none',
                        }}
                        cursor='pointer'
                        onClick={() => handleCopy(codeStringC)}
                    >
                        <SyntaxHighlighter
                            language='cpp'
                            style={currentStyle}
                            wrapLines
                            wrapLongLines
                            customStyle={{ whiteSpace: 'pre-wrap', marginTop: 0 }}
                            lineProps={(lineNumber) => {
                                const style: React.CSSProperties = { display: 'block' };
                                if (lineNumber % 2 === 0) {
                                    style.backgroundColor = colorMode === 'light' ? '#ede5cf' : '#2c2c2c';
                                }
                                return { style };
                            }}
                            showLineNumbers
                        >
                            {codeStringC}
                        </SyntaxHighlighter>
                    </Box>
                    <Separator />
                    <Button colorScheme='teal' variant='outline' width='full' onClick={() => handleCopy(codeStringC)}>
                        <CopyIcon mr={2} /> Copy
                    </Button>
                </Collapse>

                <Text mt='2'>
                    Click the{' '}
                    <Code borderRadius='md' colorScheme='teal'>
                        Submit
                    </Code>{' '}
                    button, and you will see the code converted to assembly language below. You can copy this code and
                    use it for further compilation and execution.
                </Text>

                <Heading size='md'>2. Compiling and Executing</Heading>
                <Text>
                    After obtaining the assembly code, save it as a{' '}
                    <Code borderRadius='md' colorScheme='teal'>
                        test.s
                    </Code>{' '}
                    file. Then, in the command line, use the following command to compile and execute:
                </Text>
                <Box
                    p={4}
                    borderRadius='md'
                    transition='all 0.3s ease'
                    _hover={{
                        transform: 'scale(1.03)',
                        boxShadow: `0px 2px 3px ${boxShadowColor}`,
                        textDecoration: 'none',
                    }}
                    cursor='pointer'
                    onClick={() => handleCopy(codeStringCommand)}
                >
                    <SyntaxHighlighter
                        language='bash'
                        style={currentStyle}
                        wrapLines
                        wrapLongLine
                        customStyle={{ whiteSpace: 'pre-wrap', marginTop: 0 }}
                        showLineNumbers
                    >
                        {codeStringCommand}
                    </SyntaxHighlighter>
                </Box>
                <Button colorScheme='teal' variant='outline' width='full' onClick={() => handleCopy(codeStringCommand)}>
                    <CopyIcon mr={2} /> Copy
                </Button>

                <Separator />

                <Text mt='2'>
                    This command compiles the assembly code file{' '}
                    <Code borderRadius='md' colorScheme='teal'>
                        test.s
                    </Code>{' '}
                    and generates an executable file{' '}
                    <Code borderRadius='md' colorScheme='teal'>
                        test
                    </Code>
                    .
                </Text>
                <Text>
                    Run the command{' '}
                    <Code borderRadius='md' colorScheme='teal'>
                        ./test
                    </Code>{' '}
                    to execute the compiled program.
                </Text>

                <CustomAlert
                    type='warning'
                    title='Note'
                    description='Please note that the return value must be between 0 and 255 (an 8-bit unsigned integer).'
                    isClosable={false}
                    isToast={false}
                    fullWidth={true}
                />

                <Heading size='md'>3. Additional Information</Heading>
                <Text>
                    When visiting the{' '}
                    <Link
                        as={RouterLink}
                        to='/Quadruple'
                        transition='all 0.3s ease'
                        borderRadius='md'
                        p={3}
                        _hover={{
                            transform: 'scale(1.03)',
                            boxShadow: `0px 2px 3px ${boxShadowColor}`,
                            textDecoration: 'none',
                        }}
                        colorScheme='teal'
                    >
                        Quadruple
                    </Link>{' '}
                    page, the operation process is similar to the{' '}
                    <Link
                        as={RouterLink}
                        to='/Assembly'
                        transition='all 0.3s ease'
                        borderRadius='md'
                        p={3}
                        _hover={{
                            transform: 'scale(1.03)',
                            boxShadow: `0px 2px 3px ${boxShadowColor}`,
                            textDecoration: 'none',
                        }}
                        colorScheme='teal'
                    >
                        Assembly
                    </Link>{' '}
                    page.
                </Text>
                <Text>Ensure that your code adheres to standard C syntax to enable correct conversion.</Text>

                <Heading size='md'>4. Frequently Asked Questions</Heading>

                <CustomAlert
                    type='warning'
                    title='Why is the conversion taking so long or not responding?'
                    description="If you experience delays after clicking 'Submit', it might be due to syntax errors in your code or the use of unsupported features. Please ensure your code follows standard C syntax and avoid using advanced features not yet supported."
                    isClosable={false}
                    isToast={false}
                    fullWidth={true}
                />

                <CustomAlert
                    type='info'
                    title='What syntax is supported by the converter?'
                    description='Currently, the converter supports basic C syntax including variable declarations, arithmetic operations, and return statements. Complex features like pointers, structs, and dynamic memory allocation may not be fully supported.'
                    isClosable={false}
                    isToast={false}
                    fullWidth={true}
                />

                <CustomAlert
                    type='info'
                    title='How can I debug syntax errors in my code?'
                    description='Carefully review your code for missing semicolons, unmatched brackets, or incorrect variable names. Ensure that all variables are declared before use and that your code adheres to C programming conventions.'
                    isClosable={false}
                    isToast={false}
                    fullWidth={true}
                />

                {/* Additional guidance for non-technical users */}
                <Heading size='md'>5. Tips for Non-Technical Users</Heading>
                <CustomAlert
                    type='info'
                    title='Attention'
                    description="If you're new to command-line operations, please read the following tips carefully."
                    isClosable={false}
                    isToast={false}
                    fullWidth={true}
                />
                <Text>If you are not familiar with command-line operations, here are some helpful tips:</Text>
                <UnorderedList pl={5} spacing={3}>
                    <ListItem>
                        <Text>
                            <Text as='b'>Accessing the Command Line:</Text> On <Text as='b'>Windows</Text>, open the
                            Command Prompt or PowerShell. On <Text as='b'>macOS</Text> or <Text as='b'>Linux</Text>,
                            open the Terminal application.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Text>
                            <Text as='b'>Installing GCC Compiler:</Text> Ensure that you have the{' '}
                            <Text as='b'>GCC compiler</Text> installed. If not, you can download it from the official
                            website or install it via package managers like <Text as='b'>Homebrew</Text> (macOS) or{' '}
                            <Text as='b'>apt</Text> (Linux).
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Text>
                            <Text as='b'>Saving the Assembly Code:</Text> When saving the assembly code, make sure the
                            file extension is correct (e.g.,{' '}
                            <Code borderRadius='md' colorScheme='teal'>
                                .s
                            </Code>
                            ) and the file is saved in the directory where you will run the compilation command.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Text>
                            <Text as='b'>Understanding Error Messages:</Text> If you receive any errors during
                            compilation or execution, carefully read the error messages. They often provide clues on how
                            to resolve the issues.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Text>
                            <Text as='b'>Permissions:</Text> Ensure that you have the necessary permissions to execute
                            files. On Unix-like systems, you may need to run{' '}
                            <Code borderRadius='md' colorScheme='teal'>
                                chmod +x test
                            </Code>{' '}
                            to make the file executable.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Text>
                            <Text as='b'>Further Assistance:</Text> Don't hesitate to search online for tutorials on
                            using the command line or compiling code. There are many resources available for beginners.
                        </Text>
                    </ListItem>
                </UnorderedList>
            </VStack>
        </Container>
    );
}

export default HelpsPage;
