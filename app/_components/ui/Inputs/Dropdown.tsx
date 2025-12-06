"use client"
import { type CSSProperties, useState, type ComponentType, useEffect, ReactElement } from 'react';
import Select, { type GroupBase, type InputProps, type OptionProps, type PlaceholderProps, type SelectComponentsConfig, type SingleValueProps } from 'react-select'
import { useTheme } from 'next-themes';
import configTheme from '@root/config/theme';
const { colors } = configTheme;

interface IOption {
    label: string;
    value: string;
}

type Props<T> = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: T[];
    isSearchable?: boolean;
    placeholder?: string;
    styles?: {
        control?: CSSProperties;
        valueContainer?: CSSProperties;
        dropdownIndicator?: CSSProperties;
        singleValue?: CSSProperties;
        menu?: CSSProperties;
        option?: CSSProperties;
        input?: CSSProperties;
    }
    comps?: {
        Option?: ComponentType<OptionProps<T, false>>;
        Input?: ComponentType<InputProps<T, false>>;
        Placeholder?: ComponentType<PlaceholderProps<T, false>>;
        SingleValue?: ComponentType<SingleValueProps<T, false>>;
    }
};

const Dropdown = <T extends IOption>({
    // label,
    value,
    onChange,
    options,
    comps,
    styles,
    isSearchable = true,
    placeholder = '',
}: Props<T>): ReactElement => {
    const [isFocused, setFocused] = useState(false);
    const { theme, resolvedTheme } = useTheme();
    const isDark = theme === 'dark' || resolvedTheme === 'dark';

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <i className={`mh-3 animate-spin fas fa-spinner`} />;

    const selectBackGroundColor = isDark
        ? colors.darkmode.dropdown.highlight
        : colors.default.dropdown.highlight;

    const color = isDark
        ? colors.darkmode.dropdown.text
        : colors.default.dropdown.text;

    const backgroundColor = mounted && isDark
        ? colors.darkmode.dropdown.bg
        : colors.default.dropdown.bg;

    const boxShadow = isDark
        ? colors.darkmode.dropdown.shadow
        : colors.default.dropdown.shadow;

    const borderColor: string = isDark
        ? colors.darkmode.dropdown.border
        : colors.default.dropdown.border;

    const scrollColor = isDark
        ? colors.darkmode.dropdown.scroll
        : colors.default.dropdown.scroll;


    const getSelectBackgroundColor = (isSelected: boolean) => {
        if (isSelected) {
            return selectBackGroundColor;
        }
        return backgroundColor;
    }

    const customStyles = {
        control: (provided: CSSProperties, state: OptionProps<unknown, false> & { menuIsOpen: boolean }) => {
            return {
                ...provided,
                borderWidth: '1px!important',
                // width: 'auto',
                fontSize: '0.85rem',
                backgroundColor,
                fontWeight: 'semibold',
                cursor: 'pointer',
                width: '150px',
                borderRadius: '6px',
                color,
                boxShadow: state.menuIsOpen ? boxShadow : 'none',
                borderColor: state.menuIsOpen ? "transparent" : borderColor,
                borderBottomLeftRadius: state.menuIsOpen ? '0px' : '6px',
                borderBottomRightRadius: state.menuIsOpen ? '0px' : '6px',
                "&:hover": {
                    borderColor: state.menuIsOpen ? "transparent" : borderColor,
                },
                ...styles?.control,
            }
        },
        input: (provided: CSSProperties) => ({
            ...provided,
            width: 'auto',
            minWidth: '100px',
            color,
            ...styles?.input,

        }),
        option: (provided: CSSProperties, state: OptionProps<unknown, false>) => ({
            ...provided,
            color,
            cursor: 'pointer',
            padding: '4px 10px 4px 10px',
            marginLeft: '4px',
            marginRight: '3px',
            borderRadius: '3px',
            backgroundColor: getSelectBackgroundColor(state.isSelected),
            fontSize: '0.85rem',
            ...styles?.option,
            borderColor,
            width: 'auto',
        }),
        menu: (provided: CSSProperties) => ({
            ...provided,
            borderRadius: '0px!important',
            backgroundColor,
            borderBottomLeftRadius: '6px!important',
            borderBottomRightRadius: '6px!important',
            marginTop: '-1px',
            padding: '3px',
            boxShadow,
            zIndex: 1000,
            ...styles?.menu,
        }),
        singleValue: (provided: CSSProperties) => ({
            ...provided,
            backgroundColor: 'transparent',
            color,
            ...styles?.singleValue,
        }),
        placeholder: (provided: CSSProperties) => ({
            ...provided,
            color,
            backgroundColor: "transparent",
            borderRadius: '6px',
        }),
        indicatorsContainer: (provided: CSSProperties) => ({
            ...provided,
        }),
        dropdownIndicator: (provided: CSSProperties) => ({
            ...provided,
            color,
            backgroundColor: "transparent",
            borderTopRightRadius: '6px',
            borderBottomRightRadius: isFocused ? "0px" : '6px',
            ...styles?.dropdownIndicator,
        }),
        indicatorSeparator: (provided: CSSProperties) => ({
            ...provided,
            width: '0px',
        }),
        clearIndicator: (provided: CSSProperties) => ({
            ...provided,
            color,
            borderRadius: '6px',
        }),
        valueContainer: (provided: CSSProperties) => ({
            ...provided,
            color,
            backgroundColor: "transparent",
            borderTopLeftRadius: '6px',
            borderBottomLeftRadius: isFocused ? "0px" : '6px',
            ...styles?.valueContainer,
        }),
        multiValue: (provided: CSSProperties) => ({
            ...provided,
            color,
            borderRadius: '6px',
        }),
        multiValueLabel: (provided: CSSProperties) => ({
            ...provided,
            color,
            borderRadius: '6px',
        }),
        multiValueRemove: (provided: CSSProperties) => ({
            ...provided,
            color,
            borderRadius: '6px',
        }),
        menuList: (provided: CSSProperties) => ({
            ...provided,
            backgroundColor,
            scrollbarColor: scrollColor,
            scrollbarWidth: 'thin',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            "::-webkit-scrollbar": {
                width: '8px',
            },
        }),

    }

    const sendNewValue = (value: string) => {
        setFocused(false);
        onChange(value);
    }

    return <Select<IOption>
        options={options}
        theme={(theme) => ({
            ...theme,
            borderRadius: 0,
            colors: {
                ...theme.colors,
                primary50: selectBackGroundColor,
                primary: selectBackGroundColor,
            },
        })}
        styles={customStyles as Record<string, CSSProperties>}
        onChange={(e) => sendNewValue(e?.value ?? '')}
        value={options.find((c) => c.value === value) ?? { value: '', label: placeholder } as IOption}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        components={comps as Partial<SelectComponentsConfig<IOption, false, GroupBase<IOption>>>}
        isSearchable={isSearchable}
        noOptionsMessage={() => <i className='text-2xl fa-solid fa-folder-xmark' />}
    // placeholder={"label"}
    // menuIsOpen
    />
};

export default Dropdown;