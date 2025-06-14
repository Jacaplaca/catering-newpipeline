import { useFoodCategoryTableContext } from '@root/app/specific/components/Food/Category/context';
import { type foodCategoryEditValidator } from '@root/app/validators/specific/foodCategory';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useFoodCategoryInputs = () => {
    const { rowClick: { form } } = useFoodCategoryTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof foodCategoryEditValidator>>[] = [
        {
            label: 'food:category_name_column',
            name: 'name',
            placeholder: 'food:category_name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
    ];

    return inputs;
}

export default useFoodCategoryInputs;