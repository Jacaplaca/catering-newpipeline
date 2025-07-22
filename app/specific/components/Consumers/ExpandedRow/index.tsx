
import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { Form } from '@root/app/_components/ui/form';
import Buttons from '@root/app/_components/ui/form/Buttons';
import translate from '@root/app/lib/lang/translate';
import ConsumerInputs from '@root/app/specific/components/Consumers/ExpandedRow/Inputs';
import { useConsumerTableContext } from '@root/app/specific/components/Consumers/context';

const ConsumerExpandedRow = () => {

    const {
        dictionary,
        rowClick: { onRowClick, update, form, onSubmit, expandedRowId },
    } = useConsumerTableContext();

    const Wrapper = expandedRowId ? ExpandedRow : 'div';

    return (<Wrapper>
        <Form {...form} >
            <form onSubmit={onSubmit} className='relative w-full ' >
                <ConsumerInputs />
                <Buttons
                    align="left"
                    cancelLabel={expandedRowId ? translate(dictionary, 'shared:cancel') : undefined}
                    onCancel={() => onRowClick(null)}
                    cancelDisabled={update.isPending}
                    submitLabel={translate(dictionary, 'shared:save')}
                    onSubmit={onSubmit}
                    submitDisabled={update.isPending || !form.formState.isDirty}
                    submitLoading={update.isPending}
                    onReset={form.formState.isDirty ? () => form.reset() : undefined}
                />
            </form>
        </Form>
    </Wrapper>

    );
}


export default ConsumerExpandedRow;