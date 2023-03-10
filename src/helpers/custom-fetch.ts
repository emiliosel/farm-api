import { IncomingHttpHeaders } from "http";
import https from "https";

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

interface FetchResponse {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers: IncomingHttpHeaders;
  text: () => Promise<string>;
  json: () => Promise<any>;
}

export async function fetch(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
  const { method = "GET", headers = {} } = options;
  const parsedUrl = new URL(url);

  return new Promise<FetchResponse>((resolve, reject) => {
    const request = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || "443",
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers,
      },
      response => {
        const responseData: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          responseData.push(chunk);
        });
        response.on("end", () => {
          const text = () => Promise.resolve(responseData.join(""));
          const json = () => Promise.resolve(JSON.parse(responseData.join("")));
          resolve({
            ok: response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            text,
            json,
          });
        });
      },
    );

    request.on("error", err => {
      reject(err);
    });

    request.end();
  });
}
