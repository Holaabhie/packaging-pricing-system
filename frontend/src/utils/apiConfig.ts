/**
 * Centralized API configuration and Offline Mock for Vercel.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to simulate network delay inline
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    // If not on localhost, intercept all backend calls and use LocalStorage!
    // This allows the Vercel deployed app to work 100% offline without the python backend.
    const isProduction = window.location.hostname.includes('vercel') || import.meta.env.PROD;

    if (isProduction || true) { // Force local mocking so it works always without backend dependency
        await delay(400); // Simulate network

        const method = options?.method || 'GET';

        // ─── RATES MOCK ──────────────────────────────────────────────
        if (path.includes('/api/rates')) {
            if (method === 'GET') {
                const rates = JSON.parse(localStorage.getItem('nexus_rates') || '{}');
                return new Response(JSON.stringify(rates), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (method === 'POST' && options?.body) {
                localStorage.setItem('nexus_rates', options.body as string);
                return new Response(JSON.stringify({ status: "success" }), { status: 200 });
            }
        }

        // ─── QUOTATIONS MOCK ─────────────────────────────────────────
        if (path.includes('/api/quotations')) {
            let quotes = JSON.parse(localStorage.getItem('nexus_quotes') || '[]');

            // Delete matching ending: /api/quotations/:id
            if (method === 'DELETE') {
                const id = parseInt(path.split('/').pop() || '0');
                quotes = quotes.filter((q: any) => q.id !== id);
                localStorage.setItem('nexus_quotes', JSON.stringify(quotes));
                return new Response(JSON.stringify({ status: "deleted" }), { status: 200 });
            }

            // GET list
            if (method === 'GET') {
                return new Response(JSON.stringify(quotes), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            // POST new quotation
            if (method === 'POST' && options?.body) {
                const newQuote = JSON.parse(options.body as string);
                newQuote.id = Date.now();
                newQuote.date = new Date().toISOString().split('T')[0];
                quotes.push(newQuote);
                localStorage.setItem('nexus_quotes', JSON.stringify(quotes));
                return new Response(JSON.stringify({ id: newQuote.id, status: "success" }), { status: 200 });
            }
        }

        // Configuration
        if (path.includes('/api/config')) {
            return new Response(JSON.stringify({}), { status: 200 });
        }
    }

    // Fallback if not intercepted (local dev without force)
    const url = `${API_BASE_URL}${path}`;
    return fetch(url, options);
}

export { API_BASE_URL };
