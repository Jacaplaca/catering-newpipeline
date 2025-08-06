import Suggestion from '@root/app/_components/ui/Inputs/Tags/Suggestion';
import Tag from '@root/app/_components/ui/Inputs/Tags/Tag';
import useKeyPressed from '@root/app/hooks/useKeyPressed';
// import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

const maxHashtags = Infinity;

// const hashtagsLimit = 5;

const Tags: React.FC<{
    show?: boolean;
    tags: string[];
    add?: (hashtag: string) => boolean;
    remove?: (hashtag: string) => boolean;
    autoFocus?: boolean;
    handleSearch: (value: string) => void;
    searchResults?: { id: string, name: string }[];
    isSearching?: boolean;
    labels: {
        add: string;
        placeholder: string;
        title: string;
    }
}> = ({ show, tags, add, remove, autoFocus, handleSearch, searchResults = [], isSearching, labels }) => {

    const inputRef = useRef<HTMLInputElement>(null);
    const [typed, setTyped] = useState<string>('');
    const [debouncedValue, setDebouncedValue] = useDebounceValue(typed, 275)

    const [suggestions, setSuggestions] = useState<{ id: string, name: string }[]>(searchResults);
    const [allowAdd, setAllowAdd] = useState<boolean>(false);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const [highlightedSuggestion, setHighlightedSuggestion] = useState<number>(-1);
    const [removingIndex, setRemovingIndex] = useState<number>(-1);
    const [newHashtag, setNewHashtag] = useState<number>(-1);


    const { keyPressed } = useKeyPressed();

    const disabledAddNewTags = false;

    useEffect(() => {
        autoFocus && inputRef?.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const highlightSame = (label: string) => {
        const index = tags.findIndex((hashtag) => hashtag === label);
        setHighlighted(index);
        setTimeout(() => {
            setHighlighted(-1);
        }, 400);
    }

    const addTag = () => {
        if (allowAdd && tags.length < maxHashtags) {
            const newTag = !tags.find((tag) => tag === typed)
            if (newTag) {
                setNewHashtag(tags.length);
                add?.(typed);
                setTyped('');
                setSuggestions([]);
                setTimeout(() => {
                    setNewHashtag(-1);
                }, 400);
            } else {
                highlightSame(typed);
            }
            setAllowAdd(false);
        }
    }

    const approveSuggestion = (name: string) => {
        setSuggestions([]);
        setTyped(name);
        inputRef?.current?.focus();
        setAllowAdd(true);
    }

    useEffect(() => {
        switch (keyPressed) {
            case "ArrowUp":
                if (suggestions.length) {
                    setHighlightedSuggestion(0);
                    inputRef?.current?.blur();
                }
                break;
            case "Tab":
                if (suggestions.length) {
                    setHighlightedSuggestion(0);
                    inputRef?.current?.blur();
                }
                break;
            case "ArrowDown":
                if (suggestions.length) {
                    setHighlightedSuggestion(-1);
                    inputRef?.current?.focus();
                }
                break;
            case "ArrowLeft":
                if (suggestions.length) {
                    const next = highlightedSuggestion - 1;
                    setHighlightedSuggestion(next < 0 ? 0 : next);
                }
                break;
            case "Space":
                if (document.activeElement !== inputRef.current && suggestions.length) {
                    console.log('Space', suggestions, highlightedSuggestion);
                    setTyped(suggestions[highlightedSuggestion]?.name ?? '');
                    setSuggestions([]);
                    setTimeout(() => {
                        inputRef?.current?.focus();
                    }, 400);
                }
                break;
            case "ArrowRight":
                if (suggestions.length) {
                    const next = highlightedSuggestion + 1;
                    setHighlightedSuggestion(next > suggestions.length - 1 ? suggestions.length - 1 : next);
                }
                break;
            case "Escape":
                setTyped('');
                break;
            case "Enter":
                addTag();
                break;
            default:
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyPressed]);

    const delHashtag = (label: string) => {

        const index = tags.findIndex((tag) => tag === label);
        setRemovingIndex(index);
        setTimeout(() => {
            remove?.(label);
            setRemovingIndex(-1);
        }, 0);

    }

    useEffect(() => {
        // const isValDifferent = searchValue !== value;
        handleSearch(typed)
        // everyChar && isValDifferent && search(debouncedValue);
        // console.log('searching', debouncedValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedValue]);

    const type = (e: React.ChangeEvent<HTMLInputElement>) => {
        // const limit = 15;
        // const minLimit = 3;
        setHighlightedSuggestion(-1);
        const value = e.target.value?.toLowerCase();
        const valueFixed = value.replace(/[^a-z0-9]/gi, '');
        if (valueFixed.length >= 1) {
            setAllowAdd(true);
        } else {
            setAllowAdd(false);
        }
        if (valueFixed.length <= maxHashtags) {
            setTyped(valueFixed)
            // handleSearch(valueFixed)
            setDebouncedValue(valueFixed);
            // searchResults && setSuggestions(searchResults)
        }
    }

    useEffect(() => {
        setSuggestions(searchResults);
    }, [searchResults]);

    const showLen = typed.length > maxHashtags - 4;

    return (
        <div className={`mx-4 flex flex-col items-center space-y-4 sm:mx-0`}>
            <div
                className="relative w-full items-center overflow-hidden">
                {!show && maxHashtags < Infinity ? <div className='absolute top-4 right-5 flex gap-1'>
                    <div
                        className='font-semibold text-gray-500'
                    >{tags.length}</div>
                    <div
                        className='font-semibold text-gray-500'
                    >/</div>
                    <div
                        className='font-semibold text-gray-500'
                    >{maxHashtags}</div>
                </div> : null}
                {!show && <div className="flex flex-row items-baseline justify-between">
                    <div className='flex'>
                        <h3 className='text-lg font-bold mr-4'>{labels.title}</h3>

                        <div className='flex w-full justify-start'>
                            {suggestions.map((suggestion: { id: string, name: string }, i) => (
                                <Suggestion
                                    label={suggestion.name}
                                    key={suggestion.id}
                                    onClick={() => approveSuggestion(suggestion.name)}
                                    highlighted={i === highlightedSuggestion}
                                />
                            ))}
                        </div>

                    </div>

                </div>}
                {!show && <div className="mt-2">
                    <div
                        className={`input-dark relative flex w-full items-center justify-center space-x-2 p-1 pr-4 sm:space-x-1 ${disabledAddNewTags && "opacity-30 grayscale-[20%]"}`}>
                        <div
                            className='flex-shrink-0 flex items-center justify-center h-4 w-4'
                        >
                            <i className={`
                        ${isSearching
                                    ? 'animate-spin fas fa-spinner'
                                    : `fa-regular fa-tag  `}
                            text-xl
                        text-neutral-500 dark:text-neutral-400`}></i>
                        </div>

                        <input
                            disabled={disabledAddNewTags}
                            ref={inputRef}
                            value={typed}
                            onChange={type}
                            className={`w-full border-transparent bg-transparent 
                            text-sm  sm:text-base  font-semibold
                            outline-none focus:border-transparent focus:ring-0 
                            `}
                            type="text"
                            placeholder={labels.placeholder} />


                        <div className={`w-14 pr-6 text-sm font-light text-green-400 ${showLen ? 'opacity-100' : 'opacity-0'}`} >
                            {`${typed.length < 10 ? 0 : ""}${typed.length}/${maxHashtags}`}
                        </div>
                        <button
                            className={`rounded px-2 py-1 
                            bg-secondary dark:bg-darkmode-secondary-accent
                            text-base font-semibold 
                            text-neutral-800  dark:text-white
                            ${allowAdd
                                    ? "hover:bg-secondary-accent dark:hover:bg-darkmode-secondary"
                                    : "cursor-default opacity-60"} `}
                            onClick={allowAdd ? addTag : () => null}
                            type='button'
                        >{labels.add}</button>
                    </div>
                </div>}
                <div className={`-m-1 my-3 flex flex-wrap`}>
                    {tags.map((tag: string, i) => (
                        <Tag
                            key={tag}
                            label={tag}
                            remove={() => delHashtag(tag)}
                            highlighted={i === highlighted}
                            removing={i === removingIndex}
                            newHashtag={i === newHashtag}
                            onClick={() => setTyped(tag)}
                            show={show}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Tags;