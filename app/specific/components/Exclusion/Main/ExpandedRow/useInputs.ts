import { useExclusionTableContext } from '@root/app/specific/components/Exclusion/Main/context';
import { type exclusionEditValidator } from '@root/app/validators/specific/exclusion';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useExclusionInputs = () => {
    const { rowClick: { form } } = useExclusionTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof exclusionEditValidator>>[] = [
        {
            label: 'exclusion:name_label',
            name: 'name',
            placeholder: 'exclusion:name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
        {
            label: 'exclusion:allergens_label',
            name: 'allergens',
            placeholder: 'exclusion:allergens_placeholder',
            type: 'text',
            isTextArea: true
        },
    ];

    return inputs;
}

export default useExclusionInputs;