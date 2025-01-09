import React from 'react';
import { Box, Button, useToast, useColorMode } from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight, okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon } from '@chakra-ui/icons';
import CustomAlert from 'Components/Alert';

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
    const { colorMode } = useColorMode();

    const currentStyle = colorMode === 'light' ? solarizedlight : okaidia;

    return (
        <Box>
            <SyntaxHighlighter
                language='nasm'
                style={currentStyle}
                showLineNumbers
                wrapLines
                wrapLongLines
                customStyle={{ whiteSpace: 'pre-wrap' }}
                lineProps={(lineNumber) => {
                    const style: React.CSSProperties = { display: 'block' };
                    if (lineNumber % 2 === 0) {
                        style.backgroundColor = colorMode === 'light' ? '#ede5cf' : '#2c2c2c';
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
                <CopyIcon /> Copy
            </Button>
        </Box>
    );
}

export default OutputComponent;
