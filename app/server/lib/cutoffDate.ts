interface CutoffDateOptions {
    months?: number;
    days?: number;
    years?: number;
    monthIndexing?: 'zero-based' | 'one-based'; // 'zero-based' = 0-11, 'one-based' = 1-12
}

const getCutoffDate = (options: CutoffDateOptions = {}) => {
    const {
        months = 0,
        days = 0,
        years = 0,
        monthIndexing = 'zero-based'
    } = options;

    const now = new Date();
    const cutoffDate = new Date(
        now.getFullYear() - years,
        now.getMonth() - months,
        now.getDate() - days
    );

    const cutoffYear = cutoffDate.getFullYear();
    const cutoffMonth = cutoffDate.getMonth(); // Always 0-11 internally
    const cutoffDay = cutoffDate.getDate();

    // Convert month based on indexing preference
    const displayMonth = monthIndexing === 'one-based' ? cutoffMonth + 1 : cutoffMonth;

    return {
        cutoffYear,
        cutoffMonth: displayMonth,
        cutoffDay,
        // Also return the raw Date object for convenience
        cutoffDate
    };
}

export default getCutoffDate;