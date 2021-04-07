export function getCircularReplacer () {
    const seen = new WeakSet();

    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }

            seen.add(value);
        }

        return value;
    };
};
