import { useMealCategoryTableContext } from '@root/app/specific/components/Meals/Category/context';
import { type mealCategoryEditValidator } from '@root/app/validators/specific/mealCategory';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useMealCategoryInputs = () => {
    const { rowClick: { form } } = useMealCategoryTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof mealCategoryEditValidator>>[] = [
        {
            label: 'meals:category_name_column',
            name: 'name',
            placeholder: 'meals:category_name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
    ];

    return inputs;
}

export default useMealCategoryInputs;