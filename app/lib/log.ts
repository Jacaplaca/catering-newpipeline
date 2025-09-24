const log = (message: string, isOn: boolean) => {
    if (isOn) {
        console.log(message);
    }
}

export default log;