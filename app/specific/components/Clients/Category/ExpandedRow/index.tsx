
import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { Form } from '@root/app/_components/ui/form';
import Buttons from '@root/app/_components/ui/form/Buttons';
import translate from '@root/app/lib/lang/translate';
import { useClientCategoryTableContext } from '@root/app/specific/components/Clients/Category/context';
import ClientCategoryInputs from '@root/app/specific/components/Clients/Category/ExpandedRow/Inputs';

const ClientCategoryExpandedRow = () => {

    const {
        dictionary,
        rowClick: { onRowClick, update, form, onSubmit, expandedRowId },
    } = useClientCategoryTableContext();

    const Wrapper = expandedRowId ? ExpandedRow : 'div';

    return (<Wrapper>
        <Form {...form} >
            <form onSubmit={onSubmit} className='relative max-w-[1200px] ' >
                <ClientCategoryInputs />
                <Buttons
                    cancelLabel={expandedRowId ? translate(dictionary, 'shared:cancel') : undefined}
                    onCancel={() => onRowClick(null)}
                    cancelDisabled={update.isPending}
                    submitLabel={translate(dictionary, 'shared:save')}
                    onSubmit={onSubmit}
                    // submitDisabled={update.isPending || !form.formState.isValid}
                    submitDisabled={update.isPending || !form.formState.isDirty}
                    submitLoading={update.isPending}
                    onReset={form.formState.isDirty ? () => form.reset() : undefined}
                />
            </form>
        </Form>
    </Wrapper>

    );
}


export default ClientCategoryExpandedRow;