import translate from '@root/app/lib/lang/translate';

interface SimilarCommentsProps {
    comments: (string | null)[];
    onCommentPick: (comment: string) => void;
    dictionary: Record<string, string>;
    isLoading?: boolean;
}

const SimilarComments = ({ comments, onCommentPick, dictionary, isLoading }: SimilarCommentsProps) => {
    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {translate(dictionary, 'menu-creator:similar_comments')}
            </div>

            {/* Fixed height container with horizontal scroll */}
            <div className="h-16 rounded-lg py-2 bg-neutral-100/50 dark:bg-neutral-800/50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <i className="fa-solid fa-spinner animate-spin" />
                            <span>{translate(dictionary, 'shared:loading')}</span>
                        </div>
                    </div>
                ) : !comments.length ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-sm text-neutral-600 dark:text-neutral-300">
                            {translate(dictionary, 'menu-creator:no_suggestions')}
                        </span>
                    </div>
                ) : (
                    <div className="flex gap-2 h-full overflow-x-auto overflow-y-hidden">
                        <div className="flex gap-2 items-center min-w-fit">
                            {comments.filter(item => item !== null).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => onCommentPick(item)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-neutral-200/50 hover:bg-secondary dark:bg-neutral-700/50 dark:hover:bg-darkmode-secondary-accent text-neutral-900 dark:text-neutral-50 rounded-lg transition-colors duration-200 cursor-pointer group whitespace-nowrap flex-shrink-0"
                                >
                                    <span className="truncate max-w-[200px] font-medium">
                                        {item}
                                    </span>
                                    <i className="fa-solid fa-plus text-xs opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimilarComments;
