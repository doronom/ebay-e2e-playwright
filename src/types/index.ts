export interface ParsedPrice {
  value: number;
  currency: string;
  isRange: boolean;
  min: number;
  max: number;
}

export interface CollectedItem {
  url: string;
  title: string;
  price: ParsedPrice;
  page: number;
}
