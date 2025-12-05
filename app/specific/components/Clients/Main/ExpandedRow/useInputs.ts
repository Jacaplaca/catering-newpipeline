import { useClientTableContext } from '@root/app/specific/components/Clients/Main/context';
import { type clientEditValidator } from '@root/app/validators/specific/client';
import { type InputsBulkType } from '@root/types';
import { type z } from 'zod';

const useClientInputs = () => {
    const { rowClick: { form } } = useClientTableContext();

    const inputs: InputsBulkType<keyof z.infer<typeof clientEditValidator>>[] = [
        {
            label: 'clients:info.name_column',
            name: 'name',
            placeholder: 'clients:info.name_placeholder',
            type: 'text',
            message: form.formState.errors.name?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.code_column',
            name: 'code',
            placeholder: 'clients:info.code_placeholder',
            type: 'text',
            message: form.formState.errors.code?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.email_column',
            name: 'email',
            placeholder: 'clients:info.email_placeholder',
            type: 'email',
            message: form.formState.errors.email?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.phone_column',
            name: 'phone',
            placeholder: 'clients:info.phone_placeholder',
            type: 'text',
            message: form.formState.errors.phone?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.address_column',
            name: 'address',
            placeholder: 'clients:info.address_placeholder',
            type: 'text',
            message: form.formState.errors.address?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.city_column',
            name: 'city',
            placeholder: 'clients:info.city_placeholder',
            type: 'text',
            message: form.formState.errors.city?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.zip_code_column',
            name: 'zip',
            placeholder: 'clients:info.zip_code_placeholder',
            type: 'text',
            message: form.formState.errors.zip?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.country_column',
            name: 'country',
            placeholder: 'clients:info.country_placeholder',
            type: 'text',
            message: form.formState.errors.country?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.contact_person_column',
            name: 'contactPerson',
            placeholder: 'clients:info.contact_person_placeholder',
            type: 'text',
            message: form.formState.errors.contactPerson?.message,
            isHorizontal: true
        },
        {
            label: 'clients:info.firstOrderDeadline_column',
            name: 'firstOrderDeadline',
            placeholder: '--:--',
            type: 'time',
            message: form.formState.errors.firstOrderDeadline?.message,
            isHorizontal: true,
            // labelWidth
        },
        {
            label: 'clients:info.secondOrderDeadline_column',
            name: 'secondOrderDeadline',
            placeholder: '--:--',
            type: 'time',
            message: form.formState.errors.secondOrderDeadline?.message,
            isHorizontal: true,
            // labelWidth
        },
        {
            label: 'clients:info.allowWeekendOrder_column',
            name: 'allowWeekendOrder',
            type: 'boolean',
            message: form.formState.errors.allowWeekendOrder?.message,
            isHorizontal: true,
            // labelWidth
        },
        {
            // label: 'clients:info.notes_column',
            name: 'notes',
            placeholder: 'clients:info.notes_placeholder',
            type: 'text',
            message: form.formState.errors.notes?.message,
            isTextArea: true
        },
    ];

    return inputs;
}

export default useClientInputs;