import translate from '@root/app/lib/lang/translate';
import ByClientAndMonthTable from '@root/app/specific/components/Orders/ByClientAndMonth/ByClientAndMonthTable';
import Month from '@root/app/specific/components/Orders/ByClientAndMonth/Month';
import Summary from '@root/app/specific/components/Orders/ByClientAndMonth/Summary';
import ToggleButton from '@root/app/specific/components/Orders/ByClientAndMonth/ToggleButton';
import { useState, type FunctionComponent } from 'react';

const ByClientAndMonth: FunctionComponent<{
    dictionary: Record<string, string>
}> = ({ dictionary }) => {
    const [viewMode, setViewMode] = useState<'summary' | 'table'>('summary');
    return (<>
        {/* Toggle buttons */}
        <div className="mb-4 flex gap-2">
            <ToggleButton
                onClick={() => setViewMode('summary')}
                isActive={viewMode === 'summary'}
                icon="fa-solid fa-chart-bar"
            >
                {translate(dictionary, 'orders:summary')}
            </ToggleButton>
            <ToggleButton
                onClick={() => setViewMode('table')}
                isActive={viewMode === 'table'}
                icon="fa-solid fa-table"
            >
                {translate(dictionary, 'orders:details')}
            </ToggleButton>
        </div>

        <div className="mb-4">
            <Month />
        </div>

        {/* Conditional rendering */}
        {viewMode === 'summary' ? <Summary /> : <ByClientAndMonthTable />}
    </>

    )
}

export default ByClientAndMonth;