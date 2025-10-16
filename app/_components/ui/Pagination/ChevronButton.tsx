import Link from "next/link";

const ChevronButton: React.FC<{
    direction: "left" | "right", double?: boolean, disabled?: boolean, url: string, onClick?: () => void
}> = ({ direction, double, disabled, url, onClick }) => {
    const sr = {
        left: 'Previous',
        right: 'Next',
    }

    const icon = {
        left: double ? 'fa-angle-double-left' : 'fa-chevron-left',
        right: double ? 'fa-angle-double-right' : 'fa-chevron-right',
    }

    const className = `mx-2 p-2 text-xl ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`;
    const content = (
        <>
            <span className="sr-only">{sr[direction]}</span>
            <i className={`fa-solid ${icon[direction]}`} />
        </>
    );

    if (onClick) {
        return (
            <button onClick={onClick} className={className} disabled={disabled}>
                {content}
            </button>
        )
    }

    return (
        <Link href={url} className={className}>
            {content}
        </Link>
    )
};

export default ChevronButton;