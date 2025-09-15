import DayKitchenPdf from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell/DayKitchenPdf';
import RoutesPdf from '@root/app/specific/components/Orders/ByDayMeals/DayMealsCell/RoutesPdf';

const DayTools = ({ dayId }: { dayId: string }) => {

    // const {
    //     pageName,
    //     lang,
    //     dictionary,
    //     data: { table, skeleton },
    //     columns,
    //     isFetching,
    //     totalCount,
    //     row: { dayId, onClick },
    //     sort: { sortName, sortDirection },
    //     action: {
    //         getConfirmationData,
    //     },
    //     message
    // } = useOrderByDayTableContext();

    return <div>
        <div className="flex gap-2">
            <RoutesPdf dayId={dayId} />
            <DayKitchenPdf dayId={dayId} />
        </div>
    </div>


}

export default DayTools;