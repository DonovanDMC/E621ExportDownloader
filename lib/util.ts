// raw postgres array format ({1,2,3})
export function pgArray(value: string): Array<string> {
    const inner = value.slice(1, -1);
    return inner === "" ? [] : inner.split(",");
}
