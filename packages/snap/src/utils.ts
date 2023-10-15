export function shortenString(
  val: string | undefined,
  maxLength: number | undefined,
  ellipsisPosition: "middle" | "end" = "middle"
): string {
  if (!val || !maxLength || maxLength >= val.length) {
    return val || "";
  }

  const ellipsis = "…";
  if (ellipsisPosition === "middle") {
    const fragmentSize = Math.trunc((maxLength - ellipsis.length) / 2);
    if (fragmentSize * 2 + ellipsis.length >= val.length) {
      return val;
    }

    return `${val.slice(0, fragmentSize).trimEnd()}${ellipsis}${val
      .slice(val.length - fragmentSize)
      .trimStart()}`;
  } else {
    return `${val.slice(0, maxLength - ellipsis.length + 1).trimEnd()}${ellipsis}`;
  }
}

import { clearUndefined, ensureDefaults, isDefined } from "@fleet-sdk/common";

type Variables = Record<string, unknown> | null;
type GraphQLOperation<R, V extends Variables> = (variables?: V) => Promise<GraphQLResponse<R>>;
type Credentials = RequestCredentials;
type Headers = HeadersInit;

export interface GraphQLResponse<T> {
  data?: T;
}

export interface ResponseParser {
  parse(text: string): unknown;
  stringify(value: unknown): string;
}

export interface RequestParams {
  operationName?: string | null;
  query: string;
  variables?: Record<string, unknown> | null;
}

export interface RequestOptions {
  url: URL | string;
  headers?: Headers;
  credentials?: Credentials;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function get<T = any>(url: URL, params?: any): Promise<T> {
  if (isDefined(params)) {
    Object.keys(params).map((key) => url.searchParams.append(key, params[key]));
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  return await response.json();
}

const OP_NAME_REGEX = /(query|mutation)\s?([\w\-_]+)?/;
export const DEFAULT_HEADERS: Headers = {
  "content-type": "application/json; charset=utf-8",
  accept: "application/graphql-response+json, application/json"
};

export function createGqlOp<R, V extends Variables = Variables>(
  query: string,
  options: RequestOptions
): GraphQLOperation<R, V> {
  const opt = options;
  opt.headers = ensureDefaults(options?.headers, DEFAULT_HEADERS);

  return async (variables?: V): Promise<GraphQLResponse<R>> => {
    const response = await fetch(opt.url, {
      method: "POST",
      headers: opt.headers,
      credentials: opt.credentials,
      body: JSON.stringify({
        operationName: getOpName(query),
        query,
        variables: variables ? clearUndefined(variables) : undefined
      } as RequestParams)
    });

    const data = await response.text();
    return JSON.parse(data) as GraphQLResponse<R>;
  };
}

export function gql(query: TemplateStringsArray): string {
  return query[0];
}

export function getOpName(query: string): string | undefined {
  return OP_NAME_REGEX.exec(query)?.at(2);
}

export function isRequestParam(obj: unknown): obj is RequestOptions {
  return typeof obj === "object" && (obj as RequestOptions).url !== undefined;
}
