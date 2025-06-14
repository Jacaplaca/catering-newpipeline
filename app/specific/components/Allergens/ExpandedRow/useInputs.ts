import { useAllergenTableContext } from '@root/app/specific/components/Allergens/context';
import { type allergenEditValidator } from '@root/app/validators/specific/allergen';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useAllergenInputs = () => {
    const { rowClick: { form } } = useAllergenTableContext()

    const inputs: InputsBulkType<keyof z.infer<typeof allergenEditValidator>>[] = [
        {
            label: 'allergens:name_column',
            name: 'name',
            placeholder: 'allergens:name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
    ];

    return inputs;
}

export default useAllergenInputs;