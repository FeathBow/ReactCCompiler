import React, { useState } from 'react';
import { Tooltip, Flex, useBoolean, Icon, ScaleFade, Box } from '@chakra-ui/react';
import { FiChevronRight } from 'react-icons/fi';

export type MenuList = Array<{
    icon: React.ReactNode;
    title: string;
    path?: string;
    subMenu?: Array<{ title: string; path?: string }>;
}>;

/**
 * Menu state.
 * @interface
 * @property {number[]} expandedMenu - The expanded menu indexes.
 * @property {[number, number]} activeMenuIndexes - The active menu indexes.
 * @property {Function} toggleMenuExpand - Toggle the menu expand.
 * @property {Function} setMenuActive - Set the menu active.
 */
export interface MenuState {
    expandedMenu: number[];
    activeMenuIndexes: [number, number];
    toggleMenuExpand: (index: number) => void;
    setMenuActive: (index: number, subIndex?: number) => void;
}

/**
 * Collapse state.
 * @interface
 * @property {boolean} isMenuCollapse - Whether the menu is collapsed.
 * @property {boolean} isMenuCollapseBtnShow - Whether the collapse button is shown.
 * @property {Function} showCollapseBtn - Show the collapse button.
 * @property {Function} hideCollapseBtn - Hide the collapse button.
 * @property {JSX.Element} collapseButton - The collapse button.
 */
export interface CollapseState {
    isMenuCollapse: boolean;
    isMenuCollapseBtnShow: boolean;
    showCollapseBtn: () => void;
    hideCollapseBtn: () => void;
    collapseButton: JSX.Element;
}

export const useMenuState = (): MenuState => {
    const [expandedMenu, setExpandedMenu] = useState<number[]>([]);
    const [activeMenuIndexes, setActiveMenuIndexes] = useState<[number, number]>([-1, -1]);

    const toggleMenuExpand = (index: number): void => {
        setExpandedMenu((previous) =>
            previous.includes(index) ? previous.filter((index_) => index_ !== index) : [...previous, index],
        );
    };

    const setMenuActive = (index: number, subIndex = -1): void => {
        setActiveMenuIndexes([index, subIndex]);
    };

    return {
        expandedMenu,
        activeMenuIndexes,
        toggleMenuExpand,
        setMenuActive,
    };
};
export const useCollapse = (): CollapseState => {
    const [isMenuCollapse, { toggle: toggleMenuCollapse }] = useBoolean(true);
    const [isMenuCollapseButtonShow, { on: showCollapseButton, off: hideCollapseButton }] = useBoolean(false);

    const collapseButton = (
        <ScaleFade initialScale={0.6} in={isMenuCollapseButtonShow} unmountOnExit>
            <Box
                style={{
                    position: 'absolute',
                    top: '58px',
                    right: '-14px',
                    cursor: 'pointer',
                    zIndex: '1',
                }}
            >
                <Tooltip label={isMenuCollapse ? 'Expand' : 'Collapse'} hasArrow placement='right'>
                    <Flex
                        id={`menu-${isMenuCollapse ? 'expand' : 'collapse'}-btn`}
                        align='center'
                        justify='center'
                        w='25px'
                        h='25px'
                        bgColor='green.500'
                        borderRadius='50%'
                        onClick={toggleMenuCollapse}
                        _hover={{
                            border: '1px',
                            borderColor: 'green.500',
                            bgColor: 'white',
                        }}
                        p='4px'
                    >
                        <Icon
                            w='16px'
                            h='16px'
                            transition='transform 0.2s ease-in-out'
                            transform={`rotate(${isMenuCollapse ? 0 : -180}deg)`}
                            as={FiChevronRight}
                            color='white'
                            _hover={{
                                color: 'green.500',
                            }}
                        />
                    </Flex>
                </Tooltip>
            </Box>
        </ScaleFade>
    );

    return {
        isMenuCollapse,
        isMenuCollapseBtnShow: isMenuCollapseButtonShow,
        showCollapseBtn: showCollapseButton,
        hideCollapseBtn: hideCollapseButton,
        collapseButton,
    };
};
