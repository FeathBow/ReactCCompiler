import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Tfoot, TableCaption, useColorMode } from '@chakra-ui/react';

interface QuadrupleOutputProperties {
    readonly quadrupleOutput: string;
}
const getBorderRadius = (itemIndex: number, quadLength: number): string => {
    if (itemIndex === 0) {
        return 'lg 0 0 lg';
    }
    if (itemIndex === quadLength - 1) {
        return '0 lg lg 0';
    }
    return '0';
};
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
    const { colorMode } = useColorMode();
    const oddRowBg = colorMode === 'light' ? 'gray.100' : 'gray.700'; // 浅色模式用浅灰色，深色模式用深灰色
    const evenRowBg = colorMode === 'light' ? 'white' : 'gray.800'; // 浅色模式用白色，深色模式用更深灰色

    return (
        <Table variant='simple' colorScheme='teal' borderRadius='lg' overflow='hidden'>
            <TableCaption placement='top'>Quadruple Output</TableCaption>
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
                    <Tr
                        key={quad[0]}
                        bg={index % 2 === 0 ? evenRowBg : oddRowBg}
                        _hover={{ bg: 'teal.100', color: 'teal.900' }}
                    >
                        {quad.map((item, itemIndex) => (
                            <Td
                                /* eslint-disable-next-line react/no-array-index-key */
                                key={`${quad[0]}-${index}-${itemIndex}`}
                                borderRadius={getBorderRadius(itemIndex, quad.length)}
                            >
                                {item}
                            </Td>
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

export default QuadrupleOutputComponent;
