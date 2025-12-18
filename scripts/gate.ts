import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

async function gate(callBack: () => unknown, question: string) {

    const answer = await askQuestion(question);

    if (answer.toLowerCase() !== 'y') {
        process.exit(1);
    }

    callBack();
}

export default gate;