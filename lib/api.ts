/**
 * Fetches dynamically selected search engine IDs from the backend based on a query.
 * 
 * @param query The user's search query.
 * @returns A promise that resolves to an array of selected engine IDs.
 * @throws An error if the API call fails or returns an invalid format.
 */
export async function getAIDynamicEngines(query: string): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:8000/api/v1/engines/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to select engines' }));
      console.error('[API Error] /engines/select:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to fetch AI engine suggestions');
    }

    const data = await response.json();
    if (!data.selected_engines || !Array.isArray(data.selected_engines)) {
      console.error('[API Error] Invalid response format from /engines/select:', data);
      throw new Error('Received invalid engine suggestions format from AI');
    }
    console.log(`[API Success] /engines/select returned: ${data.selected_engines.join(', ')}`);
    return data.selected_engines;
  } catch (error) {
    console.error('[API Call Error] Error calling getAIDynamicEngines:', error);
    // Re-throw the error to be caught by the caller
    throw error instanceof Error ? error : new Error('An unknown error occurred during AI engine selection');
  }
} 