import { APIResponse } from "./APIResponse";
import { Fetcher, FetchFunction } from "./Fetcher";
import { RawResponse, toRawResponse, unknownRawResponse, abortRawResponse } from "./RawResponse";
import { createRequestUrl } from "./createRequestUrl";
import { getFetchFn } from "./getFetchFn";
import { getRequestBody } from "./getRequestBody";
import { getResponseBody } from "./getResponseBody";
import { makeRequest } from "./makeRequest";
import { requestWithRetries } from "./requestWithRetries";
import { Headers } from "./Headers";

export function provideFetcher(defaultHeaders?: Record<string, string>): FetchFunction {
    return async function fetcherImpl<R = unknown>(args: Fetcher.Args): Promise<APIResponse<R, Fetcher.Error>> {
        const headers: Record<string, string> = {};
        if (defaultHeaders) {
            Object.assign(headers, defaultHeaders);
        }

        if (args.body !== undefined && args.contentType != null) {
            headers["Content-Type"] = args.contentType;
        }

        if (args.headers != null) {
            for (const [key, value] of Object.entries(args.headers)) {
                if (value != null) {
                    headers[key] = value;
                }
            }
        }

        const url = createRequestUrl(args.url, args.queryParameters);
        let requestBody: BodyInit | undefined = await getRequestBody({
            body: args.body,
            type: args.requestType === "json" ? "json" : "other",
        });
        const fetchFn = await getFetchFn();

        try {
            const response = await requestWithRetries(
                async () =>
                    makeRequest(
                        fetchFn,
                        url,
                        args.method,
                        headers,
                        requestBody,
                        args.timeoutMs,
                        args.abortSignal,
                        args.withCredentials,
                        args.duplex
                    ),
                args.maxRetries
            );
            let responseBody = await getResponseBody(response, args.responseType);
            const rawResponse = toRawResponse(response);

            if (response.status >= 200 && response.status < 400) {
                return {
                    ok: true,
                    body: responseBody as R,
                    headers: response.headers,
                    rawResponse,
                };
            } else {
                return {
                    ok: false,
                    error: {
                        reason: "status-code",
                        statusCode: response.status,
                        body: responseBody,
                    },
                    rawResponse,
                };
            }
        } catch (error) {
            if (args.abortSignal != null && args.abortSignal.aborted) {
                return {
                    ok: false,
                    error: {
                        reason: "unknown",
                        errorMessage: "The user aborted a request",
                    },
                    rawResponse: abortRawResponse,
                };
            } else if (error instanceof Error && error.name === "AbortError") {
                return {
                    ok: false,
                    error: {
                        reason: "timeout",
                    },
                    rawResponse: abortRawResponse,
                };
            } else if (error instanceof Error) {
                return {
                    ok: false,
                    error: {
                        reason: "unknown",
                        errorMessage: error.message,
                    },
                    rawResponse: unknownRawResponse,
                };
            }

            return {
                ok: false,
                error: {
                    reason: "unknown",
                    errorMessage: JSON.stringify(error),
                },
                rawResponse: unknownRawResponse,
            };
        }
    };
}

async function offlineFetcherImpl<R = unknown>(_args: Fetcher.Args): Promise<APIResponse<R, Fetcher.Error>> {
    return {
        ok: true,
        body: {} as R,
        headers: {
            "Content-Type": "application/json",
        },
        rawResponse: {
            headers: new Headers(),
            redirected: false,
            status: 200,
            statusText: "OK",
            type: "basic",
            url: "",
        },
    };
}

export const offlineFetcher: FetchFunction = offlineFetcherImpl;
