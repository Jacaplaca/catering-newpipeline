import { useRouteTableContext } from '@root/app/specific/components/Routes/context';
import { type routeEditValidator } from '@root/app/validators/specific/deliveryRoute';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useRouteInputs = () => {
    const { rowClick: { form } } = useRouteTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof routeEditValidator>>[] = [
        {
            label: 'routes:code_column',
            name: 'code',
            placeholder: 'routes:code_placeholder',
            type: 'text',
            message: form.formState.errors.code?.message,
            isHorizontal: true
        },
        {
            label: 'routes:name_column',
            name: 'name',
            placeholder: 'routes:name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
        // {
        //     label: 'routes:description_column',
        //     name: 'description',
        //     placeholder: 'routes:description_placeholder',
        //     type: 'text',
        //     message: form.formState.errors.description?.message,
        //     isTextArea: true
        // },
    ];

    return inputs;
}

export default useRouteInputs;