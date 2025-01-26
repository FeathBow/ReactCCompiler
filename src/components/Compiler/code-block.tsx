import React from 'react';
import { Box, Collapse, Text } from '@chakra-ui/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import CustomAlert from 'Components/Alert';

/**
 * CodeBlock properties.
 * @interface CodeBlockProperties
 * @property {boolean} isOpen - The state of the code block.
 * @property {string} code - The code to display.
 * @property {string} colorMode - The color mode of the code block.
 * @property {{ [key: string]: React.CSSProperties }} currentStyle - The current style of the code block.
 * @property {string} [codeLanguage] - The language of the code block.
 */
export interface CodeBlockProperties {
    isOpen: boolean;
    code: string;
    colorMode: string;
    currentStyle: Record<string, React.CSSProperties>;
    codeLanguage?: string;
}

/**
 * CodeBlock component to show the code block with syntax highlighting.
 * @param {CodeBlockProperties} properties - The properties of the component.
 * @returns {JSX.Element} The CodeBlock component.
 */
function CodeBlock({
    isOpen,
    code,
    colorMode,
    currentStyle,
    codeLanguage = 'cpp',
}: Readonly<CodeBlockProperties>): JSX.Element {
    return (
        <Collapse in={isOpen} animateOpacity>
            {isOpen && (code === null || code.length === 0) ? (
                <CustomAlert
                    type='warning'
                    title='No Code Found'
                    description='Please provide the code to display the syntax highlighting.'
                />
            ) : (
                <Box width='100%' overflowX='hidden'>
                    {code !== null && code.length > 0 && (
                        <>
                            <Box
                                display='flex'
                                justifyContent='center'
                                alignItems='center'
                                p={2}
                                bg={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                                color={colorMode === 'light' ? 'black' : 'white'}
                                borderRadius='md'
                                _hover={{
                                    bg: colorMode === 'light' ? 'gray.300' : 'gray.600',
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s ease-in-out',
                                    borderRadius: 'md',
                                }}
                            >
                                <Text fontSize='sm'>CPP</Text>
                            </Box>
                            <SyntaxHighlighter
                                language={codeLanguage}
                                style={currentStyle}
                                showLineNumbers
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
                            >
                                {code}
                            </SyntaxHighlighter>
                        </>
                    )}
                </Box>
            )}
        </Collapse>
    );
}

export default CodeBlock;
