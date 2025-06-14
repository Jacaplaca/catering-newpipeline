import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import useResetFood from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useResetFood';

interface ResetButtonProps {
    assignmentId: string;
}

const ResetButton = ({ assignmentId }: ResetButtonProps) => {
    const { dictionary } = useConsumerDietsTableContext();
    const { mutate: resetFood, isPending } = useResetFood();

    return (
        <Tooltip content={translate(dictionary, 'menu-creator:reset-food-to-standard')}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    resetFood({ id: assignmentId });
                }}
                disabled={isPending}
                className="text-blue-500 dark:text-neutral-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? (
                    <i className="fas fa-spinner animate-spin"></i>
                ) : (
                    <i className="fa-solid fa-arrow-rotate-left"></i>
                )}
            </button>
        </Tooltip>
    );
};

export default ResetButton; 