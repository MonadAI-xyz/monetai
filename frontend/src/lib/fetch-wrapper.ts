// import { setGlobalDispatcher, Agent } from "undici";

// // Increase Timeout Settings in Node.js Fetch
// setGlobalDispatcher(
//   new Agent({
//     keepAliveTimeout: 600_000, // Keep the connection alive for 10 minutes
//     headersTimeout: 600_000,  // Timeout for receiving headers (10 minutes)
//   })
// );

// APIs endpoint's baseUrl
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchWrapper = async (url: string, options: RequestInit, timeout: number = 120_000) => {
  // Control connection timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  console.log({requestData: {
    url,
    options
  }});

  try {
    const response = await fetch(`${baseUrl}/v1${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        // "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Access the body and convert it to JSON
      const errorBody = await response.json();
      console.log({errorBody});

      if (response.status === 504) {
        // throw new Error('504 Gateway Timeout');
        return { error: "504 Gateway Timeout" };
      } else if (response.status === 422) {
        return { 
          status: response.status,
          error: errorBody?.detail?.map((err: any) => `${err.loc[1]}: ${err.msg}`).join(", ")
          || `Validation error: ${response.status} ${response.statusText}`,
        };
      }

      // TODO - handle 401 unauthorized response

      return { 
        status: response.status,
        error: errorBody?.message || `Fetch error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.error("Request timed out");
      return { error: "Request timed out." };
    }

    // If a database error occurs, return a more specific error.
    console.error(error);
    // console.error('error:', (error as Error).message);
    return { 
      status: 500,
      error: "Something went wrong." 
    };
  }
}


// Prepare Error Response Object
export async function createErrorResponseObject(response: any) {
  const defaultErrorMessage = "Something went wrong";

  if (!response.ok) {
    const errorResponse = await response.json();

    return {
      status: response.status || 0,
      statusText: response.statusText || defaultErrorMessage,
      message: errorResponse?.message || defaultErrorMessage,
    };
  }
}