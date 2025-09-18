const cleanConsumerName = (consumerName: string | null | undefined, clientCode: string): string => {
    if (!consumerName) return 'UNKNOWN';
    const prefix = `${clientCode} `;
    if (consumerName.startsWith(prefix)) {
        return consumerName.slice(prefix.length);
    }
    return consumerName;
};

export default cleanConsumerName;