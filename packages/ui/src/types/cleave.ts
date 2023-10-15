export type HTMLCleaveElement = HTMLElement & {
  cleave: {
    setRawValue(raw: string): void;
    getRawValue(): string;
    getFormattedValue(): string;
    destroy(): void;
  };
};

export type CleaveOnChangedEvent = {
  target: { value: string; rawValue: string };
};

export type CleaveOptions = {
  numeralDecimalScale?: number;
  blocks?: number[];
  delimiter?: string;
  delimiters?: string[];
  prefix?: string;
  noImmediatePrefix?: boolean;
  tailPrefix?: boolean;
  numeral?: boolean;
  numericOnly?: boolean;
  numeralPositiveOnly?: boolean;
};

export type CleaveInternalOptions = CleaveOptions & {
  delimiterLazyShow?: boolean;
  rawValueTrimPrefix?: boolean;
  initValue?: string;
  onValueChanged?: (event: CleaveOnChangedEvent) => void;
};
