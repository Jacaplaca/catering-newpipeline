import DayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/DayMenuPdf';

const PdfsCell: React.FC<{ clientId: string }> = ({ clientId }) => {
    return (
        <div className='flex gap-2'>
            <DayMenuPdf
                clientId={clientId}
                week={false}
                icon="fa-solid fa-calendar-days"
                tooltipLabel='menu-creator:day-one-client-menu-pdf'
            />
            <DayMenuPdf
                clientId={clientId}
                week={true}
                icon="fa-solid fa-calendar-week"
                tooltipLabel='menu-creator:week-one-client-menu-pdf'
            />
            <DayMenuPdf
                clientId={clientId}
                week={true}
                perCustomer={true}
                icon="fa-solid fa-user"
                tooltipLabel='menu-creator:week-one-client-per-consumer-menu-pdf'
            />
        </div>
    )
}

export default PdfsCell;