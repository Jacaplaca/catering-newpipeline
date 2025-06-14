import { zodResolver } from '@hookform/resolvers/zod';
import { useCheckSettings } from '@root/app/hooks/calls';
import getInputsBulk from '@root/app/lib/table/getInputsBulk';
import managerSettingsInputsDefs from '@root/app/specific/components/Settings/Manager/inputsDefs';
import { api } from '@root/app/trpc/react';
import { managerSettingsValidator } from '@root/app/validators/specific/settings';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';

const FormSchema = managerSettingsValidator;
const useManagerSettings = ({ dictionary }: {
    dictionary: Record<string, string>;
}) => {
    const { data: settings, refetch: settingsRefetch, isFetching } = api.specific.settings.getForManager.useQuery();
    const { hasFinishedSettings, checkFinishedSettingsRefetch } = useCheckSettings();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: '',
            // lastOrderTime: '--:--',
            firstOrderDeadline: '--:--',
            secondOrderDeadline: '--:--',
            phone: '',
            email: '',
            nonWorkingDays: [],
        }
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                phone: settings.phone ?? '',
                email: settings.email ?? '',
                name: settings.name ?? '',
                // lastOrderTime: settings.lastOrderTime ?? '--:--',
                firstOrderDeadline: settings.firstOrderDeadline ?? '--:--',
                secondOrderDeadline: settings.secondOrderDeadline ?? '--:--',
                nonWorkingDays: settings.nonWorkingDays || [],
            });
        }
    }, [settings, form]);

    const submitFunction = api.specific.settings.updateByManager;

    const updateSetting = submitFunction.useMutation({
        onSuccess: async () => {
            await settingsRefetch();
            hasFinishedSettings ? null : await checkFinishedSettingsRefetch();
        },
        onError: (error) => {
            console.log(error.data, error.message, error.shape);
        }
    });

    const onSubmit = (values: z.infer<typeof FormSchema>) => {
        updateSetting.mutate(values);
    };

    const Inputs = getInputsBulk<keyof z.infer<typeof FormSchema>>({
        inputs: managerSettingsInputsDefs(form),
        dictionary,
        formControl: form.control,
        isFetching: isFetching || updateSetting.isPending
    });

    const nonWorkingDays = form.watch('nonWorkingDays', []);
    const setNonWorkingDays = (dates: string[]) => {
        form.setValue('nonWorkingDays', dates, { shouldValidate: true, shouldDirty: true });
    };

    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
        hasFinishedSettings,
        Inputs,
        nonWorkingDays,
        setNonWorkingDays,
    };
};

export default useManagerSettings;