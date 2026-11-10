export interface ApiMatcher {
  method: string;
  url: RegExp;
}

export const api = {
  addToCart: { method: 'POST', url: /\/act\/add_to_cart/ },
  removeFromCart: { method: 'POST', url: /cart\.ebay\.com\/api\/rm/ },
} satisfies Record<string, ApiMatcher>;
