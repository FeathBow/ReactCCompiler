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
    const [codeString] = useState('gcc -o test test.s && ./test && echo $?');
    const { colorMode } = useColorMode();
    const currentStyle = colorMode === 'light' ? solarizedlight : okaidia;
    const boxShadowColor = colorMode === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';

    const handleCopy = (): void => {
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
    };

    return (
        <VStack spacing={4} align='stretch' p={5}>
            <Heading size='lg'>如何使用</Heading>

            <Text>这个帮助页面将指导你如何使用代码转换,并观察转化后的执行结果。</Text>

            <Heading size='md'>1. 类C语言代码转换</Heading>
            <Text>
            在访问{' '}
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
                页面时，你可以在{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    TextArea
                </Code>{' '}
                中输入符合标准的类 C 语言代码。
            </Text>

            <Button onClick={onToggle} mt='2' borderRadius='md' colorScheme='teal'>
                {isOpen ? '隐藏示例代码' : '显示示例代码'}
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
                    onClick={handleCopy}
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
                        {'int main()\n{\n\treturn 42;\n}'}
                    </SyntaxHighlighter>
                </Box>
                <Separator />
                <Button colorScheme='teal' variant='outline' width='full' onClick={handleCopy}>
                    <CopyIcon mr={2} /> 复制
                </Button>
            </Collapse>

            <Text mt='2'>
                点击{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    Submit
                </Code>{' '}
                按钮，你将在下方看到转换成汇编语言的代码。这个代码可以被复制并用于进一步的编译和执行。
            </Text>

            <Heading size='md'>2. 编译和执行</Heading>
            <Text>
                当你获取汇编代码后，可以将其保存为{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    test.s
                </Code>{' '}
                文件。然后在命令行中使用以下命令进行编译和执行：
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
                onClick={handleCopy}
            >
                <SyntaxHighlighter
                    language='bash'
                    style={currentStyle}
                    wrapLines
                    wrapLongLine
                    customStyle={{ whiteSpace: 'pre-wrap', marginTop: 0 }}
                    showLineNumbers
                >
                    {codeString}
                </SyntaxHighlighter>
            </Box>
            <Button colorScheme='teal' variant='outline' width='full' onClick={handleCopy}>
                <CopyIcon mr={2} /> 复制
            </Button>

            <Separator />

            <Text mt='2'>
                此命令会编译汇编代码文件{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    test.s
                </Code>
                ，并生成可执行文件{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    test
                </Code>
                。
            </Text>
            <Text>
                执行{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    ./test
                </Code>{' '}
                命令以运行编译后的程序。
            </Text>

            <Text mt='2'>
                最后，通过执行{' '}
                <Code borderRadius='md' colorScheme='teal'>
                    echo $?
                </Code>{' '}
                命令，你可以查看程序的返回值。请注意，返回值必须在 0 到 255（8位）之间。
            </Text>

            <Heading size='md'>3. 额外说明</Heading>
            <Text>
                在访问{' '}
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
                页面时，操作流程与{' '}
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
                相似。
            </Text>
            <Text>确保你的代码符合类 C 语言的标准，这样才能正确地转换。</Text>

            <Heading size='md'>4. 常见问题</Heading>
            <Text>如果你在使用过程中遇到任何问题，请通过邮件联系以获得技术支持。</Text>
        </VStack>
    );
}

export default HelpsPage;
