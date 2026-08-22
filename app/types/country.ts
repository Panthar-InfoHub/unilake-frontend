export interface Country {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  flagUrl: string;
  isActive: boolean;
}

export interface PublicCountry {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  flagUrl: string;
}

export interface CountryUploadUrlResponse {
  uploadUrl: string;
  key: string;
}
