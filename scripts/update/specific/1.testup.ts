import { sleep } from 'openai/core';

const testUpdate = async () => {
    console.log("testUpdate1");
    await sleep(1000);
    return Promise.resolve();
}

export default testUpdate;