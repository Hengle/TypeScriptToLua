import * as ts from "typescript";
import * as nativeAssert from "assert";
import * as path from "path";

export function castArray<T>(value: T | T[]): T[];
export function castArray<T>(value: T | readonly T[]): readonly T[];
export function castArray<T>(value: T | readonly T[]): readonly T[] {
    return Array.isArray(value) ? value : [value];
}

export const intersperse = <T>(values: T[], separator: T): T[] =>
    values.flatMap((value, index) => (index === 0 ? [value] : [separator, value]));

type DiagnosticFactory = (...args: any) => Partial<ts.Diagnostic> & Pick<ts.Diagnostic, "messageText">;
export const createDiagnosticFactoryWithCode = <T extends DiagnosticFactory>(code: number, create: T) => {
    return Object.assign(
        (...args: Parameters<T>): ts.Diagnostic => ({
            file: undefined,
            start: undefined,
            length: undefined,
            category: ts.DiagnosticCategory.Error,
            code,
            source: "typescript-to-lua",
            ...create(...(args as any)),
        }),
        { code }
    );
};

let serialDiagnosticCodeCounter = 100000;
export const createSerialDiagnosticFactory = <T extends DiagnosticFactory>(create: T) =>
    createDiagnosticFactoryWithCode(serialDiagnosticCodeCounter++, create);

export const normalizeSlashes = (filePath: string) => filePath.replace(/\\/g, "/");
export const trimExtension = (filePath: string) => filePath.slice(0, -path.extname(filePath).length);

export function formatPathToLuaPath(filePath: string): string {
    filePath = filePath.replace(/\.json$/, "");
    if (process.platform === "win32") {
        // Windows can use backslashes
        filePath = filePath.replace(/\.\\/g, "").replace(/\\/g, ".");
    }
    return filePath.replace(/\.\//g, "").replace(/\//g, ".");
}

type NoInfer<T> = [T][T extends any ? 0 : never];

export function getOrUpdate<K, V>(
    map: Map<K, V> | (K extends object ? WeakMap<K, V> : never),
    key: K,
    getDefaultValue: () => NoInfer<V>
): V {
    if (!map.has(key)) {
        map.set(key, getDefaultValue());
    }

    return map.get(key)!;
}

export function isNonNull<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}

export function cast<TOriginal, TCast extends TOriginal>(
    item: TOriginal,
    cast: (item: TOriginal) => item is TCast
): TCast {
    if (cast(item)) {
        return item;
    } else {
        throw new Error(`Failed to cast value to expected type using ${cast.name}.`);
    }
}

export function assert(value: any, message?: string | Error): asserts value {
    nativeAssert(value, message);
}

export function assertNever(_value: never): never {
    throw new Error("Value is expected to be never");
}

export function assume<T>(_value: any): asserts _value is T {}
