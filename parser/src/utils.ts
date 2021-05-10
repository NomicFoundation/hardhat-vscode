export function getCircularReplacer () {
    const seen = new WeakSet();

    return (key: any, value: object | null) => {
        if (["parent", "typeNodes"].indexOf(key) !== -1) {
            return;
        }

        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }

            seen.add(value);
        }

        return value;
    };
}
