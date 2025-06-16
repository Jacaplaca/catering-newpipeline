import SearchInput from '@root/app/_components/ui/Inputs/Search';
import translate from '@root/app/lib/lang/translate';
import ElementToPick from '@root/app/specific/components/ui/ElementToPick';
import { type FunctionComponent } from "react";

const PickerFromAll: FunctionComponent<{
    dictionary: Record<string, string>,
    search: (value: string) => void,
    value: string,
    selectAll: () => void,
    deselectAll: () => void,
    items: { id: string, name: string, code: string }[],
    selected: string[],
    onSelect: (id: string, items: { id: string, name: string, code: string }[]) => void,
    searchPlaceholder: string,
    notFoundLabel: string,
    isLocked?: boolean
}> = ({ dictionary, search, value, selectAll, deselectAll, items, selected, onSelect, searchPlaceholder, notFoundLabel, isLocked }) => {
    // console.log("fragment", value + "AAA");
    return <>
        {!isLocked && <SearchInput
            search={search}
            everyChar
            debounce={300}
            placeholder={translate(dictionary, searchPlaceholder)}
            value={value}
        />}
        {!isLocked && <div className='flex flex-row gap-2 justify-between text-sm'>
            <button
                className='opacity-80'
                onClick={selectAll}>{translate(dictionary, 'shared:select_all')}</button>
            <button
                className='opacity-80'
                onClick={deselectAll}>{translate(dictionary, 'shared:deselect_all')}</button>

        </div>}
        <div className="flex-grow overflow-y-auto" >
            {items.length ? items.map((item) => (
                <ElementToPick
                    key={item.id}
                    item={item}
                    onClick={(id) => !isLocked && onSelect(id, items)}
                    selectedItems={selected}
                    fragment={value}
                />
            )) : <div className='flex w-full h-full flex-col justify-center items-center gap-4'>
                <i className='fa-solid fa-apple-core text-4xl text-neutral-400' />
                <div className='text-neutral-600 dark:text-neutral-300 text-sm'>{translate(dictionary, notFoundLabel)}</div>

            </div>}
        </div>
    </>
}

export default PickerFromAll;