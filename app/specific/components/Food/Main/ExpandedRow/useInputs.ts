import { useFoodTableContext } from '@root/app/specific/components/Food/Main/context';
import { type foodEditValidator } from '@root/app/validators/specific/food';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useFoodInputs = () => {
    const { rowClick: { form } } = useFoodTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof foodEditValidator>>[] = [
        {
            label: 'food:name_label',
            name: 'name',
            placeholder: 'food:name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
        {
            label: 'food:ingredients_label',
            name: 'ingredients',
            placeholder: 'food:ingredients_placeholder',
            type: 'text',
            isTextArea: true
        },
    ];

    return inputs;
}

export default useFoodInputs;