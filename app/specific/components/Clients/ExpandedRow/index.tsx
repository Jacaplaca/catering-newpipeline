
import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { Form } from '@root/app/_components/ui/form';
import Buttons from '@root/app/_components/ui/form/Buttons';
import translate from '@root/app/lib/lang/translate';
import ClientInputs from '@root/app/specific/components/Clients/ExpandedRow/Inputs';
import { useClientTableContext } from '@root/app/specific/components/Clients/context';

const ClientExpandedRow = () => {

    const {
        dictionary,
        rowClick: { onRowClick, updateClient, form, onSubmit },
    } = useClientTableContext();

    return (<ExpandedRow>
        <div className='relative'>
            <Form {...form} >
                <form onSubmit={onSubmit} className='relative max-w-[1200px] ' >
                    <ClientInputs />

                    <Buttons
                        cancelLabel={translate(dictionary, 'shared:cancel')}
                        onCancel={() => onRowClick(null)}
                        cancelDisabled={updateClient.isPending}
                        submitLabel={translate(dictionary, 'shared:save')}
                        onSubmit={onSubmit}
                        submitDisabled={updateClient.isPending || !form.formState.isDirty}
                        submitLoading={updateClient.isPending}
                        onReset={() => form.reset()}
                    />
                </form>
            </Form>
        </div>
    </ExpandedRow>

    );
}


export default ClientExpandedRow;