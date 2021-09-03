declare type GlobalVariablesType = {
    [globalVariable: string]: string[];
};
export declare const globalVariables: GlobalVariablesType;
export declare const defaultCompletion: ({
    label: string;
    kind: 3;
} | {
    label: string;
    kind: 6;
} | {
    label: string;
    kind: 14;
})[];
export {};
