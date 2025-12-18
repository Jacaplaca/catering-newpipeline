const getTimeWithOffset = (offset?: "+12h" | "-12h" | "+7h" | "-7h" | "+1d" | "-1d" | "+2d" | '-2d' | '+3d' | "-3d") => {
    const oneHour = 1000 * 60 * 60;
    const oneDay = oneHour * 24;

    let timeOffset = 0;

    if (offset) {
        switch (offset) {
            case "+12h":
                timeOffset = 12 * oneHour;
                break;
            case "+7h":
                timeOffset = 7 * oneHour;
                break;
            case "-7h":
                timeOffset = -7 * oneHour;
                break;
            case "-12h":
                timeOffset = -12 * oneHour;
                break;
            case "+1d":
                timeOffset = oneDay;
                break;
            case "-1d":
                timeOffset = -oneDay;
                break;
            case "+2d":
                timeOffset = 2 * oneDay;
                break;
            case "-2d":
                timeOffset = -2 * oneDay;
                break;
            case "+3d":
                timeOffset = 3 * oneDay;
                break;
            case "-3d":
                timeOffset = -3 * oneDay;
                break;
        }
    }

    return new Date(Date.now() + timeOffset);
}

const getCurrentTime = () => {
    const time = getTimeWithOffset();
    return time;
}

export default getCurrentTime;