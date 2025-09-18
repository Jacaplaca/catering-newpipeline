import DayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/DayMenuPdf';

const PdfsCell: React.FC<{ clientId: string }> = ({ clientId }) => {
    return (
        <div className='flex gap-2'>
            <DayMenuPdf clientId={clientId} week={false} icon="fa-solid fa-calendar-days" />
            <DayMenuPdf clientId={clientId} week={true} icon="fa-solid fa-calendar-week" />
        </div>
    )
}

export default PdfsCell;