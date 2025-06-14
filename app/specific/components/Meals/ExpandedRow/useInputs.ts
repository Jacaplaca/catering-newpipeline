import { useMealTableContext } from '@root/app/specific/components/Meals/context';
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
    ];

    return inputs;
}

export default useMealInputs;