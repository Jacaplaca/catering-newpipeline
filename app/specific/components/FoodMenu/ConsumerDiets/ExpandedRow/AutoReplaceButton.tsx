import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import useAutoClientFood from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useAutoClientFood';

interface AutoReplaceButtonProps {
    assignmentId: string;
}

const AutoReplaceButton = ({ assignmentId }: AutoReplaceButtonProps) => {
    const { dictionary } = useConsumerDietsTableContext();
    const { mutate: autoReplace, isPending } = useAutoClientFood();

    return (
        <Tooltip content={translate(dictionary, 'menu-creator:auto-replace-food')}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    autoReplace({ id: assignmentId });
                }}
                disabled={isPending}
                className="text-blue-500 dark:text-neutral-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Auto-replace dish"
            >
                {isPending ? (
                    <i className="fas fa-spinner animate-spin"></i>
                ) : (
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                )}
            </button>
        </Tooltip>
    );
};

export default AutoReplaceButton; 