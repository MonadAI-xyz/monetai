// import { setGlobalDispatcher, Agent } from "undici";

// // Increase Timeout Settings in Node.js Fetch
// setGlobalDispatcher(
//   new Agent({
//     keepAliveTimeout: 600_000, // Keep the connection alive for 10 minutes
//     headersTimeout: 600_000,  // Timeout for receiving headers (10 minutes)
//   })
// );

// APIs endpoint's baseUrl
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type FetchWrapperOptions = RequestInit & {
  baseUrl?: string; // Custom base URL for the request
};

type FetchWrapperResponse<T = unknown> = {
  data?: T; // Response data
  error?: string; // Error message
  status?: number; // HTTP status code
};

export const fetchWrapper = async <T = unknown>(
  url: string, 
  options: FetchWrapperOptions, 
  timeout: number = 120_000
): Promise<FetchWrapperResponse<T>> => {
  const { baseUrl, ...restOptions } = options;

  // Control connection timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  console.log({requestData: { url, options }});

  try {
    const response = await fetch(`${baseUrl || API_BASE_URL}${url}`, {
      ...restOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json", // Default to JSON content type
        ...(restOptions.headers || {}), // Merge custom headers
      },
    });

    clearTimeout(timeoutId); // Clear the timeout if the request completes

    if (!response.ok) {
      // Handle non-2xx responses
      // Access the body and convert it to JSON
      const errorBody = await response.json().catch(() => ({})); // Safely parse error body
      const errorMessage = errorBody?.message 
        || `API Error (${response.status}): ${response.statusText}`;
      
      console.log({errorBody});

      // throw new Error(`API Error (${response.status}): ${response.statusText} - ${errorBody?.message}`);

      // return { 
      //   status: response.status,
      //   error: errorBody?.message || `Fetch error: ${response.status} ${response.statusText}`,
      // };
      return {
        error: errorMessage,
        status: response.status,
      };
    }

    const data: T = await response.json(); // Parse response data
    console.log(data);

    return data; // Return the parsed data
  } catch (error) {
    clearTimeout(timeoutId); // Clear the timeout in case of an error

    if ((error as Error).name === "AbortError") {
      console.error("Request timed out");
      return { error: "Request timed out." };
    }

    // If a database error occurs, return a more specific error.
    console.error("Fetch error:", (error as Error).message);
    return { status: 500, error: "Something went wrong." };
    // throw new Error(`Error: ${(error as Error).message}`);
  }
};