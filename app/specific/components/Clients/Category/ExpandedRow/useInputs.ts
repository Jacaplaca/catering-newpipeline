import { useClientCategoryTableContext } from '@root/app/specific/components/Clients/Category/context';
import { type clientCategoryEditValidator } from '@root/app/validators/specific/clientCategory';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useClientCategoryInputs = () => {
    const { rowClick: { form } } = useClientCategoryTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof clientCategoryEditValidator>>[] = [
        {
            label: 'clients:category_code_column',
            name: 'code',
            placeholder: 'clients:category_code_placeholder',
            type: 'text',
            message: form.formState.errors.code?.message,
            isHorizontal: true
        },
        {
            label: 'clients:category_name_column',
            name: 'name',
            placeholder: 'clients:category_name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
    ];

    return inputs;
}

export default useClientCategoryInputs;