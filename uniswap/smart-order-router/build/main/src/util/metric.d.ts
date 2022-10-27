export declare enum MetricLoggerUnit {
    Seconds = "Seconds",
    Microseconds = "Microseconds",
    Milliseconds = "Milliseconds",
    Bytes = "Bytes",
    Kilobytes = "Kilobytes",
    Megabytes = "Megabytes",
    Gigabytes = "Gigabytes",
    Terabytes = "Terabytes",
    Bits = "Bits",
    Kilobits = "Kilobits",
    Megabits = "Megabits",
    Gigabits = "Gigabits",
    Terabits = "Terabits",
    Percent = "Percent",
    Count = "Count",
    BytesPerSecond = "Bytes/Second",
    KilobytesPerSecond = "Kilobytes/Second",
    MegabytesPerSecond = "Megabytes/Second",
    GigabytesPerSecond = "Gigabytes/Second",
    TerabytesPerSecond = "Terabytes/Second",
    BitsPerSecond = "Bits/Second",
    KilobitsPerSecond = "Kilobits/Second",
    MegabitsPerSecond = "Megabits/Second",
    GigabitsPerSecond = "Gigabits/Second",
    TerabitsPerSecond = "Terabits/Second",
    CountPerSecond = "Count/Second",
    None = "None"
}
export declare abstract class IMetric {
    abstract putDimensions(dimensions: Record<string, string>): void;
    abstract putMetric(key: string, value: number, unit?: MetricLoggerUnit): void;
}
export declare class MetricLogger extends IMetric {
    constructor();
    putDimensions(dimensions: Record<string, string>): void;
    putMetric(key: string, value: number, unit?: MetricLoggerUnit): void;
}
export declare let metric: IMetric;
export declare const setGlobalMetric: (_metric: IMetric) => void;
