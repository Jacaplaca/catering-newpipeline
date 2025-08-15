import { useMealTableContext } from '@root/app/specific/components/Meals/Main/context';
import { type mealEditValidator } from '@root/app/validators/specific/meal';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useMealInputs = () => {
    const { rowClick: { form } } = useMealTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof mealEditValidator>>[] = [
        {
            label: 'meals:name_column',
            name: 'name',
            placeholder: 'meals:name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
        {
            label: 'meals:separate_label_column',
            name: 'separateLabel',
            type: 'boolean',
            message: form.formState.errors.separateLabel?.message,
            isHorizontal: true,
            // labelWidth
        },
    ];

    return inputs;
}

export default useMealInputs;