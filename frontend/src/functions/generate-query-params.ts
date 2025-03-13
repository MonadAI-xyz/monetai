import { IQueryData } from "@/types";

/**
 * Generate query params string from object, with leading (?) mark.
 * 
 * Example: { key: 'value', key2: 'value2' } => "?key=value&key2=value2"
 * 
 * @param queryData Object
 * @returns string
 */
export const generateQueryParamsString = (queryData?: IQueryData): string => {
  const searchParams = new URLSearchParams();

  if (queryData) {
    // Build query params
    Object.entries(queryData).forEach(([key, value]) => {
      // Skip appending params with empty values
      if (value !== '') {
        if (key === 'status' && value === 'paused') {
          // Append `is_active` query param for filtering paused pipelines/sinks
          searchParams.append('is_active', String(false));
        } else {
          // Append other query params
          searchParams.append(key, value.toString());
        }
      }
    });
  }

  // Prepend (?) mark if search params available
  const queryParams = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return queryParams;
};